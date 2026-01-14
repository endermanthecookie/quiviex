import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, Room, User } from '../types';
import { Logo } from './Logo';
import { CheckCircle2, AlertCircle, Users, Trophy, ChevronUp, ChevronDown, AlignLeft, Layers, ListOrdered, Sliders, Type, CheckSquare, GripVertical, CornerDownRight, Mic, Eye, EyeOff, Flame, X, MousePointerClick, Hourglass, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { sfx } from '../services/soundService';

interface QuizTakerProps {
  quiz: Quiz;
  room?: Room;
  user?: User;
  onComplete: (answers: (number | string | number[])[], score: number, totalPoints: number) => void;
  onExit: () => void;
}

interface ShuffledQuestion extends Question {
    originalIndex: number;
}

const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
};

const isImage = (url: string) => {
    if (!url) return false;
    return url.startsWith('data:image') || /\.(jpeg|jpg|gif|png|webp)$/i.test(url) || url.startsWith('https://images.unsplash.com');
};

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, room, user, onComplete, onExit }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(room?.currentQuestionIndex || 0);
  const userAnswersRef = useRef<(number | string | number[])[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastPointsGained, setLastPointsGained] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const [roomLeaderboard, setRoomLeaderboard] = useState<any[]>([]);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  
  const [tempInput, setTempInput] = useState('');
  const [tempOrder, setTempOrder] = useState<number[]>([]);
  const [tempSlider, setTempSlider] = useState(50);
  const [matchingState, setMatchingState] = useState<{left: string, right: string | null}[]>([]);
  const [shuffledMatches, setShuffledMatches] = useState<string[]>([]);
  const [blankAnswers, setBlankAnswers] = useState<(number | null)[]>([]);
  const [draggedOrderIndex, setDraggedOrderIndex] = useState<number | null>(null);
  const [draggedMatchItem, setDraggedMatchItem] = useState<string | null>(null);
  const [selectedMatchItem, setSelectedMatchItem] = useState<string | null>(null);
  const [draggedBlankOptionIndex, setDraggedBlankOptionIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [zenMode, setZenMode] = useState(false);

  const startTimeRef = useRef<number>(0);
  const isHost = user?.id === room?.hostId;
  const [totalParticipants, setTotalParticipants] = useState(0);

  const getGuestId = () => sessionStorage.getItem('qx_guest_id') || 'guest';
  const myId = user?.id || getGuestId();

  useEffect(() => {
    let q: ShuffledQuestion[] = quiz.questions.map((qs, idx) => ({ ...qs, originalIndex: idx }));
    if (quiz.shuffleQuestions && !room) {
        for (let i = q.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q[i], q[j]] = [q[j], q[i]];
        }
    }
    setShuffledQuestions(q);
    const initIdx = room ? room.currentQuestionIndex : 0;
    setCurrentQuestionIndex(initIdx);
    if (q[initIdx]) initializeQuestionState(q[initIdx]);
  }, [quiz, room]);

  useEffect(() => {
      if (room) {
          const roomSub = supabase
            .channel(`quiz-room-${room.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload: any) => {
                const newStatus = payload.new.status;
                const newIndex = payload.new.current_question_index;
                const playersAnswers = payload.new.players_answers || {};
                
                // HOST LOGIC: Synchronize results transition
                if (isHost && newStatus === 'playing') {
                    const statuses = Object.values(playersAnswers);
                    const answeredCount = statuses.filter(s => s === 1).length;
                    
                    // If everyone has answered (including solo players), trigger results
                    if (totalParticipants > 0 && answeredCount >= totalParticipants) {
                        setTimeout(async () => {
                            await supabase.from('rooms').update({ status: 'results' }).eq('id', room.id);
                        }, 400);
                    }
                }

                if (newStatus === 'results') {
                    setTimerActive(false);
                    setWaitingForOthers(false);
                    setShowExplanation(true);
                } else if (newStatus === 'playing') {
                    if (newIndex !== currentQuestionIndex) {
                        setCurrentQuestionIndex(newIndex);
                        setWaitingForOthers(false);
                        setShowExplanation(false);
                        setIsCorrectFeedback(null);
                        setFeedbackMessage(null);
                        
                        if (shuffledQuestions[newIndex]) {
                            initializeQuestionState(shuffledQuestions[newIndex]);
                            setTimerActive(true);
                        } else {
                            handleGameFinish();
                        }
                    }
                } else if (newStatus === 'finished') {
                    handleGameFinish();
                }
            })
            .subscribe();

          const partSub = supabase
            .channel(`quiz-participants-${room.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` }, () => {
                fetchLeaderboard();
            })
            .subscribe();
            
          fetchLeaderboard();

          return () => {
              supabase.removeChannel(roomSub);
              supabase.removeChannel(partSub);
          }
      }
  }, [room?.id, isHost, currentQuestionIndex, totalParticipants, shuffledQuestions]);

  const fetchLeaderboard = async () => {
      if (!room) return;
      const { data } = await supabase.from('room_participants').select('id, user_id, username, score').eq('room_id', room.id).order('score', { ascending: false });
      if (data) {
          setRoomLeaderboard(data);
          setTotalParticipants(data.length);
      }
  };

  const handleGameFinish = () => {
      sfx.play('complete');
      const finalAnswers = new Array(quiz.questions.length).fill(-1);
      userAnswersRef.current.forEach((ans, idx) => {
          if (shuffledQuestions[idx]) finalAnswers[shuffledQuestions[idx].originalIndex] = ans;
      });
      onComplete(finalAnswers, sessionPoints, sessionPoints);
  };

  const handleHostNextQuestion = async () => {
      if (!isHost || !room) return;
      const nextIdx = currentQuestionIndex + 1;
      
      // Re-initialize players_answers map for the NEW question round
      const { data: currentPlayers } = await supabase.from('room_participants').select('user_id').eq('room_id', room.id);
      const resetAnswers: Record<string, number> = {};
      currentPlayers?.forEach(p => {
          resetAnswers[p.user_id] = 0;
      });

      if (nextIdx >= shuffledQuestions.length) {
          await supabase.from('rooms').update({ status: 'finished' }).eq('id', room.id);
      } else {
          await supabase.from('rooms').update({ 
              status: 'playing', 
              current_question_index: nextIdx,
              players_answers: resetAnswers
          }).eq('id', room.id);
      }
  };

  const handleVoiceInput = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
          return;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return alert("Voice input not supported.");
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (e: any) => setTempInput(e.results[0][0].transcript);
      recognition.start();
  };

  const initializeQuestionState = (q: Question) => {
      if (!q) return;
      setTimeLeft(q.timeLimit || 20);
      startTimeRef.current = Date.now();
      setTempInput('');
      setTempSlider(q.type === 'slider' ? parseInt(q.options[0]) || 0 : 50);
      setWaitingForOthers(false);
      if (q.type === 'ordering') {
          const indices = Array.from({length: q.options.length}, (_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          setTempOrder(indices);
      } else { setTempOrder([]); }
      if (q.type === 'matching') {
          const pairs = [];
          const matches = [];
          for (let i = 0; i < 4; i++) {
              if (q.options[i*2] && q.options[i*2+1]) {
                  pairs.push({ left: q.options[i*2], right: null });
                  matches.push(q.options[i*2+1]);
              }
          }
          setMatchingState(pairs);
          for (let i = matches.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [matches[i], matches[j]] = [matches[j], matches[i]];
          }
          setShuffledMatches(matches);
          setSelectedMatchItem(null);
      }
      if (q.type === 'fill-in-the-blank') {
          const blanksCount = (q.question.match(/\[\s*\]/g) || []).length;
          setBlankAnswers(new Array(blanksCount).fill(null));
      }
  };

  useEffect(() => {
    if (startCountdown > 0) {
        const timer = window.setInterval(() => {
            setStartCountdown((prev: number) => {
               if (prev <= 1) { window.clearInterval(timer); setTimerActive(true); return 0; } 
               return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }
  }, [startCountdown]);

  useEffect(() => {
    if (!timerActive || timeLeft === null || showExplanation || waitingForOthers) return;
    if (timeLeft <= 0) { submitAnswer(-1); return; }
    const timer = window.setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, timerActive, showExplanation, waitingForOthers]);

  const calculatePoints = (isCorrect: boolean, timeTakenSeconds: number, timeLimit: number, multiplier: number = 1) => {
      if (!isCorrect && multiplier === 0) return 0;
      const basePoints = 500 * multiplier;
      const timeBonus = multiplier > 0 ? (Math.max(0, (timeLimit - timeTakenSeconds) / timeLimit) * 500 * multiplier) : 0;
      return Math.floor(basePoints + timeBonus);
  };

  const submitAnswer = async (answer: any) => {
    setTimerActive(false);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    let isCorrect = false;
    let multiplier = 0;
    let currentFeedback = null;

    if (answer !== -1) {
        if (currentQuestion.type === 'slider') {
            const target = currentQuestion.correctAnswer as number;
            const diff = Math.abs(target - answer);
            const range = Math.abs(parseInt(currentQuestion.options[1]) - parseInt(currentQuestion.options[0]));
            const proximity = Math.max(0, 1 - (diff / (range * 0.5)));
            isCorrect = diff <= (range * 0.05);
            multiplier = isCorrect ? 1 : (proximity * 0.3);
        } else if (currentQuestion.type === 'text-input') {
            const userText = String(answer).toLowerCase().trim();
            const correctText = String(currentQuestion.correctAnswer).toLowerCase().trim();
            const distance = getLevenshteinDistance(userText, correctText);
            if (distance === 0) { isCorrect = true; multiplier = 1; } 
            else if (distance <= 2) { isCorrect = true; multiplier = 0.8; currentFeedback = "Close enough!"; }
        } else if (currentQuestion.type === 'matching') {
            isCorrect = true;
            answer.forEach((pair: any) => {
                const leftIdx = currentQuestion.options.indexOf(pair.left);
                const expectedRight = currentQuestion.options[leftIdx + 1];
                if (pair.right !== expectedRight) isCorrect = false;
            });
            if (answer.some((p:any) => p.right === null)) isCorrect = false;
            multiplier = isCorrect ? 1 : 0;
        } else {
            isCorrect = checkAnswerIsCorrect(currentQuestion, answer);
            multiplier = isCorrect ? 1 : 0;
        }
    }
    
    if (isCorrect) sfx.play('correct'); else sfx.play('wrong');
    const pointsGained = calculatePoints(isCorrect, timeTaken, currentQuestion.timeLimit, multiplier);
    setSessionPoints(prev => prev + pointsGained);
    setLastPointsGained(pointsGained);
    setStreak(prev => isCorrect ? prev + 1 : 0);
    setIsCorrectFeedback(isCorrect);
    setFeedbackMessage(currentFeedback);
    const newAnswers = [...userAnswersRef.current];
    newAnswers[currentQuestionIndex] = answer;
    userAnswersRef.current = newAnswers;

    if (room) {
        setWaitingForOthers(true);
        // Register personal score
        const { data: participants } = await supabase.from('room_participants').select('*').eq('room_id', room.id);
        const me = participants?.find(p => p.user_id === myId);
        if (me) await supabase.from('room_participants').update({ score: me.score + pointsGained }).eq('id', me.id);

        // Commit answer status to registry
        const { data: roomData } = await supabase.from('rooms').select('players_answers').eq('id', room.id).single();
        const currentTracking = roomData?.players_answers || {};
        currentTracking[myId] = 1;
        await supabase.from('rooms').update({ players_answers: currentTracking }).eq('id', room.id);
    } else {
        if (user && pointsGained > 0) supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: pointsGained });
        setShowExplanation(true);
    }
  };

  const nextQuestion = () => {
      sfx.play('click');
      setShowExplanation(false);
      setIsCorrectFeedback(null);
      setFeedbackMessage(null);
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        initializeQuestionState(shuffledQuestions[nextIndex]);
        setTimerActive(true);
      } else { handleGameFinish(); }
  };

  const checkAnswerIsCorrect = (q: any, a: any) => {
    if (a === -1 || a === null) return false;
    if (q.type === 'text-input') {
        const userText = String(a).toLowerCase().trim();
        const correctText = String(q.correctAnswer).toLowerCase().trim();
        return getLevenshteinDistance(userText, correctText) <= 2;
    }
    if (q.type === 'ordering') return Array.isArray(a) && a.every((val, i) => val === i);
    if (q.type === 'fill-in-the-blank') {
        if (!Array.isArray(a) || !Array.isArray(q.correctAnswer)) return false;
        return a.every((val, i) => val === q.correctAnswer[i]);
    }
    return a === q.correctAnswer;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;
  const handleOrderDragStart = (index: number) => setDraggedOrderIndex(index);
  const handleOrderDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedOrderIndex === null || draggedOrderIndex === index) return;
      const newOrder = [...tempOrder];
      const draggedItem = newOrder[draggedOrderIndex];
      newOrder.splice(draggedOrderIndex, 1);
      newOrder.splice(index, 0, draggedItem);
      setTempOrder(newOrder);
      setDraggedOrderIndex(index);
  };
  const handleMatchSelect = (item: string) => { if (selectedMatchItem === item) setSelectedMatchItem(null); else setSelectedMatchItem(item); };
  const handleMatchDragStart = (item: string) => { setDraggedMatchItem(item); setSelectedMatchItem(item); };
  const handleMatchDrop = (index: number) => {
      const itemToPlace = draggedMatchItem || selectedMatchItem;
      if (itemToPlace) {
          setMatchingState(prev => {
              const next = [...prev];
              const existingIdx = next.findIndex(p => p.right === itemToPlace);
              if (existingIdx !== -1) next[existingIdx].right = null;
              next[index].right = itemToPlace;
              return next;
          });
          setDraggedMatchItem(null); setSelectedMatchItem(null);
      }
  };
  const handleBlankOptionDragStart = (optIndex: number) => setDraggedBlankOptionIndex(optIndex);
  const handleBlankDrop = (blankIndex: number) => {
      if (draggedBlankOptionIndex !== null) {
          const newAnswers = [...blankAnswers];
          newAnswers[blankIndex] = draggedBlankOptionIndex;
          setBlankAnswers(newAnswers); setDraggedBlankOptionIndex(null);
      }
  };

  let lastScore = -1; let currentRank = 0; const isOnFire = streak >= 3;
  if (!currentQuestion) return null;

  const renderInputs = () => {
      if (waitingForOthers) {
          return (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                  <div className="bg-white/10 p-10 rounded-[3.5rem] backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center max-w-sm w-full">
                      <div className="relative mb-8">
                         <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                         <Hourglass className="text-yellow-400 animate-spin-slow relative z-10" size={80} />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Syncing Results</h3>
                      <p className="text-indigo-200 font-bold uppercase tracking-[0.2em] text-xs text-center leading-relaxed">
                        Waiting for all units <br/> to commit their data...
                      </p>
                  </div>
              </div>
          );
      }

      switch(currentQuestion.type) {
          case 'multiple-choice':
          case 'true-false':
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-in">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => timerActive && submitAnswer(i)} disabled={!timerActive} className={`glass p-8 rounded-[2.5rem] text-xl font-black text-left flex items-center gap-6 group click-scale border border-white/10 transition-all ${zenMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'hover:bg-white/20'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black italic group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-all ${zenMode ? 'bg-white/5 text-white/50' : 'bg-white/10 text-white/30'}`}>{i+1}</div>
                            <span className="flex-1 drop-shadow-sm">{opt}</span>
                        </button>
                    ))}
                </div>
              );
          case 'text-input':
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in relative">
                      <div className="relative">
                        <input type="text" value={tempInput} onChange={(e) => setTempInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tempInput.trim() && submitAnswer(tempInput)} placeholder="Type answer..." className="w-full bg-black/40 backdrop-blur-xl border-4 border-white/10 rounded-[2.5rem] p-10 pr-20 text-3xl font-black text-center focus:outline-none focus:border-indigo-500 transition-all mb-8 shadow-2xl text-white placeholder-white/30" autoFocus />
                        <button onClick={handleVoiceInput} className={`absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`} title="Voice Input"><Mic size={24} /></button>
                      </div>
                      <button onClick={() => submitAnswer(tempInput)} disabled={!tempInput.trim()} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale shadow-xl">Submit</button>
                  </div>
              );
          case 'fill-in-the-blank':
              const parts = currentQuestion.question.split(/(\[\s*\])/g);
              let blankCounter = 0;
              return (
                  <div className="max-w-4xl mx-auto w-full stagger-in flex flex-col gap-12">
                      <div className="bg-black/30 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center leading-loose">
                          <div className="text-2xl sm:text-4xl font-bold inline-block">
                              {parts.map((part, i) => {
                                  if (part.match(/\[\s*\]/)) {
                                      const currentIndex = blankCounter++; const filledOptIndex = blankAnswers[currentIndex];
                                      return ( <span key={i} onDragOver={(e) => e.preventDefault()} onDrop={() => handleBlankDrop(currentIndex)} onClick={() => { const newAnswers = [...blankAnswers]; newAnswers[currentIndex] = null; setBlankAnswers(newAnswers); }} className={`inline-flex items-center justify-center min-w-[120px] h-14 mx-2 align-middle border-b-4 border-dashed rounded-lg transition-all cursor-pointer ${filledOptIndex !== null ? 'bg-indigo-500 border-indigo-400 text-white px-4 border-solid shadow-lg scale-110' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}> {filledOptIndex !== null ? currentQuestion.options[filledOptIndex] : ''} </span> );
                                  }
                                  return <span key={i}>{part}</span>;
                              })}
                          </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4">
                          {currentQuestion.options.map((opt, i) => ( <div key={i} draggable onDragStart={() => handleBlankOptionDragStart(i)} className="px-8 py-4 rounded-2xl font-black text-lg transition-all cursor-grab active:cursor-grabbing shadow-lg border-b-4 bg-white text-slate-900 border-slate-300 hover:-translate-y-1 hover:shadow-xl"> {opt} </div> ))}
                      </div>
                      <div className="text-center">
                        <button onClick={() => submitAnswer(blankAnswers)} disabled={blankAnswers.some(a => a === null)} className="px-12 py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl click-scale transition-all">Submit Answer</button>
                      </div>
                  </div>
              );
          case 'matching':
              return (
                  <div className="max-w-5xl mx-auto w-full stagger-in flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex-1 space-y-4 w-full">
                          {matchingState.map((pair, idx) => (
                              <div key={idx} className={`flex items-center gap-4 p-4 rounded-3xl border transition-colors ${selectedMatchItem && !pair.right ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/20 border-white/10'}`}>
                                  <div className="flex-1 p-4 bg-white/10 rounded-2xl font-bold text-center border border-white/5">{pair.left}</div>
                                  <div className="text-white/30"><CornerDownRight size={24} /></div>
                                  <div onDragOver={(e) => e.preventDefault()} onDrop={() => handleMatchDrop(idx)} onClick={() => { if (pair.right) setMatchingState(prev => { const n = [...prev]; n[idx].right = null; return n; }); else if (selectedMatchItem) handleMatchDrop(idx); }} className={`flex-1 p-4 rounded-2xl font-bold text-center border-2 border-dashed transition-all cursor-pointer min-h-[64px] flex items-center justify-center overflow-hidden ${pair.right ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : selectedMatchItem ? 'bg-indigo-500/20 border-indigo-400/50 animate-pulse' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}> {pair.right ? ( isImage(pair.right) ? <img src={pair.right} className="max-w-full max-h-32 object-contain rounded-lg" /> : pair.right ) : <span className="text-xs uppercase tracking-widest opacity-30">{selectedMatchItem ? 'Tap to Place' : 'Drop Here'}</span>} </div>
                              </div>
                          ))}
                      </div>
                      <div className="w-full md:w-64 bg-white/10 p-6 rounded-[2.5rem] border border-white/10 min-h-[300px]">
                          <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Tap or Drag to Match</p>
                          <div className="flex flex-col gap-3">
                              {shuffledMatches.map((item, i) => {
                                  if (matchingState.some(p => p.right === item)) return null;
                                  const isSelected = selectedMatchItem === item;
                                  return ( <div key={i} draggable="true" onDragStart={() => handleMatchDragStart(item)} onClick={() => handleMatchSelect(item)} className={`p-3 rounded-2xl font-bold text-center shadow-lg cursor-pointer transition-transform border-b-4 flex items-center justify-center min-h-[60px] relative ${isSelected ? 'bg-indigo-500 text-white border-indigo-700 scale-105 ring-2 ring-white' : 'bg-white text-slate-900 border-slate-200 hover:scale-105 active:scale-95'}`}> {isImage(item) ? <img src={item} className="max-w-full max-h-24 object-contain rounded-lg" /> : item} {isSelected && <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full p-1 shadow-md"><MousePointerClick size={12} /></div>} </div> )
                              })}
                          </div>
                          <button onClick={() => submitAnswer(matchingState)} className="w-full mt-8 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl click-scale">Submit</button>
                      </div>
                  </div>
              );
          case 'ordering':
              return (
                  <div className="max-w-xl mx-auto w-full space-y-3 stagger-in">
                      {tempOrder.map((originalIdx, displayIdx) => (
                          <div key={originalIdx} draggable="true" onDragStart={() => handleOrderDragStart(displayIdx)} onDragOver={(e) => handleOrderDragOver(e, displayIdx)} onDragEnd={() => setDraggedOrderIndex(null)} className={`glass p-5 rounded-2xl border border-white/10 flex items-center gap-6 cursor-grab active:cursor-grabbing transition-all ${draggedOrderIndex === displayIdx ? 'opacity-50 scale-95 border-indigo-500/50' : 'hover:bg-white/10'}`}> <div className="text-white/20"> <GripVertical size={24} /> </div> <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-indigo-400 border border-white/5">{displayIdx + 1}</span> <span className="flex-1 font-bold text-lg">{currentQuestion.options[originalIdx]}</span> </div> ))}
                      <button onClick={() => submitAnswer(tempOrder)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale mt-8 shadow-xl">Confirm Order</button>
                  </div>
              );
          case 'slider':
              const min = parseInt(currentQuestion.options[0]); const max = parseInt(currentQuestion.options[1]);
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in bg-black/40 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl">
                      <div className="text-center mb-12"> <div className="text-7xl font-black text-indigo-400 mb-2 drop-shadow-[0_0_20px_rgba(129,140,241,0.5)]">{tempSlider}</div> </div>
                      <input type="range" min={min} max={max} value={tempSlider} onChange={(e) => setTempSlider(parseInt(e.target.value))} className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 mb-12" />
                      <button onClick={() => submitAnswer(tempSlider)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale shadow-xl">Submit Value</button>
                  </div>
              );
          default: return <div className="text-center text-rose-500 font-black">Question Error</div>;
      }
  };

  return (
    <div className={`min-h-screen text-white flex flex-col relative overflow-hidden font-['Plus_Jakarta_Sans'] transition-colors duration-1000 ${zenMode ? 'bg-[#000000]' : isOnFire ? 'bg-orange-950' : 'bg-slate-950'}`}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
         <div className={`text-[40rem] sm:text-[65rem] font-black leading-none tabular-nums transition-all duration-300 ${timeLeft <= 5 ? 'text-rose-500/20 animate-pulse scale-110' : zenMode ? 'text-white/[0.01]' : 'text-white/[0.03]'}`}> {timeLeft} </div>
      </div>
      {showExplanation && (
          <div className="absolute inset-0 z-[100] bg-[#05010d]/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-2xl w-full text-center stagger-in">
                  <div className={`mb-2 text-7xl font-black tracking-tighter drop-shadow-2xl ${isCorrectFeedback ? 'text-emerald-400' : 'text-rose-500'}`}> {isCorrectFeedback ? 'CORRECT!' : 'INCORRECT'} </div>
                  {feedbackMessage && <div className="text-indigo-400 font-black uppercase text-sm mb-6 animate-bounce"> {feedbackMessage} </div>}
                  <div className="mb-8 flex flex-col items-center">
                      <div className="inline-block bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl relative overflow-hidden">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Personal Round Score</p>
                          <div className="flex items-center justify-center gap-3"> <span className="text-4xl font-black text-white">{lastPointsGained}</span> <span className="text-indigo-400 font-black text-xs uppercase">PTS</span> </div>
                      </div>
                      {room && <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4">Total Session: {sessionPoints} pts</p>}
                  </div>
                  {currentQuestion.explanation && <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-8 text-lg font-medium text-slate-300 leading-relaxed italic shadow-xl"> "{currentQuestion.explanation}" </div>}
                  {room && roomLeaderboard.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl">
                          <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-6 flex items-center justify-center gap-2"> <Trophy size={14} /> Global Standings </h4>
                          <div className="space-y-3">
                             {roomLeaderboard.slice(0, 5).map((p, i) => {
                                 if (p.score !== lastScore) currentRank = i + 1; lastScore = p.score;
                                 return ( <div key={i} className={`flex items-center justify-between px-6 py-3 rounded-xl border transition-all ${p.user_id === myId ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-105' : 'bg-white/5 border-white/5'}`}> <div className="flex items-center gap-4"> <span className={`text-[10px] font-black w-6 ${currentRank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>#{currentRank}</span> <span className="font-bold text-sm">@{p.username}</span> </div> <span className="font-black text-indigo-400 text-sm">{p.score}</span> </div> );
                             })}
                          </div>
                      </div>
                  )}
                  {room ? ( isHost ? <button onClick={handleHostNextQuestion} className="w-full bg-white text-slate-950 font-black py-8 rounded-[2.5rem] text-2xl click-scale uppercase shadow-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-4"> Next Question <ArrowRight size={28} /> </button> : <div className="flex flex-col items-center gap-4 animate-pulse"> <Loader2 className="text-indigo-500 animate-spin" size={32} /> <div className="text-white font-black uppercase tracking-[0.4em] text-xs">Waiting for Host Signal...</div> </div> ) : ( <button onClick={nextQuestion} className="w-full bg-white text-slate-950 font-black py-8 rounded-[2.5rem] text-2xl click-scale uppercase shadow-2xl hover:bg-slate-100 transition-colors"> Next Question </button> )}
              </div>
          </div>
      )}
      <div className={`flex flex-col h-full relative z-10 ${startCountdown > 0 ? 'opacity-0 blur-xl' : 'opacity-100 blur-0'} transition-all duration-1000`}>
        <header className={`px-8 py-6 flex items-center justify-between z-40 bg-transparent border-b border-white/5 transition-all duration-500 ${zenMode ? 'opacity-0 -translate-y-full pointer-events-none absolute' : ''}`}>
            <div className="flex items-center gap-4">
                <Logo variant="small" className="shadow-2xl" />
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full"> <span className="text-xs font-black tracking-widest uppercase text-slate-400">Step <span className="text-white">{currentQuestionIndex+1} / {shuffledQuestions.length}</span></span> </div>
            </div>
            <div className="flex items-center gap-6">
                {isOnFire && <div className="flex items-center gap-2 text-orange-500 font-black uppercase text-xs tracking-widest animate-pulse"> <Flame size={18} fill="currentColor" /> Streak x{streak} </div>}
                <div className="text-right"> <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</div> <div className={`text-2xl font-black tracking-tight ${isOnFire ? 'text-orange-400' : 'text-indigo-400'}`}>{sessionPoints}</div> </div>
                <button onClick={() => setZenMode(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-slate-400 hover:text-white" title="Enter Zen Mode"><Eye size={20} /></button>
            </div>
        </header>
        {zenMode && <div className="absolute top-6 right-6 z-50 animate-in fade-in"><button onClick={() => setZenMode(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all" title="Exit Zen Mode"><EyeOff size={20} /></button></div>}
        <div className={`absolute top-0 left-0 w-full h-1.5 z-30 transition-opacity duration-500 ${zenMode ? 'opacity-0' : 'opacity-100'}`}><div className={`h-full absolute left-0 transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]' : isOnFire ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)]' : 'bg-indigo-500'}`} style={{ width: `${timePercentage}%` }} /></div>
        <main className="flex-1 flex flex-col justify-center px-6 py-12 relative overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full text-center">
                {currentQuestion.type !== 'fill-in-the-blank' && (
                    <div className={`mb-10 inline-block p-10 sm:p-16 rounded-[4rem] animate-in slide-in-from-bottom-10 duration-700 w-full transition-all ${zenMode ? 'bg-transparent shadow-none' : 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl'} ${isOnFire && !zenMode ? 'border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.1)]' : ''}`}>
                        <h2 className={`text-3xl sm:text-5xl font-black leading-tight tracking-tighter text-white transition-all ${zenMode ? 'scale-110 drop-shadow-2xl' : ''}`}> {currentQuestion.question} </h2>
                        {currentQuestion.image && <div className={`mt-8 rounded-3xl overflow-hidden shadow-2xl max-w-md mx-auto aspect-video transition-all ${zenMode ? 'border-0' : 'border border-white/10'}`}> <img src={currentQuestion.image} alt="" className="w-full h-full object-cover" /> </div>}
                    </div>
                )}
                <div className="relative z-20"> {renderInputs()} </div>
            </div>
        </main>
      </div>
      {startCountdown > 0 && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center">
              <Logo variant="large" className="mb-12 shadow-[0_0_100px_rgba(168,85,247,0.4)] animate-bounce" />
              <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-sm mb-6">Game Initializing</p>
              <div className="text-[15rem] font-black tracking-tighter leading-none animate-in zoom-in duration-500 text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]" key={startCountdown}> {startCountdown} </div>
          </div>
      )}
    </div>
  );
};