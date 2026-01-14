
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Quiz, QuizResult, User, UserStats, Achievement, Feedback, QXNotification, Room } from './types';
import { QuizHome } from './components/QuizHome';
import { QuizCreator } from './components/QuizCreator';
import { QuizTaker } from './components/QuizTaker';
import { QuizResults } from './components/QuizResults';
import { FlashcardViewer } from './components/FlashcardViewer';
import { AchievementsPage } from './components/AchievementsPage';
import { HistoryPage } from './components/HistoryPage';
import { FocusMode } from './components/FocusMode';
import { SettingsPage } from './components/SettingsPage';
import { CommunityPage } from './components/CommunityPage';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { JoinPinPage } from './components/JoinPinPage';
import { LeaderboardPage } from './components/LeaderboardPage';
import { PublicProfilePage } from './components/PublicProfilePage';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UsernameSetup } from './components/UsernameSetup';
import { NotFoundPage } from './components/NotFoundPage';
import { THEMES } from './constants';
import { NotificationToast } from './components/NotificationToast';
import { FeedbackModal } from './components/FeedbackModal';
import { LegalModal } from './components/LegalModal';
import { CommandPalette } from './components/CommandPalette';
import { PomodoroWidget } from './components/PomodoroWidget';
import { ShortcutsModal } from './components/ShortcutsModal';
import { exportQuizToQZX, exportAllQuizzesToZip } from './services/exportService';
import { supabase, checkSupabaseConnection } from './services/supabase';
import { sfx } from './services/soundService';
import { Logo } from './components/Logo';

import en from './lang/english';
import nl from './lang/dutch';
import de from './lang/german';
import fr from './lang/french';
import ja from './lang/japanese';
import ko from './lang/korean';
import es from './lang/spanish';
import tr from './lang/turkish';
import br from './lang/brazilian';
import zh from './lang/chinese';
import it from './lang/italian';

const translations: Record<string, any> = { 
    en, nl, de, fr, ja, ko, es, 'pt-BR': br, it, tr, 'zh-CN': zh 
};

interface LanguageContextType {
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};

