import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle, Info, Trophy, RotateCw, Home, Crown, Star } from 'lucide-react';
import { Quiz, Room } from '../types';
import { THEMES } from '../constants';
import { supabase } from '../services/supabase';

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: (number | string | number[])[];
  score: number;
  points?: number;
  room?: Room;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ quiz, userAnswers, score, points, room, onPlayAgain, onHome }) => {
  const percentage = Math.round((score / quiz.questions.length) * 100);
  const currentTheme = THEMES[quiz.theme || 'classic'] || THEMES.classic;
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

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

  useEffect(() => {
    if (percentage >= 80) {
        fireConfetti();
    }
    if (room) {
        fetchFinalLeaderboard();
    }
  }, [percentage, room]);

  const fetchFinalLeaderboard = async () => {
      if (!room) return;
      const { data } = await supabase.from('room_participants').select('username, score').eq('room_id', room.id).order('score', { ascending: false });
      if (data) setLeaderboard(data);
  };

  const fireConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const particleCount = 150;
    const colors = ['#fcd34d', '#f87171', '#60a5fa', '#4ade80', '#a78bfa'];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 5,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 100 + Math.random() * 50,
            gravity: 0.5
        });
    }

    const animate = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.life--;
                p.size *= 0.96;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (active) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(canvas);
        }
    };

    animate();
  };

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
        
        {room && leaderboard.length > 0 && (
            <div className="mb-12 text-center">
                <div className="inline-block bg-black/20 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-3"><Crown className="text-yellow-400" /> Final Podium</h2>
                </div>
                
                <div className="flex items-end justify-center gap-4 h-64">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-100">
                            <div className="w-20 h-20 rounded-full bg-slate-300 border-4 border-white shadow-xl flex items-center justify-center font-black text-2xl text-slate-600 mb-4 z-10 relative">
                                2
                            </div>
                            <div className="bg-slate-300/20 backdrop-blur-md w-24 h-32 rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center justify-end pb-4">
                                <div className="font-black text-white">{leaderboard[1].username}</div>
                                <div className="text-xs font-bold text-slate-300">{leaderboard[1].score} pts</div>
                            </div>
                        </div>
                    )}
                    
                    {/* 1st Place */}
                    {leaderboard[0] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700">
                            <div className="relative">
                                <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 w-12 h-12 animate-bounce" />
                                <div className="w-24 h-24 rounded-full bg-yellow-400 border-4 border-white shadow-2xl flex items-center justify-center font-black text-4xl text-yellow-800 mb-4 z-10 relative">
                                    1
                                </div>
                            </div>
                            <div className="bg-yellow-400/20 backdrop-blur-md w-32 h-48 rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center justify-end pb-4">
                                <div className="font-black text-2xl text-white">{leaderboard[0].username}</div>
                                <div className="text-sm font-bold text-yellow-200">{leaderboard[0].score} pts</div>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-bottom duration-700 delay-200">
                            <div className="w-20 h-20 rounded-full bg-orange-400 border-4 border-white shadow-xl flex items-center justify-center font-black text-2xl text-orange-900 mb-4 z-10 relative">
                                3
                            </div>
                            <div className="bg-orange-400/20 backdrop-blur-md w-24 h-24 rounded-t-2xl border-t border-x border-white/10 flex flex-col items-center justify-end pb-4">
                                <div className="font-black text-white">{leaderboard[2].username}</div>
                                <div className="text-xs font-bold text-orange-200">{leaderboard[2].score} pts</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Score Card */}
        <div 
            className={`rounded-[2.5rem] border p-8 sm:p-12 text-center shadow-2xl mb-8 relative overflow-hidden ${!quiz.customTheme ? 'bg-white/10 backdrop-blur-md border-white/20' : ''}`}
            style={cardStyle}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-widest opacity-80 mb-4">Your Performance</h2>
          
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
            {points !== undefined && <span className="ml-4 text-indigo-400 font-black">+{points} XP</span>}
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