
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

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, room, user, onComplete, onExit }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const userAnswersRef = useRef<(number | string | number[])[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
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
      setTempOrder(q.type === 'ordering' ? [0, 1, 2, 3] : []);
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

  const calculatePoints = (isCorrect: boolean, timeTakenSeconds: number, timeLimit: number, proximity: number = 1) => {
      if (!isCorrect && proximity === 1) return 0;
      const basePoints = proximity < 1 ? 200 * proximity : 500;
      const timeBonus = Math.max(0, (timeLimit - timeTakenSeconds) / timeLimit) * 500;
      return Math.floor((basePoints + timeBonus) * (isCorrect ? 1 : 0.2));
  };

  const submitAnswer = async (answer: any) => {
    setTimerActive(false);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    let isCorrect = false;
    let proximity = 1;

    if (answer !== -1) {
        if (currentQuestion.type === 'slider') {
            const target = currentQuestion.correctAnswer as number;
            const diff = Math.abs(target - answer);
            const range = Math.abs(parseInt(currentQuestion.options[1]) - parseInt(currentQuestion.options[0]));
            proximity = Math.max(0, 1 - (diff / (range * 0.5)));
            isCorrect = diff <= (range * 0.05);
        } else {
            isCorrect = checkAnswerIsCorrect(currentQuestion, answer);
        }
    }
    
    const pointsGained = calculatePoints(isCorrect, timeTaken, currentQuestion.timeLimit, proximity);
    setSessionPoints(prev => prev + pointsGained);
    setStreak(prev => isCorrect ? prev + 1 : 0);
    setIsCorrectFeedback(isCorrect);
    
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
        return typeof a === 'string' && a.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
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
                        <button key={i} onClick={() => timerActive && submitAnswer(i)} disabled={!timerActive} className="glass p-8 rounded-[2.5rem] text-xl font-black text-left flex items-center gap-6 group click-scale border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl font-black italic text-white/20 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-all">{i+1}</div>
                            <span className="flex-1">{opt}</span>
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
                        className="w-full bg-white/5 border-4 border-white/10 rounded-[2.5rem] p-10 text-3xl font-black text-center focus:outline-none focus:border-indigo-500 transition-all mb-8"
                        autoFocus
                      />
                      <button onClick={() => submitAnswer(tempInput)} disabled={!tempInput.trim()} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale">Submit</button>
                  </div>
              );
          case 'ordering':
              return (
                  <div className="max-w-xl mx-auto w-full space-y-4 stagger-in">
                      {tempOrder.map((originalIdx, displayIdx) => (
                          <div key={originalIdx} className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-6">
                              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-indigo-400">{displayIdx + 1}</span>
                              <span className="flex-1 font-bold text-lg">{currentQuestion.options[originalIdx]}</span>
                              <div className="flex flex-col gap-1">
                                  <button onClick={() => moveOrder(displayIdx, 'up')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronUp size={20} /></button>
                                  <button onClick={() => moveOrder(displayIdx, 'down')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><ChevronDown size={20} /></button>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => submitAnswer(tempOrder)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale mt-8">Confirm Order</button>
                  </div>
              );
          case 'slider':
              const min = parseInt(currentQuestion.options[0]);
              const max = parseInt(currentQuestion.options[1]);
              return (
                  <div className="max-w-2xl mx-auto w-full stagger-in bg-white/5 p-12 rounded-[3.5rem] border border-white/10">
                      <div className="text-center mb-12">
                          <div className="text-7xl font-black text-indigo-400 mb-2">{tempSlider}</div>
                      </div>
                      <input 
                        type="range" 
                        min={min} 
                        max={max} 
                        value={tempSlider}
                        onChange={(e) => setTempSlider(parseInt(e.target.value))}
                        className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 mb-12"
                      />
                      <button onClick={() => submitAnswer(tempSlider)} className="w-full py-6 bg-indigo-600 rounded-3xl font-black text-xl uppercase tracking-widest click-scale">Submit Value</button>
                  </div>
              );
          default:
              return <div className="text-center text-rose-500 font-black">Question Error</div>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-['Plus_Jakarta_Sans']">
      {showExplanation && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-2xl w-full text-center stagger-in">
                  <div className={`mb-6 text-7xl font-black tracking-tighter ${isCorrectFeedback ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {isCorrectFeedback ? 'CORRECT!' : 'INCORRECT'}
                  </div>
                  
                  {currentQuestion.explanation && (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 text-lg font-medium text-slate-300 leading-relaxed italic">
                          "{currentQuestion.explanation}"
                      </div>
                  )}

                  {room && roomLeaderboard.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10">
                          <h4 className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mb-6 flex items-center justify-center gap-2">
                             <Trophy size={14} /> Leaderboard
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

                  <button onClick={nextQuestion} className="w-full bg-white text-slate-950 font-black py-6 rounded-3xl text-2xl click-scale uppercase shadow-xl">
                    Next Question
                  </button>
              </div>
          </div>
      )}

      <div className={`flex flex-col h-full ${startCountdown > 0 ? 'opacity-0 blur-xl' : 'opacity-100 blur-0'} transition-all duration-1000`}>
        <header className="glass px-8 py-5 flex items-center justify-between border-b border-white/5 z-40 bg-slate-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <Logo variant="small" className="shadow-lg" />
                <div className="text-sm font-black tracking-widest uppercase text-slate-500">QUESTION <span className="text-white">{currentQuestionIndex+1}</span></div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Score</div>
                    <div className="text-lg font-black text-indigo-400 tracking-tight">{sessionPoints}</div>
                </div>
            </div>
        </header>

        <div className="absolute top-0 left-0 w-full h-1 z-30">
            <div className={`h-full absolute left-0 transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]' : 'bg-indigo-500'}`} style={{ width: `${timePercentage}%` }} />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 py-12 relative z-40 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full text-center py-10">
                <div className={`text-6xl font-black mb-12 tabular-nums ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                  {timeLeft}
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black mb-16 leading-tight tracking-tighter animate-in slide-in-from-bottom-8 duration-700">
                  {currentQuestion.question}
                </h2>
                
                {renderInputs()}
            </div>
        </main>
      </div>

      {startCountdown > 0 && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center">
              <Logo variant="large" className="mb-12 shadow-[0_0_80px_rgba(168,85,247,0.3)] animate-bounce" />
              <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs mb-6">Preparing Game</p>
              <div className="text-[12rem] font-black tracking-tighter leading-none animate-in zoom-in duration-500 text-white" key={startCountdown}>
                  {startCountdown}
              </div>
          </div>
      )}
    </div>
  );
};
