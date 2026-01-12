import React, { useState, useEffect } from 'react';
import { User, Feedback, Quiz } from '../types';
import { ArrowLeft, Shield, Users, MessageSquare, Trash2, CheckCircle, RefreshCw, UserMinus, Reply, Send, X, Loader2, ShieldX, UserCheck, AlertCircle, Database, Copy, Star, Hash, Search, Info, Mail, Ban, Unlock, BarChart3, TrendingUp, MousePointer2, Eye, Filter, Check, AlertTriangle, Activity, Server, Cpu, Zap, Wifi, Terminal, Globe } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  onBack: () => void;
  onEditQuiz: (quiz: Quiz) => void;
}

interface BannedEmail {
    email: string;
    reason: string;
    created_at: string;
}

interface RatingEntry {
    id: number;
    quiz_id: number;
    user_id: string;
    rating: number;
    created_at: string;
    quiz_title?: string;
    username?: string;
}

interface AnalyticsStat {
  path: string;
  count: number;
}

interface TrafficTrend {
  day: string;
  count: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onEditQuiz }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'bans' | 'ratings' | 'analytics' | 'soft_filter'>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [allUsers, setAllUsers] = useState<(User & { warnings?: number, created_at?: string })[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [softFilterQuizzes, setSoftFilterQuizzes] = useState<Quiz[]>([]);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStat[]>([]);
  const [trafficTrend, setTrafficTrend] = useState<TrafficTrend[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  
  // Advanced Metrics
  const [dbLatency, setDbLatency] = useState(0);
  const [totalContentCount, setTotalContentCount] = useState(0);
  const [creatorRatio, setCreatorRatio] = useState(0);
  const [systemLoad, setSystemLoad] = useState<'Optimal' | 'Moderate' | 'High'>('Optimal');
  
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  
  // Reject Modal State
  const [rejectQuiz, setRejectQuiz] = useState<Quiz | null>(null);
  const [rejectStrike, setRejectStrike] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setMissingTables([]);
    const start = Date.now();
    try {
        if (activeTab === 'feedback') {
            await fetchFeedbacks();
        } else if (activeTab === 'users') {
            await fetchUsers();
        } else if (activeTab === 'bans') {
            await fetchBans();
        } else if (activeTab === 'ratings') {
            await fetchRatings();
        } else if (activeTab === 'analytics') {
            await fetchAnalytics();
        } else if (activeTab === 'soft_filter') {
            await fetchSoftFilterQuizzes();
        }
    } catch (e) {
        console.error("Fetch data error:", e);
    } finally {
        const end = Date.now();
        setDbLatency(end - start);
        setIsLoading(false);
    }
  };

  const fetchSoftFilterQuizzes = async () => {
      try {
          const { data, error } = await supabase
              .from('quizzes')
              .select('*')
              .eq('is_sensitive', true)
              .order('created_at', { ascending: false });

          if (error) {
              if (error.code === '42P01') setMissingTables(prev => [...prev, 'quizzes']);
              if (error.code === '42703') setMissingTables(prev => [...prev, 'column is_sensitive']);
              throw error;
          }

          if (data) {
              const mapped: Quiz[] = data.map((q: any) => ({
                  id: q.id, userId: q.user_id, title: q.title, questions: q.questions, createdAt: q.created_at,
                  theme: q.theme, customTheme: q.custom_theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music, visibility: q.visibility,
                  isSensitive: q.is_sensitive,
                  creatorUsername: q.username_at_creation, 
                  stats: { views: q.views || 0, plays: q.plays || 0, avgRating: 0, totalRatings: 0 }
              }));
              setSoftFilterQuizzes(mapped);
          }
      } catch (e: any) {
          console.error("Error fetching sensitive quizzes:", e);
      }
  };

  const handleAllowQuiz = async (quiz: Quiz) => {
      setProcessingId(quiz.id);
      try {
          await supabase.from('quizzes').update({ is_sensitive: false }).eq('id', quiz.id);
          await supabase.from('notifications').insert({
              user_id: quiz.userId,
              title: 'Quiz Approved',
              message: `Your quiz "${quiz.title}" has been reviewed and cleared. It is now fully visible in the community.`,
              type: 'info',
              is_read: false
          });
          setSoftFilterQuizzes(prev => prev.filter(q => q.id !== quiz.id));
      } catch (e: any) {
          alert("Error allowing quiz: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleRejectConfirm = async () => {
      if (!rejectQuiz) return;
      setProcessingId(rejectQuiz.id);
      try {
          await supabase.from('quizzes').delete().eq('id', rejectQuiz.id);
          let strikeMsg = "";
          if (rejectStrike) {
              const { data: profile } = await supabase.from('profiles').select('warnings').eq('user_id', rejectQuiz.userId).single();
              const newWarnings = (profile?.warnings || 0) + 1;
              await supabase.from('profiles').update({ warnings: newWarnings }).eq('user_id', rejectQuiz.userId);
              strikeMsg = ` You have been issued a strike (${newWarnings}/3).`;
          }
          await supabase.from('notifications').insert({
              user_id: rejectQuiz.userId,
              title: 'Quiz Removed',
              message: `Your quiz "${rejectQuiz.title}" violated our content guidelines and has been removed.${strikeMsg}`,
              type: 'system',
              is_read: false
          });
          setSoftFilterQuizzes(prev => prev.filter(q => q.id !== rejectQuiz.id));
          setRejectQuiz(null);
          setRejectStrike(false);
      } catch (e: any) {
          alert("Error rejecting quiz: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: pathData, error: pathError } = await supabase.rpc('get_path_analytics');
      const { count: quizCount } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
      setTotalContentCount(quizCount || 0);
      const { data: creators } = await supabase.from('quizzes').select('user_id');
      const uniqueCreators = new Set(creators?.map((c:any) => c.user_id)).size;
      const { count: totalUserCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setCreatorRatio(totalUserCount ? Math.round((uniqueCreators / totalUserCount) * 100) : 0);

      if (pathError) {
        const { data: manualPath, error: manualError } = await supabase.from('site_analytics').select('path');
        if (manualError) {
           if (manualError.code === '42P01') setMissingTables(prev => [...prev, 'site_analytics']);
           return;
        }
        const counts: Record<string, number> = {};
        manualPath?.forEach((row: any) => {
          counts[row.path] = (counts[row.path] || 0) + 1;
        });
        const mapped = Object.entries(counts).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count);
        setAnalyticsData(mapped);
        setTotalVisits(manualPath?.length || 0);
      } else {
        setAnalyticsData(pathData || []);
        setTotalVisits(pathData?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0);
      }

      const { count: uniqueIdCount } = await supabase.from('site_analytics').select('user_id', { count: 'exact', head: true }).not('user_id', 'is', null);
      setUniqueVisitors(uniqueIdCount || 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: trendData } = await supabase.from('site_analytics').select('created_at').gte('created_at', sevenDaysAgo.toISOString());
      const dayCounts: Record<string, number> = {};
      for(let i=0; i<7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayCounts[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
      }
      trendData?.forEach((row: any) => {
        const day = new Date(row.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        if (dayCounts[day] !== undefined) dayCounts[day]++;
      });
      const trendMapped = Object.entries(dayCounts).map(([day, count]) => ({ day, count })).reverse();
      setTrafficTrend(trendMapped);
      if (totalVisits > 5000) setSystemLoad('High');
      else if (totalVisits > 1000) setSystemLoad('Moderate');
      else setSystemLoad('Optimal');
    } catch (e) {
      console.error("Analytics fetch failure:", e);
    }
  };

  const fetchRatings = async () => {
      try {
          const { data, error } = await supabase.from('ratings').select('*, quizzes(title)').order('created_at', { ascending: false });
          if (error) {
              if (error.code === '42P01') setMissingTables(prev => [...prev, 'ratings']);
              throw error;
          }
          if (data) {
              const mapped: RatingEntry[] = data.map((r: any) => ({
                  id: r.id,
                  quiz_id: r.quiz_id,
                  user_id: r.user_id,
                  rating: r.rating,
                  created_at: r.created_at,
                  quiz_title: r.quizzes?.title || 'Unknown Quiz',
                  username: r.user_id?.substring(0, 8) || 'Unknown' 
              }));
              setRatings(mapped);
          }
      } catch (e: any) {
          console.error("Error fetching ratings:", e);
      }
  };

  const fetchFeedbacks = async () => {
      try {
          const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
          if (error) {
              if (error.code === '42P01') setMissingTables(prev => [...prev, 'feedback']);
              throw error;
          }
          if (data) {
              const mapped: Feedback[] = data.map((f: any) => ({
                  id: f.id,
                  userId: f.user_id,
                  username: f.username,
                  type: f.type,
                  content: f.content,
                  date: f.created_at,
                  status: f.status,
                  adminReply: f.admin_reply
              }));
              setFeedbacks(mapped);
          }
      } catch (error: any) {
          console.error("Error fetching feedback:", error);
      }
  };

  const fetchUsers = async () => {
      try {
          const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
          if (error) {
              if (error.code === '42P01') setMissingTables(prev => [...prev, 'profiles']);
              throw error;
          }
          if (data) {
              const mapped = data.map((p: any) => ({
                  id: p.user_id,
                  username: p.username || 'Unknown',
                  email: p.email || 'No Email',
                  warnings: p.warnings || 0,
                  created_at: p.created_at,
                  stats: p.stats || {
                      quizzesCreated: 0,
                      quizzesPlayed: 0,
                      questionsAnswered: 0,
                      perfectScores: 0,
                      studySessions: 0,
                      aiQuizzesGenerated: 0,
                      aiImagesGenerated: 0,
                      totalPoints: 0
                  },
                  achievements: p.achievements || [],
                  history: [],
                  savedQuizIds: p.saved_quiz_ids || []
              }));
              setAllUsers(mapped);
          }
      } catch (error: any) {
          console.error("Error fetching users:", error);
      }
  };

  const fetchBans = async () => {
      try {
          const { data, error } = await supabase.from('banned_emails').select('*').order('created_at', { ascending: false });
          if (error) {
              if (error.code === '42P01') {
                  setMissingTables(prev => [...prev, 'banned_emails']);
                  return;
              }
              throw error;
          }
          setBannedEmails(data || []);
      } catch (e: any) {
          console.error("Ban fetch failed:", e);
      }
  };

  const handleResolveFeedback = async (id: string) => {
      setProcessingId(id);
      try {
          await supabase.from('feedback').update({ status: 'resolved' }).eq('id', id);
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' as const } : f));
      } catch (error: any) {
          alert(`Failed to resolve: ${error.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteFeedback = async (id: string) => {
      if (!confirm("Are you sure?")) return;
      setProcessingId(id);
      try {
          await supabase.from('feedback').delete().eq('id', id);
          setFeedbacks(prev => prev.filter(f => f.id !== id));
      } catch (error: any) {
          alert(`Deletion Failure: ${error.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteRating = async (id: number) => {
      if (!confirm("Remove this score record?")) return;
      setProcessingId(id);
      try {
          await supabase.from('ratings').delete().eq('id', id);
          setRatings(prev => prev.filter(r => r.id !== id));
      } catch (e: any) {
          alert(`Rating deletion fault: ${e.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("PURGE: This will erase this profile row.")) return;
    setProcessingId(userId);
    try {
        await supabase.from('profiles').delete().eq('user_id', userId);
        setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
        alert(`Purge Error: ${e.message}`);
    } finally {
        setProcessingId(null);
    }
  };

  const handleUnbanEmail = async (email: string) => {
      if (!confirm(`Revoke ban for ${email}?`)) return;
      setProcessingId(email);
      try {
          await supabase.from('banned_emails').delete().eq('email', email);
          setBannedEmails(prev => prev.filter(b => b.email !== email));
          alert("Email has been authorized for reentry.");
      } catch (e: any) {
          alert("Unban failed: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const filteredUsers = allUsers.filter(u => 
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const maxTrend = Math.max(...trafficTrend.map(t => t.count), 1);

  return (
    <div className="min-h-screen bg-[#05010d] text-white font-['Plus_Jakarta_Sans']">
      
      {/* Reject Quiz Modal */}
      {rejectQuiz && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in border border-white/10">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="bg-rose-500/20 p-4 rounded-full mb-4 text-rose-500">
                          <Trash2 size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">Delete Content?</h3>
                      <p className="text-slate-400 font-bold">You are about to permanently remove "{rejectQuiz.title}". This cannot be undone.</p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={rejectStrike} 
                            onChange={(e) => setRejectStrike(e.target.checked)}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="font-black text-sm text-slate-300 uppercase tracking-wide">Issue Guideline Strike</span>
                      </label>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setRejectQuiz(null)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-white/5 transition-colors">Cancel</button>
                      <button onClick={handleRejectConfirm} className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg click-scale">Confirm</button>
                  </div>
              </div>
          </div>
      )}

      <header className="glass sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-white/10 animate-in slide-in-from-top duration-500 bg-[#05010d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Shield className="text-rose-500" size={24} /> Sudo Panel
                    </h1>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Administrator Access</p>
                </div>
            </div>
            <button onClick={fetchData} className="md:hidden p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={fetchData} className="hidden md:block p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <div className="flex bg-white/5 rounded-2xl p-1 w-full md:w-auto border border-white/5">
                 {[
                   { id: 'feedback', icon: MessageSquare, label: 'Logs' },
                   { id: 'users', icon: Users, label: 'Units' },
                   { id: 'ratings', icon: Star, label: 'Scores' },
                   { id: 'bans', icon: ShieldX, label: 'Blacklist' },
                   { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                   { id: 'soft_filter', icon: Filter, label: 'Mild Filter' }
                 ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap flex-1 md:flex-none ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                 ))}
              </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 pb-32">
         {missingTables.length > 0 && (
             <div className="mb-8 p-8 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2.5rem] shadow-sm animate-in slide-in-from-top-4">
                 <div className="flex items-start gap-5">
                     <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg"><Database size={24} /></div>
                     <div className="flex-1">
                         <h3 className="text-xl font-black text-rose-500 mb-2 uppercase tracking-tight">Database Schema Error</h3>
                         <p className="text-slate-400 font-bold">The table <code className="bg-white/5 px-2 py-0.5 rounded text-white">"{missingTables[0]}"</code> is missing. Ensure all SQL migrations are applied.</p>
                     </div>
                 </div>
             </div>
         )}

         {isLoading && (
             <div className="flex flex-col items-center justify-center py-32 animate-pulse text-slate-500">
                 <Loader2 size={64} className="animate-spin mb-4 text-indigo-500" />
                 <p className="font-black uppercase tracking-widest text-xs">Accessing Infrastructure...</p>
             </div>
         )}

         {/* SOFT FILTER SECTION */}
         {!isLoading && activeTab === 'soft_filter' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                 <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-500" size={32} />
                        <h2 className="text-3xl font-black tracking-tight">Mild Filter Queue <span className="text-slate-500 ml-2">({softFilterQuizzes.length})</span></h2>
                     </div>
                 </div>
                 <div className="bg-white/5 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="p-6 pl-10">Flagged Module</th>
                                <th className="p-6">Author Identity</th>
                                <th className="p-6">Date Flagged</th>
                                <th className="p-6 text-right pr-10">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {softFilterQuizzes.map(q => (
                                <tr key={q.id} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="font-black text-white">{q.title}</div>
                                        <div className="flex gap-2 mt-1.5">
                                            <span className="text-[9px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-amber-500/20">Sensitive Flag</span>
                                            <span className="text-[9px] bg-white/5 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{q.questions.length} Qs</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <code className="text-xs bg-white/5 px-2 py-1 rounded text-indigo-400 font-bold block w-fit mb-1">{q.userId.substring(0, 12)}...</code>
                                        {q.creatorUsername && <span className="text-xs font-bold text-slate-400">@{q.creatorUsername}</span>}
                                    </td>
                                    <td className="p-6 text-slate-500 text-xs font-bold">{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td className="p-6 pr-10 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                title="Inspect in Creator" 
                                                onClick={() => onEditQuiz(q)} 
                                                className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all click-scale"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                title="Whitelist (Approve)" 
                                                onClick={() => handleAllowQuiz(q)} 
                                                className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all click-scale"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                title="Purge (Delete)" 
                                                onClick={() => setRejectQuiz(q)} 
                                                className="p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all click-scale"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {softFilterQuizzes.length === 0 && (
                                <tr><td colSpan={4} className="p-24 text-center text-slate-600 font-bold uppercase text-xs tracking-widest italic">The queue is empty. Infrastructure secure.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}

         {/* USERS TAB */}
         {!isLoading && activeTab === 'users' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white/5 p-8 rounded-[3rem] shadow-xl border border-white/10">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input 
                                type="text"
                                placeholder="Search by email, username, or UUID..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-white/5 border-2 border-white/10 rounded-[2rem] focus:outline-none focus:border-indigo-500 font-bold transition-all text-white placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10 text-slate-500 uppercase text-[10px] font-black tracking-[0.3em]">
                                <tr>
                                    <th className="p-6 pl-10">Unit Identity</th>
                                    <th className="p-6">Infrastructure Email</th>
                                    <th className="p-6">Points</th>
                                    <th className="p-6">Strikes</th>
                                    <th className="p-6 text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center font-black text-indigo-400 uppercase text-lg border border-indigo-500/20">{u.username.charAt(0)}</div>
                                                <div>
                                                    <span className="font-black text-white">@{u.username}</span>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">UUID: {u.id.substring(0,8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-bold ${u.email.includes('u13.quiviex.internal') ? 'text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20' : 'text-slate-400'}`}>
                                                {u.email}
                                            </span>
                                        </td>
                                        <td className="p-6"><span className="font-black text-indigo-400">{u.stats?.totalPoints || 0}</span></td>
                                        <td className="p-6">
                                            <div className="flex gap-1.5">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className={`w-3.5 h-3.5 rounded-full ${i <= (u.warnings || 0) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-white/10'}`}></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6 pr-10 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="Reset Strikes" onClick={() => supabase.from('profiles').update({ warnings: 0 }).eq('user_id', u.id).then(fetchData)} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all click-scale"><UserCheck size={18} /></button>
                                                <button title="Purge Profile" onClick={() => handleDeleteUser(u.id)} disabled={u.email === 'sudo@quiviex.com'} className="p-3 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all click-scale"><UserMinus size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
         )}

         {/* FEEDBACK TAB */}
         {!isLoading && activeTab === 'feedback' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-3xl font-black tracking-tight">Transmission Logs <span className="text-slate-500 ml-2">({feedbacks.length})</span></h2>
                 <div className="grid gap-6">
                     {feedbacks.map(item => (
                         <div key={item.id} className="bg-white/5 p-8 rounded-[3rem] shadow-2xl border border-white/10 flex flex-col gap-6 relative overflow-hidden">
                             <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'bug' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>{item.type}</span>
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                        <span className="text-sm font-black text-indigo-400">@{item.username}</span>
                                    </div>
                                    <p className="text-white text-xl font-bold leading-relaxed">"{item.content}"</p>
                                </div>
                                <div className="flex items-start gap-3 md:border-l md:pl-8 border-white/5 flex-shrink-0">
                                    <button onClick={() => handleResolveFeedback(item.id)} className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all click-scale"><CheckCircle size={22} /></button>
                                    <button onClick={() => handleDeleteFeedback(item.id)} className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all click-scale"><Trash2 size={22} /></button>
                                </div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

         {/* ANALYTICS TAB */}
         {!isLoading && activeTab === 'analytics' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white/5 rounded-[3rem] p-10 text-white shadow-2xl border border-white/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={160} /></div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Total Page Loads</h4>
                 <div className="text-7xl font-black tracking-tighter mb-2">{totalVisits.toLocaleString()}</div>
                 <p className="text-slate-500 font-bold text-sm">Site-wide interactions logged</p>
               </div>

               <div className="bg-white/5 rounded-[3rem] p-10 shadow-2xl border border-white/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={160} /></div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Unique Logged Users</h4>
                 <div className="text-7xl font-black tracking-tighter mb-2">{uniqueVisitors.toLocaleString()}</div>
                 <p className="text-slate-500 font-bold text-sm">Distinct registered profile hits</p>
               </div>

               <div className="bg-white/5 rounded-[3rem] p-10 shadow-2xl border border-white/10 flex flex-col justify-between">
                 <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6">Traffic Trend (7D)</h4>
                 <div className="flex items-end justify-between gap-2 h-32">
                   {trafficTrend.map((t, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                          className="w-full bg-indigo-500/20 group-hover:bg-indigo-500 rounded-t-xl transition-all duration-700 relative" 
                          style={{ height: `${(t.count / maxTrend) * 100}%` }}
                        >
                           <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-[10px] px-2 py-0.5 rounded font-black">{t.count}</div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase">{t.day}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white/5 p-10 rounded-[4rem] shadow-2xl border border-white/10">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                        <Activity className="text-emerald-400" /> System Vitality
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400"><Wifi size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white">Database Latency</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Supabase Global Sync</p>
                                </div>
                            </div>
                            <div className="text-2xl font-black text-white">{dbLatency}ms</div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400"><Server size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-white">Modules Stored</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Asset Count</p>
                                </div>
                            </div>
                            <div className="text-2xl font-black text-white">{totalContentCount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden text-white flex flex-col border border-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Terminal size={160} /></div>
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                        <Zap className="text-yellow-400" /> Live Audit Stream
                    </h3>
                    <div className="flex-1 space-y-4 relative z-10">
                        {[
                            { time: 'Just now', action: 'System check completed', type: 'sys' },
                            { time: '2s ago', action: 'New page view logged', type: 'user' },
                            { time: '15s ago', action: 'Database sync successful', type: 'sys' },
                            { time: '42s ago', action: 'User profile fetched', type: 'user' }
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 text-xs font-mono border-b border-white/5 pb-3 last:border-0 opacity-80">
                                <span className="text-slate-500 whitespace-nowrap">{log.time}</span>
                                <span className={log.type === 'sys' ? 'text-emerald-400' : 'text-indigo-400'}>
                                    {log.type === 'sys' ? '[SYS]' : '[USR]'}
                                </span>
                                <span className="truncate">{log.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};