
import React, { useState, useRef } from 'react';
import { ArrowLeft, Users, Zap, Loader2, AlertCircle, Check } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import { Room } from '../types';

interface JoinPinPageProps {
  onBack: () => void;
  onJoin: (room: Room) => void;
}

export const JoinPinPage: React.FC<JoinPinPageProps> = ({ onBack, onJoin }) => {
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'pin' | 'name'>('pin');
  const [username, setUsername] = useState('');
  const [tempRoom, setTempRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidatePin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('pin', pin)
            .eq('status', 'waiting')
            .single();

        if (roomError || !room) {
            setError("Invalid PIN or the game has already started.");
        } else {
            const roomObj: Room = {
                id: room.id,
                pin: room.pin,
                hostId: room.host_id,
                quizId: room.quiz_id,
                status: room.status as any,
                currentQuestionIndex: room.current_question_index,
                createdAt: room.created_at
            };
            setTempRoom(roomObj);
            setStep('name');
        }
    } catch (e) {
        setError("Connection error while searching for game.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleFinishJoin = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!username.trim() || !tempRoom) return;
      
      // Store the name so Lobby can pick it up
      sessionStorage.setItem('qx_temp_username', username.trim());
      onJoin(tempRoom);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').substring(0, 6);
      setPin(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      
      {/* Name Entry Popup Step */}
      {step === 'name' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-slate-900 shadow-2xl animate-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight mb-2">Enter Name</h3>
                    <p className="text-slate-500 font-bold text-sm">Almost there! What should we call you in the game?</p>
                </div>

                <form onSubmit={handleFinishJoin} className="space-y-6">
                    <input 
                        type="text"
                        placeholder="Username..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xl font-bold focus:outline-none focus:border-indigo-500 transition-all"
                        maxLength={15}
                        autoFocus
                    />
                    <button 
                        type="submit"
                        disabled={username.trim().length < 2}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-indigo-700 transition-all click-scale disabled:opacity-50 shadow-xl"
                    >
                        Done
                    </button>
                </form>
            </div>
        </div>
      )}

      <div className={`max-w-md w-full transition-all duration-500 ${step === 'name' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <div className="flex flex-col items-center text-center mb-12">
            <Logo variant="medium" className="mb-8 shadow-[0_0_50px_rgba(168,85,247,0.3)]" />
            <h1 className="text-4xl font-black tracking-tighter mb-2">Join a Game</h1>
            <p className="text-indigo-400 font-bold text-sm uppercase tracking-widest">Enter the 6-digit game PIN</p>
        </div>

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
            </div>
        )}

        <form onSubmit={handleValidatePin} className="space-y-8">
            <div className="relative group">
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="000000"
                    value={pin}
                    onChange={handlePinChange}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-3xl p-8 text-center text-6xl font-black tracking-[0.3em] focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-white/5"
                    maxLength={6}
                    autoFocus
                />
                <div className="absolute inset-0 pointer-events-none rounded-3xl group-focus-within:shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-shadow"></div>
            </div>

            <div className="flex flex-col gap-4">
                <button 
                    type="submit"
                    disabled={isLoading || pin.length !== 6}
                    className="w-full bg-white text-slate-950 py-6 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl flex items-center justify-center gap-4 click-scale disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={24} className="text-indigo-600" />}
                    Next
                </button>
                <button 
                    type="button"
                    onClick={onBack}
                    className="w-full py-4 text-slate-500 hover:text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} /> Cancel
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
