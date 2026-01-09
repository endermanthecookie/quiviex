
import React, { useState, useEffect } from 'react';
import { Quiz, User } from '../types';
// Added Loader2 to the lucide-react import
import { X, Play, Share2, Flag, Bookmark, Calendar, User as UserIcon, Eye, BarChart2, Lock, Trash2, ShieldAlert, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { StarRating } from './StarRating';
import { CommentSection } from './CommentSection';

interface QuizDetailsModalProps {
  quiz: Quiz;
  user: User | null;
  onClose: () => void;
  onPlay: (quiz: Quiz) => void;
  onAdminDelete?: (id: number) => Promise<void>;
}

// Fixed line 18: Ensured component returns a valid ReactNode (JSX) instead of void by completing implementation.
export const QuizDetailsModal: React.FC<QuizDetailsModalProps> = ({ quiz, user, onClose, onPlay, onAdminDelete }) => {
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
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user ? quiz.userId === user.id : false;
  const isSudo = user?.email === 'sudo@quiviex.com';

  useEffect(() => {
    let mounted = true;

    const init = async () => {
        try {
            // Fetch Latest Ratings
            const { data: ratings, error: ratingError } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id);
            if (!ratingError && ratings && mounted) {
                const avg = ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
                setStats(prev => ({ ...prev, avgRating: avg, totalRatings: ratings.length }));
            }

            // Fetch Likes count
            const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('quiz_id', quiz.id);
            if (mounted) setStats(prev => ({ ...prev, likes: likesCount || 0 }));

            if (user && mounted) {
                // Check if user already rated
                const { data: myRating } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id).eq('user_id', user.id).maybeSingle();
                if (myRating && mounted) setUserRating(myRating.rating);
                
                // Check if user already liked
                const { data: myLike } = await supabase.from('likes').select('id').eq('quiz_id', quiz.id).eq('user_id', user.id).maybeSingle();
                if (myLike && mounted) setIsLiked(true);

                setIsBookmarked(user.savedQuizIds.includes(quiz.id));
            }

            // Increment View Count
            const newViews = (quiz.stats?.views || 0) + 1;
            if (mounted) setStats(prev => ({ ...prev, views: newViews }));
            
            supabase.from('quizzes').update({ views: newViews }).eq('id', quiz.id).then(({ error }) => {
                if (error) console.warn("Failed to update views:", error.message);
            });

        } catch (e) {
            console.error("Error initializing quiz details:", e);
        }
    };

    init();

    return () => { mounted = false; };
  }, [quiz.id, user]);

  // Fixed truncated handleRate function and added missing event handlers
  const handleRate = async (stars: number) => {
    if (!user) {
        alert("Please login to rate quizzes.");
        return;
    }
    if (isOwner) {
      alert("You cannot rate your own quiz!");
      return;
    }
    
    try {
        if (userRating) {
            await supabase.from('ratings').update({ rating: stars }).eq('quiz_id', quiz.id).eq('user_id', user.id);
        } else {
            await supabase.from('ratings').insert({ quiz_id: quiz.id, user_id: user.id, rating: stars });
        }
        setUserRating(stars);
        
        const { data: ratings } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id);
        if (ratings) {
            const avg = ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
            setStats(prev => ({ ...prev, avgRating: avg, totalRatings: ratings.length }));
        }
    } catch (e) {
        console.error("Rating failed:", e);
        alert("Failed to save rating.");
    }
  };

  const handleBookmark = async () => {
    if (!user) return alert("Login to bookmark.");
    const isSaved = user.savedQuizIds.includes(quiz.id);
    const newSaved = isSaved 
        ? user.savedQuizIds.filter(id => id !== quiz.id) 
        : [...user.savedQuizIds, quiz.id];
    
    try {
        const { error } = await supabase.from('profiles').update({ saved_quiz_ids: newSaved }).eq('user_id', user.id);
        if (error) throw error;
        setIsBookmarked(!isSaved);
    } catch (e) {
        console.error("Bookmark failed:", e);
    }
  };

  const handleLike = async () => {
      if (!user) return alert("Login to like.");
      try {
          if (isLiked) {
              await supabase.from('likes').delete().eq('quiz_id', quiz.id).eq('user_id', user.id);
              setStats(prev => ({ ...prev, likes: prev.likes - 1 }));
              setIsLiked(false);
          } else {
              await supabase.from('likes').insert({ quiz_id: quiz.id, user_id: user.id });
              setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
              setIsLiked(true);
          }
      } catch (e) {
          console.error("Like failed:", e);
      }
  };

  const handleDelete = async () => {
      if (!onAdminDelete) return;
      if (!confirm("Decommission this repository?")) return;
      setIsDeleting(true);
      try {
          await onAdminDelete(quiz.id);
          onClose();
      } catch (e) {
          setIsDeleting(false);
      }
  };

  // Fixed: Added the missing return JSX statement to ensure the component returns a valid ReactNode.
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
        
        {/* Header Section */}
        <div className="p-8 pb-0 flex justify-between items-start">
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all click-scale text-slate-500">
                <X size={24} />
            </button>
            <div className="flex gap-3">
                {onAdminDelete && (
                    <button 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all click-scale shadow-sm flex items-center gap-2"
                    >
                        {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                        <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Decommission</span>
                    </button>
                )}
                <button onClick={handleLike} className={`p-3 rounded-2xl transition-all click-scale shadow-sm flex items-center gap-2 ${isLiked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'}`}>
                    <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                    <span className="text-xs font-black">{stats.likes}</span>
                </button>
                <button onClick={handleBookmark} className={`p-3 rounded-2xl transition-all click-scale shadow-sm ${isBookmarked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                    <Bookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
                </button>
            </div>
        </div>

        <div className="p-8 pt-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row gap-12">
                {/* Left: Metadata */}
                <div className="flex-1 space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                             <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Public Repository</span>
                             <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm">
                                <Calendar size={14} /> {new Date(quiz.createdAt).toLocaleDateString()}
                             </div>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tighter mb-6">{quiz.title}</h2>
                        
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black shadow-inner">
                                    {quiz.creatorAvatarUrl ? (
                                        <img src={quiz.creatorAvatarUrl} className="w-full h-full object-cover rounded-2xl" alt="Creator Avatar" />
                                    ) : (
                                        <UserIcon size={24} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Architect</p>
                                    <p className="text-lg font-black text-slate-800 tracking-tight">@{quiz.creatorUsername}</p>
                                </div>
                            </div>
                            
                            <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-xl font-black text-slate-900">{quiz.questions.length}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-slate-900">{stats.views}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transmissions</p>
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
                            <div className="flex-1 w-full space-y-4">
                                <p className="text-sm font-bold text-slate-600">Rate this repository:</p>
                                <StarRating 
                                    rating={userRating || 0} 
                                    interactive={!isOwner} 
                                    onRate={handleRate} 
                                    size={36} 
                                    showCount={false} 
                                />
                                {isOwner && <p className="text-[10px] text-slate-400 font-bold uppercase italic">Authors cannot rate their own work.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => onPlay(quiz)}
                            className="flex-1 bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all click-scale shadow-2xl"
                        >
                            <Play size={24} fill="currentColor" /> Play Module
                        </button>
                        <button 
                            className="w-20 bg-white border-2 border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 rounded-3xl flex items-center justify-center transition-all click-scale"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/community?id=${quiz.id}`);
                                alert("Link encrypted and copied to clipboard.");
                            }}
                        >
                            <Share2 size={24} />
                        </button>
                    </div>
                </div>

                {/* Right: Comments */}
                <div className="md:w-[400px] flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-12 md:pt-0 md:pl-12">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Overview</button>
                        <button onClick={() => setActiveTab('comments')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'comments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Analysis ({stats.totalRatings})</button>
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                <h4 className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-3">
                                    <BarChart2 size={16} /> Module Composition
                                </h4>
                                <div className="space-y-3">
                                    {['multiple-choice', 'true-false', 'text-input', 'ordering', 'matching', 'slider', 'fill-in-the-blank'].map(type => {
                                        const count = quiz.questions.filter(q => q.type === type).length;
                                        if (count === 0) return null;
                                        return (
                                            <div key={type} className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-600 capitalize">{type.replace(/-/g, ' ')}</span>
                                                <span className="text-xs font-black text-indigo-600">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShieldAlert size={80} /></div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Protocol</h4>
                                <p className="text-sm font-bold opacity-80 leading-relaxed">This module is protected under Quiviex Infrastructure Row-Level-Security. Global playback is monitored for fidelity analytics.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                           {user ? (
                               <CommentSection quizId={quiz.id} currentUser={user} isSudo={isSudo} />
                           ) : (
                               <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                   <Lock className="mx-auto text-slate-300 mb-4" />
                                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Authentication Required</p>
                                   <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">Sign in to participate in analysis</p>
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
