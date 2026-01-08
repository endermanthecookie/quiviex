import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, Question } from '../types';
import { THEMES } from '../constants';
import { Logo } from './Logo';
import { ArrowLeft, RotateCw, X, ThumbsUp, ThumbsDown, Repeat, CheckCircle, Brain, Shuffle, Loader2 } from 'lucide-react';

interface FlashcardViewerProps {
  quiz: Quiz;
  onExit: () => void;
}

type StudyState = 'studying' | 'summary';

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ quiz, onExit }) => {
  // Session State
  const [studyQueue, setStudyQueue] = useState<Question[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyState, setStudyState] = useState<StudyState>('studying');
  
  // Performance Tracking
  const [knownCount, setKnownCount] = useState(0);
  const [unknownQuestions, setUnknownQuestions] = useState<Question[]>([]);
  
  // Visual Theme
  const currentTheme = THEMES[quiz.theme || 'classic'] || THEMES.classic;

  const customStyle = quiz.customTheme ? {
      background: quiz.customTheme.backgroundImage ? `url(${quiz.customTheme.backgroundImage}) center/cover no-repeat fixed` : quiz.customTheme.background,
      color: quiz.customTheme.text
  } : {};
  
  const customClass = quiz.customTheme ? '' : `bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.text}`;

  // Initialize Session
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      startSession(quiz.questions);
    }
  }, [quiz]);

  const startSession = (questionsToStudy: Question[]) => {
    const shuffled = [...questionsToStudy];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setStudyQueue(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownQuestions([]);
    setStudyState('studying');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (studyState !== 'studying' || studyQueue.length === 0) return;

      if (e.code === 'Space') {
        if (e.preventDefault) e.preventDefault(); 
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.code === 'ArrowRight') handleGrade(true);
        if (e.code === 'ArrowLeft') handleGrade(false);
      }
    };

    (window as any).addEventListener('keydown', handleKeyDown);
    return () => (window as any).removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, studyState, currentCardIndex, studyQueue.length]);

  const handleGrade = (known: boolean) => {
    if (known) {
      setKnownCount(prev => prev + 1);
    } else {
      setUnknownQuestions(prev => [...prev, studyQueue[currentCardIndex]]);
    }

    if (currentCardIndex < studyQueue.length - 1) {
      setIsFlipped(false);
      (window as any).setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
    } else {
      setStudyState('summary');
    }
  };

  const renderBackContent = (q: Question) => {
    if (q.type === 'multiple-choice' || q.type === 'true-false') {
        return (
            <div className="w-full space-y-2">
                <p className="text-sm font-bold opacity-50 uppercase mb-2">Correct Answer</p>
                {q.options.map((opt, idx) => {
                    const isCorrect = idx === q.correctAnswer;
                    return (
                        <div key={idx} className={`p-3 rounded-xl flex items-center justify-between border-2 bg-white ${
                            isCorrect 
                            ? 'bg-green-50 border-green-500 text-green-900 font-bold' 
                            : 'border-transparent opacity-40 grayscale'
                        }`}>
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle size={18} className="text-green-600" />}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (q.type === 'ordering') {
        return (
            <div className="w-full space-y-2">
                 <p className="text-sm font-bold opacity-50 uppercase mb-2">Correct Sequence</p>
                 {q.options.map((opt, idx) => (
                     <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                         <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                             {idx + 1}
                         </div>
                         <span className="font-medium text-slate-800">{opt}</span>
                     </div>
                 ))}
            </div>
        );
    }

    if (q.type === 'matching') {
        return (
            <div className="w-full space-y-2">
                <p className="text-sm font-bold opacity-50 uppercase mb-2">Matches</p>
                {Array.from({ length: 4 }).map((_, i) => {
                    if (!q.options[i*2] || !q.options[i*2+1]) return null;
                    return (
                        <div key={i} className="flex items-center justify-between bg-purple-50 p-2 rounded-lg border border-purple-200 text-sm font-bold text-purple-900">
                            <span>{q.options[i*2]}</span>
                            <span>→</span>
                            <span>{q.options[i*2+1]}</span>
                        </div>
                    )
                })}
            </div>
        );
    }

    return (
        <div className="text-center">
            <p className="text-sm font-bold opacity-50 uppercase mb-4">Correct Answer</p>
            <div className="text-3xl font-black text-green-600 mb-6">
                {q.correctAnswer}
            </div>
        </div>
    );
  };

  if (studyState === 'summary') {
    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${customClass}`} style={customStyle}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain size={40} className="text-violet-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h2>
                <p className="text-slate-500 mb-8">You've reviewed {studyQueue.length} cards.</p>
                <div className="flex justify-center gap-4 mb-8">
                    <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex-1">
                        <div className="text-3xl font-black text-green-600">{knownCount}</div>
                        <div className="text-xs font-bold text-green-800 uppercase">Mastered</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex-1">
                        <div className="text-3xl font-black text-orange-600">{unknownQuestions.length}</div>
                        <div className="text-xs font-bold text-orange-800 uppercase">Needs Work</div>
                    </div>
                </div>
                <div className="space-y-3">
                    {unknownQuestions.length > 0 && (
                        <button onClick={() => startSession(unknownQuestions)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2">
                            <Repeat size={20} /> Study Missed Cards ({unknownQuestions.length})
                        </button>
                    )}
                    <button onClick={() => startSession(quiz.questions)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                        <Shuffle size={20} /> Restart Full Session
                    </button>
                    <button onClick={onExit} className="w-full bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-4 rounded-xl transition-all">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
  }

  const currentQ = studyQueue[currentCardIndex];
  if (!currentQ) return <div className="min-h-screen flex items-center justify-center text-white font-bold">Initializing Queue...</div>;

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden ${customClass}`} style={customStyle}>
      <div className="bg-white/10 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-lg border-b border-white/10 z-10">
        <div className="flex items-center gap-3 text-white">
            <Logo variant="small" />
            <div className="flex flex-col">
                <span className="text-xl font-black leading-none">Study Mode</span>
                <span className="text-xs opacity-70">{quiz.title}</span>
            </div>
        </div>
        <button onClick={onExit} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="w-full h-2 bg-black/20">
        <div className="h-full bg-white/80 transition-all duration-300 ease-out" style={{ width: `${((currentCardIndex) / studyQueue.length) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 perspective-1000">
         <div className="relative w-full max-w-xl aspect-[3/4] sm:aspect-[4/3] cursor-pointer group perspective-1000" onClick={() => !isFlipped && setIsFlipped(true)}>
             <div className="absolute top-2 left-2 w-full h-full bg-white/20 rounded-3xl transform rotate-2"></div>
             <div className="absolute top-1 left-1 w-full h-full bg-white/40 rounded-3xl transform -rotate-1"></div>

            <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front of Card */}
                <div className={`absolute inset-0 backface-hidden bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center justify-between border-b-8 border-slate-200 overflow-y-auto custom-scrollbar ${isFlipped ? 'z-0' : 'z-10'}`}>
                    <div className="w-full flex justify-between items-start flex-shrink-0 mb-4">
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Card {currentCardIndex + 1} / {studyQueue.length}</span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 animate-pulse"><RotateCw size={12} /> Tap to Flip</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center w-full text-center">
                        <h3 className={`${currentQ.question.length > 50 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black text-slate-800 mb-6 leading-tight`}>{currentQ.question}</h3>
                        {currentQ.image && <img src={currentQ.image} alt="" className="max-h-48 rounded-lg object-contain shadow-sm border border-slate-100" />}
                    </div>
                    
                    <div className="text-slate-400 text-sm font-medium italic mt-6 flex-shrink-0">Think of the answer...</div>
                </div>

                {/* Back of Card */}
                <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col items-center border-b-8 border-indigo-200 overflow-y-auto custom-scrollbar ${isFlipped ? 'z-10' : 'z-0'}`}>
                     <div className="w-full flex justify-between items-start mb-4 flex-shrink-0">
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Answer</span>
                    </div>
                    <div className="w-full flex-1 flex flex-col items-center">
                        {renderBackContent(currentQ)}
                        {currentQ.explanation && (
                            <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200 w-full text-left">
                                <h4 className="font-bold text-slate-500 uppercase text-xs tracking-wide mb-1">Explanation</h4>
                                <p className="text-slate-700 text-sm leading-relaxed">{currentQ.explanation}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
         </div>

         <div className="w-full max-w-xl mt-8 h-20">
            {isFlipped ? (
                <div className="grid grid-cols-2 gap-4 h-full animate-in slide-in-from-bottom-4 duration-300">
                    <button onClick={() => handleGrade(false)} className="bg-orange-100 hover:bg-orange-200 border-2 border-orange-200 text-orange-700 rounded-2xl font-bold text-lg flex flex-col items-center justify-center transition-all active:scale-95">
                        <span className="flex items-center gap-2"><ThumbsDown size={20} /> Study Again</span>
                        <span className="text-[10px] opacity-60 font-medium uppercase tracking-wider">Left Arrow</span>
                    </button>
                    <button onClick={() => handleGrade(true)} className="bg-green-100 hover:bg-green-200 border-2 border-green-200 text-green-700 rounded-2xl font-bold text-lg flex flex-col items-center justify-center transition-all active:scale-95">
                         <span className="flex items-center gap-2"><ThumbsUp size={20} /> Got It</span>
                         <span className="text-[10px] opacity-60 font-medium uppercase tracking-wider">Right Arrow</span>
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsFlipped(true)} className="w-full h-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 rounded-2xl font-bold text-xl backdrop-blur-sm transition-all shadow-lg active:scale-95">Show Answer</button>
            )}
         </div>
      </div>
    </div>
  );
};