
import React, { useState, useEffect } from 'react';
import { PlusCircle, Play, Edit2, Trash2, LogOut, User, BookOpen, Trophy, Brain, Settings, Download, Globe, Search, Sparkles, HelpCircle, MessageSquare, ShieldAlert, Users, Crown, Zap, Clock, History, Printer, ChevronDown, Dices, Loader2, X, Star } from 'lucide-react';
import { Quiz, User as UserType, QXNotification } from '../types';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { PlaySelectionModal } from './PlaySelectionModal';
import { PrintOptionsModal } from './PrintOptionsModal';
import { TiltCard } from './TiltCard';
import { supabase } from '../services/supabase';
import { useTranslation } from '../App';

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

export const calculateLevelInfo = (xp: number) => {
    let level = 1;
    let threshold = 100;
    let prevThreshold = 0;
    let gap = 400;
    while (xp >= threshold) {
        level++;
        prevThreshold = threshold;
        threshold += gap;
        gap += 100;
    }
    const progressInLevel = xp - prevThreshold;
    const levelTotal = threshold - prevThreshold;
    const progressPercent = Math.min(100, Math.max(0, (progressInLevel / levelTotal) * 100));
    return { level, threshold, prevThreshold, progressPercent, xpRemaining: threshold - xp };
};

