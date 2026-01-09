import React, { useState, useEffect } from 'react';
import { Quiz, User, Question } from '../types';
import { ArrowLeft, Globe, Eye, Heart, Sparkles, Search } from 'lucide-react';
import { supabase } from '../services/supabase';
import { QuizDetailsModal } from './QuizDetailsModal';
import { THEMES } from '../constants';

interface CommunityPageProps {
  user: User | null; 
  onBack: () => void;
  onPlayQuiz: (quiz: Quiz) => void;
  initialQuizId?: number | null;
}

type SortOption = 'newest' | 'trending';

const TEAM_AVATAR = "data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%239d33f5'/%3E%3Cstop offset='100%25' style='stop-color:%235c4cf4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='100' height='100' rx='28' fill='url(%23g)'/%3E%3Cpath d='M 52 14 L 68 14 L 48 48 L 66 48 L 32 86 L 44 54 L 30 54 Z' fill='white'/%3E%3C/svg%3E";

const generateTeamQuiz = (id: number, title: string, questions: Question[], theme: string = 'classic'): Quiz => ({
    id: id,
    userId: 'quiviex-team',
    title,
    questions,
    createdAt: new Date(Date.now() - id * 86400000).toISOString(),
    theme,
    creatorUsername: 'Quiviex Team',
    creatorAvatarUrl: TEAM_AVATAR,
    stats: { views: 5000 + id * 123, plays: 1200 + id * 45, avgRating: 4.8, totalRatings: 85, likes: 230 + id }
});

const DEFAULT_QUESTIONS: Question[] = [
    { question: "Which language is the backbone of the web?", image: "", type: "multiple-choice", options: ["Python", "JavaScript", "Java", "C++"], correctAnswer: 1, timeLimit: 15 },
    { question: "Is the internet the same as the World Wide Web?", image: "", type: "true-false", options: ["True", "False"], correctAnswer: 1, timeLimit: 10, explanation: "The internet is the network; the web is a service built on it." },
    { question: "What does HTML stand for?", image: "", type: "text-input", options: [], correctAnswer: "HyperText Markup Language", timeLimit: 30 }
];

const SEED_QUIZZES: Quiz[] = [
    generateTeamQuiz(2001, "Cosmic Frontiers: Mars & Beyond", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2002, "Renaissance Art Mastery", DEFAULT_QUESTIONS, 'winter'),
    generateTeamQuiz(2003, "Python for Young Minds", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2004, "Ancient Roman Architecture", DEFAULT_QUESTIONS),
    generateTeamQuiz(2005, "The Science of High-Tech Cooking", DEFAULT_QUESTIONS, 'ocean'),
    generateTeamQuiz(2006, "Retro Gaming: 8-Bit Revolution", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2007, "Oceanic Mysteries & Biology", DEFAULT_QUESTIONS, 'ocean'),
    generateTeamQuiz(2008, "Global Cuisine Deep Dive", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2009, "Quantum Physics: The Basics", DEFAULT_QUESTIONS, 'winter'),
    generateTeamQuiz(2010, "Great Explorers of History", DEFAULT_QUESTIONS),
    generateTeamQuiz(2011, "Modern Skyscrapers Engineering", DEFAULT_QUESTIONS, 'winter'),
    generateTeamQuiz(2012, "Cybersecurity Essentials", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2013, "Mythology of the Stars", DEFAULT_QUESTIONS, 'ocean'),
    generateTeamQuiz(2014, "Jurassic World: Paleontology", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2015, "Classical Music Masterpieces", DEFAULT_QUESTIONS),
    generateTeamQuiz(2016, "Botany: Rare Plant Life", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2017, "Evolution of Human Communication", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2018, "Chess Grandmaster Tactics", DEFAULT_QUESTIONS, 'winter'),
    generateTeamQuiz(2019, "The French Revolution Legacy", DEFAULT_QUESTIONS),
    generateTeamQuiz(2020, "Physics in Super-Hero Cinema", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2021, "Infrastructure & Megacity Design", DEFAULT_QUESTIONS, 'winter'),
    generateTeamQuiz(2022, "Human Anatomy: The Nervous System", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2023, "Blockchain and Future Finance", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2024, "African Safari: Ecology", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2025, "Robotics & AI Ethics", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2026, "The Modern Olympic Games", DEFAULT_QUESTIONS),
    generateTeamQuiz(2027, "Solar System: Planet Wonders", DEFAULT_QUESTIONS, 'ocean'),
    generateTeamQuiz(2028, "The Silk Road Expeditions", DEFAULT_QUESTIONS, 'nature'),
    generateTeamQuiz(2029, "Artificial Intelligence Principles", DEFAULT_QUESTIONS, 'cyberpunk'),
    generateTeamQuiz(2030, "Marine Conservation Heroes", DEFAULT_QUESTIONS, 'ocean'),
];

export const CommunityPage: React.FC<CommunityPageProps> = ({ user, onBack, onPlayQuiz }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    fetchCommunityQuizzes();
  }, [sortBy]);

  const fetchCommunityQuizzes = async () => {
    setIsLoading(true);
    try {
        let query = supabase.from('quizzes').select('*').eq('visibility', 'public');
        if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
        else if (sortBy === 'trending') query = query.order('views', { ascending: false }); 
        
        const { data: dbQuizzes } = await query.limit(20);
        const mappedDb: Quiz[] = (dbQuizzes || []).map((q: any) => ({
            id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
            theme: q.theme, creatorUsername: q.username_at_creation || 'Community Architect', creatorAvatarUrl: q.avatar_url_at_creation,
            stats: { views: q.views || 0, likes: 0, avgRating: 4.5, totalRatings: 10, plays: q.plays || 0 }
        }));

        const combined = [...mappedDb, ...SEED_QUIZZES];
        const unique = Array.from(new Map(combined.map(q => [q.id, q])).values());
        setQuizzes(unique);
    } catch (error) {
        setQuizzes(SEED_QUIZZES);
    } finally {
        setIsLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f1f5f9] view-transition pb-20">
      {selectedQuiz && (
        <QuizDetailsModal quiz={selectedQuiz} user={user} onClose={() => setSelectedQuiz(null)} onPlay={(q) => onPlayQuiz(q)} />
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
                <option value="newest">Latest</option>
                <option value="trending">Popular</option>
            </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 sm:p-10">
          {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-pulse">
                  {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-[3rem] h-64"></div>)}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-in">
                  {filteredQuizzes.map((quiz) => (
                      <div key={quiz.id} onClick={() => setSelectedQuiz(quiz)} className="group bg-white rounded-[3.5rem] p-8 hover:shadow-2xl transition-all duration-500 border border-slate-100 relative cursor-pointer hover-lift">
                          <div className={`h-48 rounded-[2.5rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-8 p-8 flex flex-col justify-between overflow-hidden shadow-xl group-hover:scale-[1.02] transition-transform`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-1">
                                        {quiz.userId === 'quiviex-team' && <span className="bg-yellow-400 text-black text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">Verified</span>}
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">{quiz.questions.length} UNITS</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-white line-clamp-2 leading-tight drop-shadow-md">{quiz.title}</h3>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100">
                                      {quiz.creatorAvatarUrl ? <img src={quiz.creatorAvatarUrl} className="w-full h-full object-cover" /> : <div className="font-black text-slate-300">Q</div>}
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
      </div>
    </div>
  );
};