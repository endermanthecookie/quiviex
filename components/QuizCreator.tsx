
import React, { useState, useEffect } from 'react';
import { Menu, Home, X, Trash2, Image as ImageIcon, Sparkles, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, Wand2, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book, Check, AlertTriangle, ShieldCheck, Infinity as InfinityIcon, Loader2, Info } from 'lucide-react';
import { Quiz, Question, QuestionType, User, CustomTheme, QuizVisibility } from '../types';
import { COLORS, TUTORIAL_STEPS, THEMES, BANNED_WORDS } from '../constants';
import { TutorialWidget } from './TutorialWidget';
import { ValidationModal } from './ValidationModal';
import { ImageSelectionModal } from './ImageSelectionModal';
import { GitHubAIModal } from './GitHubAIModal';
import { ImageQuizModal } from './ImageQuizModal';
import { MusicSelectionModal } from './MusicSelectionModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { SaveOptionsModal } from './SaveOptionsModal';
import { LegalModal } from './LegalModal';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';

interface QuizCreatorProps {
  initialQuiz: Quiz | null;
  currentUser: User;
  onSave: (quiz: Quiz) => void;
  onExit: () => void;
  startWithTutorial: boolean;
  onTutorialComplete?: () => void;
  onStatUpdate: (type: 'create' | 'ai_img' | 'ai_quiz') => void;
  onOpenSettings: () => void;
  onRefreshProfile?: () => void;
}

const DEFAULT_QUESTION: Question = {
  question: '',
  image: '',
  type: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
  explanation: ''
};

