import React, { useRef, useState } from 'react';
import { PlusCircle, Play, Edit2, Trash2, LogOut, User, BookOpen, Trophy, Brain, Settings, Download, Globe, Search, Sparkles, HelpCircle } from 'lucide-react';
import { Quiz, User as UserType } from '../types';
import { Logo } from './Logo';

interface QuizHomeProps {
  quizzes: Quiz[];
  savedQuizzes: Quiz[];
  user: UserType;
  onStartQuiz: (quiz: Quiz) => void;
  onStartStudy: (quiz: Quiz) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (id: number) => void;
  onCreateNew: () => void;
  onLogout: () => void;
  onViewAchievements: () => void;
  onViewHistory: () => void;
  onStartFocus: () => void;
  onViewSettings?: () => void;
  onExportQuiz: (quiz: Quiz) => void;
  onImportQuiz: (file: any) => void;
  onViewCommunity: () => void;
  onViewTutorial?: () => void;
}

export const QuizHome: React.FC<QuizHomeProps> = ({
  quizzes,
  savedQuizzes,
  user,
  onStartQuiz,
  onStartStudy,
  onEditQuiz,
  onDeleteQuiz,
  onCreateNew,
  onLogout,
  onViewAchievements,
  onStartFocus,
  onViewSettings,
  onExportQuiz,
  onViewCommunity,
  onViewTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  const displayedQuizzes = (activeTab === 'my' ? quizzes : savedQuizzes)
    .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/50 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <Logo variant="medium" className="group-hover:rotate-12 transition-transform shadow-md" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quiviex</h1>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white/40 border border-white/30 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm">
            <User size={14} className="text-purple-500" />
            <span className="text-sm font-bold text-slate-700">@{user.username}</span>
          </div>
          {onViewTutorial && (
            <button onClick={onViewTutorial} className="p-3 bg-white/40 border border-white/30 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm click-scale backdrop-blur-sm">
              <HelpCircle size={20} />
            </button>
          )}
          <button onClick={onViewSettings} className="p-3 bg-white/40 border border-white/30 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-purple-600 shadow-sm click-scale backdrop-blur-sm"><Settings size={20} /></button>
          <button onClick={onLogout} className="p-3 bg-rose-50/40 hover:bg-rose-100/60 text-rose-500 rounded-xl transition-all border border-rose-100/30 click-scale shadow-sm backdrop-blur-sm"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 stagger-in">
          <button onClick={onCreateNew} className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[3rem] text-white flex flex-col justify-between group click-scale shadow-xl h-60 relative overflow-hidden">
             <PlusCircle size={32} className="mb-4" />
             <div className="text-left z-10">
                <h3 className="text-2xl font-black tracking-tight">Create New Quiz</h3>
                <p className="text-sm opacity-70 font-bold">Build your next core session</p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-1000"><PlusCircle size={100} /></div>
          </button>
          
          <button onClick={onViewCommunity} className="glass p-8 rounded-[3rem] hover:border-purple-300 flex flex-col justify-between group click-scale transition-all h-60">
             <Globe size={32} className="text-indigo-500 mb-4 group-hover:rotate-12 transition-transform" />
             <div className="text-left">
                <h3 className="text-2xl font-black tracking-tight text-slate-800">Community</h3>
                <p className="text-sm text-slate-400 font-bold">Browse public library</p>
             </div>
          </button>

          <button onClick={onStartFocus} className="glass p-8 rounded-[3rem] hover:border-indigo-300 flex flex-col justify-between group click-scale transition-all h-60">
             <Brain size={32} className="text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
             <div className="text-left">
                <h3 className="text-2xl font-black tracking-tight text-slate-800">Focus Mode</h3>
                <p className="text-sm text-slate-400 font-bold">AI analysis</p>
             </div>
          </button>

          <button onClick={onViewAchievements} className="glass p-8 rounded-[3rem] hover:border-yellow-300 flex flex-col justify-between group click-scale transition-all h-60">
             <Trophy size={32} className="text-yellow-500 mb-4 group-hover:rotate-[-12deg] transition-transform" />
             <div className="text-left">
                <h3 className="text-2xl font-black tracking-tight text-slate-800">Achievements</h3>
                <p className="text-sm text-slate-400 font-bold">Your trophies</p>
             </div>
          </button>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 stagger-in">
           <div className="bg-white/30 p-1.5 rounded-[2rem] flex gap-1 border border-white/50 shadow-inner backdrop-blur-xl">
              <button onClick={() => setActiveTab('my')} className={`px-10 py-3.5 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}>My Quizzes</button>
              <button onClick={() => setActiveTab('saved')} className={`px-10 py-3.5 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'saved' ? 'bg-purple-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800'}`}>Saved Quizzes</button>
           </div>
           
           <div className="relative w-full md:w-96 group">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
             <input type="text" placeholder="Search library..." value={searchQuery} onChange={(e) => setSearchQuery((e.target as any).value)} className="w-full pl-14 pr-8 py-5 rounded-[2.5rem] border-2 border-white/40 bg-white/40 focus:bg-white/60 focus:outline-none focus:border-purple-400 transition-all font-bold text-slate-800 shadow-sm backdrop-blur-xl" />
           </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-in">
          {displayedQuizzes.map((quiz, idx) => (
            <div key={quiz.id} className="group glass rounded-[3rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col relative animate-in zoom-in-95 fade-in duration-500" style={{ animationDelay: `${(idx % 10) * 100}ms` }}>
                <div className={`h-48 rounded-[2.5rem] bg-gradient-to-br ${idx % 3 === 0 ? 'from-purple-500 to-indigo-600' : idx % 3 === 1 ? 'from-indigo-400 to-blue-500' : 'from-fuchsia-500 to-rose-400'} mb-10 p-8 flex flex-col justify-between overflow-hidden relative shadow-lg`}>
                    <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                       <button onClick={(e) => { e.stopPropagation(); onExportQuiz(quiz); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 click-scale"><Download size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500 click-scale"><Trash2 size={18} /></button>
                    </div>
                    <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full w-fit">
                        {quiz.questions.length} QUESTIONS
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md">{quiz.title}</h3>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <button onClick={() => onStartQuiz(quiz)} className="bg-slate-900 text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 click-scale shadow-lg hover:bg-black transition-all">
                    <Play size={18} fill="currentColor" /> Play
                  </button>
                  <button onClick={() => onStartStudy(quiz)} className="bg-white/40 border-2 border-white/50 text-slate-700 font-black py-4.5 rounded-2xl flex items-center justify-center gap-2 click-scale hover:bg-white/60 transition-all backdrop-blur-sm">
                    <BookOpen size={18} /> Study
                  </button>
                  <button onClick={() => onEditQuiz(quiz)} className="col-span-2 py-4 bg-white/20 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/40 transition-all border border-white/30 click-scale backdrop-blur-sm">
                    <Edit2 size={14} /> EDIT CONFIGURATION
                  </button>
                </div>
            </div>
          ))}

          {displayedQuizzes.length === 0 && (
            <div className="col-span-full py-24 text-center glass rounded-[3.5rem] border-2 border-dashed border-white/50 animate-in fade-in duration-1000">
               <Sparkles size={64} className="mx-auto text-slate-200 mb-6" />
               <h3 className="text-2xl font-black text-slate-800">No quizzes found</h3>
               <p className="text-slate-500 font-bold mb-8">Start building to see them here.</p>
               <button onClick={onCreateNew} className="bg-purple-600 text-white font-black px-12 py-4.5 rounded-2xl click-scale shadow-xl text-lg uppercase tracking-tight">Create Now</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};