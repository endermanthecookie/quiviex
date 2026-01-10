import React, { useState, useEffect, useRef } from 'react';
import { User, CustomTheme, AIMode } from '../types';
import { ArrowLeft, Loader2, Palette, Sparkles, Check, Settings, Image as ImageIcon, Key, ShieldCheck, Github, Upload, X, User as UserIcon, Star, MessageSquare, Send, Cpu, Zap, Layers } from 'lucide-react';
import { THEMES } from '../constants';
import { ThemeEditorModal } from './ThemeEditorModal';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { OpenAIKeyHelpModal } from './OpenAIKeyHelpModal';
import { supabase } from '../services/supabase';

export const SettingsPage: React.FC<any> = ({ 
  user, onBack, onUpdateProfile, onClearHistory, onDeleteAccount, onExportAll 
}) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  
  const [githubToken, setGithubToken] = useState(user.preferences?.githubToken || '');
  const [openaiKey, setOpenaiKey] = useState(user.preferences?.openaiKey || '');
  const [aiMode, setAiMode] = useState<AIMode>(user.preferences?.aiMode || '1');
  const [appTheme, setAppTheme] = useState(user.preferences?.appTheme || 'light');
  
  const [customTheme, setCustomTheme] = useState<CustomTheme>(user.preferences?.customThemeData || {
      background: '#0f172a',
      text: '#ffffff',
      accent: '#8b5cf6',
      cardColor: '#1e293b',
      cardOpacity: 0.9,
      backgroundImage: ''
  });
  
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showGhHelp, setShowGhHelp] = useState(false);
  const [showOaiHelp, setShowOaiHelp] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  const [platformRating, setPlatformRating] = useState<number>(0);
  const [platformReview, setPlatformReview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setSaveStatus('saving');
    const timer = window.setTimeout(() => { saveSettings(); }, 800);
    return () => window.clearTimeout(timer);
  }, [username, email, appTheme, customTheme, githubToken, openaiKey, aiMode, avatarUrl]);

  const saveSettings = () => {
    try {
        onUpdateProfile({ 
            username, 
            email,
            avatarUrl,
            preferences: { 
                appTheme,
                githubToken,
                openaiKey,
                aiMode,
                customThemeData: customTheme 
            }
        });
        setSaveStatus('saved');
        window.setTimeout(() => { setSaveStatus('idle'); }, 2000);
    } catch (e) { setSaveStatus('error'); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingAvatar(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
          await supabase.storage.from('UserProfiles').upload(fileName, file, { upsert: true });
          const { data: { publicUrl } } = supabase.storage.from('UserProfiles').getPublicUrl(fileName);
          setAvatarUrl(publicUrl);
      } catch (err: any) { alert("Upload failed: " + err.message); } finally { setIsUploadingAvatar(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
       {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setAppTheme('custom'); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => {}} />}
       {showGhHelp && <GitHubTokenHelpModal onClose={() => setShowGhHelp(false)} />}
       {showOaiHelp && <OpenAIKeyHelpModal onClose={() => setShowOaiHelp(false)} />}
       
       <div className="glass backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-800" /></button>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-black text-slate-900">Settings</h1>{saveStatus === 'saving' && <Loader2 className="animate-spin text-slate-400" size={16} />}</div>
        </div>
        {saveStatus === 'saved' && <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 animate-in zoom-in"><Check size={16} /><span className="text-xs font-black">Saved</span></div>}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20 stagger-in">
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Cpu size={22} className="text-indigo-500" /> AI Protocols</h2>
            <div className="grid grid-cols-1 gap-4 mb-8">
                <button onClick={() => setAiMode('1')} className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-5 group click-scale ${aiMode === '1' ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/40 border-slate-100 hover:border-indigo-100 text-slate-500'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiMode === '1' ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'}`}><Github size={20} /></div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest">Mode 1: GitHub Focused</p>
                        <p className="text-[10px] font-bold opacity-60">Text Generation only. No Visual Generation.</p>
                    </div>
                </button>
                <button onClick={() => setAiMode('2')} className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-5 group click-scale ${aiMode === '2' ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/40 border-slate-100 hover:border-indigo-100 text-slate-500'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiMode === '2' ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'}`}><Zap size={20} /></div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest">Mode 2: OpenAI Full</p>
                        <p className="text-[10px] font-bold opacity-60">Full Protocol. AI Text + DALL-E Visuals.</p>
                    </div>
                </button>
                <button onClick={() => setAiMode('3')} className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-center gap-5 group click-scale ${aiMode === '3' ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl' : 'bg-white/40 border-slate-100 hover:border-indigo-100 text-slate-500'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiMode === '3' ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'}`}><Layers size={20} /></div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest">Mode 3: Hybrid Protocol</p>
                        <p className="text-[10px] font-bold opacity-60">GitHub Text Models + OpenAI DALL-E Visuals.</p>
                    </div>
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2"><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Github size={12}/> GitHub Token</label><button onClick={() => setShowGhHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Token</button></div>
                    <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="github_pat_..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-slate-900" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2"><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Key size={12}/> OpenAI Key</label><button onClick={() => setShowOaiHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Key</button></div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-slate-900" />
                </div>
            </div>
        </section>

        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={22} className="text-purple-500" /> Account Identity</h2>
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl bg-slate-200 flex items-center justify-center">
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-400" />}
                        {isUploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 border-2 border-white"><Upload size={16} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <div className="flex-1 w-full space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profile Name</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-slate-900" />
                    </div>
                </div>
            </div>
        </section>

        <section className="pt-8 border-t border-slate-200">
             <button onClick={onExportAll} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl click-scale shadow-lg transition-all uppercase tracking-widest text-sm mb-4">Export All Quizzes (.ZIP)</button>
             <button onClick={onDeleteAccount} className="w-full bg-rose-50 text-rose-500 font-black py-4 rounded-2xl click-scale border border-rose-100 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest text-xs">Delete Account History</button>
        </section>
      </div>
    </div>
  );
};