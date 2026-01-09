import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { ArrowLeft, Trophy, Crown, User as UserIcon, TrendingUp, Star, Users, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';

interface LeaderboardPageProps {
  user: User;
  onBack: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ user, onBack }) => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
          fetchLeaderboard();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const fetchLeaderboard = async () => {
      // Safety timeout to prevent infinite hang
      const timeoutId = setTimeout(() => {
          if (isLoading) {
              setError("Infrastructure timeout. Network signal weak.");
              setIsLoading(false);
          }
      }, 10000);

      try {
          const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('user_id, username, stats, avatar_url');

          if (fetchError) throw fetchError;

          if (profiles) {
              // Ensure we filter and map correctly to handle potential null stats
              const mapped = profiles.map(p => ({
                  ...p,
                  totalPoints: p.stats?.totalPoints || 0
              }));

              const sorted = [...mapped].sort((a, b) => b.totalPoints - a.totalPoints);

              setTopUsers(sorted.slice(0, 15));
              const myRankIndex = sorted.findIndex(p => p.user_id === user.id);
              setUserRank(myRankIndex !== -1 ? myRankIndex + 1 : sorted.length + 1);
          }
          setError(null);
      } catch (e: any) {
          console.error("Leaderboard error:", e);
          setError("Infrastructure synchronization failed. Check connection.");
      } finally {
          clearTimeout(timeoutId);
          setIsLoading(false);
      }
  };

  let displayRank = 0;
  let lastScore = -1;

  return (
    <div className="min-h-screen bg-[#05010d] text-white p-6 sm:p-12 font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-16 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-6">
                <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all border border-white/5 click-scale"><ArrowLeft size={24} /></button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">Leaderboard</h1>
                    <div className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-[0.4em] mt-1">
                        <Zap size={12} className="animate-pulse" /> Global Live Feed
                    </div>
                </div>
            </div>
            <Logo variant="small" className="shadow-2xl" />
        </header>

        {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center animate-pulse">
                <Loader2 size={64} className="text-indigo-600 animate-spin mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Syncing Rankings...</p>
            </div>
        ) : error ? (
            <div className="h-96 flex flex-col items-center justify-center text-center">
                <AlertCircle size={64} className="text-rose-500 mb-6" />
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Signal Error</h3>
                <p className="text-slate-400 font-bold mb-8">{error}</p>
                <button onClick={fetchLeaderboard} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest click-scale">Retry Sync</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8 stagger-in">
                    <h3 className="text-2xl font-black flex items-center gap-3"><Crown className="text-yellow-400" /> Top Architects</h3>
                    <div className="space-y-3">
                        {topUsers.map((u, i) => {
                            const score = u.totalPoints;
                            if (score !== lastScore) displayRank = i + 1;
                            lastScore = score;
                            const isMe = u.user_id === user.id;
                            
                            return (
                                <div key={u.user_id} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group animate-in slide-in-from-right duration-500 ${isMe ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}>
                                    <div className="flex items-center gap-6">
                                        <span className={`text-xl font-black w-8 ${displayRank === 1 ? 'text-yellow-400' : displayRank === 2 ? 'text-slate-300' : displayRank === 3 ? 'text-orange-400' : 'text-slate-600'}`}>
                                            #{displayRank}
                                        </span>
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10 shadow-inner">
                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={20} className="text-slate-500" />}
                                        </div>
                                        <span className="text-lg font-black tracking-tight">@{u.username || 'Unclaimed Unit'}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black tracking-tight">{score.toLocaleString()}</div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Points</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-8 stagger-in">
                    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-[3rem] p-10 mb-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Star size={160} /></div>
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Your Profile Fidelity</h4>
                        <div className="flex items-baseline gap-4 mb-4">
                            <div className="text-7xl font-black tracking-tighter">#{userRank || '---'}</div>
                            <div className="text-xl font-bold text-slate-400 uppercase tracking-widest">Global</div>
                        </div>
                        <p className="text-slate-400 font-bold leading-relaxed">
                            {userRank === 1 ? "Incredible fidelity. You are currently the global benchmark for excellence." : "Synchronize with more modules to improve your standing."}
                        </p>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-10">
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
                            <Users className="text-indigo-400" /> Rankings Summary
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                <span className="text-slate-400">Competitive Tier</span>
                                <span className="text-indigo-400">{userRank && userRank <= 10 ? 'Elite Architect' : 'Unit Active'}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, Math.max(5, ((user.stats.totalPoints || 0) / 10000) * 100))}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                Ranks are calculated based on cumulative transmission points earned through module completion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};