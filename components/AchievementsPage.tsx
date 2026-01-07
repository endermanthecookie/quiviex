import React from 'react';
import { User } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { Logo } from './Logo';

interface AchievementsPageProps {
  user: User;
  onBack: () => void;
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ user, onBack }) => {
  const unlockedCount = user.achievements.length;
  const progress = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={28} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hall of Fame</h1>
          </div>
        </div>
        <Logo variant="small" />
      </header>

      <div className="max-w-5xl mx-auto p-6 stagger-in">
        {/* Progress Card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-[3rem] p-10 text-white mb-12 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center sm:text-left">
              <h2 className="text-4xl font-black mb-2 tracking-tight">Unlocked Assets</h2>
              <p className="text-indigo-100 font-bold opacity-70">Master your craft to collect them all.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-[2rem] p-6 backdrop-blur-md border border-white/10">
              <div className="text-5xl font-black">{unlockedCount}</div>
              <div className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em] leading-tight">
                OF {ACHIEVEMENTS.length}<br/>TOTAL UNLOCKED
              </div>
            </div>
          </div>
          <div className="w-full bg-black/20 h-4 rounded-full mt-10 overflow-hidden relative">
            <div 
              className="bg-yellow-400 h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(250,204,21,0.5)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <Trophy size={200} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = user.achievements.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                className={`
                  relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-500 click-scale
                  ${isUnlocked 
                    ? 'glass border-white shadow-xl' 
                    : 'bg-white/10 border-white/5 opacity-50 grayscale'}
                `}
              >
                <div className="flex items-start gap-5">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0
                    ${isUnlocked ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border border-white' : 'bg-slate-200'}
                  `}>
                    {isUnlocked ? ach.icon : <Lock size={24} className="text-slate-400" />}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg mb-1 tracking-tight ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                      {ach.title}
                    </h3>
                    <p className={`text-xs font-bold leading-relaxed ${isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                      {ach.description}
                    </p>
                  </div>
                </div>
                {isUnlocked && (
                    <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};