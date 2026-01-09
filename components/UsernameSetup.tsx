
import React, { useState } from 'react';
import { User as UserIcon, ArrowRight, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';

interface UsernameSetupProps {
  email: string;
  onComplete: (username: string) => void;
  onCancel: () => void;
}

export const UsernameSetup: React.FC<UsernameSetupProps> = ({ email, onComplete, onCancel }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    
    // Validation
    if (trimmed.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        setError("Letters, numbers, and underscores only.");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        const { data, error: queryError } = await supabase
            .from('profiles')
            .select('user_id')
            .ilike('username', trimmed)
            .maybeSingle();

        if (queryError) throw queryError;
        
        if (data) {
            setError("Username already taken.");
            setIsLoading(false);
            return;
        }

        onComplete(trimmed);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Error checking username.");
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-indigo-950/90 backdrop-blur-2xl flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-white/20 p-8 sm:p-12 max-w-md w-full animate-in zoom-in duration-300 relative">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo variant="medium" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Claim Username</h1>
          <p className="text-slate-500 font-bold">
            Create your unique identity on Quiviex.
          </p>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">(Minimum 3 characters)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unique Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  className={`w-full px-6 py-5 border-2 rounded-3xl focus:outline-none transition-all font-bold text-lg bg-slate-50 text-slate-900 ${error ? 'border-rose-200 focus:border-rose-400 text-rose-900' : 'border-slate-100 focus:border-indigo-500'}`}
                  placeholder="e.g. Quiviex_Master"
                  maxLength={20}
                  autoFocus
                />
              </div>
              {error && (
                  <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-tight mt-3 animate-in slide-in-from-top-1">
                      <AlertCircle size={14} /> {error}
                  </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || username.length < 3}
              className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
              Finish Setup
            </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto transition-colors"
            >
                <LogOut size={14} /> Log Out
            </button>
        </div>

      </div>
    </div>
  );
};
