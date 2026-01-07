
import React, { useState, useEffect } from 'react';
import { Quiz, User } from '../types';
import { X, Play, Share2, Flag, Bookmark, Calendar, User as UserIcon, Eye, BarChart2, Lock } from 'lucide-react';
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
    totalRatings: quiz.stats?.totalRatings || 0 
  });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comments'>('overview');

  const isOwner = user ? quiz.userId === user.id : false;
  const isSudo = user?.email === 'sudo@quiviex.com';

  useEffect(() => {
    let mounted = true;

    const init = async () => {
        try {
            const { data: ratings, error: ratingError } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id);
            if (!ratingError && ratings && mounted) {
                const avg = ratings.length ? ratings.reduce((a, b) => a + b.rating, 0) / ratings.length : 0;
                setStats(prev => ({ ...prev, avgRating: avg, totalRatings: ratings.length }));
            }

            if (user && mounted) {
                const { data: myRating } = await supabase.from('ratings').select('rating').eq('quiz_id', quiz.id).eq('user_id', user.id).maybeSingle();
                if (myRating && mounted) setUserRating(myRating.rating);

                // Use the profile data for bookmark check
                setIsBookmarked(user.savedQuizIds.includes(quiz.id));
            }

            const newViews = (quiz.stats?.views || 0) + 1;
            if (mounted) setStats(prev => ({ ...prev, views: newViews }));
            
            supabase.from('quizzes').update({ views: newViews }).eq('id', quiz.id).then(({ error }) => {
                if (error) (window as any).console.warn("Failed to update views:", error.message);
            });

        } catch (e) {
            (window as any).console.error("Error initializing quiz details:", e);
        }
    };

    init();

    return () => { mounted = false; };
  }, [quiz.id, user]);

  const handleRate = async (stars: number) => {
    if (!user) {
        (window as any).alert("Please login to rate quizzes.");
        return;
    }
    if (isOwner) {
      (window as any).alert("You cannot rate your own quiz!");
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
        (window as any).console.error("Rating failed:", e);
        (window as any).alert("Failed to save rating.");
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
        (window as any).alert("Please login to save quizzes.");
        return;
    }
    
    try {
        const isAlreadySaved = user.savedQuizIds.includes(quiz.id);
        let newIds: number[];
        
        if (isAlreadySaved) {
            newIds = user.savedQuizIds.filter(id => id !== quiz.id);
            setIsBookmarked(false);
        } else {
            newIds = [...user.savedQuizIds, quiz.id];
            setIsBookmarked(true);
        }

        // Persist to database separate column in profiles
        const { error } = await supabase
            .from('profiles')
            .update({ saved_quiz_ids: newIds })
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Update user state globally
        (window as any).dispatchEvent(new CustomEvent('quiviex_user_update', { 
            detail: { savedQuizIds: newIds } 
        }));

    } catch (e: any) {
        (window as any).console.error("Bookmark failed:", e);
        (window as any).alert("Failed to update bookmarks: " + e.message);
    }
  };

  const handleReport = async () => {
    if (!user) {
        (window as any).alert("Please login to report content.");
        return;
    }
    const reason = (window as any).prompt("Why are you reporting this quiz?");
    if (reason) {
      try {
          await supabase.from('reports').insert({ quiz_id: quiz.id, user_id: user.id, reason, status: 'pending' });
          (window as any).alert("Report submitted for review.");
      } catch (e) {
          (window as any).console.error("Report failed:", e);
          (window as any).alert("Failed to submit report.");
      }
    }
  };

  const handleShare = () => {
    const url = `https://quiviex.vercel.app/community/${quiz.id}`;
    try {
        if ((window as any).navigator.clipboard && (window as any).isSecureContext) {
            (window as any).navigator.clipboard.writeText(url)
                .then(() => (window as any).alert("Deep link copied to clipboard!"))
                .catch(() => (window as any).prompt("Copy link:", url));
        } else {
            (window as any).prompt("Copy link:", url);
        }
    } catch (e) {
        (window as any).prompt("Copy link:", url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Banner */}
        <div className="h-48 sm:h-64 bg-slate-900 relative flex-shrink-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${quiz.theme === 'winter' ? 'from-slate-800 to-sky-900' : 'from-indigo-600 to-purple-800'}`}></div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors backdrop-blur-sm z-10">
            <X size={20} />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">{quiz.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <UserIcon size={16} /> {quiz.creatorUsername}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={16} /> {new Date(quiz.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={16} /> {stats.views} Views
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
          <div className="flex border-b border-slate-200 bg-white px-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors mr-6 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Comments
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BarChart2 className="text-indigo-500" /> Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="text-2xl font-black text-slate-800">{quiz.questions.length}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Questions</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="text-2xl font-black text-slate-800">{stats.views}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Plays</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="text-2xl font-black text-slate-800">{stats.avgRating.toFixed(1)}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Rating</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Description</h3>
                    <p className="text-slate-600 leading-relaxed">
                      This quiz contains {quiz.questions.length} questions.
                      Test your knowledge and see if you can get a perfect score!
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {user ? (
                      <button 
                        onClick={() => { onClose(); onPlay(quiz); }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                      >
                        <Play size={24} fill="currentColor" /> Play Now
                      </button>
                  ) : (
                      <button 
                        onClick={() => { onClose(); onPlay(quiz); }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                      >
                        <Lock size={20} /> Login to Play
                      </button>
                  )}

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="mb-2 font-bold text-slate-700">Rate this Quiz</div>
                    <div className="flex justify-center mb-4">
                      <StarRating 
                        rating={userRating || 0} 
                        interactive={!!user && !isOwner} 
                        size={32} 
                        onRate={(r) => handleRate(r)}
                        showCount={false}
                      />
                    </div>
                    {!user && <p className="text-xs text-slate-400">Login to rate</p>}
                    {isOwner && <p className="text-xs text-slate-400">You created this quiz</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={toggleBookmark}
                      className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-colors border ${isBookmarked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Bookmark size={20} className={isBookmarked ? 'fill-indigo-600' : ''} />
                      {isBookmarked ? 'Saved' : 'Save Quiz'}
                    </button>
                    <button 
                      onClick={handleShare}
                      className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 text-sm flex flex-col items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                    >
                      <Share2 size={20} />
                      Share
                    </button>
                  </div>

                  <button 
                    onClick={handleReport}
                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Flag size={14} /> Report Content
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
                user ? (
                    <CommentSection quizId={quiz.id} currentUser={user} isSudo={isSudo} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Lock size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Comments are locked</h3>
                        <p className="text-slate-500 mb-6">Join the community to see and post comments.</p>
                        <button 
                            onClick={() => { onClose(); onPlay(quiz); }}
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700"
                        >
                            Log In / Sign Up
                        </button>
                    </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
