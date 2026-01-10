import React, { useState, useEffect } from 'react';
import { Quiz, User } from '../types';
import { X, Play, Share2, Bookmark, Calendar, User as UserIcon, Eye, BarChart2, Lock, Heart, Loader2, Star, AlertTriangle, GitFork, Printer } from 'lucide-react';
import { supabase } from '../services/supabase';
import { StarRating } from './StarRating';
import { CommentSection } from './CommentSection';

interface QuizDetailsModalProps {
  quiz: Quiz;
  user: User | null;
  onClose: () => void;
  onPlay: (quiz: Quiz) => void;
  onRemix?: (quiz: Quiz) => void;
}

export const QuizDetailsModal: React.FC<QuizDetailsModalProps> = ({ quiz, user, onClose, onPlay, onRemix }) => {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community/${quiz.id}`);
    alert("Copy Link Success!");
  };

  const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Popup blocked.");
      
      const renderQuestionContent = (q: any) => {
          if (q.type === 'matching' || q.type === 'ordering') {
              return `<div style="padding: 15px; background: #f8f8f8; border: 1px dashed #ccc; text-align: center; font-style: italic; font-size: 12px; color: #666;">This question type (${q.type}) requires interactive elements and is not supported in print format.</div>`;
          }
          if (q.type === 'fill-in-the-blank') {
              return `<div class="q-text">${q.question.replace(/\[\s*\]/g, '_______________')}</div>`;
          }
          if (q.type === 'text-input') {
              return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 40px; border-bottom: 2px solid #000; height: 30px; width: 100%; opacity: 0.3;"></div>
              `;
          }
          if (q.type === 'slider') {
               return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 25px; font-weight: bold; text-align: center; font-size: 14px;">
                    ${q.options[0]} &mdash;&mdash;&mdash; <span style="display: inline-block; border-bottom: 2px solid #000; width: 100px; margin: 0 10px;">&nbsp;</span> &mdash;&mdash;&mdash; ${q.options[1]}
                </div>
              `;
          }
          // Multiple Choice / True False
          return `
            <div class="q-text">${q.question}</div>
            <ul class="opt-list">
                ${q.options.map((o: string) => `<li class="opt"><span class="checkbox"></span> ${o}</li>`).join('')}
            </ul>
          `;
      };

      const renderAnswer = (q: any) => {
          if (q.type === 'matching' || q.type === 'ordering') return 'N/A (Interactive)';
          if (q.type === 'multiple-choice' || q.type === 'true-false') return q.options[q.correctAnswer];
          if (q.type === 'slider') return q.correctAnswer;
          return q.correctAnswer;
      };

      const content = `
        <html>
        <head>
            <title>${quiz.title} - Printable</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: black; background: white; }
                
                .name-section { font-size: 24px; font-weight: bold; margin-bottom: 40px; font-family: sans-serif; }
                
                h1 { border-bottom: none; padding-bottom: 5px; margin-bottom: 5px; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
                .meta { font-size: 12px; color: #555; margin-bottom: 40px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                
                .q-block { margin-bottom: 30px; page-break-inside: avoid; border-bottom: 4px solid #000; padding-bottom: 30px; }
                .q-num { font-weight: 800; margin-bottom: 12px; font-size: 14px; color: #333; text-transform: uppercase; background: #eee; display: inline-block; padding: 4px 8px; border-radius: 4px; }
                .q-text { font-size: 18px; font-weight: 600; margin-bottom: 15px; line-height: 1.4; }
                
                .opt-list { padding-left: 0; list-style: none; margin: 0; }
                .opt { margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; }
                
                .checkbox {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    border: 3px solid #000;
                    border-radius: 6px;
                    background: white;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
                
                .img-container { max-width: 300px; margin-top: 15px; border: 1px solid #eee; margin-bottom: 15px; border-radius: 8px; overflow: hidden; }
                img { width: 100%; height: auto; display: block; }
                
                .page-break { page-break-before: always; }
                .answer-key-header { margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
                .answer-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                .answer-row:last-child { border-bottom: none; }
                .answer-q { font-weight: bold; width: 100px; }
                .answer-val { flex-1; text-align: right; font-weight: 600; }
                
                @media print {
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <div class="name-section">Name: ......................................................................</div>
            
            <h1>${quiz.title}</h1>
            <div class="meta">Created by @${quiz.creatorUsername || 'User'} • ${quiz.questions.length} Questions</div>
            ${quiz.questions.map((q, i) => `
                <div class="q-block">
                    <div class="q-num">Question ${i + 1}</div>
                    ${q.image ? `<div class="img-container"><img src="${q.image}" /></div>` : ''}
                    ${renderQuestionContent(q)}
                </div>
            `).join('')}
            
            <div class="page-break"></div>
            
            <div class="answer-key-header">
                <h1 style="border: none; padding: 0; margin: 0;">Answer Key</h1>
                <div style="font-size: 14px; margin-top: 5px; color: #555;">${quiz.title}</div>
            </div>
            
            ${quiz.questions.map((q, i) => `
                <div class="answer-row">
                    <div class="answer-q">Question ${i + 1}</div>
                    <div class="answer-val">${renderAnswer(q)}</div>
                </div>
            `).join('')}
            
            <script>window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
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
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                             <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Repository Detail</span>
                             <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm"><Calendar size={14} /> {new Date(quiz.createdAt).toLocaleDateString()}</div>
                             {quiz.isSensitive && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-amber-200 flex items-center gap-1">
                                    <AlertTriangle size={10} /> potential bad things
                                </span>
                             )}
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

                    <div className="flex gap-4 flex-wrap">
                        {user ? (
                            <button onClick={() => onPlay(quiz)} className="flex-1 min-w-[200px] bg-slate-900 hover:bg-black text-white py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all click-scale shadow-2xl"><Play size={24} fill="currentColor" /> Play</button>
                        ) : (
                            <div className="flex-1 bg-slate-100 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] text-center">
                                <Lock size={28} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Sign in to initialize synchronization</p>
                            </div>
                        )}
                        
                        {user && onRemix && (
                            <button onClick={() => onRemix(quiz)} className="px-6 py-5 bg-indigo-50 border-2 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 rounded-3xl flex items-center justify-center gap-2 transition-all click-scale" title="Remix this Quiz">
                                <GitFork size={20} />
                            </button>
                        )}
                        
                        <button onClick={handlePrint} className="px-6 py-5 bg-slate-50 border-2 border-slate-100 hover:bg-slate-100 text-slate-600 rounded-3xl flex items-center justify-center gap-2 transition-all click-scale" title="Print Quiz">
                            <Printer size={20} />
                        </button>

                        <button 
                          className="px-6 py-5 bg-white border-2 border-slate-100 text-slate-500 hover:text-indigo-600 rounded-3xl flex items-center justify-center gap-2 transition-all click-scale" 
                          onClick={handleCopyLink}
                          title="Copy Link"
                        >
                          <Share2 size={20} />
                        </button>
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