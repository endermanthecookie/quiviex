import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, Room, User } from '../types';
import { Logo } from './Logo';
import { CheckCircle2, AlertCircle, Users, Trophy, ChevronUp, ChevronDown, AlignLeft, Layers, ListOrdered, Sliders, Type, CheckSquare } from 'lucide-react';
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
  
  const [tempInput, setTempInput] = useState('');
  const [tempOrder, setTempOrder] = useState<number[]>([]);
  const [tempSlider, setTempSlider] = useState(50);
  
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
        } else if (currentQuestion.type === 'text-input' || currentQuestion.type === 'fill-in-the-blank') {
            const userText = String(answer).toLowerCase().trim();
            const correctText = String(currentQuestion.correctAnswer).toLowerCase().trim();
            const distance = getLevenshteinDistance(userText, correctText);
            
            if (distance === 0) {
                isCorrect = true;
                multiplier = 1;
            } else if (distance === 1) {
                isCorrect = true; // Still counts as correct
                multiplier = 0.8;
                currentFeedback = "Close enough! (Typo detected)";
            } else if (distance === 2) {
                isCorrect = true; // Still counts as correct
                multiplier = 0.5;
                currentFeedback = "Almost! A few mistakes detected.";
            } else {
                isCorrect = false;
                multiplier = 0;
            }
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
        const finalScore = quiz.questions.reduce((acc, q, i) => acc + (checkAnswerIsCorrect(q, finalAnswers[i]) ? 1 : 0), 0);
        onComplete(finalAnswers, finalScore, sessionPoints);
      }
  };

  const checkAnswerIsCorrect = (q: any, a: any) => {
    if (a === -1) return false;
    if (q.type === 'text-input' || q.type === 'fill-in-the-blank') {
        const userText = String(a).toLowerCase().trim();
        const correctText = String(q.correctAnswer).toLowerCase().trim();
        return getLevenshteinDistance(userText, correctText) <= 2;
    }
    if (q.type === 'ordering') {
        return Array.isArray(a) && a.every((val, i) => val === i);
    }
    return a === q.correctAnswer;
  };

  const moveOrder = (idx: number, dir: 'up' | 'down') => {
      const newOrder = [...tempOrder];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= newOrder.length) return;
      [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
      setTempOrder(newOrder);
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;

  if (!currentQuestion) return null;

  let currentRank = 0;
  let lastScore = -1;

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
          case 'fill-in-the-blank':
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in">
                      <input 
                        type="text" 
                        value={tempInput}
                        onChange={(e) => setTempInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && tempInput.trim() && submitAnswer(tempInput)}
                        placeholder="Type answer..."
                        className="w-full bg-black/40 backdrop-blur-xl border-4 border-white/10 rounded-[2.5rem] p-10 text-3xl font-black text-center focus:outline-none focus:border-indigo-500 transition-all mb-8 shadow-2xl"
                        autoFocus
                      />
                      <button onClick={() => submitAnswer(tempInput)} disabled={!tempInput.trim()} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale shadow-xl">Submit</button>
                  </div>
              );
          case 'ordering':
              return (
                  <div className="max-w-xl mx-auto w-full space-y-4 stagger-in">
                      {tempOrder.map((originalIdx, displayIdx) => (
                          <div key={originalIdx} className="glass p-6 rounded-3xl border border-white/10 flex items-center gap-6">
                              <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-indigo-400">{displayIdx + 1}</span>
                              <span className="flex-1 font-bold text-lg">{currentQuestion.options[originalIdx]}</span>
                              <div className="flex flex-col gap-1">
                                  <button onClick={() => moveOrder(displayIdx, 'up')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronUp size={20} /></button>
                                  <button onClick={() => moveOrder(displayIdx, 'down')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronDown size={20} /></button>
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