type ViewState = 'landing' | 'auth' | 'home' | 'create' | 'take' | 'results' | 'study' | 'achievements' | 'history' | 'focus' | 'settings' | 'community' | 'admin' | 'multiplayer_lobby' | 'leaderboard' | 'join_pin' | 'onboarding' | 'not_found' | 'profile_view';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<QXNotification[]>([]);
  const [view, setView] = useState<ViewState>('landing');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeResults, setActiveResults] = useState<{answers: any[], score: number, points?: number} | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [initialCommunityQuizId, setInitialCommunityQuizId] = useState<number | null>(null);
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [achievementsDefinitions, setAchievementsDefinitions] = useState<Achievement[]>([]);
  const [notification, setNotification] = useState<{title: string, message: string, type?: string} | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'guidelines' | 'privacy' | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  const [language, setLanguage] = useState(() => {
      const browserLang = navigator.language;
      const supported = Object.keys(translations);
      if (supported.includes(browserLang)) return browserLang;
      const short = browserLang.split('-')[0];
      if (supported.includes(short)) return short;
      return 'en';
  });

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error || !profile) return null;
    
    // Check for Strike 2 suspension logic during init
    if (profile.warnings >= 2 && profile.suspended_until) {
      if (new Date(profile.suspended_until) > new Date()) {
        await supabase.auth.signOut();
        return null;
      }
    }

    return {
      id: profile.user_id,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      hasSeenTutorial: profile.has_seen_tutorial,
      stats: profile.stats || {},
      achievements: profile.achievements || [],
      history: profile.history || [],
      preferences: profile.preferences || {},
      savedQuizIds: profile.saved_quiz_ids || [],
      warnings: profile.warnings || 0
    } as User;
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkSupabaseConnection();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const userData = await fetchUserProfile(session.user.id);
          if (userData) {
            setUser(userData);
            // After user is set, check if we were heading to a deep link
            handleUrlRouting();
            if (view === 'landing') setView('home');
          } else {
            setView('auth');
          }
        }
      } catch (e) {
        console.error("Initialization Error", e);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    initializeApp();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUrlRouting = async () => {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const path = segments[0] || '';
    if (path === '' || path === 'index.html') return;

    if (path === 'community') {
      const quizId = segments[1];
      if (quizId && !isNaN(Number(quizId))) setInitialCommunityQuizId(Number(quizId));
      setView('community');
    } else if (path === 'profiles') {
      let identifier = segments[1];
      if (identifier) {
        if (identifier.startsWith('@')) {
          const username = decodeURIComponent(identifier.substring(1));
          const { data } = await supabase.from('profiles').select('user_id').ilike('username', username).maybeSingle();
          if (data) setTargetProfileId(data.user_id);
          else setView('not_found');
        } else {
          setTargetProfileId(identifier);
        }
        setView('profile_view');
      }
    }
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current = translations[language] || translations['en'];
    for (const key of keys) {
      if (current[key] !== undefined) current = current[key];
      else return keyPath;
    }
    return typeof current === 'string' ? current : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      <div className={`app-container theme-${user?.preferences?.appTheme || 'dark'}`}>
        {isLoading ? (
          <div className="min-h-screen bg-[#05010d] flex flex-col items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <Logo variant="large" className="mb-8" />
              <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Analyzing Infrastructure</p>
            </div>
          </div>
        ) : (
          <>
            <NotificationToast isVisible={showNotification} title={notification?.title || ''} message={notification?.message || ''} onClose={() => setShowNotification(false)} />
            <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onNavigate={(v) => setView(v as ViewState)} />
            {activeLegalModal && <LegalModal type={activeLegalModal} onClose={() => setActiveLegalModal(null)} />}

            <div className="view-container">
              {view === 'landing' && <LandingPage onGetStarted={() => setView('auth')} onExplore={() => setView('community')} onShowLegal={setActiveLegalModal} />}
              {view === 'auth' && <Auth onLogin={(u) => { setUser(u); setView('home'); }} onBackToLanding={() => setView('landing')} />}
              {view === 'home' && user && <QuizHome user={user} onLogout={() => { supabase.auth.signOut(); setUser(null); setView('landing'); }} quizzes={quizzes} savedQuizzes={savedQuizzes} notifications={notifications} onMarkNotificationRead={(id) => {}} onClearNotifications={() => {}} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} onStartStudy={(q) => { setActiveQuiz(q); setView('study'); }} onEditQuiz={(q) => { setActiveQuiz(q); setView('create'); }} onDeleteQuiz={(id) => {}} onCreateNew={() => { setActiveQuiz(null); setView('create'); }} onViewAchievements={() => setView('achievements')} onViewHistory={() => setView('history')} onStartFocus={() => setView('focus')} onExportQuiz={() => {}} onImportQuiz={() => {}} onViewCommunity={() => setView('community')} onOpenFeedback={() => setShowFeedbackModal(true)} onHostSession={() => {}} onJoinGame={() => setView('join_pin')} />}
              {view === 'take' && activeQuiz && <QuizTaker quiz={activeQuiz} user={user!} onComplete={() => setView('results')} onExit={() => setView('home')} />}
              {view === 'community' && <CommunityPage user={user} onBack={() => setView('home')} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} initialQuizId={initialCommunityQuizId} />}
              {view === 'profile_view' && targetProfileId && <PublicProfilePage userId={targetProfileId} onBack={() => setView('home')} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />}
              {view === 'history' && user && <HistoryPage user={user} onBack={() => setView('home')} />}
              {view === 'achievements' && user && <AchievementsPage user={user} onBack={() => setView('home')} definitions={achievementsDefinitions} />}
              {view === 'settings' && user && <SettingsPage user={user} onBack={() => setView('home')} onUpdateProfile={() => {}} />}
              {view === 'join_pin' && <JoinPinPage onBack={() => setView('home')} onJoin={(room) => { setActiveRoom(room); setView('multiplayer_lobby'); }} />}
              {view === 'not_found' && <NotFoundPage onGoHome={() => setView('landing')} />}
            </div>
            {/* Fixed: TypeScript comparison error on line 222. Since view is narrowed by !== 'take', view === 'take' is always false and caused a type error. Passing false directly as the component unmounts on 'take' anyway. */}
            {user && view !== 'take' && <PomodoroWidget stopAudio={false} />}
          </>
        )}
      </div>
    </LanguageContext.Provider>
  );
}
