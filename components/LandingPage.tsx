
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Zap, Globe, Github, Database, Brain, Rocket, PlayCircle, ChevronLeft, ChevronRight, X, Layers, Cpu, Users, BarChart3, Star, Mail, Loader2, User as UserIcon, Lock, Code } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../services/supabase';
import { Typewriter } from './Typewriter';
import { useTranslation } from '../App';

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
  const { t } = useTranslation();
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
      <div className="fixed inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
          <div className="absolute top-[-30%] left-[-20%] w-[90%] h-[90%] bg-purple-900/40 rounded-full blur-[180px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-900/40 rounded-full blur-[180px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]"></div>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-7xl mx-auto glass rounded-[2rem] sm:rounded-[2.5rem] px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-3xl bg-white/[0.03]">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <Logo variant="small" className="group-hover:scale-110 transition-transform duration-500 shadow-2xl w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-3xl font-black tracking-tighter text-white">Quiviex</span>
          </div>
          <div className="hidden lg:flex items-center gap-12">
            <button onClick={onExplore} className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]">{t('home.explore')}</button>
            <button onClick={() => { if(onJoinGame) onJoinGame(); }} className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> {t('landing.btn_join_game')}</button>
            <button className="text-[11px] font-black text-slate-400 hover:text-purple-400 transition-colors uppercase tracking-[0.3em]">Features</button>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={onGetStarted} className="hidden sm:block text-[11px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-[0.3em]">{t('auth.sign_in')}</button>
            <button onClick={onGetStarted} className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all click-scale border border-white/10">{t('landing.btn_get_started')}</button>
          </div>
        </div>
      </nav>

      <main className="pt-32 sm:pt-48 md:pt-64 pb-20 sm:pb-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-purple-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-8 sm:mb-14 shadow-2xl animate-in slide-in-from-top-6 duration-1000">
            <Sparkles size={14} className="text-yellow-400 sm:w-4 sm:h-4" /> {t('landing.badge_ai')}
          </div>
          <h1 className="text-5xl sm:text-8xl md:text-[11rem] lg:text-[13rem] font-black tracking-tighter text-white mb-8 sm:mb-12 leading-[0.9] sm:leading-[0.7] filter drop-shadow-[0_0_60px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in-95 duration-1000">
            {t('landing.hero_title_line1')} <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400">
              <Typewriter text={t('landing.hero_title_passion')} speed={120} delay={800} />
            </span>
          </h1>
          <p className="max-w-4xl mx-auto text-lg sm:text-2xl text-slate-400 font-medium mb-12 sm:mb-20 leading-relaxed animate-in slide-in-from-bottom-10 duration-1000 px-4">
            {t('landing.hero_subtitle')}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 mb-32 sm:mb-48 animate-in fade-in duration-1000 delay-500 w-full px-4 sm:px-0">
            <button onClick={onGetStarted} className="w-full md:w-auto bg-white text-slate-950 px-8 sm:px-12 py-5 sm:py-7 rounded-[2rem] sm:rounded-[2.5rem] font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_80px_rgba(255,255,255,0.15)] hover:bg-purple-50 transition-all flex items-center justify-center gap-4 group click-scale">
              {t('landing.btn_start_creating')} <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform sm:w-6 sm:h-6" />
            </button>
            <button onClick={onExplore} className="w-full md:w-auto bg-white/10 text-white border border-white/20 px-8 sm:px-12 py-5 sm:py-7 rounded-[2rem] sm:rounded-[2.5rem] font-black text-sm sm:text-base uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-4 click-scale">
              <Globe size={20} className="text-indigo-400 sm:w-6 sm:h-6" /> {t('landing.btn_browse_gallery')}
            </button>
            <button onClick={onJoinGame} className="w-full md:w-auto bg-indigo-600 text-white px-8 sm:px-12 py-5 sm:py-7 rounded-[2rem] sm:rounded-[2.5rem] font-black text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_80px_rgba(99,102,241,0.2)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 click-scale">
              <Zap size={20} className="text-yellow-400 sm:w-6 sm:h-6" /> {t('landing.btn_join_game')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 mb-32 sm:mb-48 text-left px-4 sm:px-0">
              <div className="bg-white/[0.02] border border-white/5 p-8 sm:p-14 rounded-[3rem] sm:rounded-[5rem] backdrop-blur-3xl hover:border-purple-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Zap size={220} /></div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-600/20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-purple-400 mb-6 sm:mb-10 group-hover:scale-110 transition-transform group-hover:bg-purple-600/30 border border-purple-500/20"><Zap size={32} className="sm:w-11 sm:h-11" /></div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 tracking-tighter">{t('landing.feature_ai_title')}</h3>
                  <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed">{t('landing.feature_ai_desc')}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-8 sm:p-14 rounded-[3rem] sm:rounded-[5rem] backdrop-blur-3xl hover:border-indigo-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Lock size={220} /></div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600/20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-indigo-400 mb-6 sm:mb-10 group-hover:scale-110 transition-transform group-hover:bg-indigo-600/30 border border-indigo-500/20"><Lock size={32} className="sm:w-11 sm:h-11" /></div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 tracking-tighter">{t('landing.feature_library_title')}</h3>
                  <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed">{t('landing.feature_library_desc')}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-8 sm:p-14 rounded-[3rem] sm:rounded-[5rem] backdrop-blur-3xl hover:border-pink-500/40 transition-all group shadow-[0_30px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-15 transition-opacity"><Code size={220} /></div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pink-600/20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-pink-400 mb-6 sm:mb-10 group-hover:scale-110 transition-transform group-hover:bg-pink-600/30 border border-pink-500/20"><Code size={32} className="sm:w-11 sm:h-11" /></div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 tracking-tighter">{t('landing.feature_style_title')}</h3>
                  <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed">{t('landing.feature_style_desc')}</p>
              </div>
          </div>

          <div className="relative max-w-6xl mx-auto mb-32 sm:mb-48 px-4 sm:px-0">
             <div className="text-center mb-12 sm:mb-20">
                 <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white mb-4 sm:mb-6">{t('landing.testimonials_title')}</h2>
                 <p className="text-purple-500 text-xs sm:text-sm font-black uppercase tracking-[0.5em]">{t('landing.testimonials_subtitle')}</p>
             </div>
             {isLoadingTestimonials ? (
                 <div className="h-[400px] sm:h-[550px] flex items-center justify-center bg-white/[0.01] rounded-[3rem] sm:rounded-[6rem] border border-white/5 animate-pulse">
                     <Loader2 className="animate-spin text-purple-900" size={60} />
                 </div>
             ) : (
                 <div className="relative group">
                     <div className="absolute inset-0 bg-purple-600/25 blur-[100px] sm:blur-[160px] opacity-30"></div>
                     <div className="bg-white/[0.04] backdrop-blur-3xl rounded-[3rem] sm:rounded-[6rem] p-6 sm:p-24 shadow-2xl border border-white/10 relative z-10 min-h-[450px] sm:min-h-[550px] flex flex-col justify-center transition-all duration-1000 hover:bg-white/[0.05]">
                         <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-12 duration-1000" key={slideIdx}>
                             <div className="flex justify-center gap-1.5 sm:gap-2.5 mb-8 sm:mb-14">
                                 {[...Array(10)].map((_, i) => (
                                     <Star key={i} size={20} className={`sm:w-8 sm:h-8 ${i < testimonials[slideIdx].rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'}`} />
                                 ))}
                             </div>
                             <p className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter italic mb-8 sm:mb-16 break-words px-2">
                                 "{testimonials[slideIdx].review}"
                             </p>
                             <div className="flex flex-col items-center gap-6 sm:gap-8">
                                 <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-purple-500 via-indigo-600 to-fuchsia-600 overflow-hidden p-1.5 sm:p-2 shadow-[0_0_60px_rgba(168,85,247,0.5)]">
                                     <div className="w-full h-full bg-[#05010d] rounded-[1.5rem] sm:rounded-[1.8rem] flex items-center justify-center overflow-hidden">
                                         {testimonials[slideIdx].avatar_url ? (
                                             <img src={testimonials[slideIdx].avatar_url} className="w-full h-full object-cover" />
                                         ) : (
                                             <UserIcon size={32} className="text-purple-400 sm:w-12 sm:h-12" />
                                         )}
                                     </div>
                                 </div>
                                 <div>
                                     <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter">@{testimonials[slideIdx].username}</p>
                                     <p className="text-[10px] sm:text-[12px] font-black text-purple-500 uppercase tracking-[0.5em] mt-2 sm:mt-3">Verified Quiviex User</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
             <div className="mt-12 sm:mt-20 flex justify-center gap-3 sm:gap-5">
                {testimonials.map((_, i) => (
                    <button key={i} onClick={() => setSlideIdx(i)} className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ${slideIdx === i ? 'bg-purple-500 w-16 sm:w-28 shadow-[0_0_25px_rgba(168,85,247,0.7)]' : 'bg-slate-800 w-4 sm:w-6 hover:bg-slate-700'}`}></button>
                ))}
             </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#030108] text-white py-24 sm:py-48 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-16 sm:gap-32">
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg mx-auto md:mx-0">
            <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Logo variant="medium" className="shadow-[0_0_60px_rgba(168,85,247,0.4)] w-12 h-12 sm:w-16 sm:h-16" />
              <span className="text-4xl sm:text-6xl font-black tracking-tighter">Quiviex</span>
            </div>
            <p className="text-slate-500 font-bold leading-relaxed text-lg sm:text-2xl">
                {t('landing.footer_tagline')}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-28 text-center sm:text-left">
            <div className="flex flex-col gap-6 sm:gap-10">
              <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">Product</span>
              <button onClick={() => onGetStarted()} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('home.dashboard')}</button>
              <button onClick={() => onGetStarted()} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('creator.header')}</button>
            </div>
            <div className="flex flex-col gap-6 sm:gap-10">
              <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">{t('home.explore')}</span>
              <button onClick={onExplore} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">Library</button>
              <button onClick={() => onGetStarted()} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('home.trophies')}</button>
            </div>
            <div className="flex flex-col gap-6 sm:gap-10 col-span-2 sm:col-span-1">
              <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.5em] text-purple-600">Legal</span>
              <button onClick={() => onShowLegal?.('guidelines')} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('legal.guidelines')}</button>
              <button onClick={() => onShowLegal?.('privacy')} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('legal.privacy')}</button>
              <button onClick={() => onShowLegal?.('terms')} className="font-bold text-slate-400 hover:text-white transition-colors text-lg sm:text-xl">{t('legal.terms')}</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-24 sm:mt-48 pt-12 sm:pt-24 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-12">
            <p className="text-slate-600 text-xs sm:text-sm font-bold uppercase tracking-[0.4em]">&copy; 2026 Quiviex Learning Labs.</p>
            <div className="flex gap-10 sm:gap-14 opacity-40">
                <Github size={28} className="hover:text-purple-400 cursor-pointer transition-all hover:scale-125 sm:w-8 sm:h-8" />
                <Globe size={28} className="hover:text-purple-400 cursor-pointer transition-all hover:scale-125 sm:w-8 sm:h-8" />
            </div>
        </div>
      </footer>
    </div>
  );
};
