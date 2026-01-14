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

const translations: Record<string, any> = { en, nl, de, fr, ja, ko, es, 'pt-BR': br, it, tr, 'zh-CN': zh };

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
  const [view, setView] = useState<ViewState>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'guidelines' | 'privacy' | null>(null);
  const [language, setLanguage] = useState('en');

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error || !profile) return null;

    // Correctly mapping Supabase profile to User type
    const mappedUser: User = {
      id: profile.user_id,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      hasSeenTutorial: profile.has_seen_tutorial,
      stats: profile.stats || {
        quizzesCreated: 0,
        quizzesPlayed: 0,
        questionsAnswered: 0,
        perfectScores: 0,
        studySessions: 0,
        aiQuizzesGenerated: 0,
        aiImagesGenerated: 0,
        totalPoints: 0
      },
      achievements: profile.achievements || [],
      history: profile.history || [],
      preferences: profile.preferences || {},
      savedQuizIds: profile.saved_quiz_ids || [],
      warnings: profile.warnings || 0
    };
    return mappedUser;
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
                    setView('home');
                } else {
                    // Logged in but profile record missing
                    setView('auth');
                }
            } else {
                setView('landing');
            }
        } catch (e) {
            console.error("Initialization error:", e);
            setView('landing');
        } finally {
            // Guaranteed timeout for visual polish
            setTimeout(() => setIsLoading(false), 800);
        }
    };
    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            const userData = await fetchUserProfile(session.user.id);
            setUser(userData);
            setView('home');
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setView('landing');
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

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
                {activeLegalModal && (
                    <LegalModal 
                        type={activeLegalModal} 
                        onClose={() => setActiveLegalModal(null)} 
                    />
                )}

                <div className="view-container">
                    {view === 'landing' && <LandingPage onGetStarted={() => setView('auth')} onExplore={() => setView('home')} onShowLegal={setActiveLegalModal} />}
                    {view === 'auth' && <Auth onLogin={(u) => { setUser(u); setView('home'); }} onBackToLanding={() => setView('landing')} />}
                    {view === 'home' && user && <QuizHome user={user} onLogout={() => supabase.auth.signOut()} quizzes={[]} savedQuizzes={[]} notifications={[]} onMarkNotificationRead={()=>{}} onClearNotifications={()=>{}} onStartQuiz={()=>{}} onStartStudy={()=>{}} onEditQuiz={()=>{}} onDeleteQuiz={()=>{}} onCreateNew={()=>{}} onViewAchievements={()=>{}} onViewHistory={()=>{}} onStartFocus={()=>{}} onExportQuiz={()=>{}} onImportQuiz={()=>{}} onViewCommunity={()=>{}} onOpenFeedback={()=>{}} onHostSession={()=>{}} onJoinGame={()=>{}} />}
                    {view === 'home' && !user && (
                        <div className="min-h-screen bg-[#05010d] flex items-center justify-center">
                             <Loader2 className="animate-spin text-indigo-500" />
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
    </LanguageContext.Provider>
  );
}

// Minimal loader for conditional fallbacks
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
