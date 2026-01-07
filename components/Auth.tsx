import React, { useState, useCallback, useRef } from 'react';
import { User } from '../types';
import { Lock, LogIn, Mail, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, Github, User as UserIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import ReCAPTCHA from 'react-google-recaptcha';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c1.24-21.45-8.49-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotStage, setForgotStage] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const clearErrors = () => { 
    setError(''); 
    setSuccessMsg(''); 
  };

  const isSignupFormValid = () => {
    return (
      username.trim().length >= 3 &&
      email.includes('@') &&
      password.length >= 8 &&
      password === confirmPassword
    );
  };

  const formatAuthError = (msg: string) => {
    if (msg.includes('abcdefghijklmnopqrstuvwxyz')) {
        return "Password must be at least 8 characters and include uppercase, lowercase, and numbers.";
    }
    if (msg.includes('at least 6 characters') || msg.includes('at least 8 characters')) {
        return "Password must be at least 8 characters long.";
    }
    return msg;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!isSignupFormValid()) {
      setError("Please ensure all fields are correctly filled.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the security verification.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: signupError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          captchaToken: captchaToken,
          data: {
            username: username.trim()
          }
        }
      });
      
      if (signupError) throw signupError;
      
      setSuccessMsg("Check your email for confirmation!");
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } catch (err: any) {
      console.error("Signup process failed:", err);
      setError(formatAuthError(err.message || "An unexpected error occurred during signup."));
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(formatAuthError(err.message || 'Invalid credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    if (forgotStage === 'email') {
      if (!email.trim()) { setError("Email is required"); return; }
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setSuccessMsg("Check your email for the security code!");
        setForgotStage('code');
      } catch (err: any) { setError(formatAuthError(err.message)); } finally { setIsLoading(false); }
    } else {
      if (otp.length < 8) { setError("Enter the full 8-digit code"); return; }
      if (password.length < 8) { setError("New password must be at least 8 characters."); return; }
      setIsLoading(true);
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: 'recovery' });
        if (verifyError) throw verifyError;
        const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
        if (updateError) throw updateError;
        setSuccessMsg("Success! Please log in with your new password.");
        setMode('login');
        setForgotStage('email');
      } catch (err: any) { setError(formatAuthError(err.message)); } finally { setIsLoading(false); }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin(e);
    else if (mode === 'signup') handleSignup(e);
    else if (mode === 'forgot') handleForgotPassword(e);
  };

  const handleOtpChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(0, 8);
    setOtp(sanitized);
  };

  const renderOtpInput = () => (
    <div className="space-y-8 stagger-in pt-2">
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">8-Digit Security Code</label>
        <div className="relative group">
            <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={otp}
                onChange={(e) => handleOtpChange((e.target as any).value)}
                placeholder="00000000"
                className="w-full h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all border-slate-100 bg-slate-50 tracking-[0.5em] focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none"
            />
            {otp.length > 0 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold pointer-events-none text-sm tracking-normal">
                    {otp.length}/8
                </div>
            )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Secure Password</label>
        </div>
        <div className="relative">
            <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Min. 8 characters" 
                value={password} 
                onChange={(e) => setPassword((e.target as any).value)} 
                className="w-full px-5 py-4 bg-white/50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-base transition-all" 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 click-scale uppercase tracking-widest shadow-lg">
        {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} CONFIRM CHANGE
      </button>
    </div>
  );

  const labels = mode === 'login' ? { title: 'Welcome Back', desc: 'Sign in to your account' } : 
                 mode === 'signup' ? { title: 'Join Quiviex', desc: 'Step 1: Account Details' } :
                 forgotStage === 'email' ? { title: 'Recover Access', desc: 'Enter your email' } : { title: 'Security Reset', desc: 'Authentication required' };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="glass rounded-[3rem] p-8 sm:p-12 max-w-[460px] w-full animate-in zoom-in-95 duration-500 relative z-10 border border-white">
        
        <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
          <Logo variant="large" />
        </div>

        <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-2 tracking-tight">
          {labels.title}
        </h2>
        <p className="text-center text-slate-400 font-bold text-base mb-8">
          {labels.desc}
        </p>

        {error && <div className="bg-rose-50 text-rose-500 p-4 rounded-xl mb-6 text-xs font-black border border-rose-100 animate-in slide-in-from-top-2 text-center leading-relaxed flex items-center gap-3 justify-center">
            <AlertTriangle size={16} />
            {error}
        </div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl mb-6 text-sm font-black border border-emerald-100 animate-in slide-in-from-top-2 text-center">{successMsg}</div>}

        <div className="stagger-in">
          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-3 mb-8">
              <button type="button" onClick={() => {}} className="w-full bg-white border-2 border-slate-100 text-slate-600 font-extrabold py-3 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all click-scale shadow-sm text-sm">
                <GoogleIcon /> Continue with Google
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => {}} className="bg-slate-900 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 click-scale hover:bg-black transition-all text-xs">
                  <Github size={18} /> GitHub
                </button>
                <button type="button" onClick={() => {}} className="bg-[#5865F2] text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 click-scale hover:bg-[#4752C4] transition-all text-xs">
                  <DiscordIcon /> Discord
                </button>
              </div>
              <div className="flex items-center gap-4 py-3">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">OR DIRECT ACCESS</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <UserIcon size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Unique Username (min. 3)" 
                  value={username} 
                  onChange={(e) => setUsername((e.target as any).value.replace(/\s/g, ''))} 
                  className="w-full pl-12 pr-5 py-4 bg-white/50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-base transition-all" 
                  maxLength={20}
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || (mode === 'forgot' && forgotStage === 'email')) && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Mail size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder={mode === 'login' ? "Email or Username" : "Email Address"} 
                    value={mode === 'login' ? identifier : email} 
                    onChange={(e) => mode === 'login' ? setIdentifier((e.target as any).value) : setEmail((e.target as any).value)} 
                    className="w-full pl-12 pr-5 py-4 bg-white/50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-base transition-all" 
                />
              </div>
            )}
            
            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">SECURITY</span>
                  {mode === 'login' && <button type="button" onClick={() => setMode('forgot')} className="text-xs font-black text-purple-600 hover:text-purple-700">Forgot Password?</button>}
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={mode === 'signup' ? "Create Secure Password" : "Password"} 
                    value={password} 
                    onChange={(e) => setPassword((e.target as any).value)} 
                    className="w-full pl-12 pr-12 py-4 bg-white/50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-base transition-all" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Confirm Your Password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword((e.target as any).value)} 
                    className={`w-full pl-12 pr-5 py-4 bg-white/50 border-2 rounded-2xl focus:outline-none font-bold text-base transition-all ${confirmPassword && password !== confirmPassword ? 'border-rose-300' : 'border-slate-100 focus:border-purple-500'}`} 
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest pl-2">Passwords do not match yet</p>
                )}
                {confirmPassword && password === confirmPassword && password.length >= 8 && (
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest pl-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Secure Connection Confirmed
                    </p>
                )}
              </div>
            )}

            {mode === 'signup' && isSignupFormValid() && (
              <div className="flex flex-col items-center py-5 min-h-[100px] animate-in slide-in-from-bottom-4 duration-700 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <ShieldCheck size={18} />
                  <p className="text-[11px] font-black uppercase tracking-widest">Final Step: Verify Human</p>
                </div>
                <div className="transform scale-[0.85] sm:scale-100 origin-center transition-transform">
                  <ReCAPTCHA
                    sitekey="6LfwC0MsAAAAAMF3wFKcYYLgusVeFmQQrF3Whgum"
                    onChange={(token) => setCaptchaToken(token)}
                    ref={recaptchaRef}
                  />
                </div>
              </div>
            )}

            {mode === 'forgot' && forgotStage === 'code' && renderOtpInput()}

            {(mode === 'login' || mode === 'signup' || (mode === 'forgot' && forgotStage === 'email')) && (
              <button 
                type="submit" 
                disabled={isLoading || (mode === 'signup' && (!isSignupFormValid() || !captchaToken))} 
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 click-scale hover:shadow-xl hover:shadow-purple-300/30 transition-all uppercase tracking-widest text-base shadow-lg disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={22} />} 
                {mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND CODE'}
              </button>
            )}
          </form>
        </div>

        <div className="mt-10 text-center stagger-in">
           {mode === 'login' ? (
             <p className="text-slate-400 font-bold text-sm">
               New to Quiviex? <button type="button" onClick={() => { setMode('signup'); clearErrors(); }} className="text-purple-600 font-black hover:underline">Create an account</button>
             </p>
           ) : (
             <button type="button" onClick={() => { setMode('login'); clearErrors(); setForgotStage('email'); }} className="flex items-center gap-2 mx-auto text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">
               <ArrowLeft size={14} /> Back to Login
             </button>
           )}
        </div>
      </div>
    </div>
  );
};