
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

type ViewState = 'landing' | 'auth' | 'home' | 'create' | 'take' | 'results' | 'study' | 'achievements' | 'history' | 'focus' | 'settings' | 'community' | 'admin' | 'multiplayer_lobby' | 'leaderboard' | 'join_pin' | 'onboarding' | 'not_found';

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
  }, []);

  // Analytics Tracking Effect
  useEffect(() => {
    const trackView = async () => {
      try {
        await supabase.from('site_analytics').insert({
          path: view,
          user_id: user?.id || null,
          is_guest: !user,
          user_agent: window.navigator.userAgent
        });
      } catch (e) {
        // Silently fail to not interrupt user experience
      }
    };
    trackView();
  }, [view, user?.id]);

  const handleUrlRouting = async () => {
      // Split path and filter out empty segments to handle trailing slashes and multiple slashes
      const segments = window.location.pathname.split('/').filter(Boolean);
      const path = segments[0] || '';
      
      // Root landing or internal server index
      if (path === '' || path === 'index.html') return;

      // Whitelist of valid state-based routes to allow reloads/direct navigation
      const validStates = ['home', 'community', 'leaderboard', 'achievements', 'history', 'settings', 'focus', 'admin'];
      if (validStates.includes(path)) {
          setView(path as ViewState);
          return;
      }

      // Explicit auth/utility routes
      if (path === 'login' || path === 'auth') {
          setView('auth');
          return;
      }

      if (path === 'code' || path === 'join') {
          setView('join_pin');
          return;
      }

      // Multiplayer PIN routing (direct PIN links) - Must be exactly 6 digits
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

      // If we got here and path isn't empty, it's an unrecognized route
      setView('not_found');
  };

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
        theme: q.theme, customTheme: q.custom_theme, shuffle_questions: q.shuffle_questions, backgroundMusic: q.background_music, visibility: q.visibility
      })));
    } catch (error) { console.error(error); }
  };

  const fetchNotifications = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
          if (!error && data) {
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
          setupRealtime(session.user.id);
        } else {
          setIsLoading(false);
        }
    };
    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
        fetchNotifications(session.user.id);
        setupRealtime(session.user.id);
      } else {
        setUser(null);
        setNotifications([]);
        setIsLoading(false);
        const segments = window.location.pathname.split('/').filter(Boolean);
        const path = segments[0] || '';
        if (path !== 'login' && path !== 'code' && path !== 'auth') {
          const publicViews = ['landing', 'auth', 'community', 'multiplayer_lobby', 'join_pin', 'not_found'];
          if (!publicViews.includes(view)) {
              setView('landing');
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [view]);

  const setupRealtime = (userId: string) => {
      const channel = supabase
        .channel(`notifications-stream-${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
            const n = payload.new as any;
            setNotifications(prev => [{
                id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type, isRead: n.is_read || false, createdAt: n.created_at
            }, ...prev]);
            setNotification({ title: n.title, message: n.message });
            setShowNotification(true);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      if (error) throw error;
      if (data) {
        const userData: User = {
          id: data.user_id, username: data.username || '', email: email, avatarUrl: data.avatar_url,
          stats: data.stats || DEFAULT_STATS, achievements: data.achievements || [], history: data.history || [], 
          preferences: data.preferences, savedQuizIds: data.saved_quiz_ids || [],
          hasSeenTutorial: data.has_seen_tutorial,
          warnings: data.warnings || 0
        };
        setUser(userData);
        fetchQuizzes(userId);
        
        // Refined Onboarding Check: Only force onboarding if the username is missing or a placeholder 'user_' 
        // We removed the email prefix check because that's a valid intentional username choice for email signups.
        const isDefaultUsername = !data.username || data.username.startsWith('user_');
        
        if (isDefaultUsername) {
            setView('onboarding');
        } else if (['landing', 'auth', 'onboarding'].includes(view)) {
            setView('home');
        }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const refreshProfile = async () => {
      if (!user) return;
      await fetchProfile(user.id, user.email);
  };

  const handleStatUpdate = (type: keyof UserStats, increment: number = 1) => {
    if (!user) return;
    const newStats = { ...user.stats, [type]: (user.stats[type] || 0) + increment };
    const updatedUser = { ...user, stats: newStats };
    persistUser(updatedUser);
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

  const handleSaveQuiz = async (quiz: Quiz) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const quizPayload = {
        user_id: user.id,
        title: quiz.title,
        questions: quiz.questions,
        theme: quiz.theme,
        custom_theme: quiz.customTheme,
        shuffle_questions: quiz.shuffleQuestions,
        background_music: quiz.backgroundMusic,
        visibility: quiz.visibility || 'private'
      };

      if (activeQuiz && activeQuiz.id === quiz.id) {
        const { error } = await supabase.from('quizzes').update(quizPayload).eq('id', quiz.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quizzes').insert(quizPayload);
        if (error) throw error;
      }
      
      await fetchQuizzes(user.id);
      setView('home');
    } catch (e: any) {
      alert("Save failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm("Are you sure? This will permanently decommission this module and all its data.")) return;
    
    setIsLoading(true);
    try {
      await supabase.from('ratings').delete().eq('quiz_id', id);
      await supabase.from('comments').delete().eq('quiz_id', id);
      await supabase.from('likes').delete().eq('quiz_id', id);
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (e: any) {
      alert("Purge Failure: " + (e.message || "Sync error."));
    } finally {
      setIsLoading(false);
    }
  };

  const generateUniquePin = async (): Promise<string> => {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const { data } = await supabase.from('rooms').select('pin').eq('pin', pin).maybeSingle();
      if (data) return generateUniquePin();
      return pin;
  };

  const handleStartHost = async (quiz: Quiz) => {
      const pin = await generateUniquePin();
      const { data: room, error } = await supabase.from('rooms').insert({
          pin, host_id: user?.id, quiz_id: quiz.id, status: 'waiting'
      }).select().single();
      
      if (!error && room) {
          setActiveQuiz(quiz);
          setActiveRoom({
              id: room.id, pin: room.pin, hostId: room.host_id, quizId: room.quiz_id,
              status: room.status as any, currentQuestionIndex: room.current_question_index, createdAt: room.created_at
          });
          setView('multiplayer_lobby');
      }
  };

  const cleanupRoom = async () => {
      if (activeRoom) {
          await supabase.from('rooms').delete().eq('id', activeRoom.id);
          setActiveRoom(null);
      }
  };

  const renderContent = () => {
      if (dbError) return <div className="p-20 text-center text-red-500 font-bold">{dbError}</div>;
      if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-indigo-600 animate-pulse text-2xl tracking-tighter">Quiviex...</div>;
      
      const publicViews = ['landing', 'auth', 'community', 'multiplayer_lobby', 'join_pin', 'not_found'];
      if (!user && !publicViews.includes(view)) {
          return <LandingPage onGetStarted={() => setView('auth')} onExplore={() => setView('community')} onJoinGame={() => setView('join_pin')} onShowLegal={(type) => setActiveLegalModal(type)} />;
      }
      
      switch(view) {
          case 'home': return <QuizHome quizzes={quizzes} savedQuizzes={savedQuizzes} user={user!} notifications={notifications} onMarkNotificationRead={(id) => {}} onClearNotifications={() => {}} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} onStartStudy={(q) => { setActiveQuiz(q); handleStatUpdate('studySessions'); setView('study'); }} onCreateNew={() => { setActiveQuiz(null); setView('create'); }} onEditQuiz={(q) => { setActiveQuiz(q); setView('create'); }} onDeleteQuiz={handleDeleteQuiz} onLogout={async () => { await supabase.auth.signOut(); setView('landing'); }} onViewAchievements={() => setView('achievements')} onViewHistory={() => setView('history')} onStartFocus={() => setView('focus')} onViewSettings={() => setView('settings')} onExportQuiz={(q) => exportQuizToQZX(q)} onImportQuiz={() => {}} onViewCommunity={() => setView('community')} onOpenFeedback={() => setShowFeedbackModal(true)} onViewAdmin={() => setView('admin')} onHostSession={handleStartHost} onViewLeaderboard={() => setView('leaderboard')} onJoinGame={() => setView('join_pin')} />;
          case 'create': return <QuizCreator initialQuiz={activeQuiz} currentUser={user!} onSave={handleSaveQuiz} onExit={() => setView('home')} startWithTutorial={!user!.hasSeenTutorial} onTutorialComplete={() => persistUser({...user!, hasSeenTutorial: true})} onStatUpdate={(type) => { if(type === 'create') handleStatUpdate('quizzesCreated'); if(type === 'ai_img') handleStatUpdate('aiImagesGenerated'); if(type === 'ai_quiz') handleStatUpdate('aiQuizzesGenerated'); }} onOpenSettings={() => setView('settings')} onRefreshProfile={refreshProfile} />;
          case 'auth': return <Auth onLogin={() => {}} onBackToLanding={() => setView('landing')} onJoinGame={() => setView('join_pin')} />;
          case 'onboarding': return user ? <UsernameSetup email={user.email} onComplete={(u) => { persistUser({...user, username: u}); setView('home'); }} onCancel={() => supabase.auth.signOut()} /> : null;
          case 'multiplayer_lobby': return <MultiplayerLobby room={activeRoom!} user={user} onBack={() => { cleanupRoom(); setView('home'); }} onStart={(quiz) => { setActiveQuiz(quiz); setView('take'); }} />;
          case 'join_pin': return <JoinPinPage onBack={() => user ? setView('home') : setView('landing')} onJoin={(room) => { setActiveRoom(room); setView('multiplayer_lobby'); }} />;
          case 'leaderboard': return <LeaderboardPage user={user!} onBack={() => setView('home')} />;
          case 'take': return activeQuiz ? <QuizTaker quiz={activeQuiz} room={activeRoom || undefined} user={user || undefined} onComplete={(answers, score, points) => { if(activeRoom) cleanupRoom(); setActiveResults({answers, score, points}); setView('results'); handleStatUpdate('quizzesPlayed'); if(points) handleStatUpdate('totalPoints', points); }} onExit={() => { if(activeRoom) cleanupRoom(); setView('home'); }} /> : null;
          case 'results': return activeQuiz && activeResults ? <QuizResults quiz={activeQuiz} userAnswers={activeResults.answers} score={activeResults.score} points={activeResults.points} onPlayAgain={() => setView('take')} onHome={() => setView('home')} /> : null;
          case 'achievements': return <AchievementsPage user={user!} definitions={achievementsDefinitions} onBack={() => setView('home')} />;
          case 'history': return <HistoryPage user={user!} onBack={() => setView('home')} />;
          case 'focus': return <FocusMode user={user!} quizzes={quizzes} onBack={() => setView('home')} onStartQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />;
          case 'settings': return <SettingsPage user={user!} onBack={() => setView('home')} onUpdateProfile={(p: any) => persistUser({...user!, ...p})} onExportAll={() => exportAllQuizzesToZip(quizzes)} onDeleteAccount={() => {}} />;
          case 'community': return <CommunityPage user={user} onBack={() => user ? setView('home') : setView('landing')} onPlayQuiz={(q) => { setActiveQuiz(q); setView('take'); }} />;
          case 'admin': return <AdminDashboard onBack={() => setView('home')} />;
          case 'landing': return <LandingPage onGetStarted={() => setView('auth')} onExplore={() => setView('community')} onJoinGame={() => setView('join_pin')} onShowLegal={(type) => setActiveLegalModal(type)} />;
          case 'not_found': return <NotFoundPage onGoHome={() => setView(user ? 'home' : 'landing')} />; // Render 404
          default: return <div className="p-20 text-center font-bold">Initializing...</div>;
      }
  };

  const theme = (user && THEMES[user?.preferences?.appTheme || 'light']) || THEMES.light;
  return (
    <div className={`min-h-screen transition-all duration-500 bg-gradient-to-br ${theme.gradient} ${theme.text}`}>
        <NotificationToast title={notification?.title || ''} message={notification?.message || ''} isVisible={showNotification} onClose={() => setShowNotification(false)} />
        {showFeedbackModal && user && <FeedbackModal user={user} onClose={() => setShowFeedbackModal(false)} onSubmit={async (f) => {}} />}
        {activeLegalModal && <LegalModal type={activeLegalModal} onClose={() => setActiveLegalModal(null)} />}
        <div key={view} className="view-transition">
          {renderContent()}
        </div>
    </div>
  );
}
