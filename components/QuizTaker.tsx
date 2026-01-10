import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, Room, User } from '../types';
import { Logo } from './Logo';
import { CheckCircle2, AlertCircle, Users, Trophy, ChevronUp, ChevronDown, AlignLeft, Layers, ListOrdered, Sliders, Type, CheckSquare, GripVertical, CornerDownRight } from 'lucide-react';
import { supabase } from '../services/supabase';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const userAnswersRef = useRef<(number | string | number[])[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const [roomLeaderboard, setRoomLeaderboard] = useState<any[]>([]);
  
  // Input States
  const [tempInput, setTempInput] = useState('');
  const [tempOrder, setTempOrder] = useState<number[]>([]);
  const [tempSlider, setTempSlider] = useState(50);
  
  // Matching State
  const [matchingState, setMatchingState] = useState<{left: string, right: string | null}[]>([]);
  const [shuffledMatches, setShuffledMatches] = useState<string[]>([]);
  
  // Fill in Blank State
  const [blankDropZone, setBlankDropZone] = useState<number | null>(null); // Index of dropped option

  // Drag States
  const [draggedOrderIndex, setDraggedOrderIndex] = useState<number | null>(null);
  const [draggedMatchItem, setDraggedMatchItem] = useState<string | null>(null);
  const [draggedBlankItem, setDraggedBlankItem] = useState<number | null>(null);
  
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let q: ShuffledQuestion[] = quiz.questions.map((qs, idx) => ({ ...qs, originalIndex: idx }));
    if (quiz.shuffleQuestions && !room) {
        for (let i = q.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q[i], q[j]] = [q[j], q[i]];
        }
    }
    setShuffledQuestions(q);
    initializeQuestionState(q[0]);
  }, [quiz, room]);

  const initializeQuestionState = (q: Question) => {
      if (!q) return;
      setTimeLeft(q.timeLimit || 20);
      startTimeRef.current = Date.now();
      setTempInput('');
      setTempSlider(q.type === 'slider' ? parseInt(q.options[0]) || 0 : 50);
      setTempOrder(q.type === 'ordering' ? Array.from({length: q.options.length}, (_, i) => i) : []);
      
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
          // Shuffle matches
          for (let i = matches.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [matches[i], matches[j]] = [matches[j], matches[i]];
          }
          setShuffledMatches(matches);
      }

      if (q.type === 'fill-in-the-blank') {
          setBlankDropZone(null);
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
    if (!timerActive || timeLeft === null || showExplanation) return;
    if (timeLeft <= 0) { submitAnswer(-1); return; }
    const timer = window.setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, timerActive, showExplanation]);

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
            // answer is the matchingState array
            isCorrect = true;
            answer.forEach((pair: any) => {
                // Find original pair in options
                const leftIdx = currentQuestion.options.indexOf(pair.left);
                const expectedRight = currentQuestion.options[leftIdx + 1];
                if (pair.right !== expectedRight) isCorrect = false;
            });
            // Must match all
            if (answer.some((p:any) => p.right === null)) isCorrect = false;
            multiplier = isCorrect ? 1 : 0;
        } else {
            isCorrect = checkAnswerIsCorrect(currentQuestion, answer);
            multiplier = isCorrect ? 1 : 0;
        }
    }
    
    const pointsGained = calculatePoints(isCorrect, timeTaken, currentQuestion.timeLimit, multiplier);
    setSessionPoints(prev => prev + pointsGained);
    setStreak(prev => isCorrect ? prev + 1 : 0);
    setIsCorrectFeedback(isCorrect);
    setFeedbackMessage(currentFeedback);
    
    const newAnswers = [...userAnswersRef.current];
    newAnswers[currentQuestionIndex] = answer;
    userAnswersRef.current = newAnswers;

    if (room) {
        const { data: participants } = await supabase.from('room_participants').select('*').eq('room_id', room.id);
        const me = participants?.find(p => p.user_id === user?.id);
        if (me) {
            await supabase.from('room_participants').update({ score: me.score + pointsGained }).eq('id', me.id);
        }
        const { data: updated } = await supabase.from('room_participants').select('username, score').eq('room_id', room.id).order('score', { ascending: false });
        setRoomLeaderboard(updated || []);
    }

    setShowExplanation(true);
  };

  const nextQuestion = () => {
      setShowExplanation(false);
      setIsCorrectFeedback(null);
      setFeedbackMessage(null);
      if (currentQuestionIndex < shuffledQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        initializeQuestionState(shuffledQuestions[nextIndex]);
        setTimerActive(true);
      } else {
        const finalAnswers = new Array(quiz.questions.length).fill(-1);
        userAnswersRef.current.forEach((ans, idx) => {
            finalAnswers[shuffledQuestions[idx].originalIndex] = ans;
        });
        const finalScore = quiz.questions.reduce((acc, q, i) => {
            if (q.type === 'matching') {
               const userAns = finalAnswers[i];
               if (!Array.isArray(userAns)) return acc;
               let correct = true;
               userAns.forEach((pair: any) => {
                   const idx = q.options.indexOf(pair.left);
                   if (q.options[idx+1] !== pair.right) correct = false;
               });
               return acc + (correct ? 1 : 0);
            }
            return acc + (checkAnswerIsCorrect(q, finalAnswers[i]) ? 1 : 0)
        }, 0);
        onComplete(finalAnswers, finalScore, sessionPoints);
      }
  };

  const checkAnswerIsCorrect = (q: any, a: any) => {
    if (a === -1 || a === null) return false;
    if (q.type === 'text-input') {
        const userText = String(a).toLowerCase().trim();
        const correctText = String(q.correctAnswer).toLowerCase().trim();
        return getLevenshteinDistance(userText, correctText) <= 2;
    }
    if (q.type === 'ordering') {
        return Array.isArray(a) && a.every((val, i) => val === i);
    }
    if (q.type === 'fill-in-the-blank') {
        return a === q.correctAnswer;
    }
    return a === q.correctAnswer;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;

  // Drag Handlers
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

  const handleMatchDragStart = (item: string) => setDraggedMatchItem(item);
  const handleMatchDrop = (index: number) => {
      if (draggedMatchItem) {
          setMatchingState(prev => {
              const next = [...prev];
              // If item was already somewhere else, clear it
              const existingIdx = next.findIndex(p => p.right === draggedMatchItem);
              if (existingIdx !== -1) next[existingIdx].right = null;
              
              next[index].right = draggedMatchItem;
              return next;
          });
          setDraggedMatchItem(null);
      }
  };

  const handleBlankDragStart = (index: number) => setDraggedBlankItem(index);
  const handleBlankDrop = () => {
      if (draggedBlankItem !== null) {
          setBlankDropZone(draggedBlankItem);
          setDraggedBlankItem(null);
      }
  };

  // Variables for leaderboard rendering
  let lastScore = -1;
  let currentRank = 0;

  if (!currentQuestion) return null;

  const renderInputs = () => {
      switch(currentQuestion.type) {
          case 'multiple-choice':
          case 'true-false':
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-in">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => timerActive && submitAnswer(i)} disabled={!timerActive} className="glass p-8 rounded-[2.5rem] text-xl font-black text-left flex items-center gap-6 group click-scale border border-white/10 hover:bg-white/20 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black italic text-white/30 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-all">{i+1}</div>
                            <span className="flex-1 drop-shadow-sm">{opt}</span>
                        </button>
                    ))}
                </div>
              );
          case 'text-input':
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in">
                      <input 
                        type="text" 
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && tempInput.trim() && submitAnswer(tempInput)}
                        placeholder="Type answer..."
                        className="w-full bg-black/40 backdrop-blur-xl border-4 border-white/10 rounded-[2.5rem] p-10 text-3xl font-black text-center focus:outline-none focus:border-indigo-500 transition-all mb-8 shadow-2xl text-white placeholder-white/30"
                        autoFocus
                      />
                      <button onClick={() => submitAnswer(tempInput)} disabled={!tempInput.trim()} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale shadow-xl">Submit</button>
                  </div>
              );
          case 'fill-in-the-blank':
              const parts = currentQuestion.question.split('[ ]');
              return (
                  <div className="max-w-3xl mx-auto w-full stagger-in flex flex-col gap-12">
                      <div className="bg-black/30 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center">
                          <h3 className="text-2xl sm:text-4xl font-bold leading-relaxed inline-block">
                              {parts.map((part, i) => (
                                  <React.Fragment key={i}>
                                      {part}
                                      {i < parts.length - 1 && (
                                          <span 
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleBlankDrop}
                                            onClick={() => setBlankDropZone(null)} // Clear on click
                                            className={`inline-flex items-center justify-center min-w-[120px] h-14 mx-2 align-middle border-b-4 border-dashed rounded-lg transition-all cursor-pointer ${blankDropZone !== null ? 'bg-indigo-500 border-indigo-400 text-white px-4 border-solid shadow-lg scale-110' : 'bg-white/10 border-white/30 hover:bg-white/20'}`}
                                          >
                                              {blankDropZone !== null ? currentQuestion.options[blankDropZone] : ''}
                                          </span>
                                      )}
                                  </React.Fragment>
                              ))}
                          </h3>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4">
                          {currentQuestion.options.map((opt, i) => (
                              <div 
                                key={i}
                                draggable={blankDropZone !== i}
                                onDragStart={() => handleBlankDragStart(i)}
                                onClick={() => !timerActive ? null : setBlankDropZone(i)}
                                className={`px-8 py-4 rounded-2xl font-black text-lg transition-all cursor-grab active:cursor-grabbing shadow-lg border-b-4 ${blankDropZone === i ? 'opacity-30 bg-slate-700 border-slate-800 cursor-default' : 'bg-white text-slate-900 border-slate-300 hover:-translate-y-1 hover:shadow-xl'}`}
                              >
                                  {opt}
                              </div>
                          ))}
                      </div>

                      <div className="text-center">
                        <button onClick={() => submitAnswer(blankDropZone)} disabled={blankDropZone === null} className="px-12 py-5 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl click-scale disabled:opacity-50 disabled:cursor-not-allowed transition-all">Submit Answer</button>
                      </div>
                  </div>
              );
          case 'matching':
              return (
                  <div className="max-w-5xl mx-auto w-full stagger-in flex flex-col md:flex-row gap-8 items-start">
                      {/* Drop Zones (Left) */}
                      <div className="flex-1 space-y-4 w-full">
                          {matchingState.map((pair, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-black/20 p-4 rounded-3xl border border-white/10">
                                  <div className="flex-1 p-4 bg-white/10 rounded-2xl font-bold text-center border border-white/5">{pair.left}</div>
                                  <div className="text-white/30"><CornerDownRight size={24} /></div>
                                  <div 
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleMatchDrop(idx)}
                                    onClick={() => {
                                        // Click to clear
                                        if (pair.right) {
                                            setMatchingState(prev => {
                                                const n = [...prev];
                                                n[idx].right = null;
                                                return n;
                                            })
                                        }
                                    }}
                                    className={`flex-1 p-4 rounded-2xl font-bold text-center border-2 border-dashed transition-all cursor-pointer min-h-[64px] flex items-center justify-center overflow-hidden ${pair.right ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}
                                  >
                                      {pair.right ? (
                                          isImage(pair.right) ? (
                                              <img src={pair.right} alt="Match" className="max-w-full max-h-32 object-contain rounded-lg pointer-events-none" />
                                          ) : (
                                              pair.right
                                          )
                                      ) : <span className="text-xs uppercase tracking-widest opacity-30">Drop Here</span>}
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Draggables Pool (Right) */}
                      <div className="w-full md:w-64 bg-white/10 p-6 rounded-[2.5rem] border border-white/10 min-h-[300px]">
                          <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Drag to Match</p>
                          <div className="flex flex-col gap-3">
                              {shuffledMatches.map((item, i) => {
                                  const isPlaced = matchingState.some(p => p.right === item);
                                  if (isPlaced) return null;
                                  return (
                                      <div 
                                        key={i}
                                        draggable="true"
                                        onDragStart={() => handleMatchDragStart(item)}
                                        className="p-3 bg-white text-slate-900 rounded-2xl font-bold text-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform border-b-4 border-slate-200 flex items-center justify-center min-h-[60px]"
                                      >
                                          {isImage(item) ? (
                                              <img src={item} alt="Match" className="max-w-full max-h-24 object-contain rounded-lg pointer-events-none" />
                                          ) : (
                                              item
                                          )}
                                      </div>
                                  )
                              })}
                              {shuffledMatches.every(m => matchingState.some(p => p.right === m)) && (
                                  <div className="text-center py-8 opacity-50 font-bold italic">All items placed!</div>
                              )}
                          </div>
                          
                          <button 
                            onClick={() => submitAnswer(matchingState)}
                            className="w-full mt-8 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest shadow-xl click-scale"
                          >
                              Submit
                          </button>
                      </div>
                  </div>
              );
          case 'ordering':
              return (
                  <div className="max-w-xl mx-auto w-full space-y-3 stagger-in">
                      {tempOrder.map((originalIdx, displayIdx) => (
                          <div 
                            key={originalIdx} 
                            draggable="true"
                            onDragStart={() => handleOrderDragStart(displayIdx)}
                            onDragOver={(e) => handleOrderDragOver(e, displayIdx)}
                            onDragEnd={() => setDraggedOrderIndex(null)}
                            className={`glass p-5 rounded-2xl border border-white/10 flex items-center gap-6 cursor-grab active:cursor-grabbing transition-all ${draggedOrderIndex === displayIdx ? 'opacity-50 scale-95 border-indigo-500/50' : 'hover:bg-white/10'}`}
                          >
                              <div className="text-white/20">
                                <GripVertical size={24} />
                              </div>
                              <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-indigo-400 border border-white/5">{displayIdx + 1}</span>
                              <span className="flex-1 font-bold text-lg">{currentQuestion.options[originalIdx]}</span>
                              <div className="flex flex-col gap-1 opacity-50">
                                  <button onClick={() => {
                                      const newOrder = [...tempOrder];
                                      if (displayIdx > 0) {
                                          [newOrder[displayIdx], newOrder[displayIdx-1]] = [newOrder[displayIdx-1], newOrder[displayIdx]];
                                          setTempOrder(newOrder);
                                      }
                                  }} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronUp size={16} /></button>
                                  <button onClick={() => {
                                      const newOrder = [...tempOrder];
                                      if (displayIdx < newOrder.length - 1) {
                                          [newOrder[displayIdx], newOrder[displayIdx+1]] = [newOrder[displayIdx+1], newOrder[displayIdx]];
                                          setTempOrder(newOrder);
                                      }
                                  }} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronDown size={16} /></button>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => submitAnswer(tempOrder)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale mt-8 shadow-xl">Confirm Order</button>
                  </div>
              );
          case 'slider':
              const min = parseInt(currentQuestion.options[0]);
              const max = parseInt(currentQuestion.options[1]);
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in bg-black/40 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl">
                      <div className="text-center mb-12">
                          <div className="text-7xl font-black text-indigo-400 mb-2 drop-shadow-[0_0_20px_rgba(129,140,248,0.5)]">{tempSlider}</div>
                      </div>
                      <input 
                        type="range" 
                        min={min} 
                        max={max} 
                        value={tempSlider}
                        onChange={(e) => setTempSlider(parseInt(e.target.value))}
                        className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 mb-12"
                      />
                      <button onClick={() => submitAnswer(tempSlider)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale shadow-xl">Submit Value</button>
                  </div>
              );
          default:
              return <div className="text-center text-rose-500 font-black">Question Error</div>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-['Plus_Jakarta_Sans']">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
         <div className={`text-[40rem] sm:text-[65rem] font-black leading-none tabular-nums transition-all duration-300 ${timeLeft <= 5 ? 'text-rose-500/20 animate-pulse scale-110' : 'text-white/[0.03]'}`}>
            {timeLeft}
         </div>
      </div>

      {showExplanation && (
          <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-2xl w-full text-center stagger-in">
                  <div className={`mb-2 text-7xl font-black tracking-tighter drop-shadow-2xl ${isCorrectFeedback ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {isCorrectFeedback ? 'CORRECT!' : 'INCORRECT'}
                  </div>
                  
                  {feedbackMessage && (
                      <div className="text-indigo-400 font-black uppercase text-sm mb-6 animate-bounce">
                          {feedbackMessage}
                      </div>
                  )}
                  
                  {currentQuestion.explanation && (
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-8 text-lg font-medium text-slate-300 leading-relaxed italic shadow-xl">
                          "{currentQuestion.explanation}"
                      </div>
                  )}

                  {room && roomLeaderboard.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl">
                          <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-6 flex items-center justify-center gap-2">
                             <Trophy size={14} /> Standings
                          </h4>
                          <div className="space-y-3">
                             {roomLeaderboard.slice(0, 5).map((p, i) => {
                                 if (p.score !== lastScore) currentRank = i + 1;
                                 lastScore = p.score;
                                 return (
                                     <div key={i} className={`flex items-center justify-between px-6 py-3 rounded-xl border transition-all ${p.username === user?.username ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5'}`}>
                                         <div className="flex items-center gap-4">
                                             <span className={`text-[10px] font-black w-6 ${currentRank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>#{currentRank}</span>
                                             <span className="font-bold text-sm">@{p.username}</span>
                                         </div>
                                         <span className="font-black text-indigo-400 text-sm">{p.score}</span>
                                     </div>
                                 );
                             })}
                          </div>
                      </div>
                  )}

                  <button onClick={nextQuestion} className="w-full bg-white text-slate-950 font-black py-8 rounded-[2rem] text-2xl click-scale uppercase shadow-2xl hover:bg-slate-100 transition-colors">
                    Next Question
                  </button>
              </div>
          </div>
      )}

      <div className={`flex flex-col h-full relative z-10 ${startCountdown > 0 ? 'opacity-0 blur-xl' : 'opacity-100 blur-0'} transition-all duration-1000`}>
        <header className="px-8 py-6 flex items-center justify-between z-40 bg-transparent border-b border-white/5">
            <div className="flex items-center gap-4">
                <Logo variant="small" className="shadow-2xl" />
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                    <span className="text-xs font-black tracking-widest uppercase text-slate-400">Step <span className="text-white">{currentQuestionIndex+1} / {shuffledQuestions.length}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</div>
                    <div className="text-2xl font-black text-indigo-400 tracking-tight">{sessionPoints}</div>
                </div>
            </div>
        </header>

        <div className="absolute top-0 left-0 w-full h-1.5 z-30">
            <div className={`h-full absolute left-0 transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]' : 'bg-indigo-500'}`} style={{ width: `${timePercentage}%` }} />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 py-12 relative overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full text-center">
                {currentQuestion.type !== 'fill-in-the-blank' && (
                    <div className="mb-10 inline-block bg-black/40 backdrop-blur-xl p-10 sm:p-16 rounded-[4rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-700 w-full">
                        <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tighter text-white">
                        {currentQuestion.question}
                        </h2>
                        {currentQuestion.image && (
                            <div className="mt-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl max-w-md mx-auto aspect-video">
                                <img src={currentQuestion.image} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                )}
                
                <div className="relative z-20">
                    {renderInputs()}
                </div>
            </div>
        </main>
      </div>

      {startCountdown > 0 && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center">
              <Logo variant="large" className="mb-12 shadow-[0_0_100px_rgba(168,85,247,0.4)] animate-bounce" />
              <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-sm mb-6">Game Initializing</p>
              <div className="text-[15rem] font-black tracking-tighter leading-none animate-in zoom-in duration-500 text-white drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]" key={startCountdown}>
                  {startCountdown}
              </div>
          </div>
      )}
    </div>
  );
};