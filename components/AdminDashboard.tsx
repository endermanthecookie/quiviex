
import React, { useState, useEffect } from 'react';
import { User, Feedback } from '../types';
import { ArrowLeft, Shield, Users, MessageSquare, Trash2, CheckCircle, RefreshCw, UserMinus, Reply, Send, X, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'users'>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    if (activeTab === 'feedback') {
        await fetchFeedbacks();
    } else {
        await fetchUsers();
    }
    setIsLoading(false);
  };

  const fetchFeedbacks = async () => {
      try {
          const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;

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
      } catch (error) {
          (window as any).console.error("Error fetching feedback:", error);
      }
  };

  const fetchUsers = async () => {
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
              const mapped: User[] = data.map((p: any) => ({
                  id: p.user_id,
                  username: p.username || 'Unknown',
                  email: p.email || 'No Email',
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
              }));
              setAllUsers(mapped);
          }
      } catch (error) {
          (window as any).console.error("Error fetching users:", error);
          (window as any).alert("Could not fetch users. Check RLS policies.");
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
          (window as any).alert(`Failed to resolve: ${error.message || 'Unknown error'}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleReplyFeedback = async (id: string) => {
      if (!replyContent.trim()) return;
      setProcessingId(id);
      
      try {
          const { error } = await supabase
            .from('feedback')
            .update({ admin_reply: replyContent })
            .eq('id', id);

          if (error) throw error;
          setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, adminReply: replyContent } : f));
          setReplyingTo(null);
          setReplyContent('');
      } catch (error: any) {
          (window as any).console.error(error);
          (window as any).alert(`Failed to send reply: ${error.message || 'Unknown error'}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteFeedback = async (id: string) => {
      if(!(window as any).confirm("Are you sure you want to delete this feedback?")) return;
      setProcessingId(id);
      try {
          const { error } = await supabase.from('feedback').delete().eq('id', id);
          if (error) throw error;
          setFeedbacks(prev => prev.filter(f => f.id !== id));
      } catch (error: any) {
          (window as any).alert(`Failed to delete: ${error.message || 'Unknown error'}`);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!(window as any).confirm("DANGER: This will PERMANENTLY delete the user and all their data. Continue?")) return;
    setProcessingId(userId);
    try {
        const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
        if (error) throw error;
        setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
        (window as any).console.error("Failed to delete user", e);
        (window as any).alert(`Delete failed: ${e.message}`);
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="bg-slate-900 text-white sticky top-0 z-10 px-6 py-4 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
               <Shield className="text-red-500" size={28} />
               <h1 className="text-2xl font-black tracking-tight">Sudo Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={fetchData} className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${isLoading ? 'animate-spin' : ''}`}>
                  <RefreshCw size={20} />
              </button>
              <div className="flex bg-slate-800 rounded-lg p-1">
                 <button onClick={() => setActiveTab('feedback')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'feedback' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                    <MessageSquare size={16} /> Feedback
                 </button>
                 <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                    <Users size={16} /> Users
                 </button>
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
         {isLoading && feedbacks.length === 0 && allUsers.length === 0 && (
             <div className="text-center py-10">
                 <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
             </div>
         )}

         {activeTab === 'feedback' && (
             <div className="space-y-4">
                 <h2 className="text-2xl font-bold mb-6">User Feedback ({feedbacks.length})</h2>
                 {feedbacks.length === 0 && !isLoading ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                         <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                         <p className="text-slate-500 font-bold">No feedback yet.</p>
                     </div>
                 ) : (
                     <div className="grid gap-4">
                         {feedbacks.map(item => (
                             <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                                 <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-wider ${
                                                item.type === 'bug' ? 'bg-red-100 text-red-700' : 
                                                item.type === 'suggestion' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">{new Date(item.date).toLocaleDateString()}</span>
                                            <span className="text-xs font-bold text-indigo-600">@{item.username}</span>
                                        </div>
                                        <p className="text-slate-800 text-lg leading-relaxed">{item.content}</p>
                                        {item.adminReply && (
                                            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                                                <div className="bg-red-100 p-2 rounded-full h-fit"><Reply size={14} className="text-red-600" /></div>
                                                <div>
                                                    <span className="text-xs font-bold text-red-600 uppercase">Sudo Reply</span>
                                                    <p className="text-slate-700 text-sm mt-1">{item.adminReply}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-start gap-2 md:border-l md:pl-6 border-slate-100 flex-shrink-0">
                                        <button onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                                            <Reply size={20} />
                                        </button>
                                        {item.status !== 'resolved' ? (
                                            <button onClick={() => handleResolveFeedback(item.id)} disabled={processingId === item.id} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50">
                                                {processingId === item.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                            </button>
                                        ) : (
                                            <span className="p-3 text-green-500"><CheckCircle size={20} /></span>
                                        )}
                                        <button onClick={() => handleDeleteFeedback(item.id)} disabled={processingId === item.id} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                 </div>
                                 {replyingTo === item.id && (
                                     <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2">
                                         <textarea 
                                             value={replyContent} 
                                             // Fix: Cast e.target to any to access value property
                                             onChange={(e) => setReplyContent((e.target as any).value)} 
                                             placeholder="Type reply..." 
                                             className="flex-1 p-3 border border-blue-100 rounded-xl focus:outline-none focus:border-blue-500 text-sm" 
                                         />
                                         <button onClick={() => handleReplyFeedback(item.id)} disabled={processingId === item.id} className="bg-blue-600 text-white font-bold px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70">
                                             <Send size={18} />
                                         </button>
                                     </div>
                                 )}
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         )}

         {activeTab === 'users' && (
             <div>
                <h2 className="text-2xl font-bold mb-6">Registered Users ({allUsers.length})</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Username</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Stats</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-900">{u.username}</td>
                                    <td className="p-4 text-slate-600 font-mono text-xs sm:text-sm">{u.email}</td>
                                    <td className="p-4 text-sm">
                                        <div className="flex gap-4">
                                            <span className="text-indigo-600 font-bold">{u.stats.quizzesCreated} Created</span>
                                            <span className="text-green-600 font-bold">{u.stats.quizzesPlayed} Played</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDeleteUser(u.id)} disabled={processingId === u.id} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                                            {processingId === u.id ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};
