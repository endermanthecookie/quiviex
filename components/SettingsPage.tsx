import React, { useState, useEffect, useRef } from 'react';
import { User, CustomTheme, AIMode } from '../types';
import { ArrowLeft, Loader2, Palette, Sparkles, Check, Settings, Image as ImageIcon, Key, ShieldCheck, Github, Upload, X, User as UserIcon, Star, MessageSquare, Send, Cpu, Zap, Layers, Volume2, VolumeX, Keyboard, Share2, Copy, Globe, Languages } from 'lucide-react';
import { THEMES } from '../constants';
import { ThemeEditorModal } from './ThemeEditorModal';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { OpenAIKeyHelpModal } from './OpenAIKeyHelpModal';
import { supabase } from '../services/supabase';
import { sfx } from '../services/soundService';
import { useTranslation } from '../App';

const LANGUAGE_OPTIONS = [
    { id: 'en', name: 'English', native: 'English' },
    { id: 'nl', name: 'Dutch', native: 'Nederlands' },
    { id: 'de', name: 'German', native: 'Deutsch' },
    { id: 'fr', name: 'French', native: 'Français' },
    { id: 'ja', name: 'Japanese', native: '日本語' },
    { id: 'ko', name: 'Korean', native: '한국어' },
    { id: 'es', name: 'Spanish', native: 'Español' },
    { id: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
    { id: 'it', name: 'Italian', native: 'Italiano' },
    { id: 'tr', name: 'Turkish', native: 'Türkçe' },
    { id: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文' }
];

export const SettingsPage: React.FC<any> = ({ 
  user, onBack, onUpdateProfile, onClearHistory, onDeleteAccount, onExportAll, onOpenShortcuts
}) => {
  const { t, setLanguage: setGlobalLanguage } = useTranslation();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  
  const [githubToken, setGithubToken] = useState(user.preferences?.githubToken || '');
  const [openaiKey, setOpenaiKey] = useState(user.preferences?.openaiKey || '');
  const [aiMode, setAiMode] = useState<AIMode>(user.preferences?.aiMode || '1');
  const [appTheme, setAppTheme] = useState(user.preferences?.appTheme || 'light');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(user.preferences?.soundEnabled ?? true);
  const [language, setLanguage] = useState(user.preferences?.language || 'en');
  
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
  const [copiedLink, setCopiedLink] = useState(false);
  const isFirstRender = useRef(true);

  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setSaveStatus('saving');
    sfx.setEnabled(soundEnabled);
    const timer = window.setTimeout(() => { saveSettings(); }, 800);
    return () => window.clearTimeout(timer);
  }, [username, email, appTheme, customTheme, githubToken, openaiKey, aiMode, avatarUrl, soundEnabled, language]);

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
                soundEnabled,
                language,
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

  const handleCopyVanityUrl = () => {
      const url = `${window.location.origin}/profiles/@${user.username}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLanguageChange = (newLang: string) => {
      setLanguage(newLang);
      setGlobalLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-slate-50">
       {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setAppTheme('custom'); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => {}} />}
       {showGhHelp && <GitHubTokenHelpModal onClose={() => setShowGhHelp(false)} />}
       {showOaiHelp && <OpenAIKeyHelpModal onClose={() => setShowOaiHelp(false)} />}
       
       <div className="glass backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-800" /></button>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-black text-slate-900">{t('home.dashboard')} / {t('settings.general')}</h1>{saveStatus === 'saving' && <Loader2 className="animate-spin text-slate-400" size={16} />}</div>
        </div>
        {saveStatus === 'saved' && <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 animate-in zoom-in"><Check size={16} /><span className="text-xs font-black">{t('common.done')}</span></div>}
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-20 stagger-in">
        <section className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100 border border-indigo-400 text-white">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Languages size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">App Language</h2>
                    <p className="text-indigo-100 text-xs font-bold opacity-80 uppercase tracking-widest">Auto-detected from device</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleLanguageChange(opt.id)}
                        className={`flex items-center justify-between p-5 rounded-3xl transition-all border-2 text-left group ${
                            language === opt.id 
                            ? 'bg-white text-indigo-600 border-white shadow-lg scale-[1.02]' 
                            : 'bg-indigo-500/20 border-white/10 text-white hover:bg-indigo-500/40 hover:border-white/20'
                        }`}
                    >
                        <div>
                            <p className="font-black text-lg leading-none mb-1">{opt.native}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${language === opt.id ? 'text-indigo-400' : 'text-indigo-200'}`}>{opt.name}</p>
                        </div>
                        {language === opt.id && (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check size={18} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </section>

        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={22} className="text-indigo-500" /> {t('settings.general')}</h2>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${soundEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-sm">{t('settings.sound_effects')}</p>
                            <p className="text-xs font-bold text-slate-400">{t('settings.sound_desc')}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <button onClick={onOpenShortcuts} className="w-full flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Keyboard size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-slate-800 text-sm">{t('settings.shortcuts')}</p>
                            <p className="text-xs font-bold text-slate-400">View power user keybindings</p>
                        </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-indigo-600 transition-colors px-2">Open</div>
                </button>
            </div>
        </section>

        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Cpu size={22} className="text-indigo-500" /> {t('settings.ai_protocols')}</h2>
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
                    <div className="flex justify-between items-center mb-2"><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Github size={12}/> {t('settings.github_token')}</label><button onClick={() => setShowGhHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Token</button></div>
                    <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="github_pat_..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-slate-900" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2"><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Key size={12}/> {t('settings.openai_key')}</label><button onClick={() => setShowOaiHelp(true)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Get Key</button></div>
                    <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-slate-900" />
                </div>
            </div>
        </section>

        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={22} className="text-purple-500" /> {t('settings.account_identity')}</h2>
            
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Share2 size={24} /></div>
                    <div>
                        <p className="font-black text-slate-800 text-sm">{t('settings.vanity_url')}</p>
                        <p className="text-xs font-bold text-slate-400">quiviex.vercel.app/profiles/@{user.username}</p>
                    </div>
                </div>
                <button 
                  onClick={handleCopyVanityUrl}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${copiedLink ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'} shadow-lg click-scale`}
                >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? t('common.done') : 'Copy Link'}
                </button>
            </div>

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
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('settings.profile_name')}</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold text-slate-900" />
                    </div>
                </div>
            </div>
        </section>

        <section className="pt-8 border-t border-slate-200">
             <button onClick={onExportAll} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl click-scale shadow-lg transition-all uppercase tracking-widest text-sm mb-4">{t('settings.export_all')}</button>
             <button onClick={onDeleteAccount} className="w-full bg-rose-50 text-rose-500 font-black py-4 rounded-2xl click-scale border border-rose-100 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest text-xs">{t('settings.delete_history')}</button>
        </section>
      </div>
    </div>
  );
};