export const QuizHome: React.FC<QuizHomeProps> = ({
  quizzes, savedQuizzes, user, notifications, onMarkNotificationRead, onClearNotifications,
  onStartQuiz, onStartStudy, onEditQuiz, onDeleteQuiz, onCreateNew, onLogout, onViewAchievements,
  onStartFocus, onViewSettings, onViewCommunity, onOpenFeedback, onViewAdmin, onHostSession,
  onViewLeaderboard, onJoinGame, onViewHistory
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [pendingQuizPlay, setPendingQuizPlay] = useState<Quiz | null>(null);
  const [printingQuiz, setPrintingQuiz] = useState<Quiz | null>(null);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  useEffect(() => { setVisibleCount(10); }, [activeTab, searchQuery]);

  const allFilteredQuizzes = (activeTab === 'my' ? quizzes : savedQuizzes)
    .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const displayedQuizzes = allFilteredQuizzes.slice(0, visibleCount);
  const hasMore = allFilteredQuizzes.length > visibleCount;
  const latestResult = user.history && user.history.length > 0 ? user.history[user.history.length - 1] : null;
  const isSudo = user.email === 'sudo@quiviex.com';
  const currentPoints = user.stats.totalPoints || 0;
  const { level, threshold, progressPercent, xpRemaining } = calculateLevelInfo(currentPoints);

  const handleLuckyDip = async () => {
    if (isLoadingRandom) return;
    setIsLoadingRandom(true);
    try {
        const { count } = await supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('visibility', 'public');
        if (!count) return alert("No public quizzes available.");
        const randomIndex = Math.floor(Math.random() * count);
        const { data } = await supabase.from('quizzes').select('*').eq('visibility', 'public').range(randomIndex, randomIndex).maybeSingle();
        if (data) {
            const mappedQuiz: Quiz = {
                id: data.id, userId: data.user_id, title: data.title, questions: data.questions, createdAt: data.created_at,
                theme: data.theme, customTheme: data.custom_theme, shuffleQuestions: data.shuffle_questions, backgroundMusic: data.background_music, visibility: data.visibility
            };
            setPendingQuizPlay(mappedQuiz);
        } else alert("Could not fetch a random quiz. Try again.");
    } catch (e: any) { alert("Lucky Dip failed: " + e.message); } finally { setIsLoadingRandom(false); }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#05010d] text-white">
      {pendingQuizPlay && (
        <PlaySelectionModal 
          quiz={pendingQuizPlay} 
          onSolo={(q) => { setPendingQuizPlay(null); onStartQuiz(q); }}
          onMultiplayer={(q) => { setPendingQuizPlay(null); onHostSession(q); }}
          onClose={() => setPendingQuizPlay(null)}
        />
      )}

      {printingQuiz && <PrintOptionsModal quiz={printingQuiz} onClose={() => setPrintingQuiz(null)} />}

      {showLevelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-slate-900 rounded-[3rem] p-10 max-w-md w-full border border-white/10 shadow-2xl relative animate-in zoom-in">
                  <button onClick={() => setShowLevelModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500"><X size={20} /></button>
                  <div className="text-center mb-10">
                      <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                          <Crown size={48} className="text-yellow-400" />
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter mb-2">{t('home.level')} {level}</h2>
                      <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-xs">Architect Status</p>
                  </div>
                  <div className="space-y-8">
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                          <div className="flex justify-between items-end mb-4">
                              <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current {t('home.xp')}</p>
                                  <p className="text-3xl font-black text-white">{currentPoints.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Goal</p>
                                  <p className="text-xl font-bold text-slate-300">{threshold.toLocaleString()}</p>
                              </div>
                          </div>
                          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-4">
                              <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                          <p className="text-center text-xs font-bold text-slate-400">
                              <span className="text-indigo-400">{xpRemaining.toLocaleString()} {t('home.xp')}</span> until {t('home.level')} {level + 1}
                          </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center">
                              <Trophy size={20} className="text-yellow-500 mx-auto mb-2" />
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Perfect Syncs</p>
                              <p className="text-xl font-black">{user.stats.perfectScores}</p>
                          </div>
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-center">
                              <Brain size={20} className="text-purple-500 mx-auto mb-2" />
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Plays</p>
                              <p className="text-xl font-black">{user.stats.quizzesPlayed}</p>
                          </div>
                      </div>
                  </div>
                  <button onClick={() => setShowLevelModal(false)} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs click-scale shadow-xl">Acknowledge</button>
              </div>
          </div>
      )}

      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/10 animate-in slide-in-from-top duration-500">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <Logo variant="medium" className="group-hover:rotate-12 transition-transform shadow-md" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Quiviex</h1>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">{t('home.dashboard')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onJoinGame} className="hidden lg:flex p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl transition-all shadow-lg click-scale items-center gap-2 px-5 group border border-white/10">
              <Zap size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">{t('home.btn_join_quiz')}</span>
          </button>
          {isSudo && onViewAdmin && (
              <button onClick={onViewAdmin} title="Sudo Mode" className="p-3 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl transition-all shadow-lg click-scale flex items-center gap-2 px-5">
                  <ShieldAlert size={20} className="text-red-600" />
                  <span className="text-xs font-black uppercase tracking-widest">{t('home.btn_sudo_panel')}</span>
              </button>
          )}
          <button onClick={() => setShowLevelModal(true)} className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white/10 pr-4 click-scale">
            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-indigo-50 transition-all duration-1000 ease-out" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="absolute text-[10px] font-black text-indigo-400">{level}</span>
            </div>
            <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200">@{user.username || 'Unclaimed'}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{currentPoints.toLocaleString()} {t('home.xp')}</span>
            </div>
          </button>
          <NotificationBell notifications={notifications} onMarkRead={onMarkNotificationRead} onClearAll={onClearNotifications} />
          <button onClick={onOpenFeedback} title="Send Feedback" className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-indigo-400 shadow-sm click-scale"><MessageSquare size={20} /></button>
          <button onClick={onViewSettings} title="Settings" className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-purple-400 shadow-sm click-scale"><Settings size={20} /></button>
          <button onClick={onLogout} title="Sign Out" className="p-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all click-scale shadow-sm"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 stagger-in">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <button onClick={onCreateNew} className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 sm:p-10 rounded-[3.5rem] text-white flex flex-col justify-between group click-scale shadow-2xl min-h-[360px] relative overflow-hidden transition-all duration-500 border border-white/10">
                <div className="flex items-start justify-between z-10">
                   <PlusCircle size={36} className="text-white/80" />
                   <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/10">{t('creator.header')}</span>
                </div>
                <div className="text-left z-10 max-w-lg mt-auto">
                   <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-3 transform transition-transform group-hover:translate-x-2">{t('home.create_quiz')}</h3>
                   <p className="text-lg opacity-80 font-bold">{t('home.create_quiz_desc')}</p>
                </div>
                <div className="absolute -top-10 -right-10 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000"><PlusCircle size={300} /></div>
             </button>
             <div className="grid grid-rows-2 gap-8">
                <div className="grid grid-cols-2 gap-8">
                   <button onClick={onViewCommunity} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 hover:border-purple-500/50 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm hover:shadow-lg">
                      <Globe size={32} className="text-indigo-400 mb-3 group-hover:rotate-12 transition-transform" />
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">{t('home.explore')}</h3>
                   </button>
                   <button onClick={onViewLeaderboard} className="bg-indigo-600 p-6 rounded-[2.5rem] border border-indigo-400 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-2xl hover:shadow-indigo-500/20">
                      <Crown size={32} className="text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">{t('home.leaderboard')}</h3>
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <button onClick={onViewAchievements} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 hover:border-yellow-500/50 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm hover:shadow-lg">
                       <Trophy size={32} className="text-yellow-500 mb-3 group-hover:scale-110 transition-transform group-hover:rotate-12" />
                       <h3 className="text-lg font-black tracking-tight text-white">{t('home.trophies')}</h3>
                    </button>
                    <button onClick={handleLuckyDip} disabled={isLoadingRandom} className="bg-emerald-600 p-6 rounded-[2.5rem] border border-emerald-500 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-2xl hover:shadow-emerald-500/20">
                       {isLoadingRandom ? <Loader2 size={32} className="text-white animate-spin mb-3" /> : <Dices size={32} className="text-white mb-3 group-hover:rotate-180 transition-transform duration-500" />}
                       <h3 className="text-lg font-black tracking-tight text-white leading-tight">{t('home.lucky_dip')}</h3>
                    </button>
                </div>
             </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-8">
             <button onClick={onJoinGame} className="bg-white p-8 rounded-[3.5rem] flex flex-col justify-between group click-scale transition-all shadow-xl min-h-[160px]">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-slate-900 transition-all"><Zap size={28} /></div>
                   <div className="text-left">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950 leading-tight">{t('landing.btn_join_game')}</h3>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ENTER A PIN</p>
                   </div>
                </div>
             </button>
             <div className="flex-1 bg-white/5 border border-white/10 rounded-[3.5rem] p-10 flex flex-col justify-between relative overflow-hidden group min-h-[220px]">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-white"><History size={180} /></div>
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">{t('home.recent_activity')}</h4>
                   {latestResult ? (
                     <div className="space-y-4">
                        <p className="text-2xl font-black text-white leading-tight line-clamp-2">{latestResult.quizTitle}</p>
                        <div className="flex items-center gap-3">
                           <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full font-black text-xs border border-emerald-500/20">{Math.round((latestResult.score / latestResult.totalQuestions) * 100)}% Accuracy</div>
                           <span className="text-slate-500 font-bold text-xs">+{latestResult.points || 0} pts</span>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <p className="text-2xl font-black text-white leading-tight">Welcome, User.</p>
                        <p className="text-sm font-bold text-slate-500 leading-relaxed">No history recorded yet. Play a quiz to populate this feed.</p>
                     </div>
                   )}
                </div>
                <button onClick={onViewHistory} className="relative z-10 w-full mt-6 py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all click-scale">{t('home.activity_log')}</button>
             </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 stagger-in">
           <div className="bg-white/5 p-1.5 rounded-[2.5rem] flex gap-1 border border-white/10 shadow-inner w-full md:w-auto">
              <button onClick={() => setActiveTab('my')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'my' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}>{t('home.my_quizzes')}</button>
              <button onClick={() => setActiveTab('saved')} className={`flex-1 md:flex-none px-10 py-4 rounded-[2rem] font-black text-sm transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}>{t('home.saved_quizzes')}</button>
           </div>
           <div className="relative w-full md:w-96 group">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
             <input type="text" placeholder={t('home.search_library')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 rounded-[2.5rem] border border-white/10 bg-white/5 focus:bg-white/10 focus:outline-none focus:border-purple-500 transition-all font-bold text-white shadow-sm placeholder:text-slate-600" />
           </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger-in" key={activeTab}>
          {displayedQuizzes.map((quiz) => (
            <TiltCard key={quiz.id} className="group bg-white/5 rounded-[3rem] p-8 transition-all duration-500 flex flex-col relative border border-white/10 h-full hover:border-indigo-500/30">
                <div className={`h-52 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-800 mb-10 p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group-hover:shadow-indigo-500/10 transition-all duration-500 transform-style-3d border border-white/10`}>
                    <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                       <button onClick={(e) => { e.stopPropagation(); setPrintingQuiz(quiz); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors" title="Print"><Printer size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onEditQuiz(quiz); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors" title="Edit Quiz"><Edit2 size={18} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }} className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-600 transition-colors" title="Delete"><Trash2 size={18} /></button>
                    </div>
                    <div className="flex justify-between items-start z-10"><div className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10">{quiz.questions.length} {t('ai_assistant.questions_count').toUpperCase()}</div></div>
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md relative z-10 group-hover:scale-[1.02] transition-transform translate-z-10">{quiz.title}</h3>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4">
                  <button onClick={() => setPendingQuizPlay(quiz)} className="bg-white text-slate-950 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale shadow-lg hover:bg-slate-100 transition-all"><Play size={18} fill="currentColor" /> {t('home.btn_play')}</button>
                  <button onClick={() => onStartStudy(quiz)} className="bg-white/5 border border-white/10 text-slate-300 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 click-scale hover:bg-white/10 transition-all"><BookOpen size={18} /> {t('home.btn_study')}</button>
                </div>
            </TiltCard>
          ))}
        </div>
        {hasMore && (
            <div className="flex justify-center mt-12 mb-8">
                <button onClick={() => setVisibleCount(prev => prev + 10)} className="px-12 py-4 bg-white/5 border border-white/10 hover:border-indigo-500/50 text-indigo-400 font-black rounded-2xl shadow-sm hover:shadow-lg transition-all click-scale flex items-center gap-2 uppercase tracking-widest text-xs"><ChevronDown size={18} />{t('home.load_more')}</button>
            </div>
        )}
      </main>
    </div>
  );
};
