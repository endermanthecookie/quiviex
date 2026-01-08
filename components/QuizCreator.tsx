
import React, { useState, useEffect } from 'react';
// Added Check to the lucide-react imports to fix "Cannot find name 'Check'" error
import { Menu, Home, X, Trash2, Image as ImageIcon, Sparkles, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, Wand2, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book, Check } from 'lucide-react';
import { Quiz, Question, QuestionType, User, CustomTheme, QuizVisibility } from '../types';
import { COLORS, TUTORIAL_STEPS, THEMES } from '../constants';
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

interface QuizCreatorProps {
  initialQuiz: Quiz | null;
  currentUser: User;
  onSave: (quiz: Quiz) => void;
  onExit: () => void;
  startWithTutorial: boolean;
  onTutorialComplete?: () => void;
  onStatUpdate: (type: 'create' | 'ai_img' | 'ai_quiz') => void;
  onOpenSettings: () => void;
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

export const QuizCreator: React.FC<QuizCreatorProps> = ({ initialQuiz, currentUser, onSave, onExit, startWithTutorial, onTutorialComplete, onStatUpdate, onOpenSettings }) => {
  const [creationMode, setCreationMode] = useState<'selection' | 'editor'>(
    initialQuiz || startWithTutorial ? 'editor' : 'selection'
  );

  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Theme State
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

  // Preview State
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

  const addQuestion = () => {
    setQuestions([...questions, JSON.parse(JSON.stringify(DEFAULT_QUESTION))]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'type') {
      const type = value as QuestionType;
      if (type === 'true-false') {
        updated[index].options = ['True', 'False'];
        updated[index].correctAnswer = 0;
      } else if (type === 'text-input' || type === 'fill-in-the-blank') {
        updated[index].options = [''];
        updated[index].correctAnswer = '';
      } else if (type === 'ordering') {
        updated[index].options = ['', '', '', ''];
        updated[index].correctAnswer = null; 
      } else if (type === 'matching') {
        updated[index].options = ['', '', '', '', '', '', '', '']; 
        updated[index].correctAnswer = null;
      } else if (type === 'slider') {
        updated[index].options = ['0', '100', '1', 'Units']; 
        updated[index].correctAnswer = 50;
      } else {
        updated[index].options = ['', '', '', ''];
        updated[index].correctAnswer = 0;
      }
    }
    
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options = [...updated[qIndex].options];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const moveOrderingOption = (qIndex: number, optIndex: number, direction: 'up' | 'down') => {
      const updated = [...questions];
      const options = [...updated[qIndex].options];
      const swapIndex = direction === 'up' ? optIndex - 1 : optIndex + 1;
      
      if (swapIndex >= 0 && swapIndex < options.length) {
          const temp = options[optIndex];
          options[optIndex] = options[swapIndex];
          options[swapIndex] = temp;
          updated[qIndex].options = options;
          setQuestions(updated);
      }
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, questions.length - 2));
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    updateQuestion(currentQuestionIndex, 'image', imageUrl);
  };

  const handleAIGenerated = (newQuestions: Question[], title: string) => {
    if (creationMode === 'selection') {
      setQuestions(newQuestions);
      setQuizTitle(title);
      setCurrentQuestionIndex(0);
      setCreationMode('editor');
    } else {
      if (questions.length === 1 && !questions[0].question.trim()) {
        setQuestions(newQuestions);
        if(!quizTitle.trim()) setQuizTitle(title);
        setCurrentQuestionIndex(0);
      } else {
        setQuestions(prev => [...prev, ...newQuestions]);
        setCurrentQuestionIndex(questions.length);
      }
    }
  };

  const checkComplianceWithAI = async (title: string, questions: Question[]) => {
      const token = currentUser.preferences?.githubToken || currentUser.preferences?.openaiKey;
      if (!token) return true; 
      
      const provider = currentUser.preferences?.aiTextProvider || 'github';
      const endpoint = provider === 'github' 
        ? "https://models.github.ai/inference/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
        
      const model = 'gpt-4o-mini';

      const prompt = `You are a content moderator for a quiz app. Review the following quiz.
      Title: ${title}
      Questions: ${JSON.stringify(questions.slice(0, 5))}...
      
      Does this content violate safety guidelines (hate speech, sexual content, self-harm, violence)?
      Return STRICT JSON: {"safe": boolean, "reason": "string"}`;

      try {
        const response = await (window as any).fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                model: model,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) return true; 
        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        
        if (!result.safe) {
            (window as any).alert(`Guidelines Check Failed: ${result.reason}`);
            return false;
        }
        return true;
      } catch (e) {
          return true; 
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

    const isSafe = await checkComplianceWithAI(quizTitle, questions);
    if (!isSafe) return;

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

    if (!initialQuiz) {
       onStatUpdate('create');
    }

    onSave(newQuiz);
    setShowSaveOptionsModal(false);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    if (onTutorialComplete) {
      onTutorialComplete();
    }
  };

