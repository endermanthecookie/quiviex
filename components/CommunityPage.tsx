import React, { useState, useEffect } from 'react';
import { Quiz, User, Question } from '../types';
import { ArrowLeft, User as UserIcon, Globe, Play, Sparkles, Search, Loader2, Heart, Eye, AlertTriangle, Printer, Lock, X, ChevronDown } from 'lucide-react';
import { supabase } from '../services/supabase';
import { QuizDetailsModal } from './QuizDetailsModal';
import { THEMES } from '../constants';
import { PrintOptionsModal } from './PrintOptionsModal';

interface CommunityPageProps {
  user: User | null; 
  onBack: () => void;
  onPlayQuiz: (quiz: Quiz) => void;
  initialQuizId?: number | null;
  onRemixQuiz?: (quiz: Quiz) => void;
}

type SortOption = 'newest' | 'trending';

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, onBack, onPlayQuiz, initialQuizId, onRemixQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [printingQuiz, setPrintingQuiz] = useState<Quiz | null>(null);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 1. Fetch Staff ID (First User) on Mount
  useEffect(() => {
      const fetchStaffId = async () => {
          const { data } = await supabase.from('profiles').select('user_id').order('created_at', { ascending: true }).limit(1).single();
          // Fallback to the ghost ID if no profiles exist
          setStaffId(data?.user_id || '00000000-0000-0000-0000-000000000000');
      };
      fetchStaffId();
  }, []);

  // 2. Initial Fetch when Staff ID is ready or sort/search changes
  useEffect(() => {
    if (staffId) {
        const delayDebounceFn = setTimeout(() => {
            setQuizzes([]);
            setCurrentPage(0);
            setHasMore(true);
            fetchCommunityQuizzes(0);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }
  }, [sortBy, staffId, searchQuery]);

  useEffect(() => {
      if (initialQuizId && staffId) {
          handleDeepLink(initialQuizId);
      }
  }, [initialQuizId, staffId]);

  const handleDeepLink = async (id: number) => {
      const existing = quizzes.find(q => q.id === id);
      if (existing) {
          setSelectedQuiz(existing);
          return;
      }

      try {
          const { data: q } = await supabase.from('quizzes').select('*').eq('id', id).single();
          if (q) {
              const isStaff = q.user_id === staffId;
              const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('user_id', q.user_id).single();
              
              const creatorName = isStaff ? 'Quiviex Team' : (profile?.username || q.username_at_creation || 'Unknown');
              const creatorAvatar = isStaff ? null : (profile?.avatar_url || q.avatar_url_at_creation);

              const mapped: Quiz = {
                  id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                  theme: q.theme, 
                  creatorUsername: creatorName,
                  creatorAvatarUrl: creatorAvatar,
                  isSensitive: q.is_sensitive,
                  stats: { views: isStaff ? 0 : (q.views || 0), likes: 0, avgRating: 4.5, totalRatings: 10, plays: q.plays || 0 }
              };
              setSelectedQuiz(mapped);
          }
      } catch (e) {
          console.error("Deep link error:", e);
      }
  };

  const fetchCommunityQuizzes = async (page: number) => {
    setIsLoading(true);
    try {
        const from = page * 10;
        const to = from + 9;

        let query = supabase.from('quizzes').select('*').eq('visibility', 'public');
        
        if (searchQuery.trim()) {
            query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'trending') query = query.order('views', { ascending: false }); 
        
        const { data: dbQuizzes, error } = await query.range(from, to);
        if (error) throw error;

        if (!dbQuizzes || dbQuizzes.length === 0) {
            setHasMore(false);
            if (page === 0) setQuizzes([]);
        } else {
            const userIds = Array.from(new Set(dbQuizzes.map((q: any) => q.user_id) || []));
            const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', userIds);
            
            const profileMap = new Map();
            profiles?.forEach((p: any) => profileMap.set(p.user_id, p));

            const mapped: Quiz[] = dbQuizzes.map((q: any) => {
                const isStaff = q.user_id === staffId;
                const profile = profileMap.get(q.user_id);
                
                const creatorName = isStaff ? 'Quiviex Team' : (profile?.username || q.username_at_creation || 'Unknown');
                const creatorAvatar = isStaff ? null : (profile?.avatar_url || q.avatar_url_at_creation);

                return {
                    id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                    theme: q.theme, 
                    creatorUsername: creatorName, 
                    creatorAvatarUrl: creatorAvatar,
                    isSensitive: q.is_sensitive,
                    stats: { 
                        views: isStaff ? 0 : (q.views || 0), 
                        likes: 0, 
                        avgRating: 4.5, 
                        totalRatings: 10, 
                        plays: q.plays || 0 
                    }
                };
            });

            // Filter out "Draft" or incomplete official quizzes (less than 7 questions)
            const filtered = mapped.filter(q => {
                if (q.userId === staffId) {
                    return q.questions.length >= 7;
                }
                return true;
            });

            if (page === 0) {
                setQuizzes(filtered);
            } else {
                setQuizzes(prev => [...prev, ...filtered]);
            }

            if (dbQuizzes.length < 10) setHasMore(false);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCommunityQuizzes(nextPage);
  };

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-400 text-slate-900 px-1 rounded shadow-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] view-transition pb-20">
      {selectedQuiz && (
        <QuizDetailsModal 
            quiz={selectedQuiz} 
            user={user} 
            onClose={() => { setSelectedQuiz(null); fetchCommunityQuizzes(0); }} 
            onPlay={(q) => onPlayQuiz(q)} 
            onRemix={onRemixQuiz}
        />
      )}

      {printingQuiz && (
        <PrintOptionsModal 
            quiz={printingQuiz} 
            onClose={() => setPrintingQuiz(null)} 
        />
      )}

      {showAuthAlert && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in border-4 border-slate-100 text-center">
                <button onClick={() => setShowAuthAlert(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                </button>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h3>
                <p className="text-slate-500 font-bold text-sm mb-6">Please sign in or create an account to print this document.</p>
                <button onClick={() => setShowAuthAlert(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors shadow-lg click-scale">
                    Understood
                </button>
            </div>
        </div>
      )}

      <header className="glass backdrop-blur-md border-b border-white/40 sticky top-0 z-40 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 hover:bg-white/20 rounded-2xl transition-all click-scale"><ArrowLeft size={24} className="text-slate-800" /></button>
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">Public Gallery</h1>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 flex items-center gap-1"><Sparkles size={10} /> Quiviex Verified Modules</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative group w-full sm:w-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 pr-4 py-3 bg-white/60 border border-white/80 rounded-2xl focus:outline-none focus:bg-white font-bold text-sm w-full sm:w-64 shadow-sm transition-all" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full sm:w-auto bg-white border border-slate-100 rounded-2xl px-5 py-3 font-black text-[10px] uppercase tracking-widest text-slate-600 focus:outline-none shadow-sm cursor-pointer">
                <option value="newest">Latest Arrivals</option>
                <option value="trending">Popular Content</option>
            </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-10">
          {isLoading && currentPage === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
                  {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-[3rem] h-64 animate-pulse border border-slate-100"></div>)}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 stagger-in">
                  {quizzes.map((quiz) => (
                      <div key={quiz.id} onClick={() => setSelectedQuiz(quiz)} className="group bg-white rounded-[3rem] sm:rounded-[3.5rem] p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 border border-slate-100 relative cursor-pointer hover-lift">
                          <div className={`h-40 sm:h-48 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-6 sm:mb-8 p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-xl group-hover:scale-[1.02] transition-transform`}>
                                <div className="absolute top-4 right-4 z-20">
                                     <button onClick={(e) => { 
                                         e.stopPropagation(); 
                                         if (!user) {
                                             setShowAuthAlert(true);
                                             return;
                                         }
                                         setPrintingQuiz(quiz); 
                                     }} className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100" title="Print"><Printer size={16} /></button>
                                </div>
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div className="flex gap-1 flex-wrap">
                                        {quiz.userId === staffId && <span className="bg-yellow-400 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-white/20">Verified</span>}
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">{quiz.questions.length} UNITS</span>
                                    </div>
                                    {quiz.isSensitive && (
                                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-amber-200 flex items-center gap-1 shadow-lg">
                                            <AlertTriangle size={10} /> potential bad things
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                                    {getHighlightedText(quiz.title, searchQuery)}
                                </h3>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                                      {quiz.creatorAvatarUrl ? <img src={quiz.creatorAvatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="font-black text-slate-300">{(quiz.creatorUsername || 'U').charAt(0)}</div>}
                                  </div>
                                  <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Architect</p>
                                      <p className="text-sm font-bold text-slate-700">@{quiz.creatorUsername}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest"><Eye size={14} className="text-indigo-400" /> {quiz.stats?.views}</div>
                                <div className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest"><Heart size={14} className="text-rose-400" /> {quiz.stats?.likes}</div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
          
          {hasMore && (
              <div className="flex justify-center mt-12 mb-8">
                  <button 
                      onClick={handleLoadMore} 
                      disabled={isLoading}
                      className="px-12 py-4 bg-white border-2 border-indigo-100 hover:border-indigo-300 text-indigo-600 font-black rounded-2xl shadow-sm hover:shadow-lg transition-all click-scale flex items-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ChevronDown size={18} />}
                      Load More Modules
                  </button>
              </div>
          )}
          
          {!isLoading && quizzes.length === 0 && currentPage === 0 && (
              <div className="col-span-full py-40 text-center">
                  <Globe size={80} className="mx-auto text-slate-200 mb-6 animate-pulse" />
                  <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">No Matches Found</h3>
                  <p className="text-slate-300 font-bold mt-2">Adjust your search parameters.</p>
              </div>
          )}
      </div>
    </div>
  );
};