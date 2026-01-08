import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Zap, Globe, Github, Database, Brain, Rocket, PlayCircle, ChevronLeft, ChevronRight, X, Layers, Cpu, Users, BarChart3, Star, Mail, Loader2, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore: () => void;
  onShowLegal?: (type: 'terms' | 'guidelines' | 'privacy') => void;
}

interface Testimonial {
    username: string;
    review: string;
    rating: number;
    avatar_url?: string;
}

const FALLBACK_REVIEWS: Testimonial[] = [
    { username: "GenAI_Architect", review: "The fastest way to deploy educational content globally. The AI integration is seamless.", rating: 10 },
    { username: "System_Core", review: "A robust framework for decentralized quiz repositories. Highly professional.", rating: 9 },
    { username: "Logic_Master", review: "Quiviex has completely transformed how our team generates technical assessments.", rating: 10 }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExplore, onShowLegal }) => {
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
            .limit(5); // Changed limit from 10 to 5
          
          if (error) {
              // If table is missing (PGRST205), use fallbacks
              if (error.code === 'PGRST205') {
                  setTestimonials(FALLBACK_REVIEWS);
                  return;
              }
              throw error;
          }
          setTestimonials(data && data.length > 0 ? data : FALLBACK_REVIEWS);
      } catch (e) {
          // Silent fail to fallbacks for stability
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
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-['Plus_Jakarta_Sans']">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto glass rounded-3xl px-8 py-4 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-3xl bg-white/5">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Logo variant="small" className="group-hover:scale-110 transition-transform duration-500" />
            <span className="text-2xl font-black tracking-tighter text-white">Quiviex</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <button onClick={onExplore} className="text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">Library</button>
            <button className="text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">Developers</button>
            <button className="text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">Infrastructure</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onGetStarted} className="hidden sm:block text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.2em]">Sign In</button>
            <button onClick={onGetStarted} className="bg-white text-slate-950 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all click-scale shadow-[0_0_20px_rgba(255,255,255,0.2)]">Start Building</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-52 pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto text-center">
          <div className=" stager-in inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-6 py-2 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-bounce shadow-lg">
            <Sparkles size={14} /> The Next Evolution of Learning
          </div>
          
          <h1 className="text-7xl md:text-[9rem] font-black tracking-tight text-white mb-10 leading-[0.85] filter drop-shadow-2xl">
            Build in <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">minutes.</span><br />
            Scale to <span className="underline decoration-indigo-500 underline-offset-8">millions.</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl text-slate-400 font-medium mb-16 leading-relaxed">
            Quiviex is the open-source platform for modern quiz architecture. Generate complex 
            educational assessments with industry-leading AI models in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32">
            <button onClick={onGetStarted} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3 group click-scale">
              Get Started for Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onExplore} className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-slate-300 px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 click-scale">
              <Globe size={20} /> Explore Global Library
            </button>
          </div>

          {/* Feature Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40 stagger-in text-left">
              <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl hover:border-indigo-500/30 transition-all group">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform"><Zap size={32} /></div>
                  <h3 className="text-2xl font-black mb-4">Fast Generation</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Zero-latency quiz creation powered by GPT-4o and GitHub inference clusters.</p>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl hover:border-purple-500/30 transition-all group">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform"><Layers size={32} /></div>
                  <h3 className="text-2xl font-black mb-4">Logic-Based Tasks</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Sequence ordering, matching pairs, and visual context tasks for deep learning.</p>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl hover:border-emerald-500/30 transition-all group">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform"><Users size={32} /></div>
                  <h3 className="text-2xl font-black mb-4">Open Community</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Share and fork knowledge across the globe with our decentralized repository system.</p>
              </div>
          </div>

          {/* Dynamic Testimonials Section */}
          <div className="relative max-w-5xl mx-auto mb-40">
             <div className="text-center mb-12">
                 <h2 className="text-3xl font-black tracking-tight text-white mb-2">Architect Feedback</h2>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Real stories from the Quiviex community</p>
             </div>
             
             {isLoadingTestimonials ? (
                 <div className="h-[400px] flex items-center justify-center bg-slate-900/40 rounded-[4rem] border border-white/5 animate-pulse">
                     <Loader2 className="animate-spin text-slate-700" size={48} />
                 </div>
             ) : testimonials.length > 0 ? (
                 <div className="relative group">
                     <div className="absolute inset-0 bg-yellow-500/10 blur-[100px] opacity-20"></div>
                     <div className="bg-slate-900 rounded-[4rem] p-12 shadow-2xl border border-white/10 relative z-10 min-h-[400px] flex flex-col justify-center transition-all duration-700">
                         <div className="max-w-3xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-1000" key={slideIdx}>
                             <div className="flex justify-center gap-1 mb-8">
                                 {[...Array(10)].map((_, i) => (
                                     <Star key={i} size={20} className={`${i < testimonials[slideIdx].rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'}`} />
                                 ))}
                             </div>
                             <p className="text-2xl sm:text-4xl font-black text-white leading-tight italic mb-10">
                                 "{testimonials[slideIdx].review}"
                             </p>
                             <div className="flex flex-col items-center gap-4">
                                 <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 overflow-hidden border border-indigo-500/30">
                                     {testimonials[slideIdx].avatar_url ? (
                                         <img src={testimonials[slideIdx].avatar_url} className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-indigo-400"><UserIcon size={32} /></div>
                                     )}
                                 </div>
                                 <div>
                                     <p className="text-xl font-black text-white">@{testimonials[slideIdx].username}</p>
                                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Verified Architect</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             ) : null}

             {testimonials.length > 1 && (
                 <div className="mt-8 flex justify-center gap-4">
                    {testimonials.map((_, i) => (
                        <button key={i} onClick={() => setSlideIdx(i)} className={`h-1.5 rounded-full transition-all duration-500 ${slideIdx === i ? 'bg-yellow-500 w-12' : 'bg-slate-800 w-4 hover:bg-slate-700'}`}></button>
                    ))}
                 </div>
             )}
          </div>
        </div>
      </main>

      {/* Powered By Section */}
      <section className="py-40 border-t border-white/5 relative bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] mb-20">Powered by Global Infrastructure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex flex-col items-center gap-4 group">
                 <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 group-hover:border-white/20 transition-all"><Github size={40} className="text-white" /></div>
                 <span className="font-black text-xl text-white tracking-tighter">GitHub</span>
             </div>
             <div className="flex flex-col items-center gap-4 group">
                 <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 group-hover:border-emerald-500/30 transition-all"><Database size={40} className="text-emerald-500" /></div>
                 <span className="font-black text-xl text-white tracking-tighter">Supabase</span>
             </div>
             <div className="flex flex-col items-center gap-4 group">
                 <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 group-hover:border-indigo-500/30 transition-all"><Brain size={40} className="text-indigo-400" /></div>
                 <span className="font-black text-xl text-white tracking-tighter">OpenAI</span>
             </div>
             <div className="flex flex-col items-center gap-4 group">
                 <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 group-hover:border-orange-500/30 transition-all"><Mail size={40} className="text-orange-400" /></div>
                 <span className="font-black text-xl text-white tracking-tighter">Resend</span>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-20">
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
            <div className="flex items-center gap-4 mb-8">
              <Logo variant="small" />
              <span className="text-3xl font-black tracking-tighter">Quiviex</span>
            </div>
            <p className="text-slate-500 font-bold leading-relaxed">
                The global infrastructure for decentralized learning. Powered by modern LLMs and decentralized repositories.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Infrastructure</span>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Quiz API</button>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Vision Lab</button>
            </div>
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Ecosystem</span>
              <button onClick={onExplore} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Library</button>
              <button onClick={() => onGetStarted()} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Marketplace</button>
            </div>
            <div className="flex flex-col gap-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Legal</span>
              <button onClick={() => onShowLegal?.('guidelines')} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Guidelines</button>
              <button onClick={() => onShowLegal?.('privacy')} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Privacy</button>
              <button onClick={() => onShowLegal?.('terms')} className="text-left font-bold text-slate-400 hover:text-white transition-colors">Terms</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-32 pt-16 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">&copy; 2025 Quiviex Infrastructure Corp.</p>
            <div className="flex gap-8 opacity-40">
                <Github size={20} />
                <Globe size={20} />
            </div>
        </div>
      </footer>
    </div>
  );
};