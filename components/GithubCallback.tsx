import React from 'react';
import { Loader2, Github } from 'lucide-react';
import { Logo } from './Logo';

export const GithubCallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 shadow-2xl border border-white/10 max-w-md w-full">
        <div className="mb-8 relative">
           <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
           <Logo variant="large" />
           <div className="absolute -bottom-2 -right-2 bg-white text-slate-900 p-2 rounded-full shadow-lg">
             <Github size={24} />
           </div>
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Completing Sign In</h1>
        <p className="text-slate-400 mb-8 font-medium">
          Please wait while we securely authenticate you with GitHub...
        </p>

        <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-xl border border-white/10 w-full justify-center">
          <Loader2 className="animate-spin text-violet-400" size={24} />
          <span className="text-white font-bold">Verifying credentials...</span>
        </div>
      </div>
    </div>
  );
};
