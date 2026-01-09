import React, { useState, useEffect, useRef } from 'react';
import { Quiz, User } from '../types';
import { ArrowLeft, Search, Globe, Trash2, User as UserIcon, Star, Filter, TrendingUp, Clock, ArrowDown, Eye, CheckCircle2, PlusCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { QuizDetailsModal } from './QuizDetailsModal';
import { THEMES } from '../constants';

interface CommunityPageProps {
  user: User | null; 
  onBack: () => void;
  onPlayQuiz: (quiz: Quiz) => void;
  initialQuizId?: number | null;
}

type SortOption = 'newest' | 'trending' | 'top-rated';

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, onBack, onPlayQuiz, initialQuizId }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isSudo = user?.email === 'sudo@quiviex.com';

  useEffect(() => {
    fetchCommunityQuizzes();
  }, [sortBy]);

  useEffect(() => {
    if (initialQuizId) {
        fetchQuizById(initialQuizId);
    }
  }, [initialQuizId]);

  const handleTouchStart = (e: React.TouchEvent) => {
      if ((window as any).scrollY <= 5 && (!containerRef.current || (containerRef.current as any).scrollTop === 0)) {
          startY.current = e.touches[0].clientY;
          isDragging.current = true;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging.current) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      if (diff > 0 && diff < 200) {
          setPullY(diff);
          if (diff > 50 && e.cancelable) e.preventDefault(); 
      }
  };

  const handleTouchEnd = async () => {
      isDragging.current = false;
      if (pullY > 80) { 
          setPullY(80); 
          await fetchCommunityQuizzes();
      }
      setPullY(0);
  };

  const fetchQuizById = async (id: number) => {
      try {
          const { data: q, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          if (!q) return;

          if (q.visibility === 'private' && q.user_id !== user?.id && !isSudo) {
              (window as any).alert("Access Denied: Private Repository.");
              return;
          }

          let username = 'Unknown Architect';
          let avatarUrl = undefined;
          try {
             if (q.user_id) {
                 const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('user_id', q.user_id).single();
                 if (profile) {
                     username = profile.username;
                     avatarUrl = profile.avatar_url;
                 }
             }
          } catch(e) {}
          
          let avg = 0, count = 0;
          try {
             const { data: ratings } = await supabase.from('ratings').select('rating').eq('quiz_id', id);
             if (ratings && ratings.length > 0) {
                 const sum = ratings.reduce((a: any, b: any) => a + b.rating, 0);
                 avg = sum / ratings.length;
                 count = ratings.length;
             }
          } catch(e) {}

          const mappedQuiz: Quiz = {
            id: q.id,
            userId: q.user_id,
            title: q.title,
            questions: q.questions,
            createdAt: q.created_at,
            theme: q.theme,
            customTheme: q.custom_theme,
            shuffleQuestions: q.shuffle_questions,
            backgroundMusic: q.background_music,
            visibility: q.visibility || (q.is_public ? 'public' : 'private'),
            creatorUsername: username,
            creatorAvatarUrl: avatarUrl,
            stats: {
                views: q.views || 0,
                plays: 0,
                avgRating: avg,
                totalRatings: count
            }
          };

          setSelectedQuiz(mappedQuiz);
          (window as any).history.pushState(null, '', `/community/${id}`);

      } catch (e) {
          (window as any).console.error("Deep link load fault:", e);
      }
  };

  const fetchCommunityQuizzes = async () => {
    setIsLoading(true);
    try {
        let query = supabase
            .from('quizzes')
            .select('*')
            .eq('visibility', 'public');

        if (sortBy === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'trending') {
            query = query.order('views', { ascending: false }); 
        } else if (sortBy === 'top-rated') {
            query = query.limit(100); 
        }
        
        if (sortBy !== 'top-rated') {
            query = query.limit(50);
        }
        
        const { data: quizzesData, error } = await query;
        if (error) throw error;

        const userIds = Array.from(new Set((quizzesData || [])
            .map((q: any) => q.user_id)
            .filter((id: any) => id && typeof id === 'string')
        ));
        
        let profileMap: Record<string, { username: string, avatarUrl?: string }> = {};
        if (userIds.length > 0) {
            try {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, avatar_url')
                    .in('user_id', userIds);
                
                profiles?.forEach((p: any) => {
                    profileMap[p.user_id] = { 
                        username: p.username, 
                        avatarUrl: p.avatar_url 
                    };
                });
            } catch (err) {}
        }

        const quizIds = (quizzesData || []).map((q: any) => q.id).filter((id: any) => typeof id === 'number');
        let ratingsMap: Record<number, { avg: number, count: number, sum: number }> = {};
        
        if (quizIds.length > 0) {
            try {
                const { data: ratings, error: ratingError } = await supabase.from('ratings').select('quiz_id, rating').in('quiz_id', quizIds);
                if (!ratingError && ratings) {
                    ratings.forEach((r: any) => {
                        if (!ratingsMap[r.quiz_id]) ratingsMap[r.quiz_id] = { avg: 0, count: 0, sum: 0 };
                        const entry = ratingsMap[r.quiz_id];
                        entry.sum += r.rating;
                        entry.count += 1;
                        entry.avg = entry.sum / entry.count;
                    });
                }
            } catch (err) {}
        }

        let mappedQuizzes: Quiz[] = (quizzesData || []).map((q: any) => {
            const userProfile = profileMap[q.user_id];
            return {
                id: q.id,
                userId: q.user_id,
                title: q.title || 'Untitled Session',
                questions: Array.isArray(q.questions) ? q.questions : [],
                createdAt: q.created_at,
                theme: q.theme,
                customTheme: q.custom_theme,
                shuffleQuestions: q.shuffle_questions,
                backgroundMusic: q.background_music,
                visibility: q.visibility || 'public',
                creatorUsername: userProfile?.username || 'Unknown Architect',
                creatorAvatarUrl: userProfile?.avatarUrl,
                stats: {
                    views: q.views || 0,
                    plays: 0, 
                    avgRating: ratingsMap[q.id]?.avg || 0,
                    totalRatings: ratingsMap[q.id]?.count || 0
                }
            };
        });

        if (sortBy === 'top-rated') {
            mappedQuizzes.sort((a, b) => (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0));
        }

        setQuizzes(mappedQuizzes);
    } catch (error: any) {
        (window as any).console.error("Infrastructure fetch fault:", error.message || error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdminDelete = async (id: number) => {
      // confirm dialog logic handled in modal or button
      try {
          const { error } = await supabase.from('quizzes').delete().eq('id', id);
          if (error) throw error;
          setQuizzes(prev => prev.filter(q => q.id !== id));
      } catch (e: any) {
          (window as any).console.error("Admin Decommission Sequence Fault:", e);
          throw e; // Pass up to the caller
      }
  };

  const handleOpenQuiz = (quiz: Quiz) => {
      setSelectedQuiz(quiz);
      (window as any).history.pushState(null, '', `/community/${quiz.id}`);
  };

  const handleCloseQuiz = () => {
      setSelectedQuiz(null);
      (window as any).history.pushState(null, '', '/community');
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (q.creatorUsername && q.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
        className="min-h-screen bg-[#f1f5f9]" 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEnd}
        ref={containerRef}
    >
      {selectedQuiz && (
        <QuizDetailsModal 
            quiz={selectedQuiz} 
            user={user} 
            onClose={handleCloseQuiz}
            onPlay={(q) => {
                handleCloseQuiz();
                onPlayQuiz(q);
            }}
            onAdminDelete={isSudo ? handleAdminDelete : undefined}
        />
      )}

      <div 
        className="fixed top-20 left-0 right-0 flex justify-center pointer-events-none transition-transform duration-200 z-50"
        style={{ transform: `translateY(${pullY - 60}px)` }}
      >
          <div className="bg-white rounded-full p-2 shadow-lg border border-slate-200">
              <ArrowDown size={24} className={`text-slate-600 ${pullY > 60 ? 'rotate-180 transition-transform' : ''}`} />
          </div>
      </div>

      <header className="glass backdrop-blur-md border-b border-white/40 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="text-indigo-600" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">Global Repositories</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search titles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery((e.target as any).value)}
                    className="pl-12 pr-6 py-2.5 bg-white/60 border border-white/80 rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-400 font-bold text-sm transition-all shadow-sm w-64"
                />
            </div>
            <button onClick={() => setSortBy(sortBy === 'newest' ? 'trending' : sortBy === 'trending' ? 'top-rated' : 'newest')} className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:text-indigo-600 click-scale shadow-sm">
               {sortBy === 'newest' ? <Clock size={20} /> : sortBy === 'trending' ? <TrendingUp size={20} /> : <Star size={20} />}
            </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
          <div className="mb-10 flex items-center gap-3 stagger-in">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em]">Authenticated Quiviex Global Library</p>
          </div>

          {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className="glass rounded-[3rem] h-72 animate-pulse"></div>
                  ))}
              </div>
          ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-32 px-10 glass rounded-[4rem] border-2 border-dashed border-white/50 max-w-2xl mx-auto shadow-2xl animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Globe size={48} className="text-slate-200" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Library Empty</h3>
                  <p className="text-slate-500 font-bold text-lg mb-10 leading-relaxed">No synchronization targets found. Be the first to initialize a public repository!</p>
                  <button 
                    onClick={onBack}
                    className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
                  >
                      <PlusCircle size={20} /> Create Module
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 stagger-in pb-20">
                  {filteredQuizzes.map((quiz, idx) => (
                      <div 
                        key={quiz.id} 
                        onClick={() => handleOpenQuiz(quiz)}
                        className="group bg-white rounded-[3rem] p-7 hover:shadow-2xl transition-all duration-500 flex flex-col relative animate-in zoom-in-95 fade-in border border-slate-100/50"
                        style={{ animationDelay: `${(idx % 10) * 100}ms` }}
                      >
                          <div className={`h-44 rounded-[2rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-8 p-7 flex flex-col justify-between overflow-hidden relative shadow-lg`}>
                                <div className="flex justify-between items-start z-10">
                                    <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10">
                                        {quiz.questions.length} Units
                                    </div>
                                    {isSudo && (
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if(confirm("Sudo: Decommission repository?")) handleAdminDelete(quiz.id); 
                                            }}
                                            className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white drop-shadow-md line-clamp-2 leading-tight relative z-10">
                                    {quiz.title}
                                </h3>
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4"><Globe size={160} /></div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-8 px-2">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden bg-indigo-50 border border-indigo-100">
                                  {quiz.creatorAvatarUrl ? (
                                      <img src={quiz.creatorAvatarUrl} alt={quiz.creatorUsername} className="w-full h-full object-cover" />
                                  ) : (
                                      <UserIcon size={20} className="text-indigo-500" />
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Architect</p>
                                  <p className="text-base font-black text-slate-800 truncate tracking-tight">@{quiz.creatorUsername}</p>
                              </div>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-slate-50 pt-8 px-2">
                              <div className="flex items-center gap-2.5 text-slate-400 font-black text-xs uppercase tracking-widest">
                                  <Eye size={18} /> {quiz.stats?.views || 0}
                              </div>
                              <div className="flex items-center gap-1.5 justify-end text-yellow-500 font-black text-sm">
                                  <Star size={18} className="fill-current" /> {(quiz.stats?.avgRating || 0).toFixed(1)}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};