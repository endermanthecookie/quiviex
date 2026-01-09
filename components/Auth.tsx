
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User } from '../types';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, CheckCircle2, AlertTriangle, Home, Calendar, ShieldX, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
  onJoinGame?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin, onBackToLanding, onJoinGame }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isUnder13, setIsUnder13] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | 'discord' | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Age calculation logic for privacy shielding
  useEffect(() => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setIsUnder13(age < 13);
    } else {
      setIsUnder13(false);
    }
  }, [birthday]);

  const clearErrors = () => { setError(''); setSuccessMsg(''); };

  const isFormValid = useMemo(() => {
    if (mode === 'login') return true;
    if (mode === 'forgot') return email.includes('@');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = isUnder13 ? true : emailRegex.test(email);

    return (
      username.length >= 3 &&
      birthday !== '' &&
      isEmailValid &&
      password.length >= 8 &&
      password === confirmPassword &&
      acceptedTerms
    );
  }, [mode, username, birthday, email, password, confirmPassword, acceptedTerms, isUnder13]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    if (!captchaToken) { setError("Please complete the security check."); return; }
    
    setIsLoading(true);
    try {
      // If under 13, generate a private shadow email
      const finalEmail = isUnder13 
        ? `${username.toLowerCase()}@u13.quiviex.internal` 
        : email.trim();

      const { error: signupError } = await supabase.auth.signUp({ 
        email: finalEmail, 
        password,
        options: { 
          data: { 
            username: username.trim(), 
            // Privacy Shield: Only store year/bracket for children
            birthday_type: isUnder13 ? 'protected' : 'standard',
            age_group: isUnder13 ? 'under_13' : 'adult'
          } 
        }
      });

      if (signupError) throw signupError;
      
      if (isUnder13) {
        setSuccessMsg("Account created! You can now sign in with your username.");
        setTimeout(() => setMode('login'), 2000);
      } else {
        setSuccessMsg("Check your email for confirmation!");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);
    try {
      let loginEmail = identifier.trim();
      
      // If user enters a username instead of email
      if (!loginEmail.includes('@')) {
        const { data, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', loginEmail)
            .single();
        
        if (profileError || !data?.email) throw new Error('Account not found. Check your username.');
        loginEmail = data.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: loginEmail, 
          password 
      });
      
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'discord') => {
    clearErrors();
    setOauthLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`${provider} authentication failed.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8fafc] animate-in fade-in duration-700">
      <div className="glass rounded-[3rem] p-8 sm:p-12 max-w-[480px] w-full animate-in zoom-in-95 duration-500 relative z-10 border border-white shadow-2xl flex flex-col items-center">
        
        <div className="w-full flex justify-between items-center mb-6">
          <button onClick={onBackToLanding} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 group">
             <Home size={22} className="group-hover:text-indigo-600 transition-colors" />
          </button>
          <Logo variant="medium" className="shadow-lg" />
          <button onClick={onJoinGame} className="p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-indigo-400 group">
             <Zap size={22} className="group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset'}
          </h2>
          <p className="text-slate-400 font-bold text-sm">
            {mode === 'login' ? 'Welcome back to Quiviex' : mode === 'signup' ? 'Join the community' : 'Recover your account'}
          </p>
        </div>

        {error && <div className="w-full bg-rose-50 text-rose-500 p-4 rounded-xl mb-4 text-xs font-black border border-rose-100 animate-in slide-in-from-top-2 text-center flex items-center gap-3 justify-center shadow-sm"><AlertTriangle size={18} />{error}</div>}
        {successMsg && <div className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-4 text-xs font-black border border-emerald-100 animate-in slide-in-from-top-2 text-center flex items-center gap-3 justify-center shadow-sm"><CheckCircle2 size={18} />{successMsg}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : (e) => e.preventDefault()} className="w-full space-y-3">
          {mode === 'signup' && (
            <>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><UserIcon size={20} /></div>
                <input type="text" placeholder="Unique Username" value={username} onChange={(e) => setUsername((e.target as any).value.replace(/\s/g, ''))} className="w-full pl-14 pr-6 py-3.5 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
              </div>
              
              <div className="relative group">
                <div className="absolute left-5 top-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Calendar size={20} /></div>
                <div className="w-full pl-14 pr-6 py-2.5 bg-white/80 border-2 border-slate-100 rounded-2xl focus-within:border-indigo-500 transition-all shadow-sm">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Birthday</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday((e.target as any).value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-base text-slate-900" required />
                </div>
              </div>

              {isUnder13 && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                   <ShieldCheck className="text-indigo-600 flex-shrink-0" />
                   <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tight leading-relaxed">
                     Child Privacy Active: Email address is not required for your age group.
                   </p>
                </div>
              )}
            </>
          )}
          
          {(!isUnder13 || mode === 'login') && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Mail size={20} /></div>
              <input 
                type="text" 
                placeholder={mode === 'login' ? "Email or Username" : "Email Address"} 
                value={mode === 'login' ? identifier : email} 
                onChange={(e) => mode === 'login' ? setIdentifier((e.target as any).value) : setEmail((e.target as any).value)} 
                className="w-full pl-14 pr-6 py-3.5 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" 
                required 
              />
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Lock size={20} /></div>
            <input type={showPassword ? "text" : "password"} placeholder="Password (8+ chars)" value={password} onChange={(e) => setPassword((e.target as any).value)} className="w-full pl-14 pr-14 py-3.5 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-50">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>

          {mode === 'signup' && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><CheckCircle size={20} /></div>
              <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword((e.target as any).value)} className={`w-full pl-14 pr-6 py-3.5 bg-white/80 border-2 rounded-2xl focus:outline-none font-bold text-base transition-all text-slate-900 shadow-sm ${confirmPassword && confirmPassword !== password ? 'border-rose-200' : 'border-slate-100 focus:border-indigo-500'}`} required />
            </div>
          )}

          {mode === 'signup' && (
              <div className="flex items-center gap-3 px-3">
                  <input type="checkbox" id="terms_agree" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer" />
                  <label htmlFor="terms_agree" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none leading-none">
                     I accept the Strike Policy & Terms
                  </label>
              </div>
          )}

          {mode === 'signup' && isFormValid && (
            <div className="flex flex-col items-center py-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
               <ReCAPTCHA sitekey="6LfwC0MsAAAAAMF3wFKcYYLgusVeFmQQrF3Whgum" onChange={(token) => setCaptchaToken(token)} ref={recaptchaRef} />
            </div>
          )}
          
          <button type="submit" disabled={isLoading || (mode === 'signup' && !isFormValid)} className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 click-scale shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-sm disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />} 
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center w-full flex flex-col gap-4">
           <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearErrors(); }} className="text-purple-600 font-black hover:underline uppercase text-[10px] tracking-widest">
              {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
           </button>
           
           <button onClick={onJoinGame} className="bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all click-scale border border-white/10 shadow-lg">
              <Zap size={14} className="text-yellow-400" /> Fast Join PIN
           </button>
        </div>
      </div>
    </div>
  );
};
