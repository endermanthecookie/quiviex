
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

  useEffect(() => {
    // FIX FOR HANGING LOAD: Robust async sequence with guaranteed setIsLoading(false)
    const initializeApp = async () => {
        try {
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3500));
            const initPromise = (async () => {
                await checkSupabaseConnection();
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
                    if (profile) {
                        // Transform profile to User type here...
                        setView('home');
                    }
                }
            })();

            await Promise.race([initPromise, timeoutPromise]);
        } catch (e) {
            console.error("Init Error", e);
        } finally {
            setIsLoading(false);
        }
    };
    initializeApp();
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
                    <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-xs">Initializing Infrastructure</p>
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
                    {view === 'auth' && <Auth onLogin={() => setView('home')} onBackToLanding={() => setView('landing')} />}
                    {view === 'home' && <QuizHome user={user as any} onLogout={() => setView('landing')} quizzes={[]} savedQuizzes={[]} notifications={[]} onMarkNotificationRead={()=>{}} onClearNotifications={()=>{}} onStartQuiz={()=>{}} onStartStudy={()=>{}} onEditQuiz={()=>{}} onDeleteQuiz={()=>{}} onCreateNew={()=>{}} onViewAchievements={()=>{}} onViewHistory={()=>{}} onStartFocus={()=>{}} onExportQuiz={()=>{}} onImportQuiz={()=>{}} onViewCommunity={()=>{}} onOpenFeedback={()=>{}} onHostSession={()=>{}} onJoinGame={()=>{}} />}
                </div>
            </>
        )}
      </div>
    </LanguageContext.Provider>
  );
}
