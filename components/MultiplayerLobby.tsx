
import React, { useState, useEffect, useRef } from 'react';
import { Room, Participant, User, Quiz } from '../types';
import { supabase } from '../services/supabase';
import { ArrowLeft, Users, Play, Loader2, Copy, Check, Shield, User as UserIcon, LogOut, Terminal } from 'lucide-react';
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
  
  const quizDataRef = useRef<Quiz | null>(null);
  const isHost = user?.id === room.hostId;

  const getPersistentGuestId = () => {
    let gid = sessionStorage.getItem('qx_guest_id');
    if (!gid) {
      gid = `player-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('qx_guest_id', gid);
    }
    return gid;
  };

  useEffect(() => {
    fetchInitialData();
    
    // Listen for players joining/leaving
    const subscription = supabase
        .channel(`room-participants-${room.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` }, () => {
            fetchParticipants();
        })
        .subscribe();

    // Listen for the Host starting the game
    const roomSub = supabase
        .channel(`room-status-${room.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, payload => {
            const updated = payload.new as any;
            if (updated.status === 'playing') {
                // IMPORTANT: We use the Ref to ensure we have the data even if state hasn't re-rendered
                if (quizDataRef.current) {
                    onStart(quizDataRef.current);
                } else {
                    // Fallback: if data isn't here yet, fetch it immediately and then start
                    fetchQuizAndStart();
                }
            }
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(subscription);
        supabase.removeChannel(roomSub);
    };
  }, [room.id]);

  const fetchQuizAndStart = async () => {
      const { data: q } = await supabase.from('quizzes').select('*').eq('id', room.quizId).single();
      if (q) {
          const mappedQuiz = {
              id: q.id, userId: q.user_id, title: q.title, questions: q.questions, 
              createdAt: q.created_at, theme: q.theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music
          };
          onStart(mappedQuiz);
      }
  };

  const fetchParticipants = async () => {
      const { data: p } = await supabase.from('room_participants').select('*').eq('room_id', room.id);
      setParticipants(p?.map(part => ({
          id: part.user_id, 
          username: part.username, 
          score: part.score, 
          isHost: part.user_id === room.hostId, 
          lastActive: part.last_active
      })) || []);
  };

  const fetchInitialData = async () => {
      const { data: q } = await supabase.from('quizzes').select('*').eq('id', room.quizId).single();
      if (q) {
          const mapped = {
              id: q.id, userId: q.user_id, title: q.title, questions: q.questions, 
              createdAt: q.created_at, theme: q.theme, shuffleQuestions: q.shuffle_questions, backgroundMusic: q.background_music
          };
          setQuizData(mapped);
          quizDataRef.current = mapped;
      }

      await fetchParticipants();

      if (user && !hasJoined) {
          handleJoin(user.username);
      }
      
      setIsLoading(false);
  };

  const handleJoin = async (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) return;
      
      const userId = user?.id || getPersistentGuestId();
      
      const { error } = await supabase.from('room_participants').upsert({
          room_id: room.id,
          user_id: userId,
          username: trimmedName,
          score: 0
      }, { onConflict: 'room_id, user_id' });
      
      if (!error) {
          setHasJoined(true);
          fetchParticipants();
      }
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

  const displayPlayers = participants.filter(p => p.id !== room.hostId);

  return (
    <div className="min-h-screen bg-[#05010d] text-white p-6 sm:p-12 flex flex-col font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative z-10">
        
        <header className="flex justify-between items-center mb-12 animate-in slide-in-from-top duration-700">
            <div className="flex items-center gap-6">
                <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all border border-white/5 click-scale"><ArrowLeft size={24} /></button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">Game Lobby</h1>
                    <div className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-[0.4em] mt-1">
                        Waiting for Players
                    </div>
                </div>
            </div>
            <Logo variant="small" className="shadow-2xl" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1">
            <div className="lg:col-span-2 space-y-10">
                <div className="bg-white/[0.03] border border-white/10 rounded-[4rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-1000">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150 pointer-events-none"><Users size={300} /></div>
                    <div className="relative z-10">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6">Quiz Title</h2>
                        <h3 className="text-5xl sm:text-7xl font-black text-white mb-12 tracking-tighter leading-[0.8]">{quizData?.title || 'Loading...'}</h3>
                        
                        <div className="flex flex-col sm:flex-row items-stretch gap-6">
                            <div className="bg-[#0a0a0f] border-2 border-indigo-500/20 p-8 rounded-[3rem] flex-1 text-center group transition-all hover:border-indigo-500/40">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 opacity-60">Game PIN</p>
                                <div className="text-7xl sm:text-8xl font-black tracking-[0.1em] text-white drop-shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-all group-hover:scale-105 select-all">{room.pin}</div>
                            </div>
                            <button 
                                onClick={handleCopyLink}
                                className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 px-10 py-8 rounded-[3rem] flex flex-col items-center justify-center gap-3 transition-all click-scale min-w-[180px] group"
                            >
                                {copied ? <Check className="text-emerald-400" size={32} /> : <Copy className="text-slate-400 group-hover:text-white transition-colors" size={32} />}
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">{copied ? 'Link Copied' : 'Invite Players'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10 animate-in slide-in-from-bottom-10 duration-1000">
                    <div className="flex items-center justify-between mb-10">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                            <Users size={16} className="text-indigo-400" /> Players
                        </h4>
                        <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-1.5 rounded-full">
                            <span className="text-indigo-400 font-black text-xs">{displayPlayers.length} JOINED</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {displayPlayers.map((p, i) => (
                            <div key={p.id} className="bg-slate-900/50 border border-white/5 p-5 rounded-[2rem] flex flex-col items-center text-center gap-3 transition-all hover:bg-indigo-500/5 hover:border-indigo-500/20 animate-in fade-in zoom-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 border border-white/5 shadow-inner">
                                    <UserIcon size={24} />
                                </div>
                                <div className="w-full">
                                    <p className="text-sm font-black truncate px-2">@{p.username}</p>
                                </div>
                            </div>
                        ))}
                        {displayPlayers.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-700 font-black uppercase tracking-[0.3em] text-xs border-2 border-dashed border-white/5 rounded-[3rem]">
                                Waiting for players to join...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6 animate-in slide-in-from-right duration-1000">
                {!isHost && !hasJoined && (
                    <div className="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-500 border border-indigo-400 relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <h3 className="text-2xl font-black mb-6 tracking-tight relative z-10">Enter Name</h3>
                        <div className="space-y-4 relative z-10">
                            <input 
                                type="text" 
                                placeholder="Your display name..." 
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                className="w-full bg-black/20 border-2 border-white/10 rounded-2xl p-5 focus:outline-none focus:border-white font-bold text-lg placeholder:text-white/20 transition-all"
                                maxLength={15}
                            />
                            <button 
                                onClick={() => handleJoin(tempUsername)}
                                disabled={tempUsername.trim().length < 2}
                                className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-lg shadow-xl click-scale uppercase tracking-widest disabled:opacity-50 transition-all"
                            >
                                Join Game
                            </button>
                        </div>
                    </div>
                )}

                {hasJoined && !isHost && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] p-12 text-center shadow-2xl animate-in fade-in flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-bounce"><Check size={40} /></div>
                        <h3 className="text-2xl font-black mb-3 tracking-tight text-white">You're In!</h3>
                        <p className="text-emerald-400 font-bold text-sm leading-relaxed uppercase tracking-wider">Waiting for host<br/>to start the game.</p>
                    </div>
                )}

                {isHost && (
                    <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-indigo-100 animate-in slide-in-from-bottom-6 duration-1000 flex flex-col h-full lg:h-auto">
                         <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-indigo-600" size={20} />
                            <h3 className="text-slate-900 text-xl font-black uppercase tracking-widest">Host Controls</h3>
                         </div>
                         <p className="text-slate-500 font-bold text-base mb-10 leading-relaxed">
                            Once everyone is in the lobby, click the button below to start the quiz for all players.
                         </p>
                         <button 
                            onClick={handleStartSession}
                            className="w-full bg-slate-950 hover:bg-black text-white py-8 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] click-scale flex items-center justify-center gap-4 transition-all group"
                         >
                            <Play fill="currentColor" className="group-hover:scale-110 transition-transform" /> START GAME
                         </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
