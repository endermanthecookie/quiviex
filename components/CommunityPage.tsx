
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, User } from '../types';
import { ArrowLeft, Search, Globe, Trash2, User as UserIcon, Star, Filter, TrendingUp, Clock, ArrowDown, Eye, CheckCircle2, PlusCircle, Heart } from 'lucide-react';
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

  const fetchCommunityQuizzes = async () => {
    setIsLoading(true);
    try {
        let query = supabase.from('quizzes').select('*').eq('visibility', 'public');
        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'trending') query = query.order('views', { ascending: false }); 
        
        const { data: quizzesData, error } = await query.limit(50);
        if (error) throw error;

        // Simplified mapping for brevity in this fix
        const mapped: Quiz[] = (quizzesData || []).map((q: any) => ({
            id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
            theme: q.theme, creatorUsername: q.user_id ? 'Author' : 'Unknown', stats: { views: q.views || 0, likes: 0, avgRating: 0, totalRatings: 0, plays: 0 }
        }));
        setQuizzes(mapped);
    } catch (error: any) {
        console.error("Fetch Error:", error.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdminDelete = async (id: number) => {
      try {
          const { error } = await supabase.from('quizzes').delete().eq('id', id);
          if (error) {
              alert(`PURGE FAULT: ${error.message}.`);
              return;
          }
          setQuizzes(prev => prev.filter(q => q.id !== id));
          alert("Module decommissioned.");
      } catch (e: any) {
          console.error("Admin delete fault:", e);
      }
  };

  const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f1f5f9] view-transition" ref={containerRef}>
      {selectedQuiz && (
        <QuizDetailsModal quiz={selectedQuiz} user={user} onClose={() => setSelectedQuiz(null)} onPlay={(q) => onPlayQuiz(q)} onAdminDelete={isSudo ? handleAdminDelete : undefined} />
      )}

      <header className="glass backdrop-blur-md border-b border-white/40 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-800" /></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Public Quizzes</h1>
        </div>
        <div className="flex items-center gap-3">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery((e.target as any).value)} className="pl-4 pr-4 py-2 bg-white/60 border border-white/80 rounded-2xl focus:outline-none focus:bg-white font-bold text-sm w-48 shadow-sm" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
          {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-[3rem] h-64 animate-pulse"></div>)}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {filteredQuizzes.map((quiz) => (
                      <div key={quiz.id} onClick={() => setSelectedQuiz(quiz)} className="group bg-white rounded-[3rem] p-7 hover:shadow-2xl transition-all duration-500 border border-slate-100 relative cursor-pointer">
                          {isSudo && (
                              <button onClick={(e) => { e.stopPropagation(); if(confirm("Admin: Delete?")) handleAdminDelete(quiz.id); }} className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all z-10"><Trash2 size={18} /></button>
                          )}
                          <div className={`h-40 rounded-[2rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient} mb-6 p-6 flex flex-col justify-end overflow-hidden shadow-lg`}>
                                <h3 className="text-xl font-black text-white line-clamp-2">{quiz.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><Eye size={12} /> {quiz.stats?.views} Views</div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
