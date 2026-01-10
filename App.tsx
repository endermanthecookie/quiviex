import React, { useState, useEffect } from 'react';
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
import { exportQuizToQZX, exportAllQuizzesToZip } from './services/exportService';
import { supabase, checkSupabaseConnection } from './services/supabase';

type ViewState = 'landing' | 'auth' | 'home' | 'create' | 'take' | 'results' | 'study' | 'achievements' | 'history' | 'focus' | 'settings' | 'community' | 'admin' | 'multiplayer_lobby' | 'leaderboard' | 'join_pin' | 'onboarding' | 'not_found' | 'profile_view';

const DEFAULT_STATS: UserStats = {
  quizzesCreated: 0,
  quizzesPlayed: 0,
  questionsAnswered: 0,
  perfectScores: 0,
  studySessions: 0,
  aiQuizzesGenerated: 0,
  aiImagesGenerated: 0,
  totalPoints: 0
};

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
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'guidelines' | 'privacy' | null>(null);

  useEffect(() => {
    checkSupabaseConnection().then(res => {
        if (!res.connected) setDbError(res.error);
    });
    fetchAchievementDefinitions();
    handleUrlRouting();
    
    // Handle back button
    window.onpopstate = () => {
        handleUrlRouting();
    };
  }, []);

  const safePushState = (path: string) => {
      try {
          window.history.pushState(null, '', path);
      } catch (e) {
          // Ignore security errors in sandboxed environments (e.g. blobs)
          console.debug("History pushState blocked in this environment");
      }
  };

  const handleUrlRouting = async () => {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const path = segments[0] || '';
      
      // Basic check to see if we are in a blob environment or similar that might return weird paths
      if (window.location.protocol === 'blob:') return;

      if (path === '' || path === 'index.html') return;

      if (path === 'community') {
          const quizId = segments[1];
          if (quizId && !isNaN(Number(quizId))) {
              setInitialCommunityQuizId(Number(quizId));
          }
          setView('community');
          return;
      }

      if (path === 'profiles') {
          const profileId = segments[1];
          if (profileId) {
              setTargetProfileId(profileId);
              setView('profile_view');
              return;
          }
      }

      const validStates = ['home', 'community', 'leaderboard', 'achievements', 'history', 'settings', 'focus', 'admin'];
      if (validStates.includes(path)) {
          setView(path as ViewState);
          return;
      }

      if (path === 'login' || path === 'auth') {
          setView('auth');
          return;
      }

      if (path === 'code' || path === 'join') {
          setView('join_pin');
          return;
      }

      if (path.length === 6 && /^\d+$/.test(path)) {
          const { data: room } = await supabase.from('rooms').select('*').eq('pin', path).eq('status', 'waiting').single();
          if (room) {
              setActiveRoom({
                  id: room.id, pin: room.pin, hostId: room.host_id, quizId: room.quiz_id,
                  status: room.status as any, currentQuestionIndex: room.current_question_index, createdAt: room.created_at
              });
              setView('multiplayer_lobby');
              return;
          }
      }
      setView('not_found');
  };

  const fetchAchievementDefinitions = async () => {
    try {
      const { data } = await supabase.from('achievement_definitions').select('*').order('id', { ascending: true });
      if (data) setAchievementsDefinitions(data);
    } catch (e) { console.error(e); }
  };

  const fetchQuizzes = async (userId: string) => {
    try {
      const { data } = await supabase.from('quizzes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) setQuizzes(data.map((q: any) => ({
        id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
        theme: q.theme, customTheme: q.custom_theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music, visibility: q.visibility
      })));
    } catch (error) { console.error(error); }
  };

  const fetchNotifications = async (userId: string) => {
      try {
          const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          if (data) {
              setNotifications(data.map((n: any) => ({
                  id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at
              })));
          }
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const handleAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchProfile(session.user.id, session.user.email || '');
          fetchNotifications(session.user.id);
        } else {
          setIsLoading(false);
        }
    };
    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
        fetchNotifications(session.user.id);
      } else {
        setUser(null);
        setNotifications([]);
        setIsLoading(false);
        const segments = window.location.pathname.split('/').filter(Boolean);
        // Only redirect to landing if we are not on a public route
        if (segments[0] !== 'login' && segments[0] !== 'code' && segments[0] !== 'auth' && segments[0] !== 'community' && segments[0] !== 'profiles') {
          const publicViews = ['landing', 'auth', 'community', 'multiplayer_lobby', 'join_pin', 'not_found', 'profile_view'];
          if (!publicViews.includes(view)) setView('landing');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [view]);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (!error && data) {
        const userData: User = {
          id: data.user_id, username: data.username || '', email: email, avatarUrl: data.avatar_url,
          stats: data.stats || DEFAULT_STATS, achievements: data.achievements || [], history: data.history || [], 
          preferences: data.preferences, savedQuizIds: data.saved_quiz_ids || [],
          hasSeenTutorial: data.has_seen_tutorial,
          warnings: data.warnings || 0
        };
        setUser(userData);
        fetchQuizzes(userId);
        
        const isNewAccount = !data.username || data.username.startsWith('user_');
        if (isNewAccount) {
            setView('onboarding');
        } else if (['landing', 'auth', 'onboarding'].includes(view)) {
            setView('home');
        }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleStatUpdate = (type: 'create' | 'ai_img' | 'ai_quiz') => {
    if (!user) return;
    const updatedStats = { ...user.stats };
    if (type === 'create') updatedStats.quizzesCreated++;
    if (type === 'ai_img') updatedStats.aiImagesGenerated++;
    if (type === 'ai_quiz') updatedStats.aiQuizzesGenerated++;
    persistUser({ ...user, stats: updatedStats });
  };

  const handleHostSession = async (quiz: Quiz) => {
    if (!user) return;
    setIsLoading(true);
    try {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const { data: room, error } = await supabase.from('rooms').insert({
            pin,
            host_id: user.id,
            quiz_id: quiz.id,
            status: 'waiting'
        }).select().single();

        if (error) throw error;
        
        setActiveRoom({
            id: room.id, pin: room.pin, hostId: room.host_id, quizId: room.quiz_id,
            status: room.status as any, currentQuestionIndex: room.current_question_index, createdAt: room.created_at
        });
        setView('multiplayer_lobby');
    } catch (e: any) {
        alert("Host error: " + e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const persistUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await supabase.from('profiles').update({
        username: updatedUser.username, stats: updatedUser.stats, history: updatedUser.history,
        preferences: updatedUser.preferences, saved_quiz_ids: updatedUser.savedQuizIds, 
        avatar_url: updatedUser.avatarUrl, has_seen_tutorial: updatedUser.hasSeenTutorial, 
        updated_at: new Date().toISOString()
      }).eq('user_id', updatedUser.id);
    } catch (error) { console.error(error); }
  };

  const handleFeedbackSubmit = async (feedback: Feedback) => {
    try {
        const { error } = await supabase.from('feedback').insert({
            user_id: feedback.userId,
            username: feedback.username,
            type: feedback.type,
            content: feedback.content,
            status: feedback.status
        });
        if (error) throw error;
    } catch (e: any) {
        console.error("Feedback submission error:", e);
        throw e;
    }
  };

  const renderContent = () => {
      if (dbError) return <div className="p-20 text-center text-red-500 font-bold">{dbError}</div>;
      if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-2xl tracking-tighter">Quiviex...</div>;
      
      const publicViews = ['landing', 'auth', 'community', 'multiplayer_lobby', 'join_pin', 'not_found', 'profile_view'];
      if (!user && !publicViews.includes(view)) {
          return <LandingPage 
            onGetStarted={() => { safePushState('/login'); setView('auth'); }} 
            onExplore={() => { safePushState('/community'); setView('community'); }} 
            onJoinGame={() => { safePushState('/join'); setView('join_pin'); }} 
            onShowLegal={(type) => setActiveLegalModal(type)} 
          />;
      }
      
      switch(view) {
          case 'home': return <QuizHome quizzes={quizzes} savedQuizzes={savedQuizzes} user={user!} notifications={notifications} onMarkNotificationRead={() => {}} onClearNotifications={() => {}} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} onStartStudy={(q) => { setActiveQuiz(q); setView('study'); }} onCreateNew={() => { setActiveQuiz(null); setView('create'); }} onEditQuiz={(q) => { setActiveQuiz(q); setView('create'); }} onDeleteQuiz={() => {}} onLogout={async () => { await supabase.auth.signOut(); safePushState('/'); setView('landing'); }} onViewAchievements={() => setView('achievements')} onViewHistory={() => setView('history')} onStartFocus={() => setView('focus')} onViewSettings={() => setView('settings')} onExportQuiz={(q) => exportQuizToQZX(q)} onImportQuiz={() => {}} onViewCommunity={() => { safePushState('/community'); setView('community'); }} onOpenFeedback={() => setShowFeedbackModal(true)} onViewAdmin={() => setView('admin')} onHostSession={handleHostSession} onViewLeaderboard={() => setView('leaderboard')} onJoinGame={() => { safePushState('/join'); setView('join_pin'); }} />;
          case 'create': return <QuizCreator initialQuiz={activeQuiz} currentUser={user!} onSave={(q) => { setView('home'); }} onExit={() => setView('home')} startWithTutorial={!user!.hasSeenTutorial} onOpenSettings={() => setView('settings')} onStatUpdate={handleStatUpdate} onRefreshProfile={() => fetchProfile(user!.id, user!.email)} />;
          case 'auth': return <Auth onLogin={() => {}} onBackToLanding={() => { safePushState('/'); setView('landing'); }} onJoinGame={() => { safePushState('/join'); setView('join_pin'); }} />;
          case 'onboarding': return user ? <UsernameSetup email={user.email} onComplete={(u) => { persistUser({...user, username: u}); setView('home'); }} onCancel={() => supabase.auth.signOut()} /> : null;
          case 'multiplayer_lobby': return <MultiplayerLobby room={activeRoom!} user={user} onBack={() => setView('home')} onStart={(quiz) => { setActiveQuiz(quiz); setView('take'); }} />;
          case 'join_pin': return <JoinPinPage onBack={() => { if (user) { setView('home'); safePushState('/'); } else { setView('landing'); safePushState('/'); } }} onJoin={(room) => { setActiveRoom(room); setView('multiplayer_lobby'); }} />;
          case 'leaderboard': return <LeaderboardPage user={user!} onBack={() => setView('home')} />;
          case 'profile_view': return <PublicProfilePage userId={targetProfileId!} onBack={() => { if (user) { setView('home'); safePushState('/'); } else { setView('landing'); safePushState('/'); } }} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />;
          case 'take': return activeQuiz ? <QuizTaker quiz={activeQuiz} room={activeRoom || undefined} user={user || undefined} onComplete={(answers, score, points) => { setActiveResults({answers, score, points}); setView('results'); }} onExit={() => setView('home')} /> : null;
          case 'results': return activeQuiz && activeResults ? <QuizResults quiz={activeQuiz} userAnswers={activeResults.answers} score={activeResults.score} points={activeResults.points} onPlayAgain={() => setView('take')} onHome={() => setView('home')} /> : null;
          case 'achievements': return <AchievementsPage user={user!} definitions={achievementsDefinitions} onBack={() => setView('home')} />;
          case 'history': return <HistoryPage user={user!} onBack={() => setView('home')} />;
          case 'focus': return <FocusMode user={user!} quizzes={quizzes} onBack={() => setView('home')} onStartQuiz={(quiz) => { setActiveQuiz(quiz); setView('take'); }} />;
          case 'settings': return <SettingsPage user={user!} onBack={() => setView('home')} onUpdateProfile={(p: any) => persistUser({...user!, ...p})} onExportAll={() => exportAllQuizzesToZip(quizzes)} onDeleteAccount={() => {}} />;
          case 'community': return <CommunityPage user={user} onBack={() => { if (user) { setView('home'); safePushState('/'); } else { setView('landing'); safePushState('/'); } }} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} initialQuizId={initialCommunityQuizId} />;
          case 'admin': return <AdminDashboard onBack={() => setView('home')} onEditQuiz={(q) => { setActiveQuiz(q); setView('create'); }} />;
          case 'landing': return <LandingPage 
            onGetStarted={() => { safePushState('/login'); setView('auth'); }} 
            onExplore={() => { safePushState('/community'); setView('community'); }} 
            onJoinGame={() => { safePushState('/join'); setView('join_pin'); }} 
            onShowLegal={(type) => setActiveLegalModal(type)} 
          />;
          case 'not_found': return <NotFoundPage onGoHome={() => { safePushState('/'); setView(user ? 'home' : 'landing'); }} />;
          default: return <div className="p-20 text-center font-bold">Initializing...</div>;
      }
  };

  const theme = (user && THEMES[user?.preferences?.appTheme || 'light']) || THEMES.light;
  return (
    <div className={`min-h-screen transition-all duration-500 bg-gradient-to-br ${theme.gradient} ${theme.text}`}>
        <NotificationToast title={notification?.title || ''} message={notification?.message || ''} isVisible={showNotification} onClose={() => setShowNotification(false)} />
        {showFeedbackModal && user && <FeedbackModal user={user} onClose={() => setShowFeedbackModal(false)} onSubmit={handleFeedbackSubmit} />}
        {activeLegalModal && <LegalModal type={activeLegalModal} onClose={() => setActiveLegalModal(null)} />}
        <div key={view} className="view-transition">
          {renderContent()}
        </div>
    </div>
  );
}