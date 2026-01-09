
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, Room, User } from '../types';
import { Logo } from './Logo';
import { CheckCircle2, AlertCircle, Users, Trophy } from 'lucide-react';
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

  const calculatePoints = (isCorrect: boolean, timeTakenSeconds: number, timeLimit: number) => {
      if (!isCorrect) return 0;
      if (timeTakenSeconds <= 1) return 500;
      const remainingRatio = Math.max(0, (timeLimit - timeTakenSeconds) / (timeLimit - 1));
      return Math.floor(100 + (400 * remainingRatio));
  };

  const submitAnswer = async (answer: any) => {
    setTimerActive(false);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    let isCorrect = false;
    if (answer !== -1) {
        isCorrect = checkAnswerIsCorrect(currentQuestion, answer);
    }
    
    const pointsGained = calculatePoints(isCorrect, timeTaken, currentQuestion.timeLimit);
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
    if (q.type === 'text-input') return typeof a === 'string' && a.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
    return a === q.correctAnswer;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;

  if (!currentQuestion) return null;

  // Tied ranking helper
  let currentRank = 0;
  let lastScore = -1;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {showExplanation && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="max-w-2xl w-full text-center stagger-in">
                  <div className={`mb-6 text-7xl font-black tracking-tighter ${isCorrectFeedback ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {isCorrectFeedback ? 'CORRECT!' : 'INCORRECT'}
                  </div>
                  
                  {room && roomLeaderboard.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10">
                          <h4 className="text-indigo-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center justify-center gap-2">
                             <Trophy size={16} /> Game Rankings
                          </h4>
                          <div className="space-y-3">
                             {roomLeaderboard.slice(0, 5).map((p, i) => {
                                 if (p.score !== lastScore) {
                                     currentRank = i + 1;
                                 }
                                 lastScore = p.score;

                                 return (
                                     <div key={i} className={`flex items-center justify-between px-6 py-3 rounded-xl border transition-all ${p.username === user?.username ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/5'}`}>
                                         <div className="flex items-center gap-4">
                                             <span className={`text-xs font-black w-6 ${currentRank === 1 ? 'text-yellow-400' : 'text-slate-500'}`}>#{currentRank}</span>
                                             <span className={`font-bold ${p.username === user?.username ? 'text-white' : 'text-slate-300'}`}>@{p.username}</span>
                                         </div>
                                         <span className="font-black text-indigo-400">{p.score}</span>
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

      <div className={`flex flex-col h-full ${startCountdown > 0 ? 'opacity-0 blur-xl' : 'opacity-100 blur-0'}`}>
        <header className="glass px-8 py-5 flex items-center justify-between border-b border-white/5 z-40">
            <div className="flex items-center gap-3">
                <Logo variant="small" className="shadow-lg" />
                <div className="text-lg font-black tracking-tighter">QUESTION <span className="text-indigo-400 italic">{currentQuestionIndex+1}</span></div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Points</div>
                    <div className="text-xl font-black text-indigo-400 tracking-tight">{sessionPoints} PTS</div>
                </div>
                {room && (
                    <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                        <Users size={16} className="text-indigo-400" />
                        <span className="text-xs font-black">MULTIPLAYER</span>
                    </div>
                )}
            </div>
        </header>

        <div className="absolute top-0 left-0 w-full h-2 z-30">
            <div className={`h-full absolute left-0 transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,1)]' : 'bg-indigo-500'}`} style={{ width: `${timePercentage}%` }} />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 py-12 sm:p-24 relative z-40">
            <div className="max-w-4xl mx-auto w-full text-center">
                <div className={`text-7xl font-black mb-12 tabular-nums ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                  {timeLeft}
                </div>
                
                <h2 className="text-4xl sm:text-6xl font-black mb-16 leading-tight tracking-tight animate-in slide-in-from-bottom-8 duration-700">
                  {currentQuestion.question}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-in">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => timerActive && submitAnswer(i)} disabled={!timerActive} className="glass p-10 rounded-[2.5rem] text-2xl font-black text-left flex items-center gap-8 group click-scale border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl font-black italic text-white/20 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-all">{i+1}</div>
                            <span className="flex-1">{opt}</span>
                        </button>
                    ))}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};
