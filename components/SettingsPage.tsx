import React, { useState, useEffect, useRef } from 'react';
import { User, CustomTheme } from '../types';
import { ArrowLeft, Loader2, Palette, Sparkles, Check, Settings, Image as ImageIcon, Type, Key, ShieldCheck, Github, Upload, X, User as UserIcon, Star, MessageSquare, Send } from 'lucide-react';
import { THEMES, FONT_NAMES, AI_MODELS } from '../constants';
import { ThemeEditorModal } from './ThemeEditorModal';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { OpenAIKeyHelpModal } from './OpenAIKeyHelpModal';
import { supabase } from '../services/supabase';
import opentype from 'opentype.js';

const FONT_STORAGE_BASE = 'https://ulkabycvuxyrwtkbwhid.supabase.co/storage/v1/object/public/Fonts%20Quiviex';

export const SettingsPage: React.FC<any> = ({ 
  user, onBack, onUpdateProfile, onClearHistory, onDeleteAccount, onExportAll 
}) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  
  // AI Keys
  const [githubToken, setGithubToken] = useState(user.preferences?.githubToken || '');
  const [openaiKey, setOpenaiKey] = useState(user.preferences?.openaiKey || '');
  const [aiTextProvider, setAiTextProvider] = useState(user.preferences?.aiTextProvider || 'github');
  const [aiImageProvider, setAiImageProvider] = useState(user.preferences?.aiImageProvider || 'openai');
  const [textModel, setTextModel] = useState(user.preferences?.textModel || 'gpt-4o-mini');

  const [appTheme, setAppTheme] = useState(user.preferences?.appTheme || 'light');
  const [appFont, setAppFont] = useState(user.preferences?.appFont || 'QuiviexCustom');
  const [customTheme, setCustomTheme] = useState<CustomTheme>(user.preferences?.customThemeData || {
      background: '#0f172a',
      text: '#ffffff',
      accent: '#8b5cf6',
      cardColor: '#1e293b',
      cardOpacity: 0.9,
      backgroundImage: ''
  });
  
  const [realFontNames, setRealFontNames] = useState<Record<string, string>>({});
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showGhHelp, setShowGhHelp] = useState(false);
  const [showOaiHelp, setShowOaiHelp] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  // Platform Rating State
  const [platformRating, setPlatformRating] = useState<number>(0);
  const [platformReview, setPlatformReview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract internal font names from TTF files
  useEffect(() => {
    const fetchFontNames = async () => {
      const names: Record<string, string> = {};
      const promises = Array.from({ length: 16 }, (_, i) => {
        const id = `Font${i + 1}`;
        const url = `${FONT_STORAGE_BASE}/${i + 1}.ttf`;
        return fetch(url)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            const font = opentype.parse(buffer);
            names[id] = font.names.fontFamily?.en || id;
          })
          .catch(() => {
            names[id] = FONT_NAMES[id] || id;
          });
      });
      await Promise.all(promises);
      setRealFontNames(names);
    };
    fetchFontNames();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setSaveStatus('saving');
    const timer = (window as any).setTimeout(() => { saveSettings(); }, 800);
    return () => (window as any).clearTimeout(timer);
  }, [username, email, appTheme, appFont, customTheme, githubToken, openaiKey, aiTextProvider, aiImageProvider, textModel, avatarUrl]);

  const saveSettings = () => {
    try {
        onUpdateProfile({ 
            username, 
            email,
            avatarUrl,
            preferences: { 
                appTheme,
                appFont,
                githubToken,
                openaiKey,
                aiTextProvider,
                aiImageProvider,
                textModel,
                customThemeData: customTheme 
            }
        });
        setSaveStatus('saved');
        (window as any).setTimeout(() => { setSaveStatus('idle'); }, 2000);
    } catch (e) {
        setSaveStatus('error');
    }
  };

  const handleSubmitPlatformReview = async () => {
      if (platformRating === 0 || !platformReview.trim()) return;
      setIsSubmittingReview(true);
      try {
          const { error } = await supabase.from('platform_reviews').upsert({
              user_id: user.id,
              username: user.username,
              rating: platformRating,
              review: platformReview,
              avatar_url: user.avatarUrl,
              created_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          if (error) throw error;
          setReviewSubmitted(true);
          (window as any).setTimeout(() => setReviewSubmitted(false), 3000);
      } catch (e: any) {
          (window as any).alert("Failed to submit review: " + e.message);
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("File is too large. Max 5MB allowed.");
          return;
      }

      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          alert("Only JPG, PNG, and GIF are allowed.");
          return;
      }

      setIsUploadingAvatar(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
              .from('UserProfiles')
              .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('UserProfiles')
              .getPublicUrl(fileName);

          setAvatarUrl(publicUrl);
      } catch (err: any) {
          console.error("Avatar upload failed:", err);
          alert("Upload failed: " + err.message);
      } finally {
          setIsUploadingAvatar(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50">
       {showThemeEditor && (
         <ThemeEditorModal 
           initialTheme={customTheme} 
           onSave={(t) => { setCustomTheme(t); setAppTheme('custom'); setShowThemeEditor(false); }} 
           onClose={() => setShowThemeEditor(false)} 
           onAiUsed={() => {}} 
         />
       )}
       {showGhHelp && <GitHubTokenHelpModal onClose={() => setShowGhHelp(false)} />}
       {showOaiHelp && <OpenAIKeyHelpModal onClose={() => setShowOaiHelp(false)} />}
       
       <div className="glass backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Settings</h1>
            {saveStatus === 'saving' && <Loader2 className="animate-spin text-slate-400" size={16} />}
          </div>
        </div>
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 animate-in zoom-in">
            <Check size={16} /><span className="text-xs font-black">Changes Saved</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20 stagger-in">
        
        {/* Profile */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={22} className="text-purple-500" /> Account Identity</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-200 flex items-center justify-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={48} className="text-slate-400" />
                        )}
                        {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="animate-spin text-white" size={32} />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 border-2 border-white"
                        disabled={isUploadingAvatar}
                    >
                        <Upload size={16} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleAvatarUpload}
                    />
                </div>
                <div className="flex-1 w-full space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profile Name</label>
                        <input type="text" value={username} onChange={(e) => setUsername((e.target as any).value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold transition-all text-slate-900" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email System</label>
                        <input type="email" value={email} onChange={(e) => setEmail((e.target as any).value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold transition-all text-slate-900" />
                    </div>
                </div>
            </div>
        </section>

        {/* Platform Rating Section */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Star size={22} className="text-yellow-500 fill-yellow-500" /> Rate Quiviex</h2>
            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                Enjoying the platform? High ratings with text (8-10 stars) will be featured on our global landing page!
            </p>
            
            <div className="flex flex-wrap justify-between gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button 
                        key={star}
                        onClick={() => setPlatformRating(star)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all click-scale border-2 ${
                            platformRating >= star 
                            ? 'bg-yellow-400 text-white border-yellow-300 shadow-lg' 
                            : 'bg-white text-slate-300 border-slate-100 hover:border-yellow-200'
                        }`}
                    >
                        {star}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <MessageSquare size={18} className="absolute left-4 top-4 text-slate-400" />
                    <textarea 
                        value={platformReview}
                        onChange={(e) => setPlatformReview((e.target as any).value)}
                        placeholder="What do you think of Quiviex? (Your review may be featured)"
                        className="w-full pl-12 pr-6 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-yellow-400 font-bold transition-all text-slate-900 min-h-[120px] resize-none"
                    />
                </div>
                <button 
                    onClick={handleSubmitPlatformReview}
                    disabled={isSubmittingReview || platformRating === 0 || !platformReview.trim()}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all click-scale flex items-center justify-center gap-2 shadow-xl ${
                        reviewSubmitted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-900 text-white hover:bg-black disabled:opacity-50'
                    }`}
                >
                    {isSubmittingReview ? <Loader2 className="animate-spin" /> : reviewSubmitted ? <Check /> : <Send size={18} />}
                    {reviewSubmitted ? 'SUBMITTED' : 'SUBMIT REVIEW'}
                </button>
            </div>
        </section>

        {/* AI Credentials */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Sparkles size={22} className="text-indigo-500" /> AI Authorization</h2>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Github size={12}/> GitHub Models Token</label>
                        <button onClick={() => setShowGhHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Token</button>
                    </div>
                    <input type="password" value={githubToken} onChange={(e) => setGithubToken((e.target as any).value)} placeholder="github_pat_..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono transition-all text-slate-900" />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Key size={12}/> OpenAI Secret Key</label>
                        <button onClick={() => setShowOaiHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Key</button>
                    </div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey((e.target as any).value)} placeholder="sk-..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono transition-all text-slate-900" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Text Provider</label>
                        <select value={aiTextProvider} onChange={(e) => setAiTextProvider((e.target as any).value)} className="w-full px-4 py-3 bg-white/40 border-2 border-slate-100 rounded-xl font-bold text-slate-900">
                            <option value="github">GitHub Models</option>
                            <option value="openai">OpenAI API</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Image Provider</label>
                        <select value={aiImageProvider} onChange={(e) => setAiImageProvider((e.target as any).value)} className="w-full px-4 py-3 bg-white/40 border-2 border-slate-100 rounded-xl font-bold text-slate-900">
                            <option value="openai">OpenAI API</option>
                            <option value="github">N/A (GitHub Only Text)</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>

        {/* Typography Section */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Type size={22} className="text-blue-500" /> Typography</h2>
            <div className="bg-white/40 rounded-[2rem] overflow-hidden border border-slate-100">
                <div className="max-h-72 overflow-y-auto custom-scrollbar p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button 
                            onClick={() => setAppFont('QuiviexCustom')}
                            className={`w-full p-4 flex items-center justify-between rounded-2xl transition-all ${appFont === 'QuiviexCustom' ? 'bg-white shadow-md ring-2 ring-blue-100' : 'hover:bg-white/40'}`}
                        >
                            <div className="flex flex-col items-start min-w-0">
                                <span className="font-bold text-slate-800 text-base truncate w-full text-left">Quiviex Default</span>
                                <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Standard</span>
                            </div>
                            {appFont === 'QuiviexCustom' && <div className="bg-blue-500 text-white p-1 rounded-full flex-shrink-0"><Check size={12} /></div>}
                        </button>
                        {Array.from({ length: 16 }, (_, i) => {
                            const fontId = `Font${i + 1}`;
                            const fontName = realFontNames[fontId] || FONT_NAMES[fontId] || fontId;
                            return (
                                <button 
                                    key={fontId}
                                    onClick={() => setAppFont(fontId)}
                                    className={`w-full p-4 flex items-center justify-between rounded-2xl transition-all ${appFont === fontId ? 'bg-white shadow-md ring-2 ring-blue-100' : 'hover:bg-white/40'}`}
                                >
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="font-bold text-slate-800 text-base truncate w-full text-left" style={{ fontFamily: fontId }}>{fontName}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest opacity-40">{fontId}</span>
                                    </div>
                                    {appFont === fontId && <div className="bg-blue-500 text-white p-1 rounded-full flex-shrink-0"><Check size={12} /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Fonts are cloud-hosted in the Quiviex Assets bucket</p>
        </section>

        {/* Appearance Section */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Palette size={22} className="text-pink-500" /> Interface Style</h2>
                <button onClick={() => setShowThemeEditor(true)} className="p-3 bg-white/60 hover:bg-white rounded-xl transition-all text-purple-600 shadow-sm border border-purple-100 click-scale">
                    <Palette size={20} />
                </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(THEMES).map(([key, theme]) => (
                    <button 
                        key={key}
                        onClick={() => setAppTheme(key)}
                        className={`p-4 rounded-[1.5rem] border-2 font-black text-xs transition-all flex flex-col items-center gap-3 click-scale ${appTheme === key ? 'border-purple-500 bg-white shadow-xl scale-105' : 'border-white bg-white/20 hover:bg-white/40'}`}
                    >
                        <div className={`w-full h-10 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-inner`}></div>
                        <span className="text-slate-800 tracking-widest uppercase">{theme.label}</span>
                    </button>
                ))}
                <button 
                    onClick={() => setShowThemeEditor(true)}
                    className={`p-4 rounded-[1.5rem] border-2 font-black text-xs transition-all flex flex-col items-center gap-3 click-scale ${appTheme === 'custom' ? 'border-indigo-500 bg-white shadow-xl scale-105' : 'border-white bg-white/20 hover:bg-white/40'}`}
                >
                    <div className="w-full h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><ImageIcon size={18} /></div>
                    <span className="text-slate-800 tracking-widest uppercase">Custom Theme</span>
                </button>
            </div>
        </section>

        <section className="pt-8 border-t border-slate-200">
             <button onClick={onExportAll} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl click-scale shadow-lg hover:shadow-slate-300 transition-all uppercase tracking-widest text-sm mb-4">Export All Quizzes (.ZIP)</button>
             <button onClick={onDeleteAccount} className="w-full bg-rose-50 text-rose-500 font-black py-4 rounded-2xl click-scale border border-rose-100 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest text-xs">Delete Account History</button>
        </section>
      </div>
    </div>
  );
};