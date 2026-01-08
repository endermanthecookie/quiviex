import React, { useState } from 'react';
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
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 bg-[#f1f5f9]">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/50">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <Logo variant="medium" className="group-hover:rotate-12 transition-transform shadow-md" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Quiviex</h1>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/60 border border-white/30 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-sm">
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
            ) : (
                <User size={14} className="text-purple-500" />
            )}
            <span className="text-sm font-bold text-slate-700">@{user.username}</span>
          </div>
          {onViewTutorial && (
            <button onClick={onViewTutorial} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm click-scale"><HelpCircle size={20} /></button>
          )}
          <button onClick={onViewSettings} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-purple-600 shadow-sm click-scale"><Settings size={20} /></button>
          <button onClick={onLogout} className="p-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 rounded-2xl transition-all click-scale shadow-sm"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Adjusted Grid for better responsiveness */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-16 stagger-in">
          {/* Hero Tile */}
          <button onClick={onCreateNew} className="lg:col-span-4 bg-gradient-to-br from-purple-500 to-indigo-600 p-8 sm:p-10 rounded-[3.5rem] text-white flex flex-col justify-between group click-scale shadow-2xl min-h-[320px] relative overflow-hidden">
             <div className="flex items-start justify-between z-10">
                <PlusCircle size={36} className="text-white/80" />
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/10">Start Builder</span>
             </div>
             <div className="text-left z-10 max-w-lg mt-auto">
                <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-3">Create New Quiz</h3>
                <p className="text-lg opacity-80 font-bold">Build your next core session with AI tools</p>
             </div>
             <div className="absolute -top-10 -right-10 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-1000"><PlusCircle size={300} /></div>
          </button>
          
          <div className="lg:col-span-2 grid grid-rows-2 gap-6 h-full">
             <div className="grid grid-cols-2 gap-6 h-full">
                <button onClick={onViewCommunity} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:border-purple-300 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm">
                   <Globe size={32} className="text-indigo-500 mb-3 group-hover:rotate-12 transition-transform" />
                   <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-800 leading-tight">Explore</h3>
                   </div>
                </button>

                <button onClick={onStartFocus} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm">
                   <Brain size={32} className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                   <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-800 leading-tight">Focus</h3>
                   </div>
                </button>
             </div>

             <button onClick={onViewAchievements} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-yellow-300 flex flex-row items-center justify-between group click-scale transition-all shadow-sm">
                <div className="text-left">
                    <h3 className="text-2xl font-black tracking-tight text-slate-800">Trophies</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Your Milestones</p>
                </div>
                <Trophy size={36} className="text-yellow-500 group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 stagger-in">
           <div className="bg-slate-200/50 p-1.5 rounded-[2.5rem] flex gap-1 border border-white/50 shadow-inner w-full md:w-auto">
              <button onClick={() => setActiveTab('my')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}>My Quizzes</button>
              <button onClick={() => setActiveTab('saved')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'saved' ? 'bg-purple-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}>Saved Quizzes</button>
           </div>
           
           <div className="relative w-full md:w-96 group">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
             <input type="text" placeholder="Search library..." value={searchQuery} onChange={(e) => setSearchQuery((e.target as any).value)} className="w-full pl-14 pr-8 py-5 rounded-[2.5rem] border-2 border-white bg-white focus:bg-white focus:outline-none focus:border-purple-400 transition-all font-bold text-slate-800 shadow-sm" />
           </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-in">
          {displayedQuizzes.map((quiz, idx) => (
            <div key={quiz.id} className="group bg-white rounded-[3rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col relative animate-in zoom-in-95 border border-slate-100" style={{ animationDelay: `${(idx % 10) * 100}ms` }}>
                <div className={`h-52 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 mb-10 p-8 flex flex-col justify-between overflow-hidden relative shadow-lg`}>
                    <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                       <button onClick={(e) => { e.stopPropagation(); onExportQuiz(quiz); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40"><Download size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500"><Trash2 size={18} /></button>
                    </div>
                    <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full w-fit border border-white/10">
                        {quiz.questions.length} QUESTIONS
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md relative z-10">{quiz.title}</h3>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <button onClick={() => onStartQuiz(quiz)} className="bg-slate-900 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale shadow-lg hover:bg-black transition-all">
                    <Play size={18} fill="currentColor" /> Play
                  </button>
                  <button onClick={() => onStartStudy(quiz)} className="bg-slate-100 border border-slate-200 text-slate-700 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale hover:bg-white transition-all">
                    <BookOpen size={18} /> Study
                  </button>
                </div>
            </div>
          ))}
          {displayedQuizzes.length === 0 && (
             <div className="col-span-full py-20 text-center">
                 <Search size={48} className="mx-auto text-slate-300 mb-4" />
                 <p className="font-bold text-slate-400">No quizzes found in this collection.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};