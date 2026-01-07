
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from './Logo';

export const OAuthCallback: React.FC = () => {
  const [message, setMessage] = useState("Connecting to provider...");

  useEffect(() => {
    // Fix: Access setTimeout via window to resolve "Cannot find name 'setTimeout'" error
    const timer = (window as any).setTimeout(() => {
        setMessage("Verifying credentials...");
    }, 1500);
    // Fix: Access clearTimeout via window to resolve "Cannot find name 'clearTimeout'" error
    return () => (window as any).clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 shadow-2xl border border-white/10 max-w-md w-full">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <Logo variant="large" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Authenticating</h1>
        <p className="text-slate-400 mb-8 font-medium">
          Please wait while we sign you in securely...
        </p>

        <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-xl border border-white/10 w-full justify-center">
          <Loader2 className="animate-spin text-violet-400" size={24} />
          <span className="text-white font-bold animate-pulse">{message}</span>
        </div>
      </div>
    </div>
  );
};
