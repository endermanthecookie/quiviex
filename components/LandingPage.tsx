import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Zap, Globe, Github, Database, Brain, Rocket, PlayCircle, ChevronLeft, ChevronRight, X, Layers, Cpu, Users, BarChart3, Star, Mail, Loader2, User as UserIcon, Lock, Code } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore: () => void;
  onJoinGame?: () => void; 
  onShowLegal?: (type: 'terms' | 'guidelines' | 'privacy') => void;
}

interface Testimonial {
    username: string;
    review: string;
    rating: number;
    avatar_url?: string;
}

const FALLBACK_REVIEWS: Testimonial[] = [
    { username: "QuizMaster_99", review: "The fastest way to create study materials. The AI generation is actually useful!", rating: 10 },
    { username: "Student_Core", review: "Helped me ace my finals. The flashcard mode is a game changer.", rating: 9 },
    { username: "CreativeMind", review: "I love how I can customize the themes. It makes learning feel personal.", rating: 10 }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExplore, onJoinGame, onShowLegal }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
      try {
          const { data, error } = await supabase
            .from('platform_reviews')
            .select('username, review, rating, avatar_url')
            .gte('rating', 8)
            .not('review', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5); 
          
          if (error) {
              if (error.code === 'PGRST205') {
                  setTestimonials(FALLBACK_REVIEWS);
                  return;
              }
              throw error;
          }
          setTestimonials(data && data.length > 0 ? data : FALLBACK_REVIEWS);
      } catch (e) {
          setTestimonials(FALLBACK_REVIEWS);
      } finally {
          setIsLoadingTestimonials(false);
      }
  };

  useEffect(() => {
    if (testimonials.length > 1) {
        const interval = setInterval(() => {
            setSlideIdx(prev => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(interval);
    }
  }, [testimonials]);

  return (
    <div className="min-h-screen bg-[#05010d] text-slate-100 selection:bg-purple-500/30 overflow-x-hidden font-['Plus_Jakarta_Sans'] relative">
      
      {/* Visual Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
          <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[90%] bg-purple-900/40 rounded-full blur-[180px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-900/40 rounded-full blur-[180px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto glass rounded-[2.5rem] px-10 py-5 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-3xl bg-white/[0.03]">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <Logo variant="small" className="group-hover:scale-110 transition-transform duration-500 shadow-2xl" />
            <span className="text-3xl font-black tracking-tighter text-white">Quiviex</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            <button onClick={onExplore} className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]">Explore</button>
            <button onClick={() => { if(onJoinGame) onJoinGame(); }} className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> Join Game</button>
            <button className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]">Features</button>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onGetStarted} className="hidden sm:block text-[11px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.3em]">Sign In</button>
            <button onClick={onGetStarted} className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all click-scale border border-white/10">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-64 pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-8 py-3 rounded-full text-purple-400 text-[11px] font-black uppercase tracking-[0.4em] mb-14 shadow-2xl animate-in slide-in-from-top-6 duration-1000">
            <Sparkles size={16} className="text-yellow-400" /> AI-Powered Learning
          </div>
          
          <h1 className="text-8xl md:text-[13rem] font-black tracking-tighter text-white mb-12 leading-[0.7] filter drop-shadow-[0_0_60px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in-95 duration-1000">
            Learn with <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">Pure Passion.</span>
          </h1>
          
          <p className="max-w-4xl mx-auto text-2xl text-slate-400 font-medium mb-20 leading-relaxed animate-in slide-in-from-bottom-10 duration-1000">
            The ultimate platform for creating, sharing, and mastering any topic. Build custom quizzes in seconds 
            with AI and join a global community of curious minds.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-48 animate-in fade-in duration-1000 delay-500">
            <button onClick={onGetStarted} className="w-full sm:w-auto bg-white text-slate-950 px-12 py-7 rounded-[2.5rem] font-black text-base uppercase tracking-widest shadow-[0_20px_80px_rgba(255,255,255,0.15)] hover:bg-purple-50 transition-all flex items-center justify-center gap-4 group click-scale">
              Start Creating <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <button onClick={onExplore} className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-12 py-7 rounded-[2.5rem] font-black text-base uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-4 click-scale">
              <Globe size={24} className="text-indigo-400" /> Browse Gallery
            </button>
            <button onClick={onJoinGame} className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-7 rounded-[2.5rem] font-black text-base uppercase tracking-widest shadow-[0_20px_80px_rgba(99,102,241,0.2)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 click-scale">
              <Zap size={24} className="text-yellow-400" /> Join Game
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-48 text-left">
              <div className="bg-white/[0.02] border border-white/5 p-14 rounded-[5rem] backdrop-blur-3xl hover:border-purple-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Zap size={220} /></div>
                  <div className="w-20 h-20 bg-purple-600/20 rounded-[2rem] flex items-center justify-center text-purple-400 mb-10 group-hover:scale-110 transition-transform group-hover:bg-purple-600/30 border border-purple-500/20"><Zap size={44} /></div>
                  <h3 className="text-3xl font-black mb-6 tracking-tighter">AI Magic</h3>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Instantly generate complete quizzes from any topic, image, or document using powerful AI models.</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-14 rounded-[5rem] backdrop-blur-3xl hover:border-indigo-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Lock size={220} /></div>
                  <div className="w-20 h-20 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-10 group-hover:scale-110 transition-transform group-hover:bg-indigo-600/30 border border-indigo-500/20"><Lock size={44} /></div>
                  <h3 className="text-3xl font-black mb-6 tracking-tighter">Private Library</h3>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Keep your studies organized with your own secure collection of quizzes and flashcards.</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-14 rounded-[5rem] backdrop-blur-3xl hover:border-pink-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Code size={220} /></div>
                  <div className="w-20 h-20 bg-pink-600/20 rounded-[2rem] flex items-center justify-center text-pink-400 mb-10 group-hover:scale-110 transition-transform group-hover:bg-pink-600/30 border border-pink-500/20"><Code size={44} /></div>
                  <h3 className="text-3xl font-black mb-6 tracking-tighter">Custom Style</h3>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed">Design beautiful quizzes with custom themes, fonts, and background music that match your mood.</p>
              </div>
          </div>

          {/* Testimonials */}
          <div className="relative max-w-6xl mx-auto mb-48">
             <div className="text-center mb-20">
                 <h2 className="text-6xl font-black tracking-tighter text-white mb-6">User Stories</h2>
                 <p className="text-purple-500 text-sm font-black uppercase tracking-[0.5em]">What our community has to say</p>
             </div>
             
             {isLoadingTestimonials ? (
                 <div className="h-[550px] flex items-center justify-center bg-white/[0.01] rounded-[6rem] border border-white/5 animate-pulse">
                     <Loader2 className="animate-spin text-purple-900" size={80} />
                 </div>
             ) : (
                 <div className="relative group">
                     <div className="absolute inset-0 bg-purple-600/25 blur-[160px] opacity-30"></div>
                     <div className="bg-white/[0.04] backdrop-blur-3xl rounded-[6rem] p-24 shadow-2xl border border-white/10 relative z-10 min-h-[550px] flex flex-col justify-center transition-all duration-1000 hover:bg-white/[0.05]">
                         <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-12 duration-1000" key={slideIdx}>
                             <div className="flex justify-center gap-2.5 mb-14">
                                 {[...Array(10)].map((_, i) => (
                                     <Star key={i} size={32} className={`${i < testimonials[slideIdx].rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'}`} />
                                 ))}
                             </div>
                             <p className="text-5xl sm:text-7xl font-black text-white leading-[1] tracking-tighter italic mb-16">
                                 "{testimonials[slideIdx].review}"
                             </p>
                             <div className="flex flex-col items-center gap-8">
                                 <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-purple-500 via-indigo-600 to-fuchsia-600 overflow-hidden p-2 shadow-[0_0_60px_rgba(168,85,247,0.5)]">
                                     <div className="w-full h-full bg-[#05010d] rounded-[1.8rem] flex items-center justify-center overflow-hidden">
                                         {testimonials[slideIdx].avatar_url ? (
                                             <img src={testimonials[slideIdx].avatar_url} className="w-full h-full object-cover" />
                                         ) : (
                                             <UserIcon size={54} className="text-purple-400" />
                                         )}
                                     </div>
                                 </div>
                                 <div>
                                     <p className="text-4xl font-black text-white tracking-tighter">@{testimonials[slideIdx].username}</p>
                                     <p className="text-[12px] font-black text-purple-500 uppercase tracking-[0.5em] mt-3">Verified Quiviex User</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             <div className="mt-20 flex justify-center gap-5">
                {testimonials.map((_, i) => (
                    <button key={i} onClick={() => setSlideIdx(i)} className={`h-3 rounded-full transition-all duration-1000 ${slideIdx === i ? 'bg-purple-500 w-28 shadow-[0_0_25px_rgba(168,85,247,0.7)]' : 'bg-slate-800 w-6 hover:bg-slate-700'}`}></button>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* Powered By Section */}
      <section className="py-48 border-t border-white/10 relative bg-black/60">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[13px] font-black uppercase text-purple-600 tracking-[0.8em] mb-28 opacity-80">Empowered By Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-20 items-center justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
             <div className="flex flex-col items-center gap-8 group">
                 <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 group-hover:border-white/20 transition-all shadow-2xl"><Github size={72} className="text-white" /></div>
                 <span className="font-black text-3xl text-white tracking-tighter">GitHub Models</span>
             </div>
             <div className="flex flex-col items-center gap-8 group">
                 <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 group-hover:border-emerald-500/40 transition-all shadow-2xl"><Database size={72} className="text-emerald-500" /></div>
                 <span className="font-black text-3xl text-white tracking-tighter">Supabase</span>
             </div>
             <div className="flex flex-col items-center gap-8 group">
                 <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 group-hover:border-purple-500/40 transition-all shadow-2xl"><Brain size={72} className="text-purple-400" /></div>
                 <span className="font-black text-3xl text-white tracking-tighter">OpenAI Core</span>
             </div>
             <div className="flex flex-col items-center gap-8 group">
                 <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5 group-hover:border-orange-500/40 transition-all shadow-2xl"><Mail size={72} className="text-orange-400" /></div>
                 <span className="font-black text-3xl text-white tracking-tighter">Resend MTA</span>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#030108] text-white py-48 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-32">
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg">
            <div className="flex items-center gap-6 mb-12">
              <Logo variant="medium" className="shadow-[0_0_60px_rgba(168,85,247,0.4)]" />
              <span className="text-6xl font-black tracking-tighter">Quiviex</span>
            </div>
            <p className="text-slate-500 font-bold leading-relaxed text-2xl">
                Redefining the way you learn, quiz, and study. Beautifully designed for a world-class educational experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-28">
            <div className="flex flex-col gap-10">
              <span className="text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">Product</span>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Dashboard</button>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">AI Creator</button>
            </div>
            <div className="flex flex-col gap-10">
              <span className="text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">Explore</span>
              <button onClick={onExplore} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Library</button>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Achievements</button>
            </div>
            <div className="flex flex-col gap-10">
              <span className="text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">Legal</span>
              <button onClick={() => onShowLegal?.('guidelines')} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Guidelines</button>
              <button onClick={() => onShowLegal?.('privacy')} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Privacy</button>
              <button onClick={() => onShowLegal?.('terms')} className="text-left font-bold text-slate-400 hover:text-white transition-colors text-xl">Terms</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-48 pt-24 flex flex-col md:flex-row justify-between items-center gap-12">
            <p className="text-slate-600 text-sm font-bold uppercase tracking-[0.4em]">&copy; 2026 Quiviex Learning Labs.</p>
            <div className="flex gap-14 opacity-40">
                <Github size={32} className="hover:text-purple-400 cursor-pointer transition-all hover:scale-125" />
                <Globe size={32} className="hover:text-purple-400 cursor-pointer transition-all hover:scale-125" />
            </div>
        </div>
      </footer>
    </div>
  );
};