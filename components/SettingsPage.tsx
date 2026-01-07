import React, { useState, useEffect, useRef } from 'react';
import { User, CustomTheme } from '../types';
import { ArrowLeft, Loader2, Palette, Sparkles, Key, HelpCircle, Check, Settings, Image as ImageIcon } from 'lucide-react';
import { THEMES } from '../constants';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { OpenAIKeyHelpModal } from './OpenAIKeyHelpModal';

export const SettingsPage: React.FC<any> = ({ 
  user, onBack, onUpdateProfile, onClearHistory, onDeleteAccount, onExportAll 
}) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  
  const [ghToken, setGhToken] = useState((window as any).localStorage.getItem('gh_models_token') || '');
  const [openaiKey, setOpenaiKey] = useState((window as any).localStorage.getItem('openai_api_key') || '');
  
  const [appTheme, setAppTheme] = useState(user.preferences?.appTheme || 'light');
  const [customTheme, setCustomTheme] = useState<CustomTheme>(user.preferences?.customThemeData || {
      background: '#0f172a',
      text: '#ffffff',
      accent: '#8b5cf6',
      cardColor: '#1e293b',
      cardOpacity: 0.9,
      backgroundImage: ''
  });
  
  const [showGhHelp, setShowGhHelp] = useState(false);
  const [showOpenAiHelp, setShowOpenAiHelp] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setSaveStatus('saving');
    const timer = (window as any).setTimeout(() => { saveSettings(); }, 800);
    return () => (window as any).clearTimeout(timer);
  }, [username, email, ghToken, openaiKey, appTheme, customTheme]);

  const saveSettings = () => {
    (window as any).localStorage.setItem('gh_models_token', ghToken);
    (window as any).localStorage.setItem('openai_api_key', openaiKey);

    try {
        onUpdateProfile({ 
            username, 
            email, 
            preferences: { 
                appTheme,
                customThemeData: customTheme 
            }
        });
        setSaveStatus('saved');
        (window as any).setTimeout(() => { setSaveStatus('idle'); }, 2000);
    } catch (e) {
        setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen">
       {showGhHelp && <GitHubTokenHelpModal onClose={() => setShowGhHelp(false)} />}
       {showOpenAiHelp && <OpenAIKeyHelpModal onClose={() => setShowOpenAiHelp(false)} />}
       {showThemeEditor && (
         <ThemeEditorModal 
           initialTheme={customTheme} 
           onSave={(t) => { setCustomTheme(t); setAppTheme('custom'); setShowThemeEditor(false); }} 
           onClose={() => setShowThemeEditor(false)} 
           onAiUsed={() => {}} 
         />
       )}
       
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
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profile Name</label>
                    <input type="text" value={username} onChange={(e) => setUsername((e.target as any).value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold transition-all" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email System</label>
                    <input type="email" value={email} onChange={(e) => setEmail((e.target as any).value)} className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-purple-500 font-bold transition-all" />
                </div>
            </div>
        </section>

        {/* AI Configuration */}
        <section className="glass rounded-[2.5rem] p-8 border border-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={22} className="text-indigo-500" /> AI Modules
                </h2>
            </div>
            
            <div className="space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GitHub PAT (Free Models)</label>
                        <button onClick={() => setShowGhHelp(true)} className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                            <HelpCircle size={12} /> Get Token
                        </button>
                    </div>
                    <input 
                        type="password" 
                        value={ghToken} 
                        onChange={(e) => setGhToken((e.target as any).value)} 
                        placeholder="github_pat_..."
                        className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-sm" 
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OpenAI Secret (Advanced AI & Images)</label>
                        <button onClick={() => setShowOpenAiHelp(true)} className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                            <HelpCircle size={12} /> Get Secret Key
                        </button>
                    </div>
                    <input 
                        type="password" 
                        value={openaiKey} 
                        onChange={(e) => setOpenaiKey((e.target as any).value)} 
                        placeholder="sk-..."
                        className="w-full px-5 py-4 bg-white/40 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 font-mono text-sm" 
                    />
                </div>
            </div>
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