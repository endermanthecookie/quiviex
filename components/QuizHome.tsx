import React, { useState, useEffect } from 'react';
// Fix: Added missing LogOut, Edit2, and Trash2 imports
import { PlusCircle, Play, BookOpen, Trophy, Brain, Settings, Download, Globe, Search, Sparkles, HelpCircle, MessageSquare, ShieldAlert, Users, Crown, Zap, Clock, History, Printer, ChevronDown, Dices, Loader2, X, Star, Calendar, ArrowRight, Activity, LogOut, Edit2, Trash2 } from 'lucide-react';
import { Quiz, User as UserType, QXNotification } from '../types';
import { THEMES } from '../constants';
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
  const [mounted, setMounted] = useState(false);
  const [moduleOfTheDay, setModuleOfTheDay] = useState<Quiz | null>(null);

  useEffect(() => { 
    setVisibleCount(10); 
    setMounted(true);
    fetchModuleOfTheDay();
  }, [activeTab, searchQuery]);

  const fetchModuleOfTheDay = async () => {
      try {
          const { data } = await supabase.from('quizzes').select('*').eq('visibility', 'public').limit(5);
          if (data && data.length > 0) {
              const randomIndex = new Date().getDate() % data.length;
              const q = data[randomIndex];
              setModuleOfTheDay({
                  id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                  theme: q.theme, customTheme: q.custom_theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music, visibility: q.visibility
              });
          }
      } catch (e) { console.debug("MotD fetch failed"); }
  };

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
    <div className="min-h-screen pb-20 bg-[#05010d] text-white overflow-x-hidden">
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 rounded-[3rem] p-10 max-w-md w-full border border-white/10 shadow-2xl relative pop-in">
                  <button onClick={() => setShowLevelModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 click-scale"><X size={20} /></button>
                  <div className="text-center mb-10">
                      <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse">
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
                              <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: mounted ? `${progressPercent}%` : '0%' }}></div>
                          </div>
                          <p className="text-center text-xs font-bold text-slate-400">
                              <span className="text-indigo-400">{xpRemaining.toLocaleString()} {t('home.xp')}</span> until {t('home.level')} {level + 1}
                          </p>
                      </div>
                  </div>
                  <button onClick={() => setShowLevelModal(false)} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs click-scale shadow-xl hover:bg-slate-200">Acknowledge</button>
              </div>
          </div>
      )}

      <header className="glass sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 animate-in slide-in-from-top duration-500">
        <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <Logo variant="small" className="group-hover:rotate-12 transition-transform shadow-md sm:w-10 sm:h-10" />
          <div className="hidden xs:block">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">Quiviex</h1>
            <p className="text-[9px] sm:text-[10px] font-black text-purple-500 uppercase tracking-widest mt-1">{t('home.dashboard')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onJoinGame} className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl transition-all shadow-lg click-scale items-center gap-2 px-3 sm:px-5 group border border-white/10">
              <Zap size={18} className="text-yellow-400 group-hover:scale-110 transition-transform sm:w-5 sm:h-5" />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest">{t('home.btn_join_quiz')}</span>
          </button>
          
          <button onClick={() => setShowLevelModal(true)} className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white/10 pr-2 sm:pr-4 click-scale">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                    <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-indigo-50 transition-all duration-1000 ease-out" strokeDasharray={`${progressPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="absolute text-[8px] sm:text-[10px] font-black text-indigo-400">{level}</span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">@{user.username || 'Unit'}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">{currentPoints.toLocaleString()} XP</span>
            </div>
          </button>
          <NotificationBell notifications={notifications} onMarkRead={onMarkNotificationRead} onClearAll={onClearNotifications} />
          <button onClick={onViewSettings} title="Settings" className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-purple-400 shadow-sm click-scale"><Settings size={20} /></button>
          <button onClick={onLogout} title="Sign Out" className="p-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 rounded-2xl transition-all click-scale shadow-sm"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Module of the Day Hero - Ultra Responsive */}
        {moduleOfTheDay && (
            <section className="mb-12 sm:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 stagger-in">
                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-14 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-700 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 sm:gap-12">
                        <div className="flex-1 text-center md:text-left w-full">
                            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-indigo-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 shadow-xl animate-pulse">
                                <Activity size={14} /> Spotlight Module
                            </div>
                            <h2 className="text-3xl sm:text-7xl font-black text-white mb-6 tracking-tighter leading-tight sm:leading-[0.9] group-hover:translate-x-1 transition-transform duration-700 break-words">{moduleOfTheDay.title}</h2>
                            <p className="text-base sm:text-xl text-slate-400 font-bold mb-8 sm:mb-10 max-w-2xl leading-relaxed">
                                Join the global community in mastering today's spotlight module. Achieve 100% fidelity to earn bonus points.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                                <button onClick={() => setPendingQuizPlay(moduleOfTheDay)} className="w-full sm:w-auto bg-white text-slate-950 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 click-scale group/btn">
                                    <Play fill="currentColor" size={18} className="group-hover/btn:scale-110 transition-transform" /> Start Challenge
                                </button>
                                <button onClick={onViewCommunity} className="text-[10px] sm:text-[11px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.4em] flex items-center gap-2 py-3">
                                    View All Modules <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                        {/* Fidelity Meter Widget */}
                        <div className="w-full md:w-auto flex flex-col items-center">
                            <div className="w-48 h-48 sm:w-64 sm:h-64 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[60px] opacity-10 animate-pulse"></div>
                                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#fidelity_grad)" strokeWidth="8" strokeDasharray="282" strokeDashoffset={282 - (progressPercent * 2.82)} strokeLinecap="round" className="transition-all duration-1000" />
                                    <defs>
                                        <linearGradient id="fidelity_grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#c084fc" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{Math.round(progressPercent)}%</span>
                                    <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Consistency</span>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.4em]">Fidelity Meter</p>
                        </div>
                    </div>
                </div>
            </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-12 sm:mb-16 stagger-in">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
             <button onClick={onCreateNew} className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] text-white flex flex-col justify-between group click-scale shadow-2xl min-h-[300px] sm:min-h-[360px] relative overflow-hidden transition-all duration-500 border border-white/10 hover-lift">
                <div className="flex items-start justify-between z-10">
                   <PlusCircle size={32} className="text-white/80 group-hover:rotate-90 transition-transform duration-500" />
                   <span className="bg-white/20 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border border-white/10 shimmer">ENGINEER</span>
                </div>
                <div className="text-left z-10 max-w-lg mt-auto">
                   <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-3 transform transition-transform group-hover:translate-x-2">Build Module</h3>
                   <p className="text-base sm:text-lg opacity-80 font-bold">Construct educational units with AI assist.</p>
                </div>
                <div className="absolute -top-10 -right-10 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000"><PlusCircle size={240} /></div>
             </button>
             <div className="grid grid-rows-2 gap-6 sm:gap-8">
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                   <button onClick={onViewCommunity} className="bg-white/5 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 hover:border-purple-500/50 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm hover:shadow-lg hover-lift">
                      <Globe size={28} className="text-indigo-400 mb-2 sm:mb-3 group-hover:rotate-12 transition-transform" />
                      <h3 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight">Explore</h3>
                   </button>
                   <button onClick={onViewLeaderboard} className="bg-indigo-600 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-indigo-400 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-2xl hover:shadow-indigo-500/20 hover-lift">
                      <Crown size={28} className="text-yellow-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight">Rankings</h3>
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                    <button onClick={onViewAchievements} className="bg-white/5 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 hover:border-yellow-500/50 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-sm hover:shadow-lg hover-lift">
                       <Trophy size={28} className="text-yellow-500 mb-2 sm:mb-3 group-hover:scale-110 transition-transform group-hover:rotate-12" />
                       <h3 className="text-sm sm:text-lg font-black tracking-tight text-white">Assets</h3>
                    </button>
                    <button onClick={handleLuckyDip} disabled={isLoadingRandom} className="bg-emerald-600 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-500 flex flex-col justify-center items-center text-center group click-scale transition-all shadow-2xl hover:shadow-emerald-500/20 hover-lift">
                       {isLoadingRandom ? <Loader2 size={28} className="text-white animate-spin mb-2 sm:mb-3" /> : <Dices size={28} className="text-white mb-2 sm:mb-3 group-hover:rotate-180 transition-transform duration-500" />}
                       <h3 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight">Lucky Dip</h3>
                    </button>
                </div>
             </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
             <button onClick={onJoinGame} className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] flex flex-col justify-between group click-scale transition-all shadow-xl min-h-[140px] sm:min-h-[160px] hover-lift">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white group-hover:bg-slate-900 transition-all"><Zap size={24} className="group-hover:scale-110 transition-transform sm:w-7 sm:h-7" /></div>
                   <div className="text-left">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-tight">Join Session</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ENTER MODULE PIN</p>
                   </div>
                </div>
             </button>
             <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden group min-h-[200px] sm:min-h-[220px]">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000 text-white"><History size={160} /></div>
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Unit Feed</h4>
                   {latestResult ? (
                     <div className="space-y-3 animate-in slide-in-from-right-4 duration-500">
                        <p className="text-lg sm:text-2xl font-black text-white leading-tight line-clamp-2">{latestResult.quizTitle}</p>
                        <div className="flex items-center gap-3">
                           <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-black text-[9px] border border-emerald-500/20 shimmer uppercase">Sync OK</div>
                           <span className="text-slate-500 font-bold text-[10px]">+{latestResult.points || 0} pts</span>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4 animate-in fade-in duration-1000">
                        <p className="text-lg sm:text-2xl font-black text-white leading-tight">Awaiting Sync.</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed">No history recorded yet. Complete a module to populate this feed.</p>
                     </div>
                   )}
                </div>
                <button onClick={onViewHistory} className="relative z-10 w-full mt-6 py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all click-scale">Recent History</button>
             </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12 stagger-in">
           <div className="bg-white/5 p-1 sm:p-1.5 rounded-2xl sm:rounded-[2.5rem] flex gap-1 border border-white/10 shadow-inner w-full md:w-auto">
              <button onClick={() => setActiveTab('my')} className={`flex-1 md:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] font-black text-xs sm:text-sm transition-all ${activeTab === 'my' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>My Library</button>
              <button onClick={() => setActiveTab('saved')} className={`flex-1 md:flex-none px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[2rem] font-black text-xs sm:text-sm transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>Bookmarks</button>
           </div>
           <div className="relative w-full md:w-80 lg:w-96 group">
             <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
             <input type="text" placeholder="Search units..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-4 sm:py-5 rounded-2xl sm:rounded-[2.5rem] border border-white/10 bg-white/5 focus:bg-white/10 focus:outline-none focus:border-purple-500 transition-all font-bold text-white shadow-sm placeholder:text-slate-600" />
           </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 stagger-in" key={activeTab}>
          {displayedQuizzes.map((quiz, qIdx) => (
            <TiltCard key={quiz.id} className="group bg-white/5 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 transition-all duration-500 flex flex-col relative border border-white/10 h-full hover:border-indigo-500/30 hover-lift" style={{ animationDelay: `${qIdx * 100}ms` }}>
                <div className={`h-40 sm:h-52 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br ${THEMES[quiz.theme || 'classic']?.gradient || THEMES.classic.gradient} mb-6 sm:mb-10 p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-lg group-hover:shadow-indigo-500/10 transition-all duration-500 transform-style-3d border border-white/10`}>
                    <div className="absolute top-0 right-0 p-3 sm:p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                       <button onClick={(e) => { e.stopPropagation(); setPrintingQuiz(quiz); }} className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors click-scale" title="Print"><Printer size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onEditQuiz(quiz); }} className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-colors click-scale" title="Edit"><Edit2 size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); onDeleteQuiz(quiz.id); }} className="p-2 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-600 transition-colors click-scale" title="Delete"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex justify-between items-start z-10"><div className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/10 shimmer">{quiz.questions.length} UNITS</div></div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md relative z-10 group-hover:scale-[1.02] transition-transform translate-z-10 line-clamp-2">{quiz.title}</h3>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 sm:gap-4">
                  <button onClick={() => setPendingQuizPlay(quiz)} className="bg-white text-slate-950 font-black py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-2 click-scale shadow-lg hover:bg-slate-100 transition-all group/btn text-xs sm:text-base"><Play size={16} fill="currentColor" className="group-hover/btn:scale-110 transition-transform" /> Start</button>
                  <button onClick={() => onStartStudy(quiz)} className="bg-white/5 border border-white/10 text-slate-300 font-black py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-2 click-scale hover:bg-white/10 transition-all group/study text-xs sm:text-base"><BookOpen size={16} className="group-hover/study:scale-110 transition-transform" /> Study</button>
                </div>
            </TiltCard>
          ))}
        </div>
        {hasMore && (
            <div className="flex justify-center mt-12 mb-8 animate-in fade-in duration-1000">
                <button onClick={() => setVisibleCount(prev => prev + 10)} className="px-10 py-4 bg-white/5 border border-white/10 hover:border-indigo-500/50 text-indigo-400 font-black rounded-2xl shadow-sm hover:shadow-lg transition-all click-scale flex items-center gap-2 uppercase tracking-widest text-[10px] sm:text-xs"><ChevronDown size={18} /> Load more units</button>
            </div>
        )}
      </main>
    </div>
  );
};