
import React from 'react';
import { Home, AlertCircle, Zap, Search, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-[#05010d] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      
      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center">
        <div className="mb-12 relative animate-in zoom-in duration-700">
           <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
           <Logo variant="large" className="shadow-[0_0_80px_rgba(168,85,247,0.3)]" />
        </div>

        <div className="space-y-6 mb-16 stagger-in">
            <h1 className="text-[12rem] font-black leading-none tracking-tighter opacity-10 select-none">404</h1>
            <div className="relative -mt-24">
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">Signal Lost.</h2>
                <p className="text-xl text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                    The quiz module you're looking for doesn't exist or has been decommissioned.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            <button 
                onClick={onGoHome}
                className="bg-white text-slate-950 px-10 py-6 rounded-[2rem] font-black text-base uppercase tracking-widest shadow-[0_20px_60px_rgba(255,255,255,0.1)] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 click-scale group"
            >
                <Home size={20} className="group-hover:-translate-y-1 transition-transform" /> Back Home
            </button>
            <button 
                onClick={onGoHome} // In a real app this might open search or community
                className="bg-indigo-600 text-white px-10 py-6 rounded-[2rem] font-black text-base uppercase tracking-widest shadow-[0_20px_60px_rgba(99,102,241,0.2)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 click-scale"
            >
                <Search size={20} /> Browse Quizzes
            </button>
        </div>

        <div className="mt-20 flex items-center gap-2 text-slate-600 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">
            <Zap size={12} /> Connection Secure <Zap size={12} />
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-1/4 left-10 opacity-20 animate-bounce delay-700">
          <AlertCircle size={48} className="text-indigo-400" />
      </div>
      <div className="absolute bottom-1/4 right-10 opacity-20 animate-bounce">
          <Zap size={48} className="text-purple-400" />
      </div>
    </div>
  );
};
