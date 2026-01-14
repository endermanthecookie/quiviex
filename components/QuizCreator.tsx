import React, { useState, useEffect } from 'react';
import { Menu, Home, X, Trash2, Image as ImageIcon, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book, Check, AlertTriangle, ShieldCheck, Infinity as InfinityIcon, Loader2, Info, RefreshCw, Type, ListOrdered, Layers, Sliders, AlignLeft, CheckSquare, Brackets, MinusCircle, List } from 'lucide-react';
import { Quiz, Question, QuestionType, User, CustomTheme, QuizVisibility } from '../types';
import { COLORS, TUTORIAL_STEPS, THEMES, BANNED_WORDS, SOFT_FILTER_WORDS } from '../constants';
import { ValidationModal } from './ValidationModal';
import { MusicSelectionModal } from './MusicSelectionModal';
import { ThemeEditorModal } from './ThemeEditorModal';
import { SaveOptionsModal } from './SaveOptionsModal';
import { supabase } from '../services/supabase';
import { Logo } from './Logo';

interface QuizCreatorProps {
  initialQuiz: Quiz | null;
  currentUser: User;
  onSave: (quiz: Quiz) => void;
  onExit: () => void;
  startWithTutorial: boolean;
  onTutorialComplete?: () => void;
  onStatUpdate: (type: 'create') => void;
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

const TYPE_CONFIG = [
    { id: 'multiple-choice', label: 'Choice', icon: CheckSquare, gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/40', ring: 'ring-blue-200' },
    { id: 'true-false', label: 'True/False', icon: ShieldCheck, gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/40', ring: 'ring-rose-200' },
    { id: 'text-input', label: 'Type', icon: Type, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/40', ring: 'ring-emerald-200' },
    { id: 'ordering', label: 'Order', icon: ListOrdered, gradient: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/40', ring: 'ring-orange-200' },
    { id: 'matching', label: 'Match', icon: Layers, gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/40', ring: 'ring-purple-200' },
    { id: 'slider', label: 'Slider', icon: Sliders, gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/40', ring: 'ring-cyan-200' },
    { id: 'fill-in-the-blank', label: 'Blanks', icon: AlignLeft, gradient: 'from-fuchsia-500 to-purple-600', shadow: 'shadow-fuchsia-500/40', ring: 'ring-fuchsia-200' }
];

const getBlankCount = (text: string) => (text.match(/\[\s*\]/g) || []).length;

export const QuizCreator: React.FC<QuizCreatorProps> = ({ initialQuiz, currentUser, onSave, onExit, startWithTutorial, onTutorialComplete, onStatUpdate, onOpenSettings, onRefreshProfile }) => {
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizTheme, setQuizTheme] = useState('classic');
  const [customTheme, setCustomTheme] = useState<CustomTheme | undefined>(undefined);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [bgMusic, setBgMusic] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showModerationAlert, setShowModerationAlert] = useState<{detected: string[], warningsRemaining: number, isSudo: boolean} | null>(null);
  const [showTerminalBanAlert, setShowTerminalBanAlert] = useState(false);
  const [isProcessingModeration, setIsProcessingModeration] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);

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
      if (text.startsWith('data:image')) return []; 
      return BANNED_WORDS.filter(word => {
          if (!word) return false;
          try {
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = /^[a-z0-9]+$/i.test(word) ? new RegExp(`\\b${escapedWord}\\b`, 'i') : new RegExp(escapedWord, 'i');
              return regex.test(normalized);
          } catch (e) {
              return normalized.includes(word.toLowerCase());
          }
      });
  };

  const scanForSoftFilterWords = (text: string): string[] => {
      if (!text) return [];
      const normalized = text.toLowerCase();
      if (text.startsWith('data:image')) return [];
      return SOFT_FILTER_WORDS.filter(word => {
          if (!word) return false;
          try {
              const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = /^[a-z0-9]+$/i.test(word) ? new RegExp(`\\b${escapedWord}\\b`, 'i') : new RegExp(escapedWord, 'i');
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
              const nextWarnings = (profile?.warnings || 0) + 1;
              if (nextWarnings >= 3 && !isSudo) {
                  setShowTerminalBanAlert(true);
                  return false;
              }
              await supabase.from('profiles').update({ warnings: nextWarnings }).eq('user_id', currentUser.id);
              if (onRefreshProfile) await onRefreshProfile();
              setShowModerationAlert({ detected: Array.from(detected), warningsRemaining: isSudo ? 999999 : 3 - nextWarnings, isSudo });
          } catch (err: any) {
              console.error(err);
          } finally {
              setIsProcessingModeration(false);
          }
          return false;
      }
      return true;
  };

  const triggerNuclearBan = async () => {
      await supabase.from('banned_emails').insert({ email: currentUser.email, reason: 'Strike Policy Violation' });
      await supabase.from('profiles').delete().eq('user_id', currentUser.id);
      await supabase.auth.signOut();
      window.location.reload();
  };

  const handleInitiateSave = async () => {
    const errors: string[] = [];
    if (!quizTitle.trim()) errors.push('• Add a quiz title');
    if (questions.length === 0) errors.push('• Add at least one question');
    
    questions.forEach((q, idx) => {
        if (!q.question.trim()) errors.push(`• Question ${idx + 1} is empty`);
        if (q.type === 'fill-in-the-blank') {
            const blankCount = getBlankCount(q.question);
            if (blankCount === 0) errors.push(`• Question ${idx + 1} needs at least one blank [ ]`);
            if (Array.isArray(q.correctAnswer)) {
                if (q.correctAnswer.length !== blankCount || q.correctAnswer.some(val => val === -1 || val === null)) {
                    errors.push(`• Question ${idx + 1} has unassigned blanks`);
                }
            } else {
                errors.push(`• Question ${idx + 1} answer key is invalid`);
            }
        }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }
    if (await performModerationCheck()) setShowSaveOptionsModal(true);
  };

  const handleFinalizeSave = (visibility: QuizVisibility) => {
    let isSensitive = false;
    const allText = [quizTitle, ...questions.map(q => q.question + ' ' + q.options.join(' ') + ' ' + (q.explanation || ''))].join(' ');
    const detectedSoft = scanForSoftFilterWords(allText);
    if (detectedSoft.length > 0) isSensitive = true;

    onSave({
      id: initialQuiz?.id || Date.now(),
      userId: currentUser.id, title: quizTitle, questions: questions.filter(q => q.question.trim()),
      createdAt: initialQuiz?.createdAt || new Date().toISOString(),
      theme: quizTheme, customTheme, shuffleQuestions, backgroundMusic: bgMusic, visibility,
      isSensitive
    });
    setShowSaveOptionsModal(false);
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
    setCurrentQuestionIndex(questions.length);
    setShowMobileSidebar(false);
  };

  const updateQuestion = (field: keyof Question, value: any) => {
    setQuestions(prev => {
        const updated = [...prev];
        const q = updated[currentQuestionIndex];
        let newValue = value;

        if (q.type === 'fill-in-the-blank' && field === 'question') {
            const blankCount = getBlankCount(value);
            let currentAns = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [];
            if (currentAns.length !== blankCount) {
                if (currentAns.length < blankCount) {
                    while (currentAns.length < blankCount) currentAns.push(-1);
                } else {
                    currentAns.length = blankCount;
                }
                q.correctAnswer = currentAns;
            }
        }

        updated[currentQuestionIndex] = { ...q, [field]: newValue };
        return updated;
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => {
        const newQuestions = prev.filter((_, i) => i !== index);
        if (newQuestions.length === 0) {
            return [JSON.parse(JSON.stringify(DEFAULT_QUESTION))];
        }
        return newQuestions;
    });
    if (currentQuestionIndex >= (questions.length - 1)) setCurrentQuestionIndex(Math.max(0, questions.length - 2));
  };

  const handleTypeChange = (type: QuestionType) => {
      setQuestions(prev => {
          const updated = [...prev];
          const q = updated[currentQuestionIndex];
          let options = [...q.options];
          let correct = q.correctAnswer;
          
          if (type === 'true-false') { 
              options = ['True', 'False']; 
              correct = 0; 
          } else if (type === 'slider') { 
              options = ['0', '100', '1', 'Value']; 
              correct = 50; 
          } else if (type === 'text-input') { 
              options = []; 
              correct = ''; 
          } else if (type === 'matching') {
              options = ['', '', '', '', '', '', '', ''];
              correct = null;
          } else if (type === 'fill-in-the-blank') {
              options = ['', '', '', '']; 
              const blankCount = getBlankCount(q.question);
              correct = new Array(blankCount).fill(-1);
          } else { 
              if (options.length < 4) options = ['', '', '', '']; 
              if (typeof correct !== 'number') correct = 0; 
          }
          
          updated[currentQuestionIndex] = { ...q, type, options, correctAnswer: correct };
          return updated;
      });
  };

  const insertBlank = () => {
      const textarea = document.getElementById('question-textarea') as HTMLTextAreaElement;
      if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = currentQ.question;
          const newText = text.substring(0, start) + '[ ]' + text.substring(end);
          updateQuestion('question', newText);
          setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + 3, start + 3);
          }, 0);
      } else {
          updateQuestion('question', currentQ.question + ' [ ]');
      }
  };

  const currentQ = questions[currentQuestionIndex] || DEFAULT_QUESTION;

  return (
    <div className="flex h-screen bg-[#f1f5f9] relative overflow-hidden font-['Plus_Jakarta_Sans']">
        {/* Modals & Alerts */}
        {showModerationAlert && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl max-w-xl w-full p-8 sm:p-12 text-center animate-in zoom-in">
                    <ShieldAlert size={60} className="mx-auto mb-8 text-rose-500" />
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6">Guideline Strike</h3>
                    <div className="bg-rose-50 border-2 border-rose-100 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] mb-10">
                        <p className="text-rose-600 font-black text-xl sm:text-2xl uppercase tracking-widest">{showModerationAlert.isSudo ? 'SUDO OVERRIDE' : 'STRIKE ISSUED'}</p>
                        <p className="text-xs sm:text-sm font-bold text-rose-400 mt-2">Warnings Remaining: {showModerationAlert.isSudo ? '∞' : showModerationAlert.warningsRemaining}</p>
                    </div>
                    <button onClick={() => setShowModerationAlert(null)} className="w-full bg-slate-900 text-white py-5 sm:py-6 rounded-2xl sm:rounded-[1.5rem] font-black uppercase tracking-widest click-scale">Close and Fix</button>
                </div>
            </div>
        )}

        {/* Sidebar - Desktop */}
        <div className={`
            fixed lg:relative z-[60] w-[300px] sm:w-[320px] bg-[#1a1f2e] text-white flex flex-col h-full shadow-2xl transition-transform duration-500
            ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4"><Logo variant="small" /><h1 className="text-xl sm:text-2xl font-black tracking-tight">Creator</h1></div>
                <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4">
                {questions.map((q, idx) => (
                    <div key={idx} onClick={() => { setCurrentQuestionIndex(idx); setShowMobileSidebar(false); }} className={`group p-5 sm:p-6 rounded-[1.2rem] sm:rounded-[1.5rem] cursor-pointer transition-all border relative ${currentQuestionIndex === idx ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-black uppercase tracking-widest ${currentQuestionIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>Unit {idx + 1}</span><button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="text-rose-400 hover:text-white transition-all transform hover:scale-110"><Trash2 size={14} /></button></div>
                        <p className={`text-xs sm:text-sm font-bold line-clamp-2 leading-relaxed ${!q.question ? 'italic opacity-30' : 'text-white'}`}>{q.question || 'Empty question...'}</p>
                    </div>
                ))}
                <button onClick={addQuestion} className="w-full py-5 sm:py-6 border-2 border-dashed border-white/10 rounded-[1.2rem] sm:rounded-[1.5rem] text-slate-400 hover:text-white hover:border-white/30 transition-all font-black flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"><PlusCircle size={20} /> New Unit</button>
            </div>
        </div>

        {/* Backdrop for mobile sidebar */}
        {showMobileSidebar && <div onClick={() => setShowMobileSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"></div>}

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f1f5f9]">
            <header className="bg-white px-6 sm:px-10 py-4 sm:py-6 flex items-center justify-between border-b border-slate-100 z-10">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={onExit} className="p-2 sm:p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><ArrowLeft size={24} className="sm:w-7 sm:h-7" /></button>
                    <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 sm:p-3 hover:bg-slate-100 rounded-full transition-colors text-indigo-600"><List size={24} className="sm:w-7 sm:h-7" /></button>
                </div>
                <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz Title" className="text-xl sm:text-2xl font-black bg-transparent text-slate-900 border-none focus:ring-0 placeholder-slate-200 text-center tracking-tight flex-1 mx-2 sm:mx-4 truncate" />
                <button onClick={handleInitiateSave} disabled={isProcessingModeration} className="bg-slate-950 hover:bg-black text-white font-black px-6 sm:px-10 py-3 sm:py-4 rounded-full shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase text-[9px] sm:text-xs tracking-[0.2em]">{isProcessingModeration ? <Loader2 className="animate-spin" size={16} /> : 'Save'}</button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 flex flex-col items-center custom-scrollbar">
                <div className="w-full max-w-6xl animate-in fade-in duration-500 pb-24">
                    
                    {/* Question Types - Responsive Scroller */}
                    <div className="w-full mb-8 sm:mb-10">
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-2 px-2 custom-scrollbar mask-fade">
                            {TYPE_CONFIG.map(t => {
                                const isActive = currentQ.type === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleTypeChange(t.id as QuestionType)}
                                        className={`
                                            relative group flex-shrink-0 flex flex-col items-center justify-center gap-2 
                                            w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl transition-all duration-300 click-scale
                                            ${isActive 
                                                ? `bg-gradient-to-br ${t.gradient} text-white scale-105 sm:scale-110 shadow-xl ${t.shadow} z-10` 
                                                : 'bg-white text-slate-400 hover:bg-slate-50 border-2 border-slate-100 hover:border-slate-200 shadow-sm'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-colors shadow-inner
                                            ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}
                                        `}>
                                            <t.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} />
                                        </div>
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Main Workspace Card */}
                    <div className="bg-white rounded-[2rem] sm:rounded-[4rem] shadow-2xl border border-white p-6 sm:p-12 lg:p-20 relative min-h-[500px]">
                        <div className="absolute top-6 right-6 sm:top-10 sm:right-10 flex gap-2">
                             <button onClick={() => setShowMusicModal(true)} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${bgMusic ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'}`} title="Background Music"><Music size={18} /></button>
                             <button onClick={() => setShowThemeEditor(true)} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Theme Editor"><Palette size={18} /></button>
                        </div>

                        <div className="space-y-12 sm:space-y-16">
                            <div className="p-6 sm:p-10 bg-slate-50 rounded-[1.5rem] sm:rounded-[3rem] border-[3px] border-slate-100 group focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-inner relative">
                                <label className="flex items-center justify-between text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                    <span>Unit Content</span>
                                    {currentQ.type === 'fill-in-the-blank' && (
                                        <button onClick={insertBlank} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 text-[10px]">
                                            <Brackets size={12} /> Insert Blanco
                                        </button>
                                    )}
                                </label>
                                <textarea id="question-textarea" value={currentQ.question} onChange={(e) => updateQuestion('question', e.target.value)} placeholder="Enter the prompt for this unit..." className="w-full text-2xl sm:text-4xl font-black bg-transparent border-none p-0 focus:ring-0 placeholder-slate-200 resize-none min-h-[100px] sm:min-h-[120px] text-slate-800" rows={3} />
                            </div>

                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                {currentQ.type === 'multiple-choice' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-3 sm:gap-5 group">
                                                <button onClick={() => updateQuestion('correctAnswer', i)} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all border-2 sm:border-4 font-black text-lg sm:text-xl flex-shrink-0 ${currentQ.correctAnswer === i ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105 sm:scale-110' : 'bg-slate-50 text-slate-300 border-slate-100 hover:border-slate-200'}`}>{i + 1}</button>
                                                <div className="flex-1 p-3 sm:p-5 bg-slate-50 rounded-xl sm:rounded-[2rem] border-[2px] sm:border-[3px] border-slate-100 focus-within:border-indigo-200 transition-all"><input type="text" value={opt} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[i] = e.target.value; updateQuestion('options', newOpts); }} placeholder="Enter Choice..." className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700 text-sm sm:text-base" /></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : currentQ.type === 'fill-in-the-blank' ? (
                                    <div className="space-y-10 sm:space-y-12">
                                        <div className="bg-slate-50 border-2 border-slate-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem]">
                                            <div className="flex justify-between items-center mb-6">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Glossary</label>
                                                <button onClick={() => { const o = [...currentQ.options, '']; updateQuestion('options', o); }} className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"><PlusCircle size={14} /> Add Word</button>
                                            </div>
                                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                                {currentQ.options.map((opt, i) => (
                                                    <div key={i} className="relative group/opt">
                                                        <input type="text" value={opt} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[i] = e.target.value; updateQuestion('options', newOpts); }} placeholder={`Word ${i+1}`} className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 font-bold text-slate-700 w-32 sm:w-40 focus:border-indigo-400 focus:outline-none text-sm" />
                                                        {currentQ.options.length > 2 && <button onClick={() => { const newOpts = currentQ.options.filter((_, idx) => idx !== i); updateQuestion('options', newOpts); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/opt:opacity-100 transition-opacity"><MinusCircle size={14} /></button>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 border-2 border-indigo-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem]">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 block text-center sm:text-left">Truth Mapping</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {(Array.isArray(currentQ.correctAnswer) ? currentQ.correctAnswer : []).map((ansIndex, i) => (
                                                    <div key={i} className="flex items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100 shadow-sm">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px] sm:text-xs">B{i+1}</div>
                                                        <select value={ansIndex === -1 ? '' : ansIndex} onChange={(e) => { const val = e.target.value === '' ? -1 : parseInt(e.target.value); const newAns = [...(currentQ.correctAnswer as number[])]; newAns[i] = val; updateQuestion('correctAnswer', newAns); }} className="flex-1 bg-transparent font-bold text-slate-700 focus:outline-none text-xs sm:text-sm">
                                                            <option value="">Map Blanco...</option>
                                                            {currentQ.options.map((opt, optIdx) => ( <option key={optIdx} value={optIdx}>{opt || `Word ${optIdx+1}`}</option> ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : currentQ.type === 'true-false' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                        {['True', 'False'].map((label, i) => (
                                            <button key={label} onClick={() => updateQuestion('correctAnswer', i)} className={`p-8 sm:p-12 rounded-[1.5rem] sm:rounded-[3rem] border-2 sm:border-4 font-black text-2xl sm:text-3xl transition-all click-scale ${currentQ.correctAnswer === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-indigo-100'}`}>{label}</button>
                                        ))}
                                    </div>
                                ) : currentQ.type === 'text-input' ? (
                                    <div className="p-6 sm:p-10 bg-indigo-50 border-2 sm:border-4 border-indigo-100 rounded-[1.5rem] sm:rounded-[3rem]"><label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 ml-2">Verified Truth</label><input type="text" value={currentQ.correctAnswer as string} onChange={(e) => updateQuestion('correctAnswer', e.target.value)} placeholder="Type the canonical answer..." className="w-full bg-white border-none rounded-2xl p-4 sm:p-6 text-xl sm:text-2xl font-black text-slate-800 focus:ring-4 focus:ring-indigo-200 transition-all shadow-sm" /></div>
                                ) : null /* Add more if needed, following this pattern */}
                            </div>

                            <div className="pt-8 sm:pt-12 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Academic Context</label>
                                <div className="p-6 sm:p-8 bg-slate-50 rounded-[1.5rem] sm:rounded-[2.5rem] border-[2px] sm:border-[3px] border-slate-100 focus-within:border-indigo-100 focus-within:bg-white transition-all shadow-inner"><textarea value={currentQ.explanation || ''} onChange={(e) => updateQuestion('explanation', e.target.value)} placeholder="Provide contextual truth for this unit..." className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-600 resize-none h-20 sm:h-24 text-sm sm:text-base" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};