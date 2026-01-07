import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, User, UserStats, Feedback, QuizVisibility } from './types';
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
import { OAuthCallback } from './components/OAuthCallback';
import { AdminDashboard } from './components/AdminDashboard';
import { FeedbackModal } from './components/FeedbackModal';
import { UsernameSetup } from './components/UsernameSetup';
import { ACHIEVEMENTS, THEMES } from './constants';
import { NotificationToast } from './components/NotificationToast';
import { exportQuizToQZX, exportAllQuizzesToZip } from './services/exportService';
import { supabase, checkSupabaseConnection } from './services/supabase';
import { MessageSquare, Globe, AlertTriangle } from 'lucide-react';
import { LegalModal } from './components/LegalModal';

type ViewState = 'home' | 'create' | 'take' | 'results' | 'study' | 'achievements' | 'history' | 'focus' | 'settings' | 'community' | 'admin';

const DEFAULT_STATS: UserStats = {
  quizzesCreated: 0,
  quizzesPlayed: 0,
  questionsAnswered: 0,
  perfectScores: 0,
  studySessions: 0,
  aiQuizzesGenerated: 0,
  aiImagesGenerated: 0
};

const SUDO_EMAIL = 'sudo@quiviex.com';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingOAuthUser, setPendingOAuthUser] = useState<{id: string, email: string} | null>(null);

  const [view, setView] = useState<ViewState>('home');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [startTutorial, setStartTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const currentPath = (window as any).location.pathname.toLowerCase().replace(/\/$/, '');
  const [showRedirectCallback, setShowRedirectCallback] = useState(currentPath === '/redirect');
  const [showTermsPage, setShowTermsPage] = useState(currentPath === '/t&c');

  const [deepLinkQuizId, setDeepLinkQuizId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const getGlobalStyle = () => {
      let style: React.CSSProperties = {};
      let className = "text-slate-900";

      if (user?.preferences?.appTheme) {
          if (user.preferences.appTheme === 'custom' && user.preferences.customThemeData) {
              const ct = user.preferences.customThemeData;
              style = {
                  backgroundColor: ct.background,
                  color: ct.text,
                  backgroundImage: ct.backgroundImage ? `url(${ct.backgroundImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed'
              };
              className = ""; 
          } else {
              const theme = THEMES[user.preferences.appTheme] || THEMES.light;
              className = `bg-gradient-to-br ${theme.gradient} ${theme.text}`;
          }
      } else {
          const month = new Date().getMonth();
          if (month === 11 || month === 0 || month === 1) {
              const theme = THEMES.winter;
              className = `bg-gradient-to-br ${theme.gradient} ${theme.text}`;
          } else {
              const theme = THEMES.light;
              className = `bg-gradient-to-br ${theme.gradient} ${theme.text}`;
          }
      }

      return { style, className };
  };

  const { style: globalStyle, className: globalClass } = getGlobalStyle();

  useEffect(() => {
    checkSupabaseConnection().then(res => {
        if (!res.connected) setDbError(res.error);
    });

    const path = (window as any).location.pathname;
    if (path.startsWith('/community')) {
        setView('community');
        const match = path.match(/\/community\/(\d+)/);
        if (match) setDeepLinkQuizId(parseInt(match[1]));
    } else if (path === '/t&c') {
        setShowTermsPage(true);
    }
  }, []);

  useEffect(() => {
    const handleAuth = async () => {
        const hash = (window as any).location.hash;
        if (hash && hash.includes('access_token')) {
            try {
                const params = new (window as any).URLSearchParams(hash.substring(1));
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token && refresh_token) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token,
                        refresh_token
                    });
                    
                    if (!error && data.session) {
                         const path = (window as any).location.pathname.toLowerCase().replace(/\/$/, '');
                         if (showRedirectCallback || path === '/redirect') {
                             (window as any).history.replaceState({}, (window as any).document.title, "/");
                             setShowRedirectCallback(false);
                        }
                        fetchProfile(data.session.user.id, data.session.user.email || '');
                        return; 
                    }
                }
            } catch (e) {
                console.error("Manual hash processing error:", e);
            }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            fetchProfile(session.user.id, session.user.email || '');
        } else {
            setIsLoading(false);
        }
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setPendingOAuthUser(null);
        setQuizzes([]);
        setSavedQuizzes([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [showRedirectCallback]); 

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && (error.code === 'PGRST116' || error.message.includes('No rows'))) {
          setPendingOAuthUser({ id: userId, email });
          setIsLoading(false);
          return;
      }

      if (error) throw error;

      if (data) {
        const loadedUser: User = {
          id: data.user_id,
          username: data.username || email.split('@')[0],
          email: email,
          stats: data.stats || DEFAULT_STATS,
          achievements: data.achievements || [],
          history: data.history || [],
          preferences: data.preferences,
          hasSeenTutorial: true,
          savedQuizIds: data.saved_quiz_ids || [] 
        };
        setUser(loadedUser);
        fetchQuizzes(userId);
        if (loadedUser.savedQuizIds.length > 0) {
            fetchSavedQuizzes(loadedUser.savedQuizIds);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCompleteSignup = async (username: string) => {
    if (!pendingOAuthUser) return;
    setIsLoading(true);

    const profileData = {
        user_id: pendingOAuthUser.id,
        username: username,
        email: pendingOAuthUser.email,
        stats: DEFAULT_STATS,
        achievements: [],
        history: [],
        preferences: {},
        saved_quiz_ids: [],
        updated_at: new Date().toISOString()
    };

    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        const loadedUser: User = {
          id: data.user_id,
          username: data.username,
          email: pendingOAuthUser.email,
          stats: data.stats || DEFAULT_STATS,
          achievements: data.achievements || [],
          history: data.history || [],
          preferences: data.preferences,
          hasSeenTutorial: false,
          savedQuizIds: []
        };
        
        setUser(loadedUser);
        setPendingOAuthUser(null);
        setStartTutorial(true); 
    } catch (e: any) {
        console.error("Failed to create profile:", e);
        alert("Failed to create profile: " + e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchQuizzes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedQuizzes: Quiz[] = (data || []).map((q: any) => ({
        id: q.id,
        userId: q.user_id,
        title: q.title,
        questions: q.questions,
        createdAt: q.created_at,
        theme: q.theme,
        customTheme: q.custom_theme,
        shuffleQuestions: q.shuffle_questions,
        backgroundMusic: q.background_music,
        visibility: q.visibility || (q.is_public ? 'public' : 'private')
      }));

      setQuizzes(loadedQuizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchSavedQuizzes = async (ids: number[]) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .in('id', ids);
        
        if (error) throw error;
        
        const userIds = Array.from(new Set((data || []).map(q => q.user_id)));
        const { data: profiles } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds);
        const profileMap: Record<string, string> = {};
        profiles?.forEach(p => profileMap[p.user_id] = p.username);

        const loadedSaved: Quiz[] = (data || []).map((q: any) => ({
            id: q.id,
            userId: q.user_id,
            title: q.title,
            questions: q.questions,
            createdAt: q.created_at,
            theme: q.theme,
            customTheme: q.custom_theme,
            shuffleQuestions: q.shuffle_questions,
            backgroundMusic: q.background_music,
            visibility: q.visibility || (q.is_public ? 'public' : 'private'),
            creatorUsername: profileMap[q.user_id] || 'Unknown'
        }));
        setSavedQuizzes(loadedSaved);
    } catch (e) {
        console.error("Failed to fetch saved quizzes:", e);
    }
  };

  const persistUser = async (updatedUser: User) => {
    setUser(updatedUser);
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          username: updatedUser.username,
          stats: updatedUser.stats,
          achievements: updatedUser.achievements,
          history: updatedUser.history,
          preferences: updatedUser.preferences,
          saved_quiz_ids: updatedUser.savedQuizIds,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  };

  const handleStatUpdate = (type: 'create' | 'play' | 'study' | 'ai_img' | 'ai_quiz', count: number = 1) => {
    if (!user) return;
    const newStats = { ...user.stats };
    
    if (type === 'create') newStats.quizzesCreated += count;
    if (type === 'play') newStats.quizzesPlayed += count;
    if (type === 'study') newStats.studySessions += count;
    if (type === 'ai_img') newStats.aiImagesGenerated += count;
    if (type === 'ai_quiz') newStats.aiQuizzesGenerated += count;

    const updatedUser = { ...user, stats: newStats };
    persistUser(updatedUser);
    checkAchievements(updatedUser);
  };

  const handleLogin = () => {};

  const handleTutorialComplete = () => {
    if (user && user.hasSeenTutorial === false) {
      const updatedUser = { ...user, hasSeenTutorial: true };
      persistUser(updatedUser);
    }
    setStartTutorial(false);
  };

  const handleLogout = async () => {
    setUser(null);
    setPendingOAuthUser(null);
    setQuizzes([]);
    setSavedQuizzes([]);
    setView('home');
    setIsLoading(false);
    await supabase.auth.signOut();
  };

  const handleStartQuiz = (quiz: Quiz) => {
    if (!user) {
        alert("You must be logged in to play!");
        setView('home'); 
        return;
    }
    setActiveQuiz(quiz);
    setView('take');
  };

  const handleStartStudy = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    handleStatUpdate('study');
    setView('study');
  };

  const handleCreateNew = () => {
    setEditingQuiz(null);
    setStartTutorial(false);
    setView('create');
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setStartTutorial(false);
    setView('create');
  };

  const handleDeleteQuiz = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await supabase.from('quizzes').delete().eq('id', id);
        setQuizzes(quizzes.filter(q => q.id !== id));
      } catch (error) {
        console.error("Failed to delete quiz:", error);
      }
    }
  };

  const handleSaveQuiz = async (savedQuiz: Quiz) => {
    if (!user) return;

    try {
        const dbQuiz = {
            user_id: user.id,
            title: savedQuiz.title,
            questions: savedQuiz.questions,
            theme: savedQuiz.theme,
            custom_theme: savedQuiz.customTheme,
            shuffle_questions: savedQuiz.shuffleQuestions,
            background_music: savedQuiz.backgroundMusic,
            visibility: savedQuiz.visibility || 'private',
            is_public: savedQuiz.visibility === 'public'
        };

        if (editingQuiz) {
            const { error } = await supabase
                .from('quizzes')
                .update(dbQuiz)
                .eq('id', savedQuiz.id);
            if (error) throw error;
            setQuizzes(quizzes.map(q => q.id === savedQuiz.id ? savedQuiz : q));
        } else {
            const { data, error } = await supabase
                .from('quizzes')
                .insert(dbQuiz)
                .select()
                .single();
            if (error) throw error;
            const newQuiz = { ...savedQuiz, id: data.id };
            setQuizzes([newQuiz, ...quizzes]);
        }

        setEditingQuiz(null);
        setView('home');
    } catch (error: any) {
        alert("Failed to save quiz: " + error.message);
    }
  };

  const handleQuizComplete = (answers: (number | string | number[])[], score: number) => {
    if (activeQuiz && user) {
      const result: QuizResult = {
          id: Date.now().toString(),
          quizId: activeQuiz.id,
          quizTitle: activeQuiz.title,
          date: new Date().toISOString(),
          score: score,
          totalQuestions: activeQuiz.questions.length,
          answers: answers
      };

      setLastResult(result);
      
      const newStats = { ...user.stats };
      newStats.quizzesPlayed += 1;
      newStats.questionsAnswered += activeQuiz.questions.length;
      if (score === activeQuiz.questions.length) {
          newStats.perfectScores += 1;
      }

      const updatedUser = { 
          ...user, 
          history: [...(user.history || []), result],
          stats: newStats
      };
      
      persistUser(updatedUser);
      checkAchievements(updatedUser);
      setView('results');
    }
  };

  const handlePlayAgain = () => {
    if (lastResult) {
       const freshQuiz = quizzes.find(q => q.id === lastResult.quizId) || 
                         savedQuizzes.find(q => q.id === lastResult.quizId) || 
                         activeQuiz;
       if (freshQuiz) {
            setActiveQuiz(freshQuiz);
            setView('take');
       }
    }
  };

  const handleViewTutorial = () => {
    setEditingQuiz(null);
    setStartTutorial(true);
    setView('create');
  }

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    persistUser(updatedUser);
  };

  const handleClearHistory = () => {
    if (!user) return;
    const updatedUser = { ...user, history: [] };
    persistUser(updatedUser);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
        await supabase.from('quizzes').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('user_id', user.id);
        await supabase.auth.signOut();
        setUser(null);
        setQuizzes([]);
        setSavedQuizzes([]);
        setView('home');
        alert("Account deleted.");
    } catch (e: any) {
        console.error("Account deletion error:", e);
        handleLogout();
    }
  };
  
  const handleExportQuiz = (quiz: Quiz) => {
    exportQuizToQZX(quiz);
  };
  
  const handleExportAll = () => {
    if(user && quizzes.length > 0) {
        exportAllQuizzesToZip(quizzes);
    } else {
        alert("No quizzes to export!");
    }
  };

  const handleImportQuiz = (file: any) => {
    if (!user) return;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
        try {
            const content = e.target?.result as string;
            const importedQuiz = JSON.parse(content) as Quiz;
            if (!importedQuiz.title || !Array.isArray(importedQuiz.questions)) throw new Error("Invalid file");
            const dbQuiz = {
                user_id: user.id,
                title: importedQuiz.title + ' (Imported)',
                questions: importedQuiz.questions,
                theme: importedQuiz.theme || 'classic',
                custom_theme: importedQuiz.customTheme || null,
                shuffle_questions: importedQuiz.shuffleQuestions || false,
                visibility: 'private'
            };
            const { data, error } = await supabase.from('quizzes').insert(dbQuiz).select().single();
            if (error) throw error;
            const newQuiz: Quiz = { 
                ...importedQuiz, 
                id: data.id, 
                userId: user.id, 
                title: dbQuiz.title, 
                visibility: 'private' as QuizVisibility 
            };
            setQuizzes([newQuiz, ...quizzes]);
            showAchievementNotification("Quiz Imported!", `Successfully added "${newQuiz.title}"`);
        } catch (error) {
            alert("Failed to import quiz.");
        }
    };
    reader.readAsText(file);
  };

  const handleFeedbackSubmit = async (feedback: Feedback) => {
      try {
          const { error } = await supabase.from('feedback').insert({
              id: feedback.id,
              user_id: feedback.userId,
              username: feedback.username,
              type: feedback.type,
              content: feedback.content,
              status: 'new'
          });
          if (error) throw error;
      } catch (e: any) {
          console.error("Error sending feedback:", e);
          throw e; 
      }
  };

  const checkAchievements = (currentUser: User) => {
    let newUnlocks = false;
    const updatedAchievements = [...currentUser.achievements];

    ACHIEVEMENTS.forEach(ach => {
      if (!updatedAchievements.includes(ach.id) && ach.condition(currentUser.stats)) {
        updatedAchievements.push(ach.id);
        newUnlocks = true;
        showAchievementNotification(ach.title, ach.description);
      }
    });

    if (newUnlocks) {
      const updatedUser = { ...currentUser, achievements: updatedAchievements };
      persistUser(updatedUser);
    }
  };

  const showAchievementNotification = (title: string, message: string) => {
    setNotification({ title, message });
    setShowNotification(true);
  };

  const renderContent = () => {
      if (dbError) {
          return (
              <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-red-50">
                  <AlertTriangle size={64} className="text-red-500 mb-6" />
                  <h1 className="text-3xl font-black text-red-900 mb-2">Database Error</h1>
                  <p className="text-red-700 max-w-md mb-8">
                      Could not connect to the Quiviex database. Please ensure your Supabase configuration is correct.
                  </p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                  >
                      Retry Connection
                  </button>
              </div>
          )
      }

      if (pendingOAuthUser) {
          return (
            <UsernameSetup 
                email={pendingOAuthUser.email} 
                onComplete={handleCompleteSignup} 
                onCancel={handleLogout} 
            />
          );
      }

      if (showTermsPage) {
          return (
              <div className="flex items-center justify-center min-h-screen p-4">
                  <LegalModal type="terms" onClose={() => { setShowTermsPage(false); window.history.back(); }} />
              </div>
          )
      }

      if (view === 'community') {
          return (
            <CommunityPage 
                user={user} 
                onBack={() => setView('home')} 
                onPlayQuiz={handleStartQuiz} 
                initialQuizId={deepLinkQuizId}
            />
          );
      }

      if (!user) {
          return (
            <>
               <div className="fixed top-6 right-6 z-[100]">
                   <button 
                     onClick={() => setView('community')} 
                     className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-black transition-all shadow-2xl hover:scale-105 active:scale-95 border-2 border-slate-900 hover:bg-slate-50"
                   >
                       <Globe size={20} className="text-indigo-600" /> 
                       <span>Browse Community</span>
                   </button>
               </div>
               <Auth onLogin={handleLogin} />
            </>
          );
      }

      return (
        <>
            {showFeedbackModal && (
                <FeedbackModal 
                    user={user} 
                    onClose={() => setShowFeedbackModal(false)} 
                    onSubmit={handleFeedbackSubmit} 
                />
            )}

            {view !== 'take' && view !== 'study' && (
                <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="fixed bottom-4 right-4 z-40 bg-white shadow-xl rounded-full p-3 text-slate-500 hover:text-violet-600 hover:scale-110 transition-all border border-slate-200"
                    title="Send Feedback"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {user.email === SUDO_EMAIL && view === 'home' && (
                <button
                    onClick={() => setView('admin')}
                    className="fixed bottom-4 left-4 z-40 bg-red-600 text-white shadow-xl rounded-full px-4 py-3 font-bold hover:bg-red-700 transition-all border border-red-800 flex items-center gap-2"
                >
                    SUDO MODE
                </button>
            )}

            {view === 'admin' && user.email === SUDO_EMAIL && (
                <AdminDashboard onBack={() => setView('home')} />
            )}

            {view === 'home' && (
                <QuizHome
                quizzes={quizzes}
                savedQuizzes={savedQuizzes}
                user={user}
                onStartQuiz={handleStartQuiz}
                onStartStudy={handleStartStudy}
                onCreateNew={handleCreateNew}
                onEditQuiz={handleEditQuiz}
                onDeleteQuiz={handleDeleteQuiz}
                onViewTutorial={handleViewTutorial}
                onLogout={handleLogout}
                onViewAchievements={() => setView('achievements')}
                onViewHistory={() => setView('history')}
                onStartFocus={() => setView('focus')}
                onViewSettings={() => setView('settings')}
                onExportQuiz={handleExportQuiz}
                onImportQuiz={handleImportQuiz}
                onViewCommunity={() => setView('community')}
                />
            )}

            {view === 'create' && (
                <QuizCreator
                initialQuiz={editingQuiz}
                currentUser={user}
                onSave={handleSaveQuiz}
                onExit={() => setView('home')}
                startWithTutorial={startTutorial}
                onTutorialComplete={handleTutorialComplete}
                onStatUpdate={handleStatUpdate}
                onOpenSettings={() => setView('settings')}
                />
            )}

            {view === 'take' && activeQuiz && (
                <QuizTaker
                quiz={activeQuiz}
                onComplete={handleQuizComplete}
                onExit={() => setView('home')}
                />
            )}

            {view === 'study' && activeQuiz && (
                <FlashcardViewer
                quiz={activeQuiz}
                onExit={() => setView('home')}
                />
            )}

            {view === 'results' && lastResult && activeQuiz && (
                <QuizResults
                quiz={activeQuiz}
                userAnswers={lastResult.answers}
                score={lastResult.score}
                onPlayAgain={handlePlayAgain}
                onHome={() => setView('home')}
                />
            )}

            {view === 'achievements' && (
                <AchievementsPage user={user} onBack={() => setView('home')} />
            )}

            {view === 'history' && (
                <HistoryPage user={user} onBack={() => setView('home')} />
            )}

            {view === 'focus' && (
                <FocusMode 
                    user={user} 
                    quizzes={quizzes} 
                    onBack={() => setView('home')} 
                    onStartQuiz={handleStartQuiz}
                />
            )}

            {view === 'settings' && user && (
                <SettingsPage 
                    user={user} 
                    onBack={() => setView('home')} 
                    onUpdateProfile={handleUpdateUser}
                    onClearHistory={handleClearHistory}
                    onDeleteAccount={handleDeleteAccount}
                    onExportAll={handleExportAll}
                />
            )}
        </>
      );
  };

  if (showRedirectCallback) {
      return (
        <div className={`min-h-screen ${globalClass}`} style={globalStyle}>
            <OAuthCallback />
        </div>
      );
  }

  if (isLoading) {
      return <div className={`min-h-screen flex items-center justify-center font-bold ${globalClass}`} style={globalStyle}>Loading Quiviex...</div>;
  }

  return (
    <div 
        className={`min-h-screen transition-all duration-500 ${globalClass}`}
        style={globalStyle}
    >
        <NotificationToast 
            title={notification?.title || ''} 
            message={notification?.message || ''} 
            isVisible={showNotification} 
            onClose={() => setShowNotification(false)} 
        />
        {renderContent()}
    </div>
  );
}