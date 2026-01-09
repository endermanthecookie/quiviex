import React, { useState } from 'react';
import { PlusCircle, Play, Edit2, Trash2, LogOut, User, BookOpen, Trophy, Brain, Settings, Download, Globe, Search, Sparkles, HelpCircle, MessageSquare, ShieldAlert, Users, Crown, Zap, Clock, History } from 'lucide-react';
import { Quiz, User as UserType, QXNotification } from '../types';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { PlaySelectionModal } from './PlaySelectionModal';

interface QuizHomeProps {
  quizzes: Quiz[];
  savedQuizzes: Quiz[];
  user: UserType;
  notifications: QXNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
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
  onOpenFeedback: () => void;
  onViewAdmin?: () => void;
  onHostSession: (quiz: Quiz) => void;
  onViewLeaderboard?: () => void;
  onJoinGame: () => void;
}

export const QuizHome: React.FC<QuizHomeProps> = ({
  quizzes,
  savedQuizzes,
  user,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onStartQuiz,
  onStartStudy,
  onEditQuiz,
  onDeleteQuiz,
  onCreateNew,
  onLogout,
  onViewAchievements,
  onStartFocus,
  onViewSettings,
  onViewCommunity,
  onOpenFeedback,
  onViewAdmin,
  onHostSession,
  onViewLeaderboard,
  onJoinGame,
  onViewHistory
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingQuizPlay, setPendingQuizPlay] = useState<Quiz | null>(null);

  const displayedQuizzes = (activeTab === 'my' ? quizzes : savedQuizzes)
    .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const latestResult = user.history && user.history.length > 0 ? user.history[user.history.length - 1] : null;

  const isSudo = user.email === 'sudo@quiviex.com';

  return (
    <div className="min-h-screen pb-20 bg-[#f1f5f9]">
      {pendingQuizPlay && (
        <PlaySelectionModal 
          quiz={pendingQuizPlay} 
          onSolo={(q) => { setPendingQuizPlay(null); onStartQuiz(q); }}
          onMultiplayer={(q) => { setPendingQuizPlay(null); onHostSession(q); }}
          onClose={() => setPendingQuizPlay(null)}
        />
      )}

      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/50 animate-in slide-in-from-top duration-500">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <Logo variant="medium" className="group-hover:rotate-12 transition-transform shadow-md" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Quiviex</h1>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onJoinGame} className="hidden lg:flex p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl transition-all shadow-lg click-scale items-center gap-2 px-5 group">
              <Zap size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Join Quiz</span>
          </button>

          {isSudo && onViewAdmin && (
              <button onClick={onViewAdmin} title="Sudo Mode" className="p-3 bg-slate-900 text-white hover:bg-black rounded-2xl transition-all shadow-lg click-scale flex items-center gap-2 px-5">
                  <ShieldAlert size={20} className="text-red-400" />
                  <span className="text-xs font-black uppercase tracking-widest">Sudo Panel</span>
              </button>
          )}
          
          <div className="hidden sm:flex items-center gap-2 bg-white/60 border border-white/30 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white">
            <div className="flex flex-col items-end mr-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Points</span>
                <span className="text-xs font-black text-indigo-600 leading-none">{user.stats.totalPoints || 0}</span>
            </div>
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
            ) : (
                <User size={14} className="text-purple-500" />
            )}
            <span className="text-sm font-bold text-slate-700">@{user.username || 'Unclaimed'}</span>
          </div>

          <NotificationBell 
            notifications={notifications} 
            onMarkRead={onMarkNotificationRead} 
            onClearAll={onClearNotifications} 
          />

          <button onClick={onViewSettings} title="Settings" className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-purple-600 shadow-sm click-scale"><Settings size={20} /></button>
          <button onClick={onLogout} title="Sign Out" className="p-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 rounded-2xl transition-all click-scale shadow-sm"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 stagger-in">
          {/* Main Action Block */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <button onClick={onCreateNew} className="bg-gradient-to-br from-purple-500 to-indigo-600 p-8 sm:p-10 rounded-[3.5rem] text-white flex flex-col justify-between group click-scale shadow-2xl min-h-[360px] relative overflow-hidden transition-all duration-500 hover:shadow-purple-200">
                <div className="flex items-start justify-between z-10">
                   <PlusCircle size={36} className="text-white/80" />
                   <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/10">Creator</span>
                </div>
                <div className="text-left z-10 max-w-lg mt-auto">
                   <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-3 transform transition-transform group-hover:translate-x-2">Create New Quiz</h3>
                   <p className="text-lg opacity-80 font-bold">Build a quiz with AI tools</p>
                </div>
                <div className="absolute -top-10 -right-10 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000"><PlusCircle size={300} /></div>
             </button>

             <div className="grid grid-rows-2 gap-8">
                <div className="grid grid-cols-2 gap-8">
                   <button onClick={onViewCommunity} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:border-purple-300 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm hover:shadow-lg">
                      <Globe size={32} className="text-indigo-500 mb-3 group-hover:rotate-12 transition-transform" />
                      <h3 className="text-lg font-black tracking-tight text-slate-800 leading-tight">Explore</h3>
                   </button>

                   <button onClick={onViewLeaderboard} className="bg-indigo-600 p-6 rounded-[2.5rem] border border-indigo-400 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-2xl hover:shadow-indigo-200">
                      <Crown size={32} className="text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">Leaderboard</h3>
                   </button>
                </div>

                <button onClick={onViewAchievements} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-yellow-300 flex flex-row items-center justify-between group click-scale transition-all shadow-sm hover:shadow-lg">
                   <div className="text-left">
                       <h3 className="text-2xl font-black tracking-tight text-slate-800">Trophies</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Your Milestones</p>
                   </div>
                   <Trophy size={36} className="text-yellow-500 group-hover:scale-110 transition-transform group-hover:rotate-12" />
                </button>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
             <button onClick={onJoinGame} className="bg-white p-8 rounded-[3.5rem] border border-slate-200 hover:border-indigo-400 flex flex-col justify-between group click-scale transition-all shadow-sm hover:shadow-lg min-h-[160px]">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Zap size={28} />
                   </div>
                   <div className="text-left">
                      <h3 className="text-2xl font-black tracking-tight text-slate-800 leading-tight">Join Game</h3>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ENTER A PIN</p>
                   </div>
                </div>
             </button>

             <div className="flex-1 bg-white/40 border border-slate-200 rounded-[3.5rem] p-10 flex flex-col justify-between relative overflow-hidden group min-h-[220px]">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><History size={180} /></div>
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Recent Activity</h4>
                   {latestResult ? (
                     <div className="space-y-4">
                        <p className="text-2xl font-black text-slate-800 leading-tight line-clamp-2">{latestResult.quizTitle}</p>
                        <div className="flex items-center gap-3">
                           <div className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full font-black text-xs">{Math.round((latestResult.score / latestResult.totalQuestions) * 100)}% Accuracy</div>
                           <span className="text-slate-400 font-bold text-xs">+{latestResult.points || 0} pts</span>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <p className="text-2xl font-black text-slate-800 leading-tight">Welcome, User.</p>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed">No history recorded yet. Play a quiz to populate this feed.</p>
                     </div>
                   )}
                </div>
                <button onClick={onViewHistory} className="relative z-10 w-full mt-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all click-scale">Open Activity Log</button>
             </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 stagger-in">
           <div className="bg-slate-200/50 p-1.5 rounded-[2.5rem] flex gap-1 border border-white/5 shadow-inner w-full md:w-auto">
              <button onClick={() => setActiveTab('my')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}>My Quizzes</button>
              <button onClick={() => setActiveTab('saved')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-700'}`}>Saved Quizzes</button>
           </div>
           
           <div className="relative w-full md:w-96 group">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
             <input type="text" placeholder="Search library..." value={searchQuery} onChange={(e) => setSearchQuery((e.target as any).value)} className="w-full pl-14 pr-8 py-5 rounded-[2.5rem] border-2 border-white bg-white focus:bg-white focus:outline-none focus:border-purple-400 transition-all font-bold text-slate-800 shadow-sm" />
           </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-in" key={activeTab}>
          {displayedQuizzes.map((quiz) => (
            <div key={quiz.id} className="group bg-white rounded-[3rem] p-8 hover:shadow-2xl transition-all duration-500 flex flex-col relative border border-slate-100 hover-lift">
                <div className={`h-52 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 mb-10 p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group-hover:shadow-indigo-100 transition-all duration-500`}>
                    <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                       <button onClick={(e) => { e.stopPropagation(); onEditQuiz(quiz); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors" title="Edit Quiz"><Edit2 size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500 transition-colors" title="Delete"><Trash2 size={18} /></button>
                    </div>
                    <div className="flex justify-between items-start z-10">
                        <div className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10">
                            {quiz.questions.length} QUESTIONS
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md relative z-10 group-hover:scale-[1.02] transition-transform">{quiz.title}</h3>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <button onClick={() => setPendingQuizPlay(quiz)} className="bg-slate-900 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale shadow-lg hover:bg-black transition-all">
                    <Play size={18} fill="currentColor" /> Play
                  </button>
                  <button onClick={() => onStartStudy(quiz)} className="bg-slate-100 border border-slate-200 text-slate-700 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale hover:bg-white transition-all">
                    <BookOpen size={18} /> Study
                  </button>
                </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};