  const startPreview = () => {
    if (!quizTitle.trim() && questions.every(q => !q.question.trim())) {
        (window as any).alert("Please add some content before previewing.");
        return;
    }
    setIsPreviewing(true);
  };

  if (isPreviewing) {
    const previewQuiz: Quiz = {
        id: initialQuiz?.id || -1,
        userId: currentUser.id,
        title: quizTitle || 'Untitled Quiz',
        questions: questions,
        createdAt: new Date().toISOString(),
        theme: quizTheme,
        customTheme: customTheme,
        shuffleQuestions: shuffleQuestions,
        backgroundMusic: bgMusic,
        visibility: 'private'
    };

    return (
        <div className="fixed inset-0 z-50 bg-white">
            <QuizTaker 
                quiz={previewQuiz} 
                onComplete={() => setIsPreviewing(false)} 
                onExit={() => setIsPreviewing(false)} 
            />
        </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
        {showTutorial && (
            <TutorialWidget 
                step={tutorialStep} 
                onClose={closeTutorial}
                onNext={() => setTutorialStep(prev => Math.min(prev + 1, TUTORIAL_STEPS.length - 1))}
                onPrev={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                onOpenSettings={onOpenSettings}
                onOpenHelp={() => setShowTokenHelpModal(true)}
            />
        )}
        
        {showGuidelines && <LegalModal type="guidelines" onClose={() => setShowGuidelines(false)} />}

        {showValidationModal && (
            <ValidationModal 
                errors={validationErrors} 
                onClose={() => setShowValidationModal(false)}
                onExitWithoutSaving={onExit}
            />
        )}

        {showSaveOptionsModal && (
            <SaveOptionsModal 
                onConfirm={handleFinalizeSave}
                onCancel={() => setShowSaveOptionsModal(false)}
            />
        )}
        
        {showImageModal && <ImageSelectionModal onSelect={handleImageSelect} onClose={() => setShowImageModal(false)} onAiUsed={() => onStatUpdate('ai_img')} preferences={currentUser.preferences} />}
        {showAIModal && <GitHubAIModal onGenerate={handleAIGenerated} onClose={() => setShowAIModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
        {showImageQuizModal && <ImageQuizModal onGenerate={handleAIGenerated} onClose={() => setShowImageQuizModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} user={currentUser} />}
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
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/20 rounded-xl text-red-300 transition-all"
                             >
                                 <Trash2 size={16} />
                             </button>
                         </div>
                         <p className="text-sm font-bold line-clamp-2 h-10 text-slate-200 leading-tight">
                             {q.question || <span className="italic opacity-30 font-medium">Untitled Task...</span>}
                         </p>
                     </div>
                 ))}
                 
                 <button 
                    onClick={addQuestion}
                    className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all font-black flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                 >
                     <PlusCircle size={20} /> Add Item
                 </button>
             </div>

             <div className="p-6 border-t border-white/5 space-y-3 bg-slate-950/50 backdrop-blur-xl">
                 <button onClick={() => setShowGuidelines(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white mb-2 ml-2 transition-colors">
                    <Book size={12} /> Guidelines
                 </button>
                 <button 
                    onClick={() => setShowAIModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl text-sm border border-indigo-400/50 uppercase tracking-widest"
                 >
                     <Sparkles size={16} className="text-yellow-400" /> AI Generator
                 </button>
                 <button 
                    onClick={() => setShowImageQuizModal(true)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 text-sm uppercase tracking-widest"
                 >
                     <ImageIcon size={16} className="text-rose-400" /> Image to Quiz
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
                        <input 
                            type="text" 
                            value={quizTitle}
                            onChange={(e) => setQuizTitle((e.target as any).value)}
                            placeholder="Untitled Quiz"
                            className="text-2xl font-black bg-transparent text-slate-900 border-none px-3 py-1 focus:ring-0 placeholder-slate-300 w-full tracking-tight"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={startPreview} className="hidden sm:flex items-center gap-2 text-slate-600 font-black hover:bg-white px-5 py-3 rounded-2xl transition-all shadow-sm border border-slate-200 uppercase text-xs tracking-widest">
                        <Eye size={18} /> Preview
                    </button>
                    <button onClick={handleInitiateSave} className="bg-slate-900 hover:bg-black text-white font-black px-8 py-3.5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 uppercase text-sm tracking-widest">
                        Save Quiz
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
                         <div className="flex items-center gap-2">
                             <div className="flex items-center bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                                 {Object.entries(THEMES).map(([key, theme]) => (
                                     <button key={key} onClick={() => { setQuizTheme(key); setCustomTheme(undefined); }} className={`w-9 h-9 rounded-xl transition-all ${quizTheme === key && !customTheme ? 'bg-white shadow-lg scale-110' : 'opacity-40 hover:opacity-100'}`} title={theme.label}>
                                         <div className={`w-4 h-4 rounded-full mx-auto bg-gradient-to-br ${theme.gradient}`}></div>
                                     </button>
                                 ))}
                                 <button onClick={() => setShowThemeEditor(true)} className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center ${customTheme ? 'bg-white shadow-lg scale-110 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Custom Theme">
                                     <Palette size={18} />
                                 </button>
                             </div>
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
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit:</span>
                                    <input type="number" min="5" max="300" step="5" value={currentQ.timeLimit} onChange={(e) => updateQuestion(currentQuestionIndex, 'timeLimit', parseInt((e.target as any).value))} className="w-12 bg-transparent text-slate-900 text-center font-black text-sm outline-none" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sec</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 sm:p-12 space-y-10">
                            <div className="space-y-6">
                                <textarea value={currentQ.question} onChange={(e) => updateQuestion(currentQuestionIndex, 'question', (e.target as any).value)} placeholder="Type your core prompt here..." className="w-full text-2xl sm:text-4xl font-black border-none rounded-3xl p-8 bg-slate-50 text-slate-900 placeholder-slate-200 focus:ring-0 focus:bg-white transition-all resize-none shadow-inner leading-tight min-h-[160px]" rows={3} />
                                
                                {currentQ.image ? (
                                    <div className="relative rounded-[2.5rem] overflow-hidden group max-w-lg mx-auto bg-slate-50 border border-slate-100 shadow-xl">
                                        <img src={currentQ.image} alt="Question" className="w-full h-auto max-h-[400px] object-contain p-4" />
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 duration-300">
                                            <button onClick={() => setShowImageModal(true)} className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-110 transition-transform shadow-2xl">Change Visual</button>
                                            <button onClick={() => updateQuestion(currentQuestionIndex, 'image', '')} className="bg-rose-500 text-white p-3.5 rounded-2xl hover:bg-rose-600 hover:scale-110 transition-transform shadow-2xl"><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowImageModal(true)} className="flex items-center gap-3 text-indigo-600 font-black hover:bg-indigo-50 px-8 py-5 rounded-3xl transition-all w-fit border-2 border-dashed border-indigo-200 text-xs uppercase tracking-[0.2em] mx-auto group">
                                        <ImageIcon size={20} className="group-hover:rotate-12 transition-transform" /> Add Visual Context
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] whitespace-nowrap">Logic Configuration</h4>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                </div>
                                
                                {currentQ.type === 'multiple-choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                {/* Thickened A, B, C, D buttons */}
                                                <button 
                                                    onClick={() => updateQuestion(currentQuestionIndex, 'correctAnswer', i)} 
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-4 font-black text-lg flex-shrink-0 ${
                                                        currentQ.correctAnswer === i 
                                                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-110' 
                                                        : 'bg-white text-slate-300 border-slate-100 hover:border-indigo-200 group-hover:scale-105'
                                                    }`}
                                                >
                                                    {String.fromCharCode(65 + i)}
                                                </button>
                                                <div className="relative flex-1">
                                                    <input 
                                                        type="text" 
                                                        value={opt} 
                                                        onChange={(e) => updateOption(currentQuestionIndex, i, (e.target as any).value)} 
                                                        placeholder={`Define Option ${i + 1}`} 
                                                        className={`w-full px-6 py-4 rounded-[1.5rem] border-2 font-bold transition-all focus:outline-none bg-slate-50 text-slate-800 ${currentQ.correctAnswer === i ? 'border-emerald-200 bg-emerald-50 shadow-sm' : 'border-slate-50 focus:border-indigo-100 focus:bg-white'}`} 
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentQ.type === 'true-false' && (
                                    <div className="flex gap-6">
                                        {['True', 'False'].map((opt, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => updateQuestion(currentQuestionIndex, 'correctAnswer', i)} 
                                                className={`flex-1 py-12 rounded-[2.5rem] font-black text-3xl transition-all border-4 shadow-sm group relative overflow-hidden ${
                                                    currentQ.correctAnswer === i 
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xl scale-[1.03]' 
                                                    : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-slate-200 hover:bg-white'
                                                }`}
                                            >
                                                {opt}
                                                {currentQ.correctAnswer === i && <div className="absolute top-4 right-4 text-emerald-400"><Check size={24} strokeWidth={4} /></div>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {(currentQ.type === 'text-input' || currentQ.type === 'fill-in-the-blank') && (
                                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner">
                                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-4 ml-1">Validation Target</label>
                                        <input 
                                            type="text" 
                                            value={currentQ.correctAnswer as string} 
                                            onChange={(e) => updateQuestion(currentQuestionIndex, 'correctAnswer', (e.target as any).value)} 
                                            className="w-full px-8 py-5 rounded-2xl border-2 border-emerald-100 bg-white text-slate-900 focus:border-emerald-400 focus:outline-none font-black text-2xl shadow-xl placeholder:text-slate-200" 
                                            placeholder="Ex: Alexander the Great" 
                                        />
                                    </div>
                                )}

                                {currentQ.type === 'ordering' && (
                                    <div className="space-y-3">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <button onClick={() => moveOrderingOption(currentQuestionIndex, i, 'up')} disabled={i === 0} className="text-slate-300 hover:text-indigo-500 disabled:opacity-20"><ArrowUp size={20} strokeWidth={3}/></button>
                                                    <button onClick={() => moveOrderingOption(currentQuestionIndex, i, 'down')} disabled={i === currentQ.options.length - 1} className="text-slate-300 hover:text-indigo-500 disabled:opacity-20"><ArrowDown size={20} strokeWidth={3}/></button>
                                                </div>
                                                <span className="font-black text-indigo-200 text-xl w-8 text-center">{i + 1}</span>
                                                <input type="text" value={opt} onChange={(e) => updateOption(currentQuestionIndex, i, (e.target as any).value)} className="flex-1 px-6 py-3 rounded-xl border-2 border-transparent bg-white text-slate-800 font-bold focus:border-indigo-200 focus:outline-none transition-all shadow-sm" placeholder={`Item in sequence ${i + 1}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentQ.type === 'matching' && (
                                    <div className="space-y-4">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">{i + 1}</div>
                                                <input type="text" value={currentQ.options[i * 2] || ''} onChange={(e) => updateOption(currentQuestionIndex, i * 2, (e.target as any).value)} className="flex-1 px-6 py-3 rounded-xl border-2 border-transparent bg-white text-slate-800 font-bold focus:border-indigo-100 focus:outline-none shadow-sm" placeholder={`Label A`} />
                                                <ArrowRight size={20} className="text-indigo-300" strokeWidth={3} />
                                                <input type="text" value={currentQ.options[i * 2 + 1] || ''} onChange={(e) => updateOption(currentQuestionIndex, i * 2 + 1, (e.target as any).value)} className="flex-1 px-6 py-3 rounded-xl border-2 border-transparent bg-white text-slate-800 font-bold focus:border-indigo-100 focus:outline-none shadow-sm" placeholder={`Target B`} />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentQ.type === 'slider' && (
                                    <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-inner grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Minimum</label><input type="number" value={currentQ.options[0]} onChange={(e) => updateOption(currentQuestionIndex, 0, (e.target as any).value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black focus:border-indigo-400 focus:outline-none" /></div>
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maximum</label><input type="number" value={currentQ.options[1]} onChange={(e) => updateOption(currentQuestionIndex, 1, (e.target as any).value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black focus:border-indigo-400 focus:outline-none" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Increment</label><input type="number" value={currentQ.options[2]} onChange={(e) => updateOption(currentQuestionIndex, 2, (e.target as any).value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black focus:border-indigo-400 focus:outline-none" /></div>
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Label</label><input type="text" value={currentQ.options[3]} onChange={(e) => updateOption(currentQuestionIndex, 3, (e.target as any).value)} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-900 font-black focus:border-indigo-400 focus:outline-none" /></div>
                                        </div>
                                        <div className="col-span-2 pt-6">
                                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center block mb-4">Target Accurate Value</label>
                                            <input type="number" value={currentQ.correctAnswer as number} onChange={(e) => updateQuestion(currentQuestionIndex, 'correctAnswer', Number((e.target as any).value))} className="w-full px-6 py-6 rounded-[2rem] border-4 border-emerald-200 bg-white text-slate-900 font-black text-4xl text-center focus:border-emerald-500 focus:outline-none shadow-2xl" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Explanation & Knowledge (Optional)</label>
                                <textarea 
                                    value={currentQ.explanation || ''} 
                                    onChange={(e) => updateQuestion(currentQuestionIndex, 'explanation', (e.target as any).value)} 
                                    placeholder="Explain the logic behind this task to your learners..." 
                                    className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 text-slate-700 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all resize-none h-32 text-base font-bold shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
