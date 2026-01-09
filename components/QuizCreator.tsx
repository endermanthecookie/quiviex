import React, { useState, useEffect } from 'react';
import { Menu, Home, X, Trash2, Image as ImageIcon, Sparkles, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, Wand2, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book, Check, AlertTriangle, ShieldCheck, Infinity as InfinityIcon, Loader2, Info, RefreshCw, Type, ListOrdered, Layers, Sliders, AlignLeft, CheckSquare } from 'lucide-react';
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

const TYPE_CONFIG = [
    { id: 'multiple-choice', label: 'Choice', icon: CheckSquare },
    { id: 'true-false', label: 'T / F', icon: ShieldCheck },
    { id: 'text-input', label: 'Written', icon: Type },
    { id: 'ordering', label: 'Order', icon: ListOrdered },
    { id: 'matching', label: 'Match', icon: Layers },
    { id: 'slider', label: 'Slider', icon: Sliders },
    { id: 'fill-in-the-blank', label: 'Blank', icon: AlignLeft }
];

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
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);
  const [showModerationAlert, setShowModerationAlert] = useState<{detected: string[], warningsRemaining: number, isSudo: boolean} | null>(null);
  const [showTerminalBanAlert, setShowTerminalBanAlert] = useState(false);
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
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }
    if (await performModerationCheck()) setShowSaveOptionsModal(true);
  };

  const handleFinalizeSave = (visibility: QuizVisibility) => {
    onSave({
      id: initialQuiz?.id || Date.now(),
      userId: currentUser.id, title: quizTitle, questions: questions.filter(q => q.question.trim()),
      createdAt: initialQuiz?.createdAt || new Date().toISOString(),
      theme: quizTheme, customTheme, shuffleQuestions, backgroundMusic: bgMusic, visibility
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
    const newQuestions = questions.filter((_, i) => i !== index);
    if (newQuestions.length === 0) {
        setQuestions([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
        setCurrentQuestionIndex(0);
    } else {
        setQuestions(newQuestions);
        if (currentQuestionIndex >= newQuestions.length) setCurrentQuestionIndex(newQuestions.length - 1);
    }
  };

  const handleTypeChange = (type: QuestionType) => {
      const q = questions[currentQuestionIndex];
      let options = [...q.options];
      let correct = q.correctAnswer;
      if (type === 'true-false') { options = ['True', 'False']; correct = 0; }
      else if (type === 'slider') { options = ['0', '100', '1', 'Value']; correct = 50; }
      else if (type === 'text-input' || type === 'fill-in-the-blank') { options = []; correct = ''; }
      else { if (options.length < 4) options = ['', '', '', '']; if (typeof correct !== 'number') correct = 0; }
      updateQuestion('type', type); updateQuestion('options', options); updateQuestion('correctAnswer', correct);
  };

  const currentQ = questions[currentQuestionIndex] || DEFAULT_QUESTION;

  return (
    <div className="flex h-screen bg-[#f1f5f9] relative overflow-hidden font-['Plus_Jakarta_Sans']">
        {showModerationAlert && (
            <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-xl w-full p-12 text-center animate-in zoom-in">
                    <ShieldAlert size={60} className="mx-auto mb-8 text-rose-500" />
                    <h3 className="text-4xl font-black text-slate-900 mb-6">Guideline Strike</h3>
                    <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] mb-10">
                        <p className="text-rose-600 font-black text-2xl uppercase tracking-widest">{showModerationAlert.isSudo ? 'SUDO OVERRIDE' : 'STRIKE ISSUED'}</p>
                        <p className="text-sm font-bold text-rose-400 mt-2">Warnings Remaining: {showModerationAlert.isSudo ? '∞' : showModerationAlert.warningsRemaining}</p>
                    </div>
                    <button onClick={() => setShowModerationAlert(null)} className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-widest click-scale">Close and Fix</button>
                </div>
            </div>
        )}
        {showTerminalBanAlert && (
            <div className="fixed inset-0 z-[200] bg-black backdrop-blur-3xl flex items-center justify-center p-4">
                <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-2xl w-full p-16 text-center animate-in zoom-in duration-700">
                    <ShieldAlert size={100} className="mx-auto mb-10 text-rose-600 animate-pulse" />
                    <h3 className="text-5xl font-black text-slate-900 mb-8 leading-tight">Account Terminated</h3>
                    <button onClick={triggerNuclearBan} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm click-scale shadow-2xl">Exit Infrastructure</button>
                </div>
            </div>
        )}
        {showSaveOptionsModal && <SaveOptionsModal onConfirm={handleFinalizeSave} onCancel={() => setShowSaveOptionsModal(false)} />}
        {showAIModal && <GitHubAIModal onGenerate={(qs, t) => { setQuestions(prev => [...prev, ...qs]); setQuizTitle(t); }} onClose={() => setShowAIModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
        {showMusicModal && <MusicSelectionModal currentMusic={bgMusic} onSelect={setBgMusic} onClose={() => setShowMusicModal(false)} />}
        {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => onStatUpdate('ai_img')} />}

        <div className="w-[320px] bg-[#1a1f2e] text-white flex flex-col relative z-20 shadow-2xl flex-shrink-0">
            <div className="p-8 border-b border-white/5 flex items-center gap-4"><Logo variant="small" /><h1 className="text-2xl font-black tracking-tight">Creator</h1></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {questions.map((q, idx) => (
                    <div key={idx} onClick={() => setCurrentQuestionIndex(idx)} className={`group p-6 rounded-[1.5rem] cursor-pointer transition-all border relative ${currentQuestionIndex === idx ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-black uppercase tracking-widest ${currentQuestionIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>Question {idx + 1}</span><button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="text-rose-400 hover:text-white transition-all transform hover:scale-110"><Trash2 size={14} /></button></div>
                        <p className={`text-sm font-bold line-clamp-2 leading-relaxed ${!q.question ? 'italic opacity-30' : 'text-white'}`}>{q.question || 'Empty question...'}</p>
                    </div>
                ))}
                <button onClick={addQuestion} className="w-full py-6 border-2 border-dashed border-white/10 rounded-[1.5rem] text-slate-400 hover:text-white hover:border-white/30 transition-all font-black flex items-center justify-center gap-3 uppercase text-xs tracking-widest"><PlusCircle size={20} /> Add Question</button>
            </div>
            <div className="p-6 border-t border-white/5 bg-[#1a1f2e]"><button onClick={() => setShowAIModal(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl uppercase tracking-widest text-xs"><Sparkles size={16} className="text-yellow-400" /> AI Generator</button></div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white px-10 py-6 flex items-center justify-between border-b border-slate-100 z-10">
                <button onClick={onExit} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><ArrowLeft size={28} /></button>
                <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Quiz Title" className="text-2xl font-black bg-transparent text-slate-900 border-none focus:ring-0 placeholder-slate-200 text-center tracking-tight flex-1 mx-4" />
                <button onClick={handleInitiateSave} disabled={isProcessingModeration} className="bg-slate-950 hover:bg-black text-white font-black px-10 py-4 rounded-full shadow-xl transition-all active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em]">{isProcessingModeration ? <Loader2 className="animate-spin" size={18} /> : 'Save Quiz'}</button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 bg-[#f1f5f9] flex justify-center">
                <div className="w-full max-w-5xl animate-in fade-in duration-500">
                    <div className="bg-white/60 backdrop-blur-xl border border-white p-2 rounded-full mb-8 shadow-xl flex items-center justify-between max-w-3xl mx-auto">
                        {TYPE_CONFIG.map(t => (
                            <button key={t.id} onClick={() => handleTypeChange(t.id as QuestionType)} className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all click-scale ${currentQ.type === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}><t.icon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span></button>
                        ))}
                    </div>

                    <div className="bg-white rounded-[4rem] shadow-2xl border border-white p-12 sm:p-20 relative min-h-[600px]">
                        <div className="absolute top-10 right-10 flex gap-2">
                             <button onClick={() => setShowMusicModal(true)} className={`p-4 rounded-2xl border transition-all ${bgMusic ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'}`} title="Background Music"><Music size={20} /></button>
                             <button onClick={() => setShowThemeEditor(true)} className="p-4 rounded-2xl border bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="Theme Editor"><Palette size={20} /></button>
                        </div>

                        <div className="space-y-16">
                            <div className="p-10 bg-slate-50 rounded-[3rem] border-[3px] border-slate-100 group focus-within:border-indigo-200 focus-within:bg-white transition-all shadow-inner">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Question Text</label>
                                <textarea value={currentQ.question} onChange={(e) => updateQuestion('question', e.target.value)} placeholder="Type your question here..." className="w-full text-3xl sm:text-4xl font-black bg-transparent border-none p-0 focus:ring-0 placeholder-slate-200 resize-none min-h-[120px] text-slate-800" rows={3} />
                            </div>

                            <div className="animate-in slide-in-from-bottom-4 duration-500">
                                {currentQ.type === 'multiple-choice' || currentQ.type === 'ordering' || currentQ.type === 'matching' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-5 group">
                                                <button onClick={() => currentQ.type === 'multiple-choice' && updateQuestion('correctAnswer', i)} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all border-4 font-black text-xl flex-shrink-0 ${currentQ.type === 'multiple-choice' ? (currentQ.correctAnswer === i ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110' : 'bg-slate-50 text-slate-300 border-slate-100 hover:border-slate-200') : 'bg-slate-100 text-slate-400 border-slate-200'}`}>{currentQ.type === 'matching' ? (i % 2 === 0 ? Math.floor(i/2)+1 : String.fromCharCode(65 + Math.floor(i/2))) : i + 1}</button>
                                                <div className="flex-1 p-5 bg-slate-50 rounded-[2rem] border-[3px] border-slate-100 focus-within:border-indigo-200 transition-all"><input type="text" value={opt} onChange={(e) => { const newOpts = [...currentQ.options]; newOpts[i] = e.target.value; updateQuestion('options', newOpts); }} placeholder={currentQ.type === 'matching' ? (i % 2 === 0 ? "Side A" : "Side B") : "Option..."} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-700" /></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : currentQ.type === 'true-false' ? (
                                    <div className="grid grid-cols-2 gap-8">
                                        {['True', 'False'].map((label, i) => (
                                            <button key={label} onClick={() => updateQuestion('correctAnswer', i)} className={`p-12 rounded-[3rem] border-4 font-black text-3xl transition-all click-scale ${currentQ.correctAnswer === i ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-indigo-100'}`}>{label}</button>
                                        ))}
                                    </div>
                                ) : currentQ.type === 'text-input' || currentQ.type === 'fill-in-the-blank' ? (
                                    <div className="p-10 bg-indigo-50 border-4 border-indigo-100 rounded-[3rem]"><label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 ml-2">Correct Answer</label><input type="text" value={currentQ.correctAnswer as string} onChange={(e) => updateQuestion('correctAnswer', e.target.value)} placeholder="Type the answer..." className="w-full bg-white border-none rounded-2xl p-6 text-2xl font-black text-slate-800 focus:ring-4 focus:ring-indigo-200 transition-all shadow-sm" /></div>
                                ) : currentQ.type === 'slider' ? (
                                    <div className="bg-slate-50 border-4 border-slate-100 p-12 rounded-[3rem] space-y-12"><div className="flex justify-between items-center px-4"><div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min</p><input type="number" value={currentQ.options[0]} onChange={(e) => { const o = [...currentQ.options]; o[0] = e.target.value; updateQuestion('options', o); }} className="w-20 bg-white p-3 rounded-xl font-black text-center border-2 border-slate-100" /></div><div className="text-center"><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Target</p><div className="text-5xl font-black text-indigo-600">{currentQ.correctAnswer}</div></div><div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Max</p><input type="number" value={currentQ.options[1]} onChange={(e) => { const o = [...currentQ.options]; o[1] = e.target.value; updateQuestion('options', o); }} className="w-20 bg-white p-3 rounded-xl font-black text-center border-2 border-slate-100" /></div></div><input type="range" min={currentQ.options[0]} max={currentQ.options[1]} step={currentQ.options[2]} value={currentQ.correctAnswer as number} onChange={(e) => updateQuestion('correctAnswer', parseInt(e.target.value))} className="w-full h-4 bg-indigo-200 rounded-full appearance-none cursor-pointer accent-indigo-600" /></div>
                                ) : null}
                            </div>

                            <div className="pt-12 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Explanation</label>
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-[3px] border-slate-100 focus-within:border-indigo-100 focus-within:bg-white transition-all shadow-inner"><textarea value={currentQ.explanation || ''} onChange={(e) => updateQuestion('explanation', e.target.value)} placeholder="Explain why the answer is correct..." className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-600 resize-none h-24" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};