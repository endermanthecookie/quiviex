
import React from 'react';
import { XCircle, CheckCircle, Info, Trophy, RotateCw, Home } from 'lucide-react';
import { Quiz } from '../types';
import { THEMES } from '../constants';

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: (number | string | number[])[];
  score: number;
  /* Added points prop to resolve missing property error in App.tsx */
  points?: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quiz, userAnswers, score, points, onPlayAgain, onHome }) => {
  const percentage = Math.round((score / quiz.questions.length) * 100);
  const currentTheme = THEMES[quiz.theme || 'classic'] || THEMES.classic;

  const customStyle = quiz.customTheme ? {
      background: quiz.customTheme.backgroundImage ? `url(${quiz.customTheme.backgroundImage}) center/cover no-repeat fixed` : quiz.customTheme.background,
      color: quiz.customTheme.text
  } : {};
  
  const customClass = quiz.customTheme ? '' : `bg-gradient-to-br ${currentTheme.gradient} ${currentTheme.text}`;

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const cardStyle = quiz.customTheme ? {
      backgroundColor: hexToRgba(quiz.customTheme.cardColor, quiz.customTheme.cardOpacity),
      color: quiz.customTheme.text,
      border: `1px solid ${hexToRgba(quiz.customTheme.text, 0.1)}`
  } : {};

  const renderCorrectAnswer = (q: any) => {
      if (q.type === 'text-input' || q.type === 'fill-in-the-blank') return q.correctAnswer;
      if (q.type === 'ordering') return 'Correct sequence shown in creator';
      if (q.type === 'matching') return 'Matched pairs shown in creator';
      if (q.type === 'slider') return `${q.correctAnswer} ${q.options[3] || ''}`;
      if (typeof q.correctAnswer === 'number') return q.options[q.correctAnswer];
      return '';
  };

  return (
    <div 
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${customClass}`}
        style={customStyle}
    >
      <div className="max-w-4xl w-full animate-in fade-in zoom-in duration-500">
        
        {/* Score Card */}
        <div 
            className={`rounded-[2.5rem] border p-8 sm:p-12 text-center shadow-2xl mb-8 relative overflow-hidden ${!quiz.customTheme ? 'bg-white/10 backdrop-blur-md border-white/20' : ''}`}
            style={cardStyle}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest opacity-80 mb-4">Quiz Complete</h2>
          
          <div className="relative inline-block mb-6">
             <div 
                className={`text-[8rem] sm:text-[10rem] font-black leading-none drop-shadow-2xl bg-clip-text text-transparent ${!quiz.customTheme ? 'bg-gradient-to-b from-white to-white/60' : ''}`}
                style={quiz.customTheme ? { backgroundImage: 'none', color: quiz.customTheme.text } : {}}
             >
                {percentage}%
             </div>
             {percentage === 100 && (
                 <Trophy className="absolute -top-4 -right-12 text-yellow-400 drop-shadow-lg animate-bounce" size={64} />
             )}
          </div>
          
          <div className="text-2xl sm:text-3xl font-medium bg-black/20 inline-block px-8 py-3 rounded-full backdrop-blur-sm" style={quiz.customTheme ? { color: '#ffffff' } : {}}>
            {score} / {quiz.questions.length} Correct
            {points !== undefined && <span className="ml-4 text-indigo-400 font-black">+{points} PTS</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <button
            onClick={onPlayAgain}
            className={`font-bold py-4 rounded-2xl text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${!quiz.customTheme ? 'bg-white text-slate-900 hover:bg-slate-100' : 'text-white hover:opacity-90'}`}
            style={quiz.customTheme ? { backgroundColor: quiz.customTheme.accent } : {}}
          >
            <RotateCw size={24} /> Play Again
          </button>
          <button
            onClick={onHome}
            className={`font-bold py-4 rounded-2xl text-xl shadow-xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 ${!quiz.customTheme ? 'bg-black/30 hover:bg-black/40 text-white' : 'bg-black/20 hover:bg-black/30 text-white'}`}
          >
            <Home size={24} /> Dashboard
          </button>
        </div>

        {/* Breakdown */}
        <h3 className="text-2xl font-bold mb-6 px-4 opacity-90">Question Breakdown</h3>
        <div className="space-y-4">
          {quiz.questions.map((q, index) => {
            return (
              <div key={index} className="bg-white/90 backdrop-blur text-slate-900 rounded-2xl p-6 shadow-lg border-l-8 border-l-indigo-500">
                <div className="flex flex-col gap-3">
                    <p className="font-bold text-lg sm:text-xl">{q.question}</p>
                    
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-800 font-bold text-sm uppercase tracking-wide mb-1">
                            <CheckCircle size={16} /> Correct Answer
                        </div>
                        <p className="text-lg font-medium text-green-900">
                            {renderCorrectAnswer(q)}
                        </p>
                    </div>

                    {q.explanation && (
                        <div className="bg-slate-100 p-4 rounded-xl text-slate-700 text-sm flex gap-3">
                            <Info size={20} className="flex-shrink-0 text-slate-400" />
                            <span className="leading-relaxed">{q.explanation}</span>
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
