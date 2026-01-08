import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, CheckCircle2, AlertTriangle, Home, Calendar, ShieldX, CheckCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

// Brand SVGs - White fills for brand compliance on dark backgrounds
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin, onBackToLanding }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showLegalViewer, setShowLegalViewer] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const clearErrors = () => { setError(''); setSuccessMsg(''); };

  // Validation Logic for Captcha Appearance
  const isFormValid = useMemo(() => {
    if (mode === 'login') return true;
    if (mode === 'forgot') return email.includes('@');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      username.length >= 3 &&
      birthday !== '' &&
      emailRegex.test(email) &&
      password.length >= 8 &&
      password === confirmPassword &&
      acceptedTerms
    );
  }, [mode, username, birthday, email, password, confirmPassword, acceptedTerms]);

  const checkBannedEmail = async (emailToCheck: string): Promise<boolean> => {
      const { data } = await supabase.from('banned_emails').select('email').eq('email', emailToCheck.trim().toLowerCase()).maybeSingle();
      if (data) {
          setIsBanned(true);
          setError("SECURITY TERMINATION: This email address is permanently blacklisted.");
          return true;
      }
      return false;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!captchaToken) { setError("Please complete the security check."); return; }
    if (await checkBannedEmail(email)) return;
    
    setIsLoading(true);
    try {
      const { error: signupError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: { data: { username: username.trim(), birthday: birthday } }
      });
      if (signupError) throw signupError;
      setSuccessMsg("Check your email for confirmation!");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
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
        if (profileError || !data?.email) throw new Error('Invalid credentials');
        loginEmail = data.email;
      }
      if (await checkBannedEmail(loginEmail)) { setIsLoading(false); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (resetError) throw resetError;
      setSuccessMsg("Password reset link sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'discord') => {
    clearErrors();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(`${provider} authentication failed.`);
    }
  };

  if (isBanned) {
      return (
          <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
              <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border-t-[12px] border-rose-600">
                  <ShieldX size={80} className="text-rose-600 mx-auto mb-8" />
                  <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Access Forbidden</h2>
                  <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                      This identity has been permanently decommissioned from Quiviex Infrastructure. 
                  </p>
                  <button onClick={onBackToLanding} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Return to Home</button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f8fafc] animate-in fade-in duration-700">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      {showLegalViewer && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3"><h3 className="text-2xl font-black">Legal Agreement</h3></div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 text-slate-600 leading-relaxed text-sm custom-scrollbar">
                    <h4 className="font-black text-slate-900 mb-6 text-xl text-center">Strike Policy Enforcement</h4>
                    <p className="mb-6">Quiviex Infrastructure strictly monitors all generation events. Collecting 3 Strikes results in permanent infrastructure ban.</p>
                </div>
                <div className="p-8 border-t border-slate-100 flex gap-4">
                    <button onClick={() => setShowLegalViewer(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Close</button>
                    <button onClick={() => { setAcceptedTerms(true); setShowLegalViewer(false); }} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-indigo-200">I Accept Terms</button>
                </div>
            </div>
        </div>
      )}

      <div className="glass rounded-[3rem] p-6 sm:p-10 max-w-[500px] w-full animate-in zoom-in-95 duration-500 relative z-10 border border-white shadow-2xl flex flex-col items-center">
        
        <div className="w-full flex justify-between items-center mb-6">
          <button onClick={onBackToLanding} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 group">
             <Home size={22} className="group-hover:text-indigo-600 transition-colors" />
          </button>
          <Logo variant="medium" className="shadow-lg" />
          <div className="w-12"></div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
          </h2>
          <p className="text-slate-400 font-bold text-base">
            {mode === 'login' ? 'Access your account' : mode === 'signup' ? 'Create your account' : 'Enter email to receive reset link'}
          </p>
        </div>

        {error && <div className="w-full bg-rose-50 text-rose-500 p-4 rounded-xl mb-6 text-xs font-black border border-rose-100 animate-in slide-in-from-top-2 text-center leading-relaxed flex items-center gap-3 justify-center shadow-sm"><AlertTriangle size={18} />{error}</div>}
        {successMsg && <div className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 text-xs font-black border border-emerald-100 animate-in slide-in-from-top-2 text-center leading-relaxed flex items-center gap-3 justify-center shadow-sm"><CheckCircle2 size={18} />{successMsg}</div>}

        {/* OAuth Section - Now Primarily Focused and First */}
        {mode !== 'forgot' && (
          <div className="w-full mb-8">
            <div className="space-y-3">
               {/* Google Focused */}
               <button onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-100 hover:border-indigo-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all click-scale shadow-sm">
                 <GoogleIcon /> Continue with Google
               </button>

               {/* Discord & GitHub Grid below Google */}
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => handleOAuth('discord')} className="flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all click-scale shadow-md">
                   <DiscordIcon /> Discord
                 </button>
                 <button onClick={() => handleOAuth('github')} className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all click-scale shadow-md">
                   <GithubIcon /> GitHub
                 </button>
               </div>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#f8fafc] px-4 text-slate-400 font-black tracking-widest">Or use email</span></div>
            </div>
          </div>
        )}

        {/* Email/Password Form Section */}
        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword} className="w-full space-y-4">
          {mode === 'signup' && (
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><UserIcon size={20} /></div>
                <input type="text" placeholder="Unique Username" value={username} onChange={(e) => setUsername((e.target as any).value.replace(/\s/g, ''))} className="w-full pl-14 pr-6 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white font-bold text-base transition-all text-slate-900 shadow-sm" maxLength={20} required />
              </div>
              
              <div className="relative group">
                <div className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Calendar size={20} /></div>
                <div className="w-full pl-14 pr-6 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Birthday</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday((e.target as any).value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-base text-slate-900" required />
                </div>
              </div>
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Mail size={20} /></div>
            <input type="text" placeholder={mode === 'login' ? "Email or Username" : "Email Address"} value={mode === 'login' ? identifier : email} onChange={(e) => mode === 'login' ? setIdentifier((e.target as any).value) : setEmail((e.target as any).value)} className="w-full pl-14 pr-6 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white font-bold text-base transition-all text-slate-900 shadow-sm" required />
          </div>
          
          {mode !== 'forgot' && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><Lock size={20} /></div>
              <input type={showPassword ? "text" : "password"} placeholder="Password (Min. 8 chars)" value={password} onChange={(e) => setPassword((e.target as any).value)} className="w-full pl-14 pr-14 py-4 bg-white/80 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white font-bold text-base transition-all text-slate-900 shadow-sm" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end px-1">
              <button type="button" onClick={() => setMode('forgot')} className="text-xs font-black text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Forgot password?</button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"><CheckCircle size={20} /></div>
              <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword((e.target as any).value)} className={`w-full pl-14 pr-6 py-4 bg-white/80 border-2 rounded-2xl focus:outline-none focus:bg-white font-bold text-base transition-all text-slate-900 shadow-sm ${confirmPassword && confirmPassword !== password ? 'border-rose-200' : 'border-slate-100 focus:border-indigo-500'}`} required />
            </div>
          )}

          {mode === 'signup' && (
              <div className="flex items-center gap-3 px-3 pt-2">
                  <input type="checkbox" id="terms_agree" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-6 h-6 accent-indigo-600 rounded-lg cursor-pointer" />
                  <label htmlFor="terms_agree" className="text-xs font-bold text-slate-400 cursor-pointer select-none leading-relaxed">
                     I accept the <button type="button" onClick={() => setShowLegalViewer(true)} className="text-indigo-600 hover:underline">Strike Policy & Terms</button>
                  </label>
              </div>
          )}

          {mode === 'signup' && isFormValid && (
            <div className="flex flex-col items-center py-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
               <ReCAPTCHA sitekey="6LfwC0MsAAAAAMF3wFKcYYLgusVeFmQQrF3Whgum" onChange={(token) => setCaptchaToken(token)} ref={recaptchaRef} />
            </div>
          )}
          
          <button type="submit" disabled={isLoading || (mode === 'signup' && (!captchaToken || password.length < 8))} className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 click-scale shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-base disabled:opacity-50 mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={22} />} 
            {mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'SIGN UP' : 'SEND RESET LINK'}
          </button>
        </form>

        {/* Footer Toggle Link */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100 w-full">
           <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); clearErrors(); }} className="text-purple-600 font-black hover:underline transition-all uppercase text-xs tracking-widest">
              {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
           </button>
        </div>
      </div>
    </div>
  );
};