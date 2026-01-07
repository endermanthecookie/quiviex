import React, { useState, useEffect, useRef } from 'react';
import { Quiz, User } from '../types';
import { ArrowLeft, Search, Globe, Trash2, User as UserIcon, Star, Filter, TrendingUp, Clock, ArrowDown, Eye, CheckCircle2 } from 'lucide-react';
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
              (window as any).alert("This quiz is private.");
              return;
          }

          let username = 'Unknown User';
          try {
             if (q.user_id) {
                 const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', q.user_id).single();
                 if (profile) username = profile.username;
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
          (window as any).console.error("Failed to load deep linked quiz", e);
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
        
        let profileMap: Record<string, string> = {};
        if (userIds.length > 0) {
            try {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username')
                    .in('user_id', userIds);
                
                profiles?.forEach((p: any) => {
                    profileMap[p.user_id] = p.username;
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

        let mappedQuizzes: Quiz[] = (quizzesData || []).map((q: any) => ({
            id: q.id,
            userId: q.user_id,
            title: q.title || 'Untitled',
            questions: Array.isArray(q.questions) ? q.questions : [],
            createdAt: q.created_at,
            theme: q.theme,
            customTheme: q.custom_theme,
            shuffleQuestions: q.shuffle_questions,
            backgroundMusic: q.background_music,
            visibility: q.visibility || 'public',
            creatorUsername: profileMap[q.user_id] || 'Unknown User',
            stats: {
                views: q.views || 0,
                plays: 0, 
                avgRating: ratingsMap[q.id]?.avg || 0,
                totalRatings: ratingsMap[q.id]?.count || 0
            }
        }));

        if (sortBy === 'top-rated') {
            mappedQuizzes.sort((a, b) => (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0));
        }

        setQuizzes(mappedQuizzes);
    } catch (error: any) {
        (window as any).console.error("Error fetching community quizzes:", error.message || error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdminDelete = async (id: number) => {
      if(!(window as any).confirm("Admin: Are you sure you want to delete this quiz?")) return;
      try {
          const { error } = await supabase.from('quizzes').delete().eq('id', id);
          if (error) throw error;
          setQuizzes(prev => prev.filter(q => q.id !== id));
      } catch (e: any) {
          (window as any).console.error("Delete failed:", e);
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
        className="min-h-screen" 
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Community Library</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search library..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery((e.target as any).value)}
                    className="pl-10 pr-4 py-2 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-400 font-bold text-sm transition-all"
                />
            </div>
            <button onClick={() => setSortBy(sortBy === 'newest' ? 'trending' : sortBy === 'trending' ? 'top-rated' : 'newest')} className="p-3 bg-white/40 border border-white/60 rounded-xl text-slate-600 hover:text-indigo-600 click-scale">
               {sortBy === 'newest' ? <Clock size={20} /> : sortBy === 'trending' ? <TrendingUp size={20} /> : <Star size={20} />}
            </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="mb-6 flex items-center gap-3 stagger-in">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Verified Public Repositories</p>
          </div>

          {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className="glass rounded-[2.5rem] h-64 animate-pulse"></div>
                  ))}
              </div>
          ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-24 glass rounded-[3rem] border-2 border-dashed border-white/50">
                  <Search size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-2xl font-black text-slate-800">No results found</h3>
                  <p className="text-slate-500 font-bold">Try adjusting your search criteria.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-in">
                  {filteredQuizzes.map((quiz, idx) => (
                      <div 
                        key={quiz.id} 
                        onClick={() => handleOpenQuiz(quiz)}
                        className="group glass rounded-[2.5rem] p-6 hover:shadow-2xl transition-all duration-500 flex flex-col relative animate-in zoom-in-95 fade-in duration-500"
                        style={{ animationDelay: `${(idx % 10) * 100}ms` }}
                      >
                          <div className={`h-40 rounded-3xl bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-6 p-6 flex flex-col justify-between overflow-hidden relative shadow-lg`}>
                                <div className="flex justify-between items-start">
                                    <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                                        {quiz.questions.length} Items
                                    </div>
                                    {isSudo && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAdminDelete(quiz.id); }}
                                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-white drop-shadow-md line-clamp-2 leading-tight">
                                    {quiz.title}
                                </h3>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                                  <UserIcon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Creator</p>
                                  <p className="text-sm font-bold text-slate-700 truncate">@{quiz.creatorUsername}</p>
                              </div>
                          </div>

                          <div className="mt-auto grid grid-cols-2 gap-4 border-t border-white/40 pt-6">
                              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                  <Eye size={16} /> {quiz.stats?.views || 0}
                              </div>
                              <div className="flex items-center gap-1 justify-end text-yellow-500 font-black text-sm">
                                  <Star size={16} className="fill-current" /> {(quiz.stats?.avgRating || 0).toFixed(1)}
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