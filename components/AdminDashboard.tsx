
import React, { useState, useEffect } from 'react';
import { User, Feedback, Quiz } from '../types';
import { ArrowLeft, Shield, Users, MessageSquare, Trash2, CheckCircle, RefreshCw, UserMinus, Reply, Send, X, Loader2, ShieldX, UserCheck, AlertCircle, Database, Copy, Star, Hash, Search, Info, Mail, Ban, Unlock, BarChart3, TrendingUp, MousePointer2, Eye, Filter, Check, AlertTriangle } from 'lucide-react';
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
                  creatorUsername: q.username_at_creation, // Assuming this might be available or we just don't have it here without join
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
          // 1. Remove Sensitive Flag
          await supabase.from('quizzes').update({ is_sensitive: false }).eq('id', quiz.id);
          
          // 2. Notify User
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
          // 1. Delete Quiz
          await supabase.from('quizzes').delete().eq('id', rejectQuiz.id);

          // 2. Issue Strike if selected
          let strikeMsg = "";
          if (rejectStrike) {
              const { data: profile } = await supabase.from('profiles').select('warnings').eq('user_id', rejectQuiz.userId).single();
              const newWarnings = (profile?.warnings || 0) + 1;
              await supabase.from('profiles').update({ warnings: newWarnings }).eq('user_id', rejectQuiz.userId);
              strikeMsg = ` You have been issued a strike (${newWarnings}/3).`;
          }

          // 3. Notify User
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
      
      if (pathError) {
        const { data: manualPath, error: manualError } = await supabase
          .from('site_analytics')
          .select('path');
        
        if (manualError) {
           if (manualError.code === '42P01') setMissingTables(prev => [...prev, 'site_analytics']);
           return;
        }

        const counts: Record<string, number> = {};
        manualPath?.forEach((row: any) => {
          counts[row.path] = (counts[row.path] || 0) + 1;
        });
        const mapped = Object.entries(counts)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count);
        
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
      
      const { data: trendData } = await supabase
        .from('site_analytics')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());
      
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

      const trendMapped = Object.entries(dayCounts)
        .map(([day, count]) => ({ day, count }))
        .reverse();
      
      setTrafficTrend(trendMapped);

    } catch (e) {
      console.error("Analytics fetch failure:", e);
    }
  };

  const fetchRatings = async () => {
      try {
          const { data, error } = await supabase
              .from('ratings')
              .select('*, quizzes(title)')
              .order('created_at', { ascending: false });

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
          const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });
            
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
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

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
          const { error } = await supabase.from('feedback').update({ status: 'resolved' }).eq('id', id);
          if (error) throw error;
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
          const { error } = await supabase.from('feedback').delete().eq('id', id);
          if (error) throw error;
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
          const { error } = await supabase.from('ratings').delete().eq('id', id);
          if (error) throw error;
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
        const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
        if (error) throw error;
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
          const { error } = await supabase.from('banned_emails').delete().eq('email', email);
          if (error) throw error;
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
    <div className="min-h-screen bg-slate-100 text-slate-900 font-['Plus_Jakarta_Sans']">
      
      {/* Reject Quiz Modal */}
      {rejectQuiz && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in border-4 border-rose-100">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="bg-rose-100 p-4 rounded-full mb-4 text-rose-600">
                          <Trash2 size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-rose-950 mb-2">Delete Content?</h3>
                      <p className="text-slate-500 font-bold">You are about to permanently remove "{rejectQuiz.title}". This cannot be undone.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={rejectStrike} 
                            onChange={(e) => setRejectStrike(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="font-black text-sm text-slate-700 uppercase tracking-wide">Issue Guideline Strike</span>
                      </label>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setRejectQuiz(null)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                      <button onClick={handleRejectConfirm} className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg click-scale">Confirm</button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-slate-900 text-white sticky top-0 z-10 px-6 py-4 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
               <Shield className="text-rose-500" size={28} />
               <h1 className="text-2xl font-black tracking-tight">Admin Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={fetchData} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
                  <RefreshCw size={20} />
              </button>
              <div className="flex bg-slate-800 rounded-xl p-1 overflow-x-auto">
                 {[
                   { id: 'feedback', icon: MessageSquare, label: 'Logs' },
                   { id: 'users', icon: Users, label: 'Units' },
                   { id: 'ratings', icon: Star, label: 'Scores' },
                   { id: 'bans', icon: ShieldX, label: 'Blacklist' },
                   { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                   { id: 'soft_filter', icon: Filter, label: 'Filtered' }
                 ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-600 text-white shadow-inner' : 'text-slate-500 hover:text-white'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                 ))}
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 pb-32">
         {missingTables.length > 0 && (
             <div className="mb-8 p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] shadow-sm animate-in slide-in-from-top-4">
                 <div className="flex items-start gap-5">
                     <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg"><Database size={24} /></div>
                     <div className="flex-1">
                         <h3 className="text-xl font-black text-rose-900 mb-2 uppercase tracking-tight">Database Schema Error</h3>
                         <p className="text-rose-700 font-bold">The table <code className="bg-white/50 px-2 py-0.5 rounded">"{missingTables[0]}"</code> is missing. Ensure all SQL migrations are applied.</p>
                     </div>
                 </div>
             </div>
         )}

         {isLoading && (
             <div className="flex flex-col items-center justify-center py-32 animate-pulse text-slate-400">
                 <Loader2 size={64} className="animate-spin mb-4" />
                 <p className="font-black uppercase tracking-widest text-xs">Accessing Infrastructure...</p>
             </div>
         )}

         {/* SOFT FILTER SECTION */}
         {!isLoading && activeTab === 'soft_filter' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                 <div className="flex items-center gap-3 mb-2">
                     <AlertCircle className="text-amber-500" size={32} />
                     <h2 className="text-3xl font-black tracking-tight text-slate-900">Content Review <span className="text-slate-400 ml-2">({softFilterQuizzes.length})</span></h2>
                 </div>
                 <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="p-6 pl-10">Flagged Module</th>
                                <th className="p-6">Author UUID</th>
                                <th className="p-6">Date Flagged</th>
                                <th className="p-6 text-right pr-10">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {softFilterQuizzes.map(q => (
                                <tr key={q.id} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="font-black text-slate-900">{q.title}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-amber-200">Soft Filter</span>
                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{q.questions.length} Qs</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-indigo-600 font-bold block w-fit mb-1">{q.userId.substring(0, 12)}...</code>
                                        {q.creatorUsername && <span className="text-xs font-bold text-slate-500">@{q.creatorUsername}</span>}
                                    </td>
                                    <td className="p-6 text-slate-400 text-xs font-bold">{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td className="p-6 pr-10 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                title="Open in Creator" 
                                                onClick={() => onEditQuiz(q)} 
                                                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all click-scale shadow-sm"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                title="Allow (Clear Flag)" 
                                                onClick={() => handleAllowQuiz(q)} 
                                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all click-scale shadow-sm"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                title="Reject (Delete)" 
                                                onClick={() => setRejectQuiz(q)} 
                                                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all click-scale shadow-sm"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {softFilterQuizzes.length === 0 && (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No flagged content pending review.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}

         {/* EXISTING TABS */}
         {!isLoading && activeTab === 'users' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search by email, username, or UUID..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:outline-none focus:border-indigo-400 font-bold transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                                <tr>
                                    <th className="p-6 pl-10">Unit Identity</th>
                                    <th className="p-6">Infrastructure Email</th>
                                    <th className="p-6">Points</th>
                                    <th className="p-6">Strikes</th>
                                    <th className="p-6 text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 uppercase text-lg shadow-sm">{u.username.charAt(0)}</div>
                                                <div>
                                                    <span className="font-black text-slate-900">@{u.username}</span>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">UUID: {u.id.substring(0,8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-sm font-bold ${u.email.includes('u13.quiviex.internal') ? 'text-amber-600 bg-amber-50 px-2 py-1 rounded' : 'text-slate-600'}`}>
                                                {u.email}
                                            </span>
                                        </td>
                                        <td className="p-6"><span className="font-black text-indigo-500">{u.stats?.totalPoints || 0}</span></td>
                                        <td className="p-6">
                                            <div className="flex gap-1.5">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className={`w-3.5 h-3.5 rounded-full ${i <= (u.warnings || 0) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-slate-200'}`}></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6 pr-10 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="Reset Strikes" onClick={() => supabase.from('profiles').update({ warnings: 0 }).eq('user_id', u.id).then(fetchData)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all click-scale"><UserCheck size={18} /></button>
                                                <button title="Delete Profile" onClick={() => handleDeleteUser(u.id)} disabled={u.email === 'sudo@quiviex.com'} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all click-scale"><UserMinus size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && !isLoading && (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No matching units found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
         )}

         {!isLoading && activeTab === 'feedback' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-3xl font-black tracking-tight">Incoming Logs <span className="text-slate-400 ml-2">({feedbacks.length})</span></h2>
                 <div className="grid gap-6">
                     {feedbacks.map(item => (
                         <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6 relative overflow-hidden">
                             <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'bug' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>{item.type}</span>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                        <span className="text-sm font-black text-indigo-600">@{item.username}</span>
                                    </div>
                                    <p className="text-slate-800 text-xl font-bold leading-relaxed">{item.content}</p>
                                </div>
                                <div className="flex items-start gap-3 md:border-l md:pl-8 border-slate-100 flex-shrink-0">
                                    <button onClick={() => handleResolveFeedback(item.id)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all click-scale"><CheckCircle size={22} /></button>
                                    <button onClick={() => handleDeleteFeedback(item.id)} className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all click-scale"><Trash2 size={22} /></button>
                                </div>
                             </div>
                         </div>
                     ))}
                     {feedbacks.length === 0 && (
                         <div className="p-32 bg-white rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                             <MessageSquare size={64} className="mx-auto text-slate-200 mb-6" />
                             <p className="text-slate-400 font-black uppercase tracking-widest">Registry Empty</p>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {!isLoading && activeTab === 'ratings' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                 <h2 className="text-3xl font-black tracking-tight">Transmission Scores <span className="text-slate-400 ml-2">({ratings.length})</span></h2>
                 <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="p-6 pl-10">Target Module</th>
                                <th className="p-6">Unit UUID</th>
                                <th className="p-6">Rating</th>
                                <th className="p-6 text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {ratings.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="font-black text-slate-900">{r.quiz_title}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {r.quiz_id}</div>
                                    </td>
                                    <td className="p-6">
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-indigo-600 font-bold">{r.user_id.substring(0, 16)}...</code>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} size={14} className={i <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6 pr-10 text-right">
                                        <button onClick={() => handleDeleteRating(r.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all click-scale"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {ratings.length === 0 && (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No telemetry scores logged</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}

         {!isLoading && activeTab === 'bans' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                 <h2 className="text-3xl font-black tracking-tight text-rose-600">Blacklisted Entities <span className="text-slate-400 ml-2">({bannedEmails.length})</span></h2>
                 <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="p-6 pl-10">Restricted Email</th>
                                <th className="p-6">Termination Reason</th>
                                <th className="p-6">Date Decommissioned</th>
                                <th className="p-6 text-right pr-10">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {bannedEmails.map(b => (
                                <tr key={b.email} className="hover:bg-rose-50/30 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Mail size={16} /></div>
                                            <span className="font-black text-slate-800">{b.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 italic">"{b.reason}"</span>
                                    </td>
                                    <td className="p-6 text-slate-400 text-xs font-bold">{new Date(b.created_at).toLocaleString()}</td>
                                    <td className="p-6 pr-10 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button title="Copy Email" onClick={() => navigator.clipboard.writeText(b.email).then(() => alert("Copied"))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><Copy size={18} /></button>
                                            <button title="Revoke Ban" onClick={() => handleUnbanEmail(b.email)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all click-scale"><Unlock size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bannedEmails.length === 0 && (
                                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">Infrastructure clean. No active blacklists.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
             </div>
         )}

         {!isLoading && activeTab === 'analytics' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={160} /></div>
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Total Page Loads</h4>
                 <div className="text-7xl font-black tracking-tighter mb-2">{totalVisits.toLocaleString()}</div>
                 <p className="text-slate-400 font-bold text-sm">Site-wide interactions logged</p>
               </div>

               <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={160} /></div>
                 <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Unique Logged Users</h4>
                 <div className="text-7xl font-black tracking-tighter mb-2">{uniqueVisitors.toLocaleString()}</div>
                 <p className="text-slate-400 font-bold text-sm">Distinct registered profile hits</p>
               </div>

               <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200 flex flex-col justify-between">
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Traffic Trend (7D)</h4>
                 <div className="flex items-end justify-between gap-2 h-32">
                   {trafficTrend.map((t, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                          className="w-full bg-indigo-100 group-hover:bg-indigo-500 rounded-t-xl transition-all duration-700 relative" 
                          style={{ height: `${(t.count / maxTrend) * 100}%` }}
                        >
                           <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded font-black">{t.count}</div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{t.day}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-200">
                 <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                   <MousePointer2 className="text-indigo-500" /> Popular Destinations
                 </h3>
                 <div className="space-y-6">
                   {analyticsData.map((item, i) => {
                     const percentage = Math.round((item.count / totalVisits) * 100);
                     return (
                       <div key={i} className="space-y-2">
                         <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                           <span className="text-slate-700">{item.path}</span>
                           <span className="text-slate-400">{item.count} hits</span>
                         </div>
                         <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                           <div 
                             className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                             style={{ width: `${percentage}%` }}
                           />
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

               <div className="bg-indigo-600 rounded-[4rem] p-10 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                 <h3 className="text-xl font-black mb-10 flex items-center gap-3 relative z-10">
                   <Info className="text-indigo-200" /> Intel Overview
                 </h3>
                 <div className="space-y-6 relative z-10">
                   <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Peak Discovery</p>
                      <p className="text-2xl font-black leading-tight">The community gallery remains the primary entry point for unauthenticated sessions.</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Growth Analysis</p>
                      <p className="text-2xl font-black leading-tight">Sync sessions have increased by 14% since the last infrastructure update.</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};
