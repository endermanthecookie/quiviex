
import React, { useState } from 'react';
// Fix: Import User as UserIcon to resolve "Cannot find name 'UserIcon'" error
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
    
    // Basic validation
    if (trimmed.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        setError("Username can only contain letters, numbers, and underscores.");
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        // Precise availability check
        const { data, error: queryError } = await supabase
            .from('profiles')
            .select('user_id')
            .ilike('username', trimmed)
            .maybeSingle();

        if (queryError) throw queryError;
        
        if (data) {
            setError("This username is already taken.");
            setIsLoading(false);
            return;
        }

        onComplete(trimmed);
    } catch (e: any) {
        (window as any).console.error(e);
        setError(e.message || "Error checking username availability.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-violet-900 to-slate-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 max-w-md w-full animate-in fade-in zoom-in duration-300 relative z-10">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo variant="medium" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Almost there!</h1>
          <p className="text-slate-500 font-medium">
            Choose a unique username to complete your profile.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 flex items-center gap-3">
             <div className="bg-slate-200 p-2 rounded-full text-slate-500">
                 <UserIcon size={18} />
             </div>
             <div className="flex-1 overflow-hidden">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Account</div>
                 <div className="text-sm font-bold text-slate-700 truncate" title={email}>{email}</div>
             </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername((e.target as any).value.replace(/\s/g, ''))}
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none transition-all font-bold text-lg bg-white text-black ${error ? 'border-red-300 focus:border-red-500 text-red-900' : 'border-slate-200 focus:border-violet-600'}`}
                  placeholder="e.g. QuizMaster99"
                  maxLength={20}
                  autoFocus
                />
                <div className="absolute right-4 top-4 text-slate-300 pointer-events-none font-medium">
                    {username.length}/20
                </div>
              </div>
              {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-bold mt-2 animate-in slide-in-from-top-1">
                      <AlertCircle size={14} /> {error}
                  </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !username}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-violet-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              Complete Signup
            </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
            >
                <LogOut size={14} /> Cancel & Sign Out
            </button>
        </div>

      </div>
    </div>
  );
};