export const QuizCreator: React.FC<QuizCreatorProps> = ({ initialQuiz, currentUser, onSave, onExit, startWithTutorial, onTutorialComplete, onStatUpdate, onOpenSettings, onRefreshProfile }) => {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [quizTheme, setQuizTheme] = useState('classic');
  const [customTheme, setCustomTheme] = useState<CustomTheme | undefined>(undefined);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [bgMusic, setBgMusic] = useState('');
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImageQuizModal, setShowImageQuizModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showTokenHelpModal, setShowTokenHelpModal] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  
  const [showModerationAlert, setShowModerationAlert] = useState<{detected: string[], warningsRemaining: number, isSudo: boolean} | null>(null);
  const [isProcessingModeration, setIsProcessingModeration] = useState(false);

  useEffect(() => {
    if (initialQuiz) {
      setQuizTitle(initialQuiz.title);
      setQuestions(JSON.parse(JSON.stringify(initialQuiz.questions)));
      setQuizTheme(initialQuiz.theme || 'classic');
      setCustomTheme(initialQuiz.customTheme);
      setShuffleQuestions(initialQuiz.shuffleQuestions || false);
      setBgMusic(initialQuiz.backgroundMusic || '');
    }
  }, [initialQuiz]);

  const scanForBannedWords = (text: string): string[] => {
      if (!text) return [];
      const normalized = text.toLowerCase();
      return BANNED_WORDS.filter(word => {
          if (!word) return false;
          try {
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const isAlphaNumeric = /^[a-z0-9]+$/i.test(word);
              const regex = isAlphaNumeric ? new RegExp(`\\b${escapedWord}\\b`, 'i') : new RegExp(escapedWord, 'i');
              return regex.test(normalized);
          } catch (e) {
              return normalized.includes(word.toLowerCase());
          }
      });
  };

  const performModerationCheck = async (): Promise<boolean> => {
      let detected: Set<string> = new Set();
      scanForBannedWords(quizTitle).forEach(w => detected.add(w));
      questions.forEach(q => {
          scanForBannedWords(q.question).forEach(w => detected.add(w));
          scanForBannedWords(q.explanation || '').forEach(w => detected.add(w));
          q.options.forEach(opt => scanForBannedWords(opt).forEach(w => detected.add(w)));
      });

      if (detected.size > 0) {
          setIsProcessingModeration(true);
          const isSudo = currentUser.email === 'sudo@quiviex.com';
          try {
              const { data: profile } = await supabase.from('profiles').select('warnings').eq('user_id', currentUser.id).maybeSingle();
              const serverWarnings = profile?.warnings || 0;
              const nextWarnings = serverWarnings + 1;
              if (nextWarnings >= 3 && !isSudo) {
                  await triggerNuclearBan();
                  return false;
              }
              await supabase.from('profiles').update({ warnings: nextWarnings }).eq('user_id', currentUser.id);
              if (onRefreshProfile) await onRefreshProfile();
              setShowModerationAlert({ detected: Array.from(detected), warningsRemaining: isSudo ? 999999 : 3 - nextWarnings, isSudo });
          } catch (err: any) {
              alert("Verification Error: " + err.message);
          } finally {
              setIsProcessingModeration(false);
          }
          return false;
      }
      return true;
  };

  const triggerNuclearBan = async () => {
      await supabase.from('banned_emails').insert({ email: currentUser.email, reason: 'Content Moderation: Terminal Strike' });
      await supabase.from('quizzes').delete().eq('user_id', currentUser.id).neq('visibility', 'public');
      await supabase.from('profiles').delete().eq('user_id', currentUser.id);
      await supabase.auth.signOut();
      window.location.reload();
  };

  const handleInitiateSave = async () => {
    const errors: string[] = [];
    if (!quizTitle.trim()) errors.push('• Add a quiz title');
    if (questions.length === 0) errors.push('• Add at least one question');
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }
    const isModerated = await performModerationCheck();
    if (isModerated) setShowSaveOptionsModal(true);
  };

  const handleFinalizeSave = (visibility: QuizVisibility) => {
    const validQuestions = questions.filter(q => q.question.trim());
    onSave({
      id: initialQuiz?.id || Date.now(),
      userId: currentUser.id, 
      title: quizTitle,
      questions: validQuestions,
      createdAt: initialQuiz?.createdAt || new Date().toISOString(),
      theme: quizTheme,
      customTheme: customTheme,
      shuffleQuestions: shuffleQuestions,
      backgroundMusic: bgMusic,
      visibility: visibility
    });
    setShowSaveOptionsModal(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length) setCurrentQuestionIndex(newQuestions.length - 1);
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-[#f1f5f9] relative overflow-hidden font-['Plus_Jakarta_Sans']">
        {/* Modals */}
        {showModerationAlert && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-xl w-full p-12 text-center animate-in zoom-in duration-500">
                    <ShieldAlert size={60} className="mx-auto mb-8 text-rose-500" />
                    <h3 className="text-4xl font-black text-slate-900 mb-6">Moderation Strike</h3>
                    <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] mb-10">
                        <p className="text-rose-600 font-black text-2xl uppercase tracking-widest">{showModerationAlert.isSudo ? 'SUDO OVERRIDE' : 'STRIKE ISSUED'}</p>
                        <p className="text-sm font-bold text-rose-400 mt-2">Warnings Remaining: {showModerationAlert.isSudo ? '∞' : showModerationAlert.warningsRemaining}</p>
                    </div>
                    <button onClick={() => setShowModerationAlert(null)} className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest click-scale">I'll fix it</button>
                </div>
            </div>
        )}

        {showSaveOptionsModal && <SaveOptionsModal onConfirm={handleFinalizeSave} onCancel={() => setShowSaveOptionsModal(false)} />}
        {showAIModal && <GitHubAIModal onGenerate={(qs: Question[], t: string) => { setQuestions(prev => [...prev, ...qs]); setQuizTitle(t); }} onClose={() => setShowAIModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
        {showMusicModal && <MusicSelectionModal currentMusic={bgMusic} onSelect={setBgMusic} onClose={() => setShowMusicModal(false)} />}
        {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => onStatUpdate('ai_img')} />}

        {/* Sidebar - RESTORED DARK INTERFACE */}
        <div className="w-[320px] bg-[#1a1f2e] text-white flex flex-col relative z-20 shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center gap-4">
                <Logo variant="small" />
                <h1 className="text-2xl font-black tracking-tight">Editor</h1>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {questions.map((q, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setCurrentQuestionIndex(idx)} 
                        className={`p-6 rounded-[1.5rem] cursor-pointer transition-all border ${currentQuestionIndex === idx ? 'bg-[#5c4cf4] border-[#7c6ff5] shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-xs font-black uppercase tracking-widest ${currentQuestionIndex === idx ? 'text-white' : 'text-slate-500'}`}>Q. {idx + 1}</span>
                            {questions.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-opacity"><Trash2 size={16} /></button>
                            )}
                        </div>
                        <p className={`text-sm font-bold line-clamp-2 leading-relaxed ${!q.question ? 'italic opacity-30' : 'text-white'}`}>
                            {q.question || 'Untitled Question...'}
                        </p>
                    </div>
                ))}

                <button onClick={addQuestion} className="w-full py-6 border-2 border-dashed border-white/10 rounded-[1.5rem] text-slate-400 hover:text-white hover:border-white/30 transition-all font-black flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
                    <PlusCircle size={20} /> Add Item
                </button>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
                 <button onClick={() => setShowAIModal(true)} className="w-full bg-[#5c4cf4] hover:bg-[#4a3ddb] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl uppercase tracking-widest text-xs">
                     <Sparkles size={16} /> AI Assistant
                 </button>
            </div>
        </div>

        {/* Main Canvas - CENTERED CARD LAYOUT */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Header */}
            <header className="bg-white px-10 py-6 flex items-center justify-between border-b border-slate-100 z-10">
                <button onClick={onExit} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <ArrowLeft size={28} />
                </button>
                
                <input 
                    type="text" 
                    value={quizTitle} 
                    onChange={(e) => setQuizTitle(e.target.value)} 
                    placeholder="Untitled Quiz" 
                    className="text-2xl font-black bg-transparent text-slate-900 border-none focus:ring-0 placeholder-slate-200 text-center tracking-tight flex-1 max-w-xl mx-4" 
                />

                <button 
                    onClick={handleInitiateSave} 
                    disabled={isProcessingModeration} 
                    className="bg-[#1a1f2e] hover:bg-black text-white font-black px-10 py-4 rounded-full shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em]"
                >
                    {isProcessingModeration ? <Loader2 className="animate-spin" size={18} /> : 'Save Quiz'}
                </button>
            </header>

            {/* Canvas Body */}
            <div className="flex-1 overflow-y-auto p-12 bg-[#f1f5f9] flex justify-center">
                <div className="w-full max-w-5xl animate-in fade-in duration-500 stagger-in">
                    
                    {/* The Floating White Card */}
                    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-white p-12 sm:p-16 relative">
                        
                        {/* Pill Label - TOP LEFT INSIDE CARD */}
                        <div className="absolute top-10 left-10 sm:top-16 sm:left-16">
                            <div className="bg-[#eff2ff] border border-[#dce4ff] px-6 py-2 rounded-full text-[#5c4cf4] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                Question {currentQuestionIndex + 1}
                            </div>
                        </div>

                        {/* Feature Icons */}
                        <div className="absolute top-10 right-10 sm:top-16 sm:right-16 flex gap-2">
                             <button onClick={() => setShowMusicModal(true)} className={`p-3 rounded-2xl border transition-all ${bgMusic ? 'bg-[#5c4cf4] border-[#5c4cf4] text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'}`} title="Audio Setup"><Music size={18} /></button>
                             <button onClick={() => setShowThemeEditor(true)} className="p-3 rounded-2xl border bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Theme Designer"><Palette size={18} /></button>
                        </div>

                        {/* Editor Inputs */}
                        <div className="mt-16 sm:mt-24 space-y-16">
                            {/* Question Input Block - GRAY FRAME STYLE */}
                            <div className="p-10 bg-[#f8fafc] rounded-[2.5rem] border-[3px] border-[#edf2f7] group focus-within:border-[#5c4cf4]/10 focus-within:bg-white transition-all shadow-inner">
                                <textarea 
                                    value={currentQ.question} 
                                    onChange={(e) => updateQuestion('question', e.target.value)} 
                                    placeholder="Untitled Question..." 
                                    className="w-full text-3xl sm:text-4xl font-black bg-transparent border-none p-0 focus:ring-0 placeholder-slate-200 resize-none min-h-[140px] text-slate-800 italic" 
                                    rows={3} 
                                />
                            </div>

                            {/* Multiple Choice Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {currentQ.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <button 
                                            onClick={() => updateQuestion('correctAnswer', i)} 
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-4 font-black text-lg flex-shrink-0 ${currentQ.correctAnswer === i ? 'bg-[#5c4cf4] text-white border-[#5c4cf4] shadow-lg scale-110' : 'bg-slate-50 text-slate-300 border-[#f1f5f9] hover:border-slate-200'}`}
                                        >
                                            {i + 1}
                                        </button>
                                        <div className="flex-1 p-4 bg-[#f8fafc] rounded-[1.5rem] border-[3px] border-[#edf2f7] focus-within:border-[#5c4cf4]/20 transition-all">
                                            <input 
                                                type="text" 
                                                value={opt} 
                                                onChange={(e) => {
                                                    const newOpts = [...currentQ.options];
                                                    newOpts[i] = e.target.value;
                                                    updateQuestion('options', newOpts);
                                                }} 
                                                placeholder={`Choice ${i + 1}`} 
                                                className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Explanation Block - GRAY FRAME STYLE */}
                            <div className="pt-12 border-t border-slate-100">
                                <div className="mb-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Explanation</span>
                                </div>
                                <div className="p-8 bg-[#f8fafc] rounded-[2rem] border-[3px] border-[#edf2f7] focus-within:border-[#5c4cf4]/10 focus-within:bg-white transition-all shadow-inner">
                                    <textarea 
                                        value={currentQ.explanation || ''} 
                                        onChange={(e) => updateQuestion('explanation', e.target.value)} 
                                        placeholder="Add context or logic for this module..." 
                                        className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-600 resize-none h-24" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
