
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { ArrowLeft, Trophy, Crown, User as UserIcon, TrendingUp, Search, Star, Users } from 'lucide-react';
import { Logo } from './Logo';

interface LeaderboardPageProps {
  user: User;
  onBack: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ user, onBack }) => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [relativeUsers, setRelativeUsers] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user.id]);

  const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
          const { data: top } = await supabase
            .from('profiles')
            .select('username, stats, avatar_url')
            .order('stats->totalPoints', { ascending: false })
            .limit(10);
          
          setTopUsers(top || []);

          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .filter('stats->totalPoints', 'gt', user.stats.totalPoints || 0);
          
          const rank = (count || 0) + 1;
          setUserRank(rank);

          const { data: around } = await supabase
            .from('profiles')
            .select('username, stats, avatar_url')
            .order('stats->totalPoints', { ascending: false })
            .range(Math.max(0, rank - 5), rank + 5);
          
          setRelativeUsers(around || []);

      } catch (e) {
          console.error("Leaderboard fetch fault:", e);
      } finally {
          setIsLoading(false);
      }
  };

  // Ranking variables for Top 10
  let topRank = 0;
  let topLastScore = -1;

  return (
    <div className="min-h-screen bg-[#05010d] text-white p-6 sm:p-12 font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-16 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-6">
                <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all click-scale border border-white/5"><ArrowLeft size={24} /></button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">Leaderboard</h1>
                    <p className="text-purple-500 font-black uppercase text-[10px] tracking-[0.4em]">Global Rankings</p>
                </div>
            </div>
            <Logo variant="small" className="shadow-2xl" />
        </header>

        {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center animate-pulse">
                <TrendingUp size={64} className="text-purple-900 mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Rankings...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 stagger-in">
                {/* Global Top 10 */}
                <div className="space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3"><Crown className="text-yellow-400" /> Top Players</h3>
                    <div className="space-y-3">
                        {topUsers.map((u, i) => {
                            const score = u.stats?.totalPoints || 0;
                            if (score !== topLastScore) {
                                topRank = i + 1;
                            }
                            topLastScore = score;

                            return (
                                <div key={i} className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${u.username === user.username ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}>
                                    <div className="flex items-center gap-6">
                                        <span className={`text-xl font-black w-8 ${topRank === 1 ? 'text-yellow-400' : topRank === 2 ? 'text-slate-300' : topRank === 3 ? 'text-orange-400' : 'text-slate-600'}`}>#{topRank}</span>
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10">
                                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={20} />}
                                        </div>
                                        <span className="text-lg font-black tracking-tight">@{u.username}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black tracking-tight">{score}</div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Points</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contextual Ranking */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-[3rem] p-10 mb-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Star size={160} /></div>
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Your Rank</h4>
                        <div className="text-6xl font-black tracking-tighter mb-4">#{userRank}</div>
                        <p className="text-slate-400 font-bold">You are in the top {Math.ceil((userRank! / 1000) * 100)}% of players worldwide.</p>
                    </div>

                    <h3 className="text-2xl font-black flex items-center gap-3"><Users className="text-indigo-400" /> Players Near You</h3>
                    <div className="space-y-3">
                        {(() => {
                            // Local helper ranking for relative view
                            let relRankStart = userRank! - (relativeUsers.length > 5 ? 5 : 0);
                            if (relRankStart < 1) relRankStart = 1;
                            
                            let currentRelRank = 0;
                            let lastRelScore = -1;

                            return relativeUsers.map((u, i) => {
                                const score = u.stats?.totalPoints || 0;
                                if (score !== lastRelScore) {
                                    currentRelRank = relRankStart + i;
                                }
                                lastRelScore = score;

                                return (
                                    <div key={i} className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${u.username === user.username ? 'bg-indigo-600 border-indigo-400 shadow-lg' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm font-black text-slate-500 w-8">#{currentRelRank}</div>
                                            <span className="font-black">@{u.username}</span>
                                        </div>
                                        <span className="font-bold text-sm text-slate-400">{score} PTS</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
