
import React, { useState, useRef } from 'react';
import { ArrowLeft, Users, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import { Room } from '../types';

interface JoinPinPageProps {
  onBack: () => void;
  onJoin: (room: Room) => void;
}

export const JoinPinPage: React.FC<JoinPinPageProps> = ({ onBack, onJoin }) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleJoin = async (e?: React.FormEvent) => {
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
            onJoin({
                id: room.id,
                pin: room.pin,
                hostId: room.host_id,
                quizId: room.quiz_id,
                status: room.status as any,
                currentQuestionIndex: room.current_question_index,
                createdAt: room.created_at
            });
        }
    } catch (e) {
        setError("Network fault while searching for room.");
    } finally {
        setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').substring(0, 6);
      setPin(val);
      if (val.length === 6) {
          // Auto-submit logic would go here if desired
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center mb-12">
            <Logo variant="medium" className="mb-8 shadow-[0_0_50px_rgba(168,85,247,0.3)]" />
            <h1 className="text-4xl font-black tracking-tighter mb-2">Multiplex Connect</h1>
            <p className="text-indigo-400 font-bold text-sm uppercase tracking-widest">Enter the 6-digit access code</p>
        </div>

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in slide-in-from-top-2">
                <AlertCircle className="flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
            </div>
        )}

        <form onSubmit={handleJoin} className="space-y-8">
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
                    Link Grid
                </button>
                <button 
                    type="button"
                    onClick={onBack}
                    className="w-full py-4 text-slate-500 hover:text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} /> Return
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
