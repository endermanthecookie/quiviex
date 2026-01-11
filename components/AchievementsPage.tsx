import React, { useEffect, useState } from 'react';
import { User, Achievement } from '../types';
import { ArrowLeft, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import { HoloCard } from './HoloCard';

interface AchievementsPageProps {
  user: User;
  onBack: () => void;
  // Added definitions prop to fix type error in App.tsx
  definitions: Achievement[];
}

export const AchievementsPage: React.FC<AchievementsPageProps> = ({ user, onBack, definitions: initialDefinitions }) => {
  const [definitions, setDefinitions] = useState<Achievement[]>(initialDefinitions || []);
  const [userStatus, setUserStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const fetchData = async () => {
    try {
      // 1. If definitions are not provided via props, fetch them from DB
      if (definitions.length === 0) {
        const { data: defs, error: defError } = await supabase.from('achievement_definitions').select('*').order('id', { ascending: true });
        if (defError) throw defError;
        setDefinitions(defs || []);
      }

      // 2. Fetch user column status from wide table
      const { data: status, error: statusError } = await supabase
        .from('user_achievement_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statusError) throw statusError;
      if (status) {
          setUserStatus(status);
      } else {
          // Initialize user row if missing
          const initial: any = { user_id: user.id };
          for (let i = 1; i <= 100; i++) initial[`a${i}`] = 0;
          await supabase.from('user_achievement_status').insert(initial);
          setUserStatus(initial);
      }
    } catch (e) {
      (window as any).console.error("Achievement fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = Object.keys(userStatus).filter(k => k.startsWith('a') && userStatus[k] === 1).length;
  const totalCount = definitions.length || 100;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-40 bg-[#f1f5f9]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Achievements</h1>
          </div>
        </div>
        <Logo variant="small" />
      </header>

      <div className="max-w-7xl mx-auto p-6 stagger-in">
        {/* Progress Banner - Matches Screenshot 100% */}
        <div className="bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#6366f1] rounded-[3.5rem] p-12 text-white mb-16 shadow-2xl relative overflow-hidden border border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-12 relative z-10">
            <div className="text-center sm:text-left">
              <h2 className="text-5xl font-black mb-3 tracking-tighter">Unlocked Assets</h2>
              <p className="text-indigo-100 font-bold text-lg opacity-80">Master your craft to collect them all.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl flex items-center gap-6 min-w-[200px]">
              <div className="text-7xl font-black drop-shadow-lg text-white">{unlockedCount}</div>
              <div className="text-[10px] font-black opacity-80 uppercase tracking-[0.3em] leading-tight">
                OF {totalCount}<br/>TOTAL UNLOCKED
              </div>
            </div>
          </div>
          
          {/* Yellow Progress Bar */}
          <div className="absolute bottom-10 left-12 right-12">
            <div className="w-full bg-black/20 h-4 rounded-full overflow-hidden border border-white/10 shadow-inner">
                <div 
                  className="bg-yellow-400 h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(250,204,21,0.6)]" 
                  style={{ width: `${progressPercent}%` }}
                />
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-3xl bg-white animate-pulse"></div>)}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {definitions.map((ach, idx) => {
                const isUnlocked = userStatus[`a${idx + 1}`] === 1;
                
                const Content = (
                  <div 
                    className={`
                      relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-500 click-scale group
                      ${isUnlocked 
                        ? 'bg-white border-white shadow-xl' 
                        : 'bg-white/40 border-slate-200 opacity-60 grayscale'}
                    `}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`
                        w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0 transition-transform group-hover:scale-110
                        ${isUnlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border border-yellow-200' : 'bg-slate-200'}
                      `}>
                        {isUnlocked ? ach.icon : <Lock size={28} className="text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-black text-xl truncate tracking-tight ${isUnlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                                {ach.title}
                            </h3>
                            {isUnlocked && <CheckCircle2 size={16} className="text-emerald-500" />}
                        </div>
                        <p className={`text-sm font-bold leading-relaxed ${isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                if (isUnlocked) {
                    return <HoloCard key={ach.id}>{Content}</HoloCard>;
                }
                return <div key={ach.id}>{Content}</div>;
              })}
            </div>
        )}
      </div>
    </div>
  );
};