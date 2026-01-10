import React, { useState, useEffect } from 'react';
import { Quiz, User, Question } from '../types';
import { ArrowLeft, User as UserIcon, Globe, Play, Sparkles, Search, Loader2, Heart, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { QuizDetailsModal } from './QuizDetailsModal';
import { THEMES } from '../constants';

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    fetchCommunityQuizzes();
  }, [sortBy]);

  useEffect(() => {
      if (initialQuizId) {
          handleDeepLink(initialQuizId);
      }
  }, [initialQuizId]);

  const handleDeepLink = async (id: number) => {
      const existing = quizzes.find(q => q.id === id);
      if (existing) {
          setSelectedQuiz(existing);
          return;
      }

      try {
          const { data: q } = await supabase.from('quizzes').select('*').eq('id', id).single();
          if (q) {
              const isStaff = q.user_id === '00000000-0000-0000-0000-000000000000';
              const mapped: Quiz = {
                  id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                  theme: q.theme, creatorUsername: q.username_at_creation || 'Community Architect', creatorAvatarUrl: q.avatar_url_at_creation,
                  isSensitive: q.is_sensitive,
                  stats: { views: isStaff ? 0 : (q.views || 0), likes: 0, avgRating: 4.5, totalRatings: 10, plays: q.plays || 0 }
              };
              setSelectedQuiz(mapped);
          }
      } catch (e) {
          console.error("Deep link error:", e);
      }
  };

  const fetchCommunityQuizzes = async () => {
    setIsLoading(true);
    try {
        let query = supabase.from('quizzes').select('*').eq('visibility', 'public');
        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'trending') query = query.order('views', { ascending: false }); 
        
        const { data: dbQuizzes, error } = await query.limit(40);
        if (error) throw error;

        const mapped: Quiz[] = (dbQuizzes || []).map((q: any) => {
            const isStaff = q.user_id === '00000000-0000-0000-0000-000000000000';
            return {
                id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                theme: q.theme, creatorUsername: q.username_at_creation || 'Quiviex Team', creatorAvatarUrl: q.avatar_url_at_creation,
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

        setQuizzes(mapped);
    } catch (error) {
        console.error("Fetch Error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
            onClose={() => setSelectedQuiz(null)} 
            onPlay={(q) => onPlayQuiz(q)} 
            onRemix={onRemixQuiz}
        />
      )}

      <header className="glass backdrop-blur-md border-b border-white/40 sticky top-0 z-40 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 hover:bg-white/20 rounded-2xl transition-all click-scale"><ArrowLeft size={24} className="text-slate-800" /></button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Public Gallery</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5 flex items-center gap-1"><Sparkles size={10} /> Quiviex Verified Modules</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 pr-4 py-3 bg-white/60 border border-white/80 rounded-2xl focus:outline-none focus:bg-white font-bold text-sm w-64 shadow-sm transition-all" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-white border border-slate-100 rounded-2xl px-5 py-3 font-black text-[10px] uppercase tracking-widest text-slate-600 focus:outline-none shadow-sm cursor-pointer">
                <option value="newest">Latest Arrivals</option>
                <option value="trending">Popular Content</option>
            </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
          {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-[3rem] h-64 animate-pulse border border-slate-100"></div>)}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-in">
                  {filteredQuizzes.map((quiz) => (
                      <div key={quiz.id} onClick={() => setSelectedQuiz(quiz)} className="group bg-white rounded-[3.5rem] p-8 hover:shadow-2xl transition-all duration-500 border border-slate-100 relative cursor-pointer hover-lift">
                          <div className={`h-48 rounded-[2.5rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-8 p-8 flex flex-col justify-between overflow-hidden shadow-xl group-hover:scale-[1.02] transition-transform`}>
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div className="flex gap-1 flex-wrap">
                                        {quiz.userId === '00000000-0000-0000-0000-000000000000' && <span className="bg-yellow-400 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-white/20">Verified</span>}
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">{quiz.questions.length} UNITS</span>
                                    </div>
                                    {quiz.isSensitive && (
                                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-amber-200 flex items-center gap-1 shadow-lg">
                                            <AlertTriangle size={10} /> potential bad things
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                                    {getHighlightedText(quiz.title, searchQuery)}
                                </h3>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                                      {quiz.creatorAvatarUrl ? <img src={quiz.creatorAvatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="font-black text-slate-300">Q</div>}
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
          
          {!isLoading && filteredQuizzes.length === 0 && (
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