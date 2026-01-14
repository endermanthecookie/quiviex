import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User } from '../types';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, CheckCircle2, AlertTriangle, Home, Calendar, ShieldX, CheckCircle, Zap, ShieldCheck, Github, Key as KeyIcon, Hash, Shield, Ban } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import { useTranslation } from '../App';

interface AuthProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
  onJoinGame?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify_otp';

export const Auth: React.FC<AuthProps> = ({ onLogin, onBackToLanding, onJoinGame }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suspension, setSuspension] = useState<{ daysLeft: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = useMemo(() => {
    if (mode === 'login') return identifier.length > 0 && password.length > 0;
    if (mode === 'forgot') return email.includes('@');
    return (username.length >= 3 && birthday !== '' && password.length >= 8 && password === confirmPassword && acceptedTerms);
  }, [mode, username, birthday, email, password, confirmPassword, acceptedTerms, identifier]);

  const fetchUserProfile = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (!profile) return null;
    return {
      id: profile.user_id,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      stats: profile.stats || {},
      achievements: profile.achievements || [],
      history: profile.history || [],
      preferences: profile.preferences || {},
      savedQuizIds: profile.saved_quiz_ids || [],
      warnings: profile.warnings || 0
    } as User;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuspension(null);
    setIsLoading(true);
    try {
      let loginEmail = identifier.trim();
      if (!loginEmail.includes('@')) {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('email, warnings, suspended_until').ilike('username', loginEmail).maybeSingle();
        if (profileError || !profile) throw new Error('Account not found.');
        
        // Strike 2 Suspension Check
        if (profile.warnings >= 2 && profile.suspended_until) {
            const until = new Date(profile.suspended_until);
            if (until > new Date()) {
                const diff = until.getTime() - new Date().getTime();
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                setSuspension({ daysLeft: days });
                setIsLoading(false);
                return;
            }
        }
        loginEmail = profile.email;
      }
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) throw signInError;
      if (data.user) {
          const userProfile = await fetchUserProfile(data.user.id);
          if (userProfile) onLogin(userProfile);
      }
    } catch (err: any) { setError(err.message || 'Invalid credentials'); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f1f5f9] animate-in fade-in duration-700">
      <div className="max-w-[480px] rounded-[3rem] border-white bg-white p-8 sm:p-12 w-full shadow-[0_30px_60px_rgba(0,0,0,0.08)] flex flex-col items-center border relative overflow-hidden transition-all duration-500">
        <div className="w-full flex justify-between items-center mb-8 relative z-10">
            <button onClick={onBackToLanding} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 group click-scale"><Home size={22} /></button>
            <Logo variant="medium" />
            <button onClick={onJoinGame} className="p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-indigo-400 group click-scale"><Zap size={22} /></button>
        </div>
        
        <div className="text-center mb-8 relative z-10">
            <h2 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">
                {mode === 'login' ? t('auth.sign_in') : mode === 'signup' ? t('auth.sign_up') : t('auth.reset_password')}
            </h2>
        </div>

        {suspension && (
            <div className="w-full bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] mb-8 animate-in bounce-in">
                <div className="flex items-center gap-4 text-rose-600 mb-2">
                    <Ban size={24} />
                    <span className="font-black uppercase tracking-widest text-sm">Access Revoked</span>
                </div>
                <p className="text-slate-800 font-bold leading-relaxed">
                    Account is suspended. Wait <span className="text-rose-600 font-black">{suspension.daysLeft}</span> day(s) until unbanned.
                </p>
                <p className="text-slate-400 text-[10px] font-black uppercase mt-3 tracking-widest italic">Protocol: Strike 02 Enforcement</p>
            </div>
        )}

        {error && !suspension && <div className="w-full bg-rose-50 text-rose-500 p-4 rounded-2xl mb-6 text-xs font-black border border-rose-100 flex items-center gap-3 justify-center"><AlertTriangle size={18} />{error}</div>}

        <form onSubmit={handleLogin} className="w-full space-y-4 relative z-10">
            {mode === 'login' && !suspension && (
                <>
                <input type="text" placeholder={t('auth.username') + " / " + t('auth.email')} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <button type="submit" disabled={isLoading || !isFormValid} className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 click-scale shadow-lg transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />} 
                    {t('auth.sign_in')}
                </button>
                </>
            )}
        </form>
      </div>
    </div>
  );
};
