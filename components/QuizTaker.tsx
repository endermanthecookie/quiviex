import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question } from '../types';
import { Logo } from './Logo';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (answers: (number | string | number[])[], score: number) => void;
  onExit: () => void;
}

interface ShuffledQuestion extends Question {
    originalIndex: number;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onComplete, onExit }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const userAnswersRef = useRef<(number | string | number[])[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerActive, setTimerActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const bgMusicRef = useRef<any>(null);

  useEffect(() => {
    let q: ShuffledQuestion[] = quiz.questions.map((qs, idx) => ({ ...qs, originalIndex: idx }));
    if (quiz.shuffleQuestions) {
        for (let i = q.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q[i], q[j]] = [q[j], q[i]];
        }
    }
    setShuffledQuestions(q);
    initializeQuestionState(q[0]);
  }, [quiz]);

  const initializeQuestionState = (q: Question) => {
      if (!q) return;
      setTimeLeft(q.timeLimit || 20);
      setTextInput('');
  };

  useEffect(() => {
    if (quiz.backgroundMusic) {
        const audio = new (window as any).Audio(quiz.backgroundMusic);
        audio.loop = true;
        audio.volume = 0.3;
        bgMusicRef.current = audio;
        audio.play().catch(() => {});
    }
    return () => { if (bgMusicRef.current) (bgMusicRef.current as any).pause(); };
  }, [quiz.backgroundMusic]);

  useEffect(() => {
    if (startCountdown > 0) {
        const timer = (window as any).setInterval(() => {
            setStartCountdown((prev: number) => {
               if (prev <= 1) { (window as any).clearInterval(timer); setTimerActive(true); return 0; } 
               return prev - 1;
            });
        }, 1000);
        return () => (window as any).clearInterval(timer);
    }
  }, [startCountdown]);

  useEffect(() => {
    if (!timerActive || timeLeft === null || showExplanation) return;
    if (timeLeft <= 0) { submitAnswer(-1); return; }
    const timer = (window as any).setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => (window as any).clearInterval(timer);
  }, [timeLeft, timerActive, showExplanation]);

  const submitAnswer = (answer: any) => {
    setTimerActive(false);
    let isCorrect = false;
    if (answer !== -1) {
        isCorrect = checkAnswerIsCorrect(currentQuestion, answer);
        setStreak(prev => isCorrect ? prev + 1 : 0);
    } else {
        setStreak(0);
    }
    setIsCorrectFeedback(isCorrect);
    const newAnswers = [...userAnswersRef.current];
    newAnswers[currentQuestionIndex] = answer;
    userAnswersRef.current = newAnswers;
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
        onComplete(finalAnswers, calculateScore(finalAnswers));
      }
  };

  const calculateScore = (ans: any[]) => quiz.questions.reduce((acc, q, i) => acc + (checkAnswerIsCorrect(q, ans[i]) ? 1 : 0), 0);
  const checkAnswerIsCorrect = (q: any, a: any) => {
    if (q.type === 'text-input') return typeof a === 'string' && a.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
    return a === q.correctAnswer;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timePercentage = currentQuestion ? (timeLeft / currentQuestion.timeLimit) * 100 : 0;

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden transition-all duration-1000">
      {/* Countdown Overlay */}
      {startCountdown > 0 && (
          <div className="absolute inset-0 z-50 glass flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="text-[12rem] font-black text-white animate-bounce drop-shadow-[0_0_80px_rgba(168,85,247,0.8)] tracking-tighter">{startCountdown}</div>
             <p className="text-lg font-black text-purple-400 mt-8 tracking-[1.5em] uppercase animate-pulse">Establishing Session</p>
          </div>
      )}

      {/* Feedback Overlay */}
      {showExplanation && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="bg-white/5 border border-white/10 rounded-[3.5rem] p-12 max-w-xl w-full text-center shadow-2xl">
                  <div className="mb-10">
                      {isCorrectFeedback ? (
                          <div className="text-emerald-400 font-black text-7xl animate-pulse tracking-tighter flex flex-col items-center gap-4">
                             <CheckCircle2 size={100} /> CORRECT
                          </div>
                      ) : (
                          <div className="text-rose-500 font-black text-7xl tracking-tighter flex flex-col items-center gap-4">
                             <AlertCircle size={100} /> INCORRECT
                          </div>
                      )}
                  </div>
                  <button onClick={nextQuestion} className="w-full bg-white text-slate-950 font-black py-6 rounded-2xl text-2xl click-scale uppercase tracking-tighter shadow-xl">
                    Next Question
                  </button>
              </div>
          </div>
      )}

      <div className={`flex flex-col h-full transition-all duration-1000 ${startCountdown > 0 ? 'scale-110 opacity-0 blur-3xl' : 'scale-100 opacity-100 blur-0'}`}>
        <header className="glass px-8 py-5 flex items-center justify-between border-b border-white/5 z-40">
            <div className="flex items-center gap-3">
                <Logo variant="small" className="shadow-lg" />
                <div className="text-lg font-black tracking-tighter">QUIVIEX <span className="text-purple-400 italic">#{currentQuestionIndex+1}</span></div>
            </div>
            {streak > 1 && <div className="bg-purple-500/20 px-6 py-2 rounded-full border border-purple-500/30 text-2xl font-black italic tracking-widest text-purple-400 animate-in zoom-in">{streak}X STREAK</div>}
            <button onClick={onExit} className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all click-scale border border-rose-500/20">Exit Session</button>
        </header>

        {/* Background Timer Bar */}
        <div className="absolute top-0 left-0 w-full h-2 z-30">
            <div className={`h-full absolute left-0 transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,1)]' : 'bg-purple-500'}`} style={{ width: `${timePercentage}%` }} />
        </div>

        <main className="flex-1 flex flex-col justify-center px-6 py-12 sm:p-24 overflow-y-auto custom-scrollbar relative z-40">
            <div className="max-w-4xl mx-auto w-full text-center">
                {/* Timer Clock */}
                <div className={`text-7xl font-black mb-12 tabular-nums drop-shadow-lg ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                  {timeLeft}
                </div>
                
                {/* Question Layer - Ensures it's above the timer background visually */}
                <div className="relative z-50">
                   <h2 className="text-4xl sm:text-6xl font-black mb-16 leading-tight tracking-tight animate-in slide-in-from-bottom-8 duration-700 bg-clip-text">
                     {currentQuestion.question}
                   </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-in">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => timerActive && submitAnswer(i)} disabled={!timerActive} className="glass p-10 rounded-[2.5rem] text-2xl font-black text-left flex items-center gap-8 group click-scale border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl font-black italic text-white/20 group-hover:text-purple-400 group-hover:bg-purple-500/20 transition-all">{i+1}</div>
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