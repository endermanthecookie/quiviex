
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User } from '../types';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, CheckCircle2, AlertTriangle, Home, Calendar, ShieldX, CheckCircle, Zap, ShieldCheck, Github } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
  onJoinGame?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

// Custom Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Custom Discord Icon
const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
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
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      setIsUnder13(age < 13);
      setCalculatedAge(age);
    } else {
      setIsUnder13(false);
      setCalculatedAge(null);
    }
  }, [birthday]);

  const clearErrors = () => { setError(''); setSuccessMsg(''); };

  const isFormValid = useMemo(() => {
    if (mode === 'login') return true;
    if (mode === 'forgot') return email.includes('@');
    const isEmailValid = isUnder13 ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return (username.length >= 3 && birthday !== '' && isEmailValid && password.length >= 8 && password === confirmPassword && acceptedTerms);
  }, [mode, username, birthday, email, password, confirmPassword, acceptedTerms, isUnder13]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (!captchaToken) { setError("Please complete the security check."); return; }
    
    setIsLoading(true);
    try {
      const finalEmail = isUnder13 ? `${username.toLowerCase()}@u13.quiviex.internal` : email.trim();
      
      const { error: signupError } = await supabase.auth.signUp({ 
        email: finalEmail, 
        password,
        options: { 
          data: { 
            username: username.trim(), 
            age_display: isUnder13 ? `Age ${calculatedAge}` : birthday,
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
      if (!loginEmail.includes('@')) {
        const { data, error: profileError } = await supabase.from('profiles').select('email').ilike('username', loginEmail).single();
        if (profileError || !data?.email) throw new Error('Account not found.');
        loginEmail = data.email;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'discord') => {
    setOauthLoading(provider);
    clearErrors();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`${provider} sign-in failed. Please try again.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f1f5f9] animate-in fade-in duration-700">
      <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-[480px] w-full shadow-2xl flex flex-col items-center border border-white relative overflow-hidden">
        
        <div className="w-full flex justify-between items-center mb-8 relative z-10">
          <button onClick={onBackToLanding} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 group">
            <Home size={22} className="group-hover:text-indigo-600 transition-colors" />
          </button>
          <Logo variant="medium" className="shadow-lg" />
          <button onClick={onJoinGame} className="p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-indigo-400 group">
             <Zap size={22} className="group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset'}
          </h2>
          <p className="text-slate-400 font-bold text-sm">
            {mode === 'login' ? 'Welcome back to Quiviex' : mode === 'signup' ? 'Join the community' : 'Recover your account'}
          </p>
        </div>

        {error && <div className="w-full bg-rose-50 text-rose-500 p-4 rounded-xl mb-6 text-xs font-black border border-rose-100 flex items-center gap-3 justify-center animate-in slide-in-from-top-2 shadow-sm"><AlertTriangle size={18} />{error}</div>}
        {successMsg && <div className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 text-xs font-black border border-emerald-100 flex items-center gap-3 justify-center animate-in slide-in-from-top-2 shadow-sm"><CheckCircle2 size={18} />{successMsg}</div>}

        <div className="w-full space-y-3 mb-8 relative z-10">
            {/* Google Priority */}
            <button 
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || isLoading}
                className="w-full h-14 bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-slate-50 text-slate-700 font-black rounded-2xl flex items-center justify-center gap-3 transition-all click-scale shadow-sm relative"
            >
                {oauthLoading === 'google' ? <Loader2 className="animate-spin text-slate-400" size={20} /> : <GoogleIcon />}
                <span>Continue with Google</span>
            </button>

            {/* Other Providers */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleOAuth('github')}
                    disabled={!!oauthLoading || isLoading}
                    className="h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all click-scale shadow-sm"
                >
                    {oauthLoading === 'github' ? <Loader2 className="animate-spin" size={20} /> : <Github size={20} />}
                    <span className="text-xs font-black uppercase tracking-widest">GitHub</span>
                </button>
                <button 
                    onClick={() => handleOAuth('discord')}
                    disabled={!!oauthLoading || isLoading}
                    className="h-14 bg-[#5865F2] text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-[#4752C4] transition-all click-scale shadow-sm"
                >
                    {oauthLoading === 'discord' ? <Loader2 className="animate-spin" size={20} /> : <DiscordIcon />}
                    <span className="text-xs font-black uppercase tracking-widest">Discord</span>
                </button>
            </div>

            <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">or credentials</span>
                <div className="flex-1 h-px bg-slate-100"></div>
            </div>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : (e) => e.preventDefault()} className="w-full space-y-4 relative z-10">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername((e.target as any).value.replace(/\s/g, ''))} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
              </div>
              <div className="relative">
                <div className="w-full px-6 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:border-indigo-500 transition-all shadow-sm">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Birthday</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday((e.target as any).value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-base text-slate-900" required />
                </div>
              </div>
              {isUnder13 && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                   <ShieldCheck className="text-indigo-600 flex-shrink-0" />
                   <p className="text-[10px] font-black text-indigo-900 uppercase tracking-tight leading-relaxed">Child Safety Active: Email address is optional for your age.</p>
                </div>
              )}
            </>
          )}
          
          {(!isUnder13 || mode === 'login') && (
            <div className="relative">
              <input type="text" placeholder={mode === 'login' ? "Email or Username" : "Email Address"} value={mode === 'login' ? identifier : email} onChange={(e) => mode === 'login' ? setIdentifier((e.target as any).value) : setEmail((e.target as any).value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
            </div>
          )}
          
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword((e.target as any).value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-bold text-base transition-all text-slate-900 shadow-sm" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
          </div>

          {mode === 'signup' && (
            <>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword((e.target as any).value)} className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none font-bold text-base transition-all text-slate-900 shadow-sm ${confirmPassword && confirmPassword !== password ? 'border-rose-200' : 'border-slate-100 focus:border-indigo-500'}`} required />
              </div>
              <div className="flex items-center gap-3 px-3">
                  <input type="checkbox" id="terms_agree" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer" />
                  <label htmlFor="terms_agree" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none leading-none">I accept the Strike Policy & Terms</label>
              </div>
              {isFormValid && (
                <div className="flex flex-col items-center py-2 animate-in fade-in zoom-in"><ReCAPTCHA sitekey="6LfwC0MsAAAAAMF3wFKcYYLgusVeFmQQrF3Whgum" onChange={(token) => setCaptchaToken(token)} ref={recaptchaRef} /></div>
              )}
            </>
          )}
          
          <button type="submit" disabled={isLoading || (mode === 'signup' && !isFormValid)} className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 click-scale shadow-lg hover:shadow-indigo-200 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />} 
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-10 text-center w-full relative z-10 flex flex-col gap-4">
           <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearErrors(); }} className="text-indigo-600 font-black hover:underline uppercase text-[10px] tracking-widest">
              {mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
           </button>
           
           <button onClick={onJoinGame} className="text-slate-400 font-black hover:text-indigo-500 transition-colors uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
              <Zap size={14} className="text-yellow-400" /> Fast Join PIN
           </button>
        </div>
      </div>
    </div>
  );
};
