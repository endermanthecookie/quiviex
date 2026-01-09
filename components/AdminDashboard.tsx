import React, { useState, useEffect } from 'react';
import { User, Feedback } from '../types';
import { ArrowLeft, Shield, Users, MessageSquare, Trash2, CheckCircle, RefreshCw, UserMinus, Reply, Send, X, Loader2, ShieldX, UserCheck, AlertCircle, Database, Copy, Star, Hash } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  onBack: () => void;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'users' | 'bans' | 'ratings'>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [allUsers, setAllUsers] = useState<(User & { warnings?: number })[]>([]);
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setMissingTables([]);
    if (activeTab === 'feedback') {
        await fetchFeedbacks();
    } else if (activeTab === 'users') {
        await fetchUsers();
    } else if (activeTab === 'bans') {
        await fetchBans();
    } else if (activeTab === 'ratings') {
        await fetchRatings();
    }
    setIsLoading(false);
  };

  const fetchRatings = async () => {
      try {
          const { data, error } = await supabase
              .from('ratings')
              .select('*, quizzes(title), profiles(username)')
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
                  username: r.profiles?.username || 'Unknown User'
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
                  stats: p.stats || {
                      quizzesCreated: 0,
                      quizzesPlayed: 0,
                      questionsAnswered: 0,
                      perfectScores: 0,
                      studySessions: 0,
                      aiQuizzesGenerated: 0,
                      aiImagesGenerated: 0
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
          const { error } = await supabase
            .from('feedback')
            .update({ status: 'resolved' })
            .eq('id', id);

          if (error) throw error;
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: 'resolved' as const } : f));
      } catch (error: any) {
          alert(`Failed to resolve: ${error.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleReplyFeedback = async (id: string) => {
      if (!replyContent.trim()) return;
      setProcessingId(id);
      try {
          const { error } = await supabase.from('feedback').update({ admin_reply: replyContent }).eq('id', id);
          if (error) throw error;
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, adminReply: replyContent } : f));
          setReplyingTo(null);
          setReplyContent('');
      } catch (error: any) {
          alert(`Failed to send reply: ${error.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteFeedback = async (id: string) => {
      if (!confirm("Are you sure you want to delete this feedback log?")) return;
      setProcessingId(id);
      try {
          const { error } = await supabase.from('feedback').delete().eq('id', id);
          if (error) {
              if (error.code === '42501') throw new Error("Permission Denied: Run the SQL feedback policy script.");
              throw error;
          }
          setFeedbacks(prev => prev.filter(f => f.id !== id));
      } catch (error: any) {
          alert(`Deletion Failure: ${error.message}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteRating = async (id: number) => {
      if (!confirm("Remove this rating entry? This affects the quiz average score.")) return;
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
    if (!confirm("SUDO DANGER: This will PERMANENTLY erase this profile from the database. Proceed?")) return;
    setProcessingId(userId);
    try {
        const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
        if (error) {
            if (error.code === '42501') throw new Error("Permission Denied: Run the 'Admins can delete any profile' SQL policy.");
            throw error;
        }
        setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
        alert(`Architect Deletion Failure: ${e.message}`);
    } finally {
        setProcessingId(null);
    }
  };

  const handleResetStrikes = async (userId: string) => {
      setProcessingId(userId);
      try {
          const { error } = await supabase.from('profiles').update({ warnings: 0 }).eq('user_id', userId);
          if (error) throw error;
          setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, warnings: 0 } : u));
      } catch (e: any) {
          alert("Failed to reset strikes: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleUnbanEmail = async (email: string) => {
      setProcessingId(email);
      try {
          const { error } = await supabase.from('banned_emails').delete().eq('email', email);
          if (error) throw error;
          setBannedEmails(prev => prev.filter(b => b.email !== email));
      } catch (e: any) {
          alert("Unban failed: " + e.message);
      } finally {
          setProcessingId(null);
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-['Plus_Jakarta_Sans']">
      <div className="bg-slate-900 text-white sticky top-0 z-10 px-6 py-4 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
               <Shield className="text-rose-500" size={28} />
               <h1 className="text-2xl font-black tracking-tight">Sudo Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={fetchData} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
                  <RefreshCw size={20} />
              </button>
              <div className="flex bg-slate-800 rounded-xl p-1">
                 {[
                   { id: 'feedback', icon: MessageSquare, label: 'Logs' },
                   { id: 'users', icon: Users, label: 'Units' },
                   { id: 'ratings', icon: Star, label: 'Scores' },
                   { id: 'bans', icon: ShieldX, label: 'Blacklist' }
                 ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)} 
                        className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-slate-600 text-white shadow-inner' : 'text-slate-500 hover:text-white'}`}
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
             <div className="mb-8 p-8 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 shadow-sm">
                 <div className="flex items-start gap-5">
                     <div className="bg-rose-500 p-3 rounded-2xl text-white shadow-lg"><Database size={24} /></div>
                     <div className="flex-1">
                         <h3 className="text-xl font-black text-rose-900 mb-2 uppercase tracking-tight">Database Schema Error</h3>
                         <p className="text-rose-700 font-bold mb-4 leading-relaxed">
                             The relation <code className="bg-white/50 px-2 py-0.5 rounded">"{missingTables[0]}"</code> does not exist in your Supabase project. 
                         </p>
                         <button 
                            onClick={() => {
                                const sql = `-- SQL Code provided in Chat!`;
                                navigator.clipboard.writeText(sql);
                                alert("Setup logic copied. Run the provided SQL in your Supabase dash.");
                            }}
                            className="bg-white border-2 border-rose-200 text-rose-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center gap-2"
                        >
                             <Copy size={14} /> Copy Setup Logic
                         </button>
                     </div>
                 </div>
             </div>
         )}

         {isLoading && (
             <div className="fixed top-24 right-10 z-50">
                 <div className="animate-spin w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full"></div>
             </div>
         )}

         {activeTab === 'feedback' && !missingTables.includes('feedback') && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-tight">Incoming Logs <span className="text-slate-400 ml-2">({feedbacks.length})</span></h2>
                 </div>
                 
                 {feedbacks.length === 0 && !isLoading ? (
                     <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-sm">
                         <MessageSquare className="mx-auto text-slate-100 mb-6" size={80} />
                         <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">No Active Reports</p>
                     </div>
                 ) : (
                     <div className="grid gap-6">
                         {feedbacks.map(item => (
                             <div key={item.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col gap-6 relative overflow-hidden">
                                 {item.status === 'resolved' && <div className="absolute top-0 right-0 p-3 bg-emerald-500 text-white rounded-bl-2xl font-black text-[10px] uppercase tracking-widest">Resolved</div>}
                                 <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                item.type === 'bug' ? 'bg-rose-100 text-rose-600 border border-rose-200' : 
                                                item.type === 'suggestion' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                            <span className="text-sm font-black text-indigo-600">@{item.username}</span>
                                        </div>
                                        <p className="text-slate-800 text-xl font-bold leading-relaxed">{item.content}</p>
                                        
                                        {item.adminReply && (
                                            <div className="mt-8 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex gap-4">
                                                <div className="bg-rose-100 p-2.5 rounded-xl h-fit shadow-sm"><Reply size={16} className="text-rose-600" /></div>
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-1 block">Infrastructure Reply</span>
                                                    <p className="text-slate-700 font-medium italic">{item.adminReply}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-start gap-3 md:border-l md:pl-8 border-slate-100 flex-shrink-0">
                                        <button onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all click-scale" title="Respond">
                                            <Reply size={22} />
                                        </button>
                                        {item.status !== 'resolved' && (
                                            <button onClick={() => handleResolveFeedback(item.id)} disabled={processingId === item.id} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all click-scale disabled:opacity-50" title="Mark Resolved">
                                                <CheckCircle size={22} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteFeedback(item.id)} disabled={processingId === item.id} className="p-4 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all click-scale disabled:opacity-50" title="Delete">
                                            <Trash2 size={22} />
                                        </button>
                                    </div>
                                 </div>
                                 {replyingTo === item.id && (
                                     <div className="mt-4 flex gap-4 animate-in slide-in-from-top-4 duration-300">
                                         <textarea 
                                             value={replyContent} 
                                             onChange={(e) => setReplyContent((e.target as any).value)} 
                                             placeholder="Type reply to unit..." 
                                             className="flex-1 p-5 bg-slate-50 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white text-base font-bold shadow-inner" 
                                         />
                                         <button onClick={() => handleReplyFeedback(item.id)} disabled={processingId === item.id || !replyContent.trim()} className="bg-indigo-600 text-white font-black px-8 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 click-scale">
                                             {processingId === item.id ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                                         </button>
                                     </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}

         {activeTab === 'users' && !missingTables.includes('profiles') && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black mb-8 tracking-tight">Active User Profiles <span className="text-slate-400 ml-2">({allUsers.length})</span></h2>
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                                <tr>
                                    <th className="p-6 pl-10">Unit Identity</th>
                                    <th className="p-6">Infrastructure Email</th>
                                    <th className="p-6">Strikes</th>
                                    <th className="p-6 text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/50">
                                        <td className="p-6 pl-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center font-black text-indigo-600 uppercase">{u.username.charAt(0)}</div>
                                                <span className="font-bold">@{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-500 text-sm font-medium">{u.email}</td>
                                        <td className="p-6">
                                            <div className="flex gap-1">
                                                {[1,2,3].map(i => (
                                                    <div key={i} className={`w-3 h-3 rounded-full ${i <= (u.warnings || 0) ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6 pr-10 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleResetStrikes(u.id)} disabled={processingId === u.id || (u.warnings || 0) === 0} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 disabled:opacity-20 transition-all"><UserCheck size={18} /></button>
                                                <button onClick={() => handleDeleteUser(u.id)} disabled={processingId === u.id || u.email === 'sudo@quiviex.com'} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 disabled:opacity-20 transition-all"><UserMinus size={18} /></button>
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

         {activeTab === 'ratings' && !missingTables.includes('ratings') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black mb-8 tracking-tight">Active Ratings <span className="text-slate-400 ml-2">({ratings.length})</span></h2>
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-[0.3em]">
                                <tr>
                                    <th className="p-6 pl-10">Architect</th>
                                    <th className="p-6">Target Module</th>
                                    <th className="p-6">Core Score</th>
                                    <th className="p-6">Timestamp</th>
                                    <th className="p-6 text-right pr-10">Erasure</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ratings.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 pl-10">
                                            <span className="font-bold text-indigo-600">@{r.username}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Hash size={14} className="text-slate-300" />
                                                <span className="font-bold text-slate-800">{r.quiz_title}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-1">
                                                {[1,2,3,4,5].map(star => (
                                                    <Star key={star} size={14} className={`${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-400 text-xs font-bold uppercase">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 pr-10 text-right">
                                            <button 
                                                onClick={() => handleDeleteRating(r.id)} 
                                                disabled={processingId === r.id}
                                                className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all click-scale"
                                            >
                                                {processingId === r.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {ratings.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No ratings detected</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
         )}

         {activeTab === 'bans' && !missingTables.includes('banned_emails') && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-black tracking-tight">Email Blacklist</h2>
                </div>
                <div className="bg-white rounded-[3rem] shadow-xl border border-rose-100 overflow-hidden">
                    {bannedEmails.length === 0 ? (
                        <div className="text-center py-32"><p className="text-slate-400 font-bold uppercase">Global Blacklist Clear</p></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-rose-50 border-b border-rose-100 text-rose-400 uppercase text-[10px] font-black tracking-[0.3em]">
                                <tr>
                                    <th className="p-6 pl-10">Banned Identity</th>
                                    <th className="p-6">Reason</th>
                                    <th className="p-6 text-right pr-10">Revoke Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-50">
                                {bannedEmails.map(b => (
                                    <tr key={b.email}>
                                        <td className="p-6 pl-10 font-bold">{b.email}</td>
                                        <td className="p-6 text-rose-600 text-xs font-bold">{b.reason}</td>
                                        <td className="p-6 pr-10 text-right">
                                            <button onClick={() => handleUnbanEmail(b.email)} className="text-emerald-600 font-black text-xs uppercase hover:underline">Unban Unit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
             </div>
         )}
      </div>
    </div>
  );
};