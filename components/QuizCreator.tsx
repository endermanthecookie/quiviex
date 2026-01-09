
import React, { useState, useEffect } from 'react';
import { Menu, Home, X, Trash2, Image as ImageIcon, Sparkles, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, Wand2, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book, Check, AlertTriangle, ShieldCheck, Infinity as InfinityIcon, Loader2 } from 'lucide-react';
import { Quiz, Question, QuestionType, User, CustomTheme, QuizVisibility } from '../types';
import { COLORS, TUTORIAL_STEPS, THEMES, BANNED_WORDS } from '../constants';
import { TutorialWidget } from './TutorialWidget';
import { ValidationModal } from './ValidationModal';
import { ImageSelectionModal } from './ImageSelectionModal';
import { GitHubAIModal } from './GitHubAIModal';
import { ImageQuizModal } from './ImageQuizModal';
import { MusicSelectionModal } from './MusicSelectionModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { QuizTaker } from './QuizTaker';
import { GitHubTokenHelpModal } from './GitHubTokenHelpModal';
import { SaveOptionsModal } from './SaveOptionsModal';
import { LegalModal } from './LegalModal';
import { supabase } from '../services/supabase';

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
  const [creationMode, setCreationMode] = useState<'selection' | 'editor'>(
    initialQuiz || startWithTutorial ? 'editor' : 'selection'
  );

  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showTokenHelpModal, setShowTokenHelpModal] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showModerationAlert, setShowModerationAlert] = useState<{detected: string[], warningsRemaining: number, isSudo: boolean} | null>(null);
  const [isProcessingModeration, setIsProcessingModeration] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);

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

  useEffect(() => {
    if (startWithTutorial) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  }, [startWithTutorial]);

  const scanForBannedWords = (text: string): string[] => {
      if (!text) return [];
      const normalized = text.toLowerCase();
      return BANNED_WORDS.filter(word => {
          if (!word) return false;
          try {
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const isAlphaNumeric = /^[a-z0-9]+$/i.test(word);
              const regex = isAlphaNumeric 
                  ? new RegExp(`\\b${escapedWord}\\b`, 'i') 
                  : new RegExp(escapedWord, 'i');
              
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
          const detectedList = Array.from(detected);
          const isSudo = currentUser.email === 'sudo@quiviex.com';
          
          // Re-fetch fresh count to prevent stale '2 warnings left' loop
          const { data: profile, error: fetchErr } = await supabase.from('profiles').select('warnings').eq('user_id', currentUser.id).single();
          if (fetchErr) {
              setIsProcessingModeration(false);
              alert("Infrastructure Verification Fault. Try again.");
              return false;
          }

          const currentWarningsInDB = profile?.warnings || 0;
          const nextWarnings = currentWarningsInDB + 1;

          if (nextWarnings >= 3 && !isSudo) {
              await triggerNuclearBan();
              return false;
          }

          const { error: updateErr } = await supabase.from('profiles').update({ warnings: nextWarnings }).eq('user_id', currentUser.id);
          if (updateErr) {
              setIsProcessingModeration(false);
              alert("Strike registry update failed: " + updateErr.message);
              return false;
          }
          
          // Refresh the global user object in App.tsx so future checks are accurate
          if (onRefreshProfile) onRefreshProfile();
          
          setShowModerationAlert({
              detected: detectedList,
              warningsRemaining: isSudo ? 999999 : 3 - nextWarnings,
              isSudo: isSudo
          });
          setIsProcessingModeration(false);
          return false;
      }
      return true;
  };

  const triggerNuclearBan = async () => {
      try {
          await supabase.from('banned_emails').insert({ email: currentUser.email, reason: 'Content Moderation: Terminal Strike' });
          await supabase.from('quizzes').delete().eq('user_id', currentUser.id).neq('visibility', 'public');
          await supabase.from('profiles').delete().eq('user_id', currentUser.id);
          await supabase.auth.signOut();
          alert("SECURITY ALERT: INFRASTRUCTURE ACCESS REVOKED. Your account has been decommissioned due to 3 moderation strikes. This identity is permanently blacklisted.");
          window.location.reload();
      } catch (e) {
          console.error("Ban sequence fault:", e);
      }
  };

  const handleInitiateSave = async () => {
    const errors: string[] = [];
    if (!quizTitle.trim()) errors.push('• Add a quiz title');
    if (questions.length === 0) errors.push('• Add at least one question');
    questions.forEach((q, index) => {
      if (!q.question.trim()) errors.push(`• Question ${index + 1}: Add question text`);
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    const isModerated = await performModerationCheck();
    if (!isModerated) return;

    setShowSaveOptionsModal(true);
  };

  const handleFinalizeSave = (visibility: QuizVisibility) => {
    const validQuestions = questions.filter(q => q.question.trim());
    const newQuiz: Quiz = {
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
    };
    if (!initialQuiz) onStatUpdate('create');
    onSave(newQuiz);
    setShowSaveOptionsModal(false);
  };

  const addQuestion = () => {
    setQuestions([...questions, JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'type') {
      const type = value as QuestionType;
      if (type === 'true-false') { updated[index].options = ['True', 'False']; updated[index].correctAnswer = 0; }
      else if (type === 'text-input' || type === 'fill-in-the-blank') { updated[index].options = ['']; updated[index].correctAnswer = ''; }
      else if (type === 'ordering') { updated[index].options = ['', '', '', '']; updated[index].correctAnswer = null; }
      else if (type === 'matching') { updated[index].options = ['', '', '', '', '', '', '', '']; updated[index].correctAnswer = null; }
      else if (type === 'slider') { updated[index].options = ['0', '100', '1', 'Units']; updated[index].correctAnswer = 50; }
      else { updated[index].options = ['', '', '', '']; updated[index].correctAnswer = 0; }
    }
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options = [...updated[qIndex].options];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
    if (currentQuestionIndex >= questions.length - 1) setCurrentQuestionIndex(Math.max(0, questions.length - 2));
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
        {showModerationAlert && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-xl w-full p-12 text-center animate-in zoom-in duration-500 border border-white/20">
                    <div className="w-28 h-28 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
                        <ShieldAlert size={60} />
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Moderation Strike</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed text-lg">
                        Our core systems detected terms that violate community safety standards.
                        <span className="block mt-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-sm font-mono text-rose-500 overflow-x-auto whitespace-pre-wrap">
                            Flagged Elements: {showModerationAlert.detected.join(', ')}
                        </span>
                    </p>
                    
                    <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] mb-10">
                        <div className="flex justify-center gap-2 mb-4">
                             {showModerationAlert.isSudo ? (
                                 <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-lg animate-pulse">
                                     <InfinityIcon size={32} />
                                 </div>
                             ) : (
                                [1,2,3].map(i => (
                                    <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i <= (3 - showModerationAlert.warningsRemaining) ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                        {i}
                                    </div>
                                ))
                             )}
                        </div>
                        <p className="text-rose-600 font-black text-2xl mb-1 uppercase tracking-widest">
                            {showModerationAlert.isSudo ? 'SUDO OVERRIDE' : 'STRIKE ISSUED'}
                        </p>
                        <p className="text-rose-50 font-bold text-sm bg-rose-600 inline-block px-4 py-1 rounded-full mb-1">
                            {showModerationAlert.isSudo ? 'Architect Warnings Remaining: ∞' : `Warnings Remaining: ${showModerationAlert.warningsRemaining}`}
                        </p>
                        <p className="text-xs text-rose-400 font-black uppercase tracking-widest mt-4 opacity-60">
                            {showModerationAlert.isSudo ? 'NOTICE: PROHIBITED WORDS MUST BE REMOVED BEFORE SAVING' : 'WARNING: TERMINAL STRIKE RESULTS IN ACCOUNT ERASURE'}
                        </p>
                    </div>

                    <button 
                        onClick={() => setShowModerationAlert(null)}
                        className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl click-scale text-lg"
                    >
                        I'll fix it
                    </button>
                </div>
            </div>
        )}

        {showTutorial && (
            <TutorialWidget 
                step={tutorialStep} 
                onClose={() => setShowTutorial(false)}
                onNext={() => setTutorialStep(prev => Math.min(prev + 1, TUTORIAL_STEPS.length - 1))}
                onPrev={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                onOpenSettings={onOpenSettings}
                onOpenHelp={() => setShowTokenHelpModal(true)}
            />
        )}
        
        {showGuidelines && <LegalModal type="guidelines" onClose={() => setShowGuidelines(false)} />}
        {showValidationModal && <ValidationModal errors={validationErrors} onClose={() => setShowValidationModal(false)} onExitWithoutSaving={onExit} />}
        {showSaveOptionsModal && <SaveOptionsModal onConfirm={handleFinalizeSave} onCancel={() => setShowSaveOptionsModal(false)} />}
        {showImageModal && <ImageSelectionModal onSelect={(url) => updateQuestion(currentQuestionIndex, 'image', url)} onClose={() => setShowImageModal(false)} onAiUsed={() => onStatUpdate('ai_img')} preferences={currentUser.preferences} />}
        {showAIModal && <GitHubAIModal onGenerate={(qs: Question[], t: string) => { setQuestions(prev => [...prev, ...qs]); setQuizTitle(t); setCreationMode('editor'); }} onClose={() => setShowAIModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
        {showImageQuizModal && <ImageQuizModal onGenerate={(qs: Question[], t: string) => { setQuestions(prev => [...prev, ...qs]); setQuizTitle(t); setCreationMode('editor'); }} onClose={() => setShowImageQuizModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
        {showMusicModal && <MusicSelectionModal currentMusic={bgMusic} onSelect={setBgMusic} onClose={() => setShowMusicModal(false)} />}
        {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => onStatUpdate('ai_img')} />}
        {showTokenHelpModal && <GitHubTokenHelpModal onClose={() => setShowTokenHelpModal(false)} />}
        
        <div className={`fixed inset-y-0 left-0 w-80 bg-slate-900 text-white transform transition-transform duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-r border-white/10 shadow-2xl`}>
             <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                 <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
                     <PenTool className="text-indigo-400" />
                     <span>Editor</span>
                 </div>
                 <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:bg-white/10 rounded-full">
                     <X size={24} />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                 {questions.map((q, idx) => (
                     <div 
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all group relative border ${
                            currentQuestionIndex === idx 
                            ? 'bg-indigo-600 shadow-xl border-indigo-400 scale-[1.02]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                     >
                         <div className="flex justify-between items-start mb-3">
                             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${currentQuestionIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>Q.{idx + 1}</span>
                             <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/20 rounded-xl text-red-300 transition-all"><Trash2 size={16} /></button>
                         </div>
                         <p className="text-sm font-bold line-clamp-2 h-10 text-slate-200 leading-tight">
                             {q.question || <span className="italic opacity-30 font-medium">Untitled Question...</span>}
                         </p>
                     </div>
                 ))}
                 
                 <button onClick={addQuestion} className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all font-black flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                     <PlusCircle size={20} /> Add Item
                 </button>
             </div>

             <div className="p-6 border-t border-white/5 space-y-3 bg-slate-950/50 backdrop-blur-xl">
                 <button onClick={() => setShowGuidelines(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white mb-2 ml-2 transition-colors">
                    <Book size={12} /> Guidelines
                 </button>
                 <button onClick={() => setShowAIModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl text-sm border border-indigo-400/50 uppercase tracking-widest">
                     <Sparkles size={16} className="text-yellow-400" /> AI Generator
                 </button>
             </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
            <div className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 p-5 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-3 bg-slate-100 rounded-2xl shadow-sm text-slate-600">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2 w-full max-w-xl">
                        <button onClick={onExit} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors" title="Exit">
                            <ArrowLeft size={24} />
                        </button>
                        <input type="text" value={quizTitle} onChange={(e) => setQuizTitle((e.target as any).value)} placeholder="Untitled Quiz" className="text-2xl font-black bg-transparent text-slate-900 border-none px-3 py-1 focus:ring-0 placeholder-slate-300 w-full tracking-tight" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setIsPreviewing(true)} className="hidden sm:flex items-center gap-2 text-slate-600 font-black hover:bg-white px-5 py-3 rounded-2xl transition-all shadow-sm border border-slate-200 uppercase text-xs tracking-widest">
                        <Eye size={18} /> Preview
                    </button>
                    <button onClick={handleInitiateSave} disabled={isProcessingModeration} className="bg-slate-900 hover:bg-black text-white font-black px-8 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 uppercase text-sm tracking-widest disabled:opacity-50">
                        {isProcessingModeration ? <Loader2 className="animate-spin" size={18} /> : 'Save Quiz'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-12 custom-scrollbar bg-slate-50/50">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-5 rounded-3xl flex flex-wrap gap-4 items-center justify-between shadow-sm border border-slate-200/60">
                         <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-inner">
                                 <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions((e.target as any).checked)} id="shuffle" className="accent-indigo-600 w-4 h-4 rounded-md" />
                                 <label htmlFor="shuffle" className="text-xs font-black text-slate-500 cursor-pointer select-none uppercase tracking-widest">Shuffle</label>
                             </div>
                             <button onClick={() => setShowMusicModal(true)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all shadow-sm ${bgMusic ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'}`}>
                                 <Music size={16} /> {bgMusic ? 'Audio On' : 'No Audio'}
                             </button>
                         </div>
                         <div className="flex items-center bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                             {Object.entries(THEMES).map(([key, theme]) => (
                                 <button key={key} onClick={() => { setQuizTheme(key); setCustomTheme(undefined); }} className={`w-9 h-9 rounded-xl transition-all ${quizTheme === key && !customTheme ? 'bg-white shadow-lg scale-110' : 'opacity-40 hover:opacity-100'}`}>
                                     <div className={`w-4 h-4 rounded-full mx-auto bg-gradient-to-br ${theme.gradient}`}></div>
                                 </button>
                             ))}
                             <button onClick={() => setShowThemeEditor(true)} className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center ${customTheme ? 'bg-white shadow-lg scale-110 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                 <Palette size={18} />
                             </button>
                         </div>
                    </div>

                    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 stagger-in">
                        <div className="bg-slate-50/80 border-b border-slate-100 p-8 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <span className="bg-white text-indigo-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm whitespace-nowrap">Question {currentQuestionIndex + 1}</span>
                                <select value={currentQ.type} onChange={(e) => updateQuestion(currentQuestionIndex, 'type', (e.target as any).value)} className="bg-white border border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all cursor-pointer flex-1 sm:flex-none">
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True / False</option>
                                    <option value="text-input">Text Entry</option>
                                    <option value="fill-in-the-blank">Fill Space</option>
                                    <option value="ordering">Sequence</option>
                                    <option value="matching">Logic Pairs</option>
                                    <option value="slider">Range Slider</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-8 sm:p-12 space-y-10">
                            <textarea value={currentQ.question} onChange={(e) => updateQuestion(currentQuestionIndex, 'question', (e.target as any).value)} placeholder="Type your core prompt here..." className="w-full text-2xl sm:text-4xl font-black border-none rounded-3xl p-8 bg-slate-50 text-slate-900 placeholder-slate-200 focus:ring-0 focus:bg-white transition-all resize-none shadow-inner leading-tight min-h-[160px]" rows={3} />
                            
                            {currentQ.type === 'multiple-choice' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {currentQ.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <button onClick={() => updateQuestion(currentQuestionIndex, 'correctAnswer', i)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-4 font-black text-lg flex-shrink-0 ${currentQ.correctAnswer === i ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110' : 'bg-white text-slate-300 border-slate-100 hover:border-indigo-200 group-hover:scale-105'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </button>
                                            <input type="text" value={opt} onChange={(e) => updateOption(currentQuestionIndex, i, (e.target as any).value)} placeholder={`Option ${i + 1}`} className={`w-full px-6 py-4 rounded-[1.5rem] border-2 font-bold transition-all focus:outline-none bg-slate-50 text-slate-800 ${currentQ.correctAnswer === i ? 'border-emerald-200 bg-emerald-50 shadow-sm' : 'border-slate-50 focus:border-indigo-100 focus:bg-white'}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Explanation</label>
                                <textarea value={currentQ.explanation || ''} onChange={(e) => updateQuestion(currentQuestionIndex, 'explanation', (e.target as any).value)} placeholder="Explain the logic behind this task..." className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 text-slate-700 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all resize-none h-32 text-base font-bold shadow-inner" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
