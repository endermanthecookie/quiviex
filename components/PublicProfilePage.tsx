import React, { useState, useEffect } from 'react';
import { Quiz, User } from '../types';
import { supabase } from '../services/supabase';
import { ArrowLeft, User as UserIcon, Globe, Play, Sparkles, Loader2, Award, Zap, Trophy } from 'lucide-react';
import { Logo } from './Logo';
import { THEMES } from '../constants';

interface PublicProfilePageProps {
  userId: string;
  onBack: () => void;
  onPlayQuiz: (quiz: Quiz) => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ userId, onBack, onPlayQuiz }) => {
  const [profile, setProfile] = useState<any>(null);
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: prof, error: profErr } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (profErr || !prof) throw new Error("Profile not found or identity decommissioned.");
        setProfile(prof);

        const { data: qz, error: qzErr } = await supabase
            .from('quizzes')
            .select('*')
            .eq('user_id', userId)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false });
        
        if (qzErr) throw qzErr;
        
        const mappedQuizzes = qz.map((q: any) => ({
            id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
            theme: q.theme, creatorUsername: prof.username, creatorAvatarUrl: prof.avatar_url
        }));

        // Filter: Quiviex Team quizzes must have >= 7 questions
        const filteredQuizzes = mappedQuizzes.filter((q: Quiz) => {
            if (q.userId === '00000000-0000-0000-0000-000000000000') {
                return q.questions.length >= 7;
            }
            return true;
        });

        setPublicQuizzes(filteredQuizzes);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicData();
  }, [userId]);

  if (isLoading) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center animate-pulse">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
          <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Syncing Dossier...</p>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
          <Globe size={80} className="text-slate-800 mb-8" />
          <h2 className="text-4xl font-black mb-4">Unit Signal Lost</h2>
          <p className="text-slate-400 font-bold mb-12 max-w-md">{error}</p>
          <button onClick={onBack} className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black uppercase tracking-widest click-scale shadow-2xl">Return to Base</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#05010d] text-white p-6 sm:p-12 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
            <header className="flex justify-between items-center mb-16 animate-in slide-in-from-top duration-700">
                <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all border border-white/5 click-scale"><ArrowLeft size={24} /></button>
                <Logo variant="small" className="shadow-2xl" />
            </header>

            <section className="flex flex-col md:flex-row items-center gap-12 mb-24 animate-in fade-in duration-1000">
                <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-[4rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-2 shadow-2xl relative z-10">
                        <div className="w-full h-full bg-[#0a0a0f] rounded-[3.5rem] overflow-hidden flex items-center justify-center border-4 border-white/5">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={80} className="text-slate-700" />
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-black px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border-4 border-[#05010d] z-20 flex items-center gap-2">
                        <Award size={14} /> Level 1
                    </div>
                </div>

                <div className="text-center md:text-left flex-1">
                    <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-white mb-4 leading-none">@{profile.username}</h1>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-sm mb-10 ml-1 flex items-center justify-center md:justify-start gap-3">
                        <Zap size={16} className="text-yellow-400" /> Registered Unit
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-10">
                         <div className="text-center md:text-left group">
                             <div className="text-4xl font-black text-white group-hover:text-indigo-400 transition-colors">{(profile.stats?.totalPoints || 0).toLocaleString()}</div>
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Transmission Pts</div>
                         </div>
                         <div className="w-px h-10 bg-white/5 hidden md:block"></div>
                         <div className="text-center md:text-left group">
                             <div className="text-4xl font-black text-white group-hover:text-purple-400 transition-colors">{publicQuizzes.length}</div>
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Public Modules</div>
                         </div>
                         <div className="w-px h-10 bg-white/5 hidden md:block"></div>
                         <div className="text-center md:text-left group">
                             <div className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">{(profile.stats?.perfectScores || 0)}</div>
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Perfect Syncs</div>
                         </div>
                    </div>
                </div>
            </section>

            <div className="mb-12 flex items-center justify-between border-b border-white/5 pb-8 animate-in slide-in-from-bottom-4 duration-1000">
                <h3 className="text-3xl font-black flex items-center gap-4">
                    <Sparkles className="text-indigo-500" /> Authorized Public Library
                </h3>
            </div>

            {publicQuizzes.length === 0 ? (
                <div className="py-40 text-center bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-white/5 animate-in zoom-in duration-700">
                    <Trophy size={64} className="mx-auto text-slate-800 mb-6" />
                    <h4 className="text-2xl font-black text-slate-500 uppercase tracking-widest">No Public Data</h4>
                    <p className="text-slate-600 font-bold mt-2">This unit has not shared any modules with the community.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-in">
                    {publicQuizzes.map((quiz) => (
                        <div key={quiz.id} onClick={() => onPlayQuiz(quiz)} className="group bg-white/[0.03] rounded-[3.5rem] p-8 border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 cursor-pointer hover-lift relative overflow-hidden">
                            <div className={`h-48 rounded-[2.5rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-8 p-8 flex flex-col justify-between overflow-hidden relative shadow-xl group-hover:scale-[1.02] transition-transform`}>
                                <div className="bg-black/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit border border-white/10">
                                    {quiz.questions.length} UNITS
                                </div>
                                <h4 className="text-2xl font-black text-white line-clamp-2 leading-tight drop-shadow-md">{quiz.title}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                                </div>
                                <button className="bg-white text-slate-950 p-4 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg click-scale">
                                    <Play fill="currentColor" size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};