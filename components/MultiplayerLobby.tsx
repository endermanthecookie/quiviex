
import React, { useState, useEffect } from 'react';
import { Room, Participant, User, Quiz } from '../types';
import { supabase } from '../services/supabase';
import { ArrowLeft, Users, Play, Loader2, Copy, Check, Shield, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';

interface MultiplayerLobbyProps {
  room: Room;
  user: User | null;
  onBack: () => void;
  onStart: (quiz: Quiz) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ room, user, onBack, onStart }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempUsername, setTempUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [copied, setCopied] = useState(false);

  const isHost = user?.id === room.hostId;

  useEffect(() => {
    fetchInitialData();
    const subscription = subscribeToParticipants();
    const roomSub = subscribeToRoomStatus();
    
    return () => {
        supabase.removeChannel(subscription);
        supabase.removeChannel(roomSub);
    };
  }, [room.id]);

  const fetchInitialData = async () => {
      const { data: q } = await supabase.from('quizzes').select('*').eq('id', room.quizId).single();
      if (q) setQuizData({
          id: q.id, userId: q.user_id, title: q.title, questions: q.questions, 
          createdAt: q.created_at, theme: q.theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music
      });

      const { data: p } = await supabase.from('room_participants').select('*').eq('room_id', room.id);
      setParticipants(p?.map(part => ({
          id: part.user_id, username: part.username, score: part.score, isHost: part.user_id === room.hostId, lastActive: part.last_active
      })) || []);

      // Auto-join if user is logged in
      if (user && !hasJoined) handleJoin(user.username);
      
      setIsLoading(false);
  };

  const subscribeToParticipants = () => {
      return supabase
        .channel(`room-participants-${room.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` }, payload => {
            fetchInitialData(); // Simpler than complex state diffing for a lobby
        })
        .subscribe();
  };

  const subscribeToRoomStatus = () => {
      return supabase
        .channel(`room-status-${room.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, payload => {
            const updated = payload.new as any;
            if (updated.status === 'playing' && quizData) {
                onStart(quizData);
            }
        })
        .subscribe();
  };

  const handleJoin = async (name: string) => {
      if (!name.trim()) return;
      const { error } = await supabase.from('room_participants').upsert({
          room_id: room.id,
          user_id: user?.id || `temp-${Date.now()}`,
          username: name,
          score: 0
      });
      if (!error) setHasJoined(true);
  };

  const handleStartSession = async () => {
      if (!isHost) return;
      await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id);
  };

  const handleCopyLink = () => {
      const link = `${window.location.origin}/${room.pin}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-12 flex flex-col font-['Plus_Jakarta_Sans']">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        
        <header className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Multiplayer Sync</h1>
                    <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Waiting for synchronization</p>
                </div>
            </div>
            <Logo variant="small" className="shadow-2xl" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
            <div className="lg:col-span-2 space-y-12">
                <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Users size={200} /></div>
                    <div className="relative z-10 text-center sm:text-left">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Repository Ident</h2>
                        <h3 className="text-4xl sm:text-5xl font-black text-white mb-10 tracking-tight leading-none">{quizData?.title || 'Loading...'}</h3>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="bg-slate-900 border-2 border-indigo-500/30 p-8 rounded-[2.5rem] flex-1 text-center group">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Room Entry PIN</p>
                                <div className="text-7xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all group-hover:scale-105">{room.pin}</div>
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                className="h-full bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 transition-all click-scale min-w-[160px]"
                            >
                                {copied ? <Check className="text-emerald-400" /> : <Copy className="text-slate-400" />}
                                <span className="text-xs font-black uppercase tracking-widest">{copied ? 'Copied' : 'Direct Link'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                        <Users size={18} className="text-indigo-400" /> Linked Participants <span className="text-indigo-600">({participants.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-in">
                        {participants.map((p, i) => (
                            <div key={i} className="bg-slate-900 border border-white/5 p-5 rounded-3xl flex items-center gap-4 transition-all hover:bg-indigo-500/10 hover:border-indigo-500/20">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.isHost ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                    {p.isHost ? <Shield size={18} className="text-white" /> : <UserIcon size={18} className="text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black truncate">@{p.username}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase">{p.isHost ? 'Host' : 'Member'}</p>
                                </div>
                            </div>
                        ))}
                        {participants.length === 0 && <div className="col-span-full py-10 text-center text-slate-600 font-bold italic">Establishing connection grid...</div>}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {!hasJoined ? (
                    <div className="bg-indigo-600 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-500">
                        <h3 className="text-2xl font-black mb-6">Initialize Identity</h3>
                        <input 
                            type="text" 
                            placeholder="Enter Display Name..." 
                            value={tempUsername}
                            onChange={(e) => setTempUsername((e.target as any).value)}
                            className="w-full bg-black/20 border-2 border-white/10 rounded-2xl p-5 mb-6 focus:outline-none focus:border-white font-bold text-lg"
                        />
                        <button 
                            onClick={() => handleJoin(tempUsername)}
                            className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-lg shadow-xl click-scale uppercase"
                        >
                            Connect to Room
                        </button>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-10 text-center">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><Check size={32} /></div>
                        <h3 className="text-2xl font-black mb-2">Grid Connected</h3>
                        <p className="text-emerald-400 font-bold text-sm">Synchronization will begin when the host initializes the module.</p>
                    </div>
                )}

                {isHost && (
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl">
                         <h3 className="text-slate-900 text-2xl font-black mb-2">Architect Console</h3>
                         <p className="text-slate-500 font-bold text-sm mb-8">Begin the session for all connected participants. The room will be locked upon start.</p>
                         <button 
                            onClick={handleStartSession}
                            disabled={participants.length === 0}
                            className="w-full bg-slate-950 hover:bg-black text-white py-6 rounded-2xl font-black text-xl shadow-xl click-scale flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                         >
                            <Play fill="currentColor" /> Start Protocol
                         </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
