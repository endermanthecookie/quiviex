import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, User, UserStats, Achievement, Feedback } from './types';
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
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { THEMES } from './constants';
import { NotificationToast } from './components/NotificationToast';
import { FeedbackModal } from './components/FeedbackModal';
import { LegalModal } from './components/LegalModal';
import { exportQuizToQZX, exportAllQuizzesToZip } from './services/exportService';
import { supabase, checkSupabaseConnection } from './services/supabase';
import { AlertTriangle } from 'lucide-react';

type ViewState = 'landing' | 'auth' | 'home' | 'create' | 'take' | 'results' | 'study' | 'achievements' | 'history' | 'focus' | 'settings' | 'community' | 'admin';

const DEFAULT_STATS: UserStats = {
  quizzesCreated: 0,
  quizzesPlayed: 0,
  questionsAnswered: 0,
  perfectScores: 0,
  studySessions: 0,
  aiQuizzesGenerated: 0,
  aiImagesGenerated: 0
};

const FONT_STORAGE_BASE = 'https://ulkabycvuxyrwtkbwhid.supabase.co/storage/v1/object/public/Fonts%20Quiviex';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeResults, setActiveResults] = useState<{answers: any[], score: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [achievementsDefinitions, setAchievementsDefinitions] = useState<Achievement[]>([]);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'guidelines' | 'privacy' | null>(null);
  const [verifiedFonts, setVerifiedFonts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const runFontAudit = async () => {
      const available = new Set<string>();
      const checkPromises = Array.from({ length: 16 }, (_, i) => {
        const fontIndex = i + 1;
        const fontName = `Font${fontIndex}`;
        const fileName = `${fontIndex}.ttf`;
        const fontUrl = `${FONT_STORAGE_BASE}/${fileName}`;
        return fetch(fontUrl, { method: 'HEAD', cache: 'no-cache' })
          .then(response => { if (response.ok) available.add(fontName); })
          .catch(() => {});
      });
      await Promise.all(checkPromises);
      setVerifiedFonts(available);
    };
    runFontAudit();
  }, []);

  useEffect(() => {
    checkSupabaseConnection().then(res => {
        if (!res.connected) setDbError(res.error);
    });
    fetchAchievementDefinitions();
  }, []);

  useEffect(() => {
    const applyFont = async () => {
        const body = (window as any).document.body;
        const fontId = user?.preferences?.appFont;
        if (fontId && fontId.startsWith('Font')) {
            const fontIndex = fontId.replace('Font', '');
            const fontUrl = `${FONT_STORAGE_BASE}/${fontIndex}.ttf`;
            if (!verifiedFonts.has(fontId) && verifiedFonts.size > 0) {
                body.style.fontFamily = `'QuiviexCustom', 'Plus Jakarta Sans', sans-serif`;
                return;
            }
            try {
                const customFontFace = new FontFace(fontId, `url(${fontUrl})`);
                const loadedFont = await customFontFace.load();
                (window as any).document.fonts.add(loadedFont);
                body.style.fontFamily = `'${fontId}', 'QuiviexCustom', 'Plus Jakarta Sans', sans-serif`;
            } catch (error) {
                body.style.fontFamily = `'QuiviexCustom', 'Plus Jakarta Sans', sans-serif`;
            }
        } else if (fontId) {
            body.style.fontFamily = `'${fontId}', 'QuiviexCustom', 'Plus Jakarta Sans', sans-serif`;
        } else {
            body.style.fontFamily = `'QuiviexCustom', 'Plus Jakarta Sans', sans-serif`;
        }
    };
    applyFont();
  }, [user?.preferences?.appFont, verifiedFonts]);

  const fetchAchievementDefinitions = async () => {
    try {
      const { data, error } = await supabase.from('achievement_definitions').select('*').order('id', { ascending: true });
      if (error) throw error;
      setAchievementsDefinitions(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchQuizzes = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('quizzes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setQuizzes(data.map((q: any) => ({
        id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
        theme: q.theme, customTheme: q.custom_theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music, visibility: q.visibility
      })));
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const handleAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetchProfile(session.user.id, session.user.email || '');
          setView('home');
        } else {
          setIsLoading(false);
        }
    };
    handleAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
        setView('home');
      } else {
        setUser(null);
        setIsLoading(false);
        if (view !== 'landing') setView('landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (error) throw error;
      if (data) {
        const achievementsList: string[] = Array.isArray(data.achievements) ? data.achievements.map((id: any) => id.toString()) : [];
        setUser({
          id: data.user_id, username: data.username || email.split('@')[0], email: email, avatarUrl: data.avatar_url,
          stats: data.stats || DEFAULT_STATS, achievements: achievementsList, history: data.history || [], preferences: data.preferences, savedQuizIds: data.saved_quiz_ids || [] 
        });
        fetchQuizzes(userId);
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleStatUpdate = (type: keyof UserStats) => {
    if (!user) return;
    const newStats = { ...user.stats, [type]: (user.stats[type] || 0) + 1 };
    const updatedUser = { ...user, stats: newStats };
    persistUser(updatedUser);
    checkAchievements(updatedUser);
  };

  const checkAchievements = async (currentUser: User) => {
    if (achievementsDefinitions.length === 0) return;
    const currentUnlocked = new Set(currentUser.achievements);
    const newUnlocked: string[] = [];
    let hasNew = false;
    for (const definition of achievementsDefinitions) {
        if (currentUnlocked.has(definition.id)) continue;
        const userValue = currentUser.stats[definition.req_type] || 0;
        if (userValue >= definition.req_value) {
            newUnlocked.push(definition.id);
            hasNew = true;
            setNotification({ title: definition.title, message: definition.description });
            setShowNotification(true);
        }
    }
    if (hasNew) {
        try {
            const updatedAchievements = [...currentUser.achievements, ...newUnlocked];
            setUser({ ...currentUser, achievements: updatedAchievements });
            await supabase.from('profiles').update({ achievements: updatedAchievements }).eq('user_id', currentUser.id);
        } catch (e) { console.error(e); }
    }
  };

  const persistUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await supabase.from('profiles').update({
        username: updatedUser.username, stats: updatedUser.stats, history: updatedUser.history,
        preferences: updatedUser.preferences, saved_quiz_ids: updatedUser.savedQuizIds, avatar_url: updatedUser.avatarUrl, updated_at: new Date().toISOString()
      }).eq('user_id', updatedUser.id);
    } catch (error) { console.error(error); }
  };

  const handleFeedbackSubmit = async (feedback: any) => {
      const { error } = await supabase.from('feedback').insert({
          id: feedback.id, user_id: user?.id, username: user?.username, type: feedback.type, content: feedback.content, status: 'new'
      });
      if (error) throw error;
  };

  const renderContent = () => {
      if (dbError) return (
          <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50">
              <AlertTriangle size={64} className="text-red-500 mb-6" />
              <h1 className="text-3xl font-black text-red-900">Database Connection Failed</h1>
              <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-8 py-3 rounded-xl font-bold">Retry</button>
          </div>
      );
      if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse">Quiviex...</div>;
      
      if (!user) {
        if (view === 'auth') return <Auth onLogin={() => {}} onBackToLanding={() => setView('landing')} />;
        return <LandingPage onGetStarted={() => setView('auth')} onExplore={() => setView('community')} onShowLegal={(type) => setActiveLegalModal(type)} />;
      }
      
      switch(view) {
          case 'home': return <QuizHome quizzes={quizzes} savedQuizzes={savedQuizzes} user={user} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} onStartStudy={(q) => { setActiveQuiz(q); handleStatUpdate('studySessions'); setView('study'); }} onCreateNew={() => setView('create')} onEditQuiz={(q) => { setView('create'); }} onDeleteQuiz={async (id) => { if(confirm('Delete?')){ await supabase.from('quizzes').delete().eq('id', id); fetchQuizzes(user.id); } }} onLogout={async () => { await supabase.auth.signOut(); setView('landing'); }} onViewAchievements={() => setView('achievements')} onViewHistory={() => setView('history')} onStartFocus={() => setView('focus')} onViewSettings={() => setView('settings')} onExportQuiz={(q) => exportQuizToQZX(q)} onImportQuiz={() => {}} onViewCommunity={() => setView('community')} onOpenFeedback={() => setShowFeedbackModal(true)} />;
          case 'create': return <QuizCreator initialQuiz={activeQuiz} currentUser={user} onSave={async (q) => { await supabase.from('quizzes').upsert({ user_id: user.id, ...q }); fetchQuizzes(user.id); setView('home'); }} onExit={() => setView('home')} startWithTutorial={!user.hasSeenTutorial} onStatUpdate={(type) => handleStatUpdate(type === 'create' ? 'quizzesCreated' : type === 'ai_quiz' ? 'aiQuizzesGenerated' : 'aiImagesGenerated')} onOpenSettings={() => setView('settings')} />;
          case 'take': return activeQuiz ? <QuizTaker quiz={activeQuiz} onComplete={(answers, score) => { setActiveResults({answers, score}); setView('results'); handleStatUpdate('quizzesPlayed'); }} onExit={() => setView('home')} /> : null;
          case 'results': return activeQuiz && activeResults ? <QuizResults quiz={activeQuiz} userAnswers={activeResults.answers} score={activeResults.score} onPlayAgain={() => setView('take')} onHome={() => setView('home')} /> : null;
          case 'study': return activeQuiz ? <FlashcardViewer quiz={activeQuiz} onExit={() => setView('home')} /> : null;
          case 'achievements': return <AchievementsPage user={user} definitions={achievementsDefinitions} onBack={() => setView('home')} />;
          case 'history': return <HistoryPage user={user} onBack={() => setView('home')} />;
          case 'focus': return <FocusMode user={user} quizzes={quizzes} onBack={() => setView('home')} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />;
          case 'settings': return <SettingsPage user={user} onBack={() => setView('home')} onUpdateProfile={(p: any) => persistUser({...user, ...p})} onExportAll={() => exportAllQuizzesToZip(quizzes)} />;
          case 'community': return <CommunityPage user={user} onBack={() => user ? setView('home') : setView('landing')} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />;
          default: return <div className="p-20 text-center font-bold">Initializing View...</div>;
      }
  };

  const theme = (user && THEMES[user?.preferences?.appTheme || 'light']) || THEMES.light;
  return (
    <div className={`min-h-screen transition-all duration-500 bg-gradient-to-br ${theme.gradient} ${theme.text}`}>
        <NotificationToast title={notification?.title || ''} message={notification?.message || ''} isVisible={showNotification} onClose={() => setShowNotification(false)} />
        {showFeedbackModal && user && (
            <FeedbackModal
                user={user}
                onClose={() => setShowFeedbackModal(false)}
                onSubmit={handleFeedbackSubmit}
            />
        )}
        {activeLegalModal && (
            <LegalModal 
              type={activeLegalModal === 'terms' ? 'terms' : 'guidelines'} 
              onClose={() => setActiveLegalModal(null)} 
            />
        )}
        {renderContent()}
    </div>
  );
}