import React, { useState, useEffect } from 'react';
import { Quiz, User } from '../types';
import { X, Play, Share2, Bookmark, Calendar, User as UserIcon, Eye, BarChart2, Lock, Heart, Loader2, Star } from 'lucide-react';
import { supabase } from '../services/supabase';
import { StarRating } from './StarRating';
import { CommentSection } from './CommentSection';

interface QuizDetailsModalProps {
  quiz: Quiz;
  user: User | null;
  onClose: () => void;
  onPlay: (quiz: Quiz) => void;
}

export const QuizDetailsModal: React.FC<QuizDetailsModalProps> = ({ quiz, user, onClose, onPlay }) => {
  const [stats, setStats] = useState({ 
    views: quiz.stats?.views || 0, 
    avgRating: quiz.stats?.avgRating || 0, 
    totalRatings: quiz.stats?.totalRatings || 0,
    likes: quiz.stats?.likes || 0
  });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');

  const isOwner = user ? quiz.userId === user.id : false;

  useEffect(() => {
    let mounted = true;
    const init = async () => {
        try {
            const { data: ratings } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id);
            if (ratings && mounted) {
                const avg = ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
                setStats(prev => ({ ...prev, avgRating: avg, totalRatings: ratings.length }));
            }
            const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('quiz_id', quiz.id);
            if (mounted) setStats(prev => ({ ...prev, likes: likesCount || 0 }));
            if (user && mounted) {
                const { data: myRating } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id).eq('user_id', user.id).maybeSingle();
                if (myRating && mounted) setUserRating(myRating.rating);
                const { data: myLike } = await supabase.from('likes').select('id').eq('quiz_id', quiz.id).eq('user_id', user.id).maybeSingle();
                if (myLike && mounted) setIsLiked(true);
                setIsBookmarked(user.savedQuizIds.includes(quiz.id));
            }
            supabase.from('quizzes').update({ views: (quiz.stats?.views || 0) + 1 }).eq('id', quiz.id);
        } catch (e) { console.error(e); }
    };
    init();
    return () => { mounted = false; };
  }, [quiz.id, user]);

  const handleRate = async (stars: number) => {
    if (!user) return alert("Sign in to rate.");
    if (isOwner) return alert("You can't rate your own work.");
    try {
        if (userRating) await supabase.from('ratings').update({ rating: stars }).eq('quiz_id', quiz.id).eq('user_id', user.id);
        else await supabase.from('ratings').insert({ quiz_id: quiz.id, user_id: user.id, rating: stars });
        setUserRating(stars);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
        
        <div className="p-8 pb-0 flex justify-between items-start">
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all click-scale text-slate-500"><X size={24} /></button>
            <div className="flex gap-3">
                {user && (
                    <>
                        <button onClick={() => {}} className={`p-3 rounded-2xl transition-all click-scale shadow-sm flex items-center gap-2 ${isLiked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white'}`}>
                            <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                            <span className="text-xs font-black">{stats.likes}</span>
                        </button>
                        <button onClick={() => {}} className={`p-3 rounded-2xl transition-all click-scale shadow-sm ${isBookmarked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                            <Bookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="p-8 pt-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1 space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                             <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Repository Detail</span>
                             <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm"><Calendar size={14} /> {new Date(quiz.createdAt).toLocaleDateString()}</div>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tighter mb-6">{quiz.title}</h2>
                        
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black shadow-inner overflow-hidden">
                                    {quiz.creatorAvatarUrl ? <img src={quiz.creatorAvatarUrl} className="w-full h-full object-cover" alt="" /> : <UserIcon size={24} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Architect</p>
                                    <p className="text-lg font-black text-slate-800 tracking-tight">@{quiz.creatorUsername}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6">User Feedback</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-10">
                            <div className="text-center">
                                <div className="text-6xl font-black text-slate-900 mb-2">{stats.avgRating.toFixed(1)}</div>
                                <StarRating rating={stats.avgRating} totalRatings={stats.totalRatings} size={20} />
                            </div>
                            {user && (
                                <div className="flex-1 w-full space-y-4 text-center sm:text-left">
                                    <p className="text-sm font-bold text-slate-600">Rate this repository:</p>
                                    <StarRating rating={userRating || 0} interactive={!isOwner} onRate={handleRate} size={36} showCount={false} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {user ? (
                            <button onClick={() => onPlay(quiz)} className="flex-1 bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all click-scale shadow-2xl"><Play size={24} fill="currentColor" /> Play Module</button>
                        ) : (
                            <div className="flex-1 bg-slate-100 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
                                <Lock size={28} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Sign in to initialize synchronization</p>
                            </div>
                        )}
                        <button className="w-20 bg-white border-2 border-slate-100 text-slate-500 hover:text-indigo-600 rounded-3xl flex items-center justify-center transition-all click-scale" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/community?id=${quiz.id}`); alert("Copied."); }}><Share2 size={24} /></button>
                    </div>
                </div>

                <div className="md:w-[400px] flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-12 md:pt-0 md:pl-12">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Overview</button>
                        <button onClick={() => setActiveTab('comments')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'comments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Analysis</button>
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                <h4 className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-3"><BarChart2 size={16} /> Composition</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-600"><span>Units</span><span>{quiz.questions.length}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600"><span>Transmissions</span><span>{stats.views}</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                           {user ? (
                               <CommentSection quizId={quiz.id} currentUser={user} isSudo={user.email === 'sudo@quiviex.com'} />
                           ) : (
                               <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                   <Lock className="mx-auto text-slate-300 mb-4" />
                                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Authentication Required</p>
                               </div>
                           )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};