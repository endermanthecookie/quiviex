import React, { useState, useEffect } from 'react';
import { Menu, Home, X, Trash2, Image as ImageIcon, Sparkles, Palette, Shuffle, GripVertical, ArrowUp, ArrowDown, PenTool, ArrowRight, Wand2, ArrowLeft, Camera, Music, PlusCircle, Eye, ShieldAlert, Book } from 'lucide-react';
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
      const token = (window as any).localStorage.getItem('gh_models_token') || (window as any).localStorage.getItem('openai_api_key');
      if (!token) return true; 
      
      const provider = (window as any).localStorage.getItem('ai_text_provider') || 'github';
      const endpoint = provider === 'github' 
        ? "https://models.github.ai/inference/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
        
      const model = provider === 'github' ? 'gpt-4o-mini' : 'gpt-4o-mini';

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
          (window as any).console.error("Mod check error", e);
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
        
        {showImageModal && <ImageSelectionModal onSelect={handleImageSelect} onClose={() => setShowImageModal(false)} onAiUsed={() => onStatUpdate('ai_img')} />}
        {showAIModal && <GitHubAIModal onGenerate={handleAIGenerated} onClose={() => setShowAIModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} textModel={currentUser.preferences?.textModel} imageModel={currentUser.preferences?.imageModel} />}
        {showImageQuizModal && <ImageQuizModal onGenerate={handleAIGenerated} onClose={() => setShowImageQuizModal(false)} onAiUsed={() => onStatUpdate('ai_quiz')} />}
        {showMusicModal && <MusicSelectionModal currentMusic={bgMusic} onSelect={setBgMusic} onClose={() => setShowMusicModal(false)} />}
        {showThemeEditor && <ThemeEditorModal initialTheme={customTheme} onSave={(t) => { setCustomTheme(t); setShowThemeEditor(false); }} onClose={() => setShowThemeEditor(false)} onAiUsed={() => onStatUpdate('ai_img')} />}
        {showTokenHelpModal && <GitHubTokenHelpModal onClose={() => setShowTokenHelpModal(false)} />}
        
        <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900/90 backdrop-blur-2xl text-white transform transition-transform duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-r border-white/10`}>
             <div className="p-6 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-2 font-bold text-xl">
                     <PenTool className="text-indigo-400" />
                     <span>Editor</span>
                 </div>
                 <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
                     <X size={24} />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                 {questions.map((q, idx) => (
                     <div 
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`p-4 rounded-xl cursor-pointer transition-all group relative border ${
                            currentQuestionIndex === idx 
                            ? 'bg-indigo-600/80 shadow-lg border-indigo-400' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                     >
                         <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${currentQuestionIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>Question {idx + 1}</span>
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-red-300 transition-all"
                             >
                                 <Trash2 size={14} />
                             </button>
                         </div>
                         <p className="text-sm font-medium line-clamp-2 h-10 text-slate-200">
                             {q.question || <span className="italic opacity-50">Empty Question...</span>}
                         </p>
                     </div>
                 ))}
                 
                 <button 
                    onClick={addQuestion}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all font-bold flex items-center justify-center gap-2"
                 >
                     <PlusCircle size={20} /> Add Question
                 </button>
             </div>

             <div className="p-4 border-t border-white/5 space-y-2">
                 <button onClick={() => setShowGuidelines(true)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-2 ml-2">
                    <Book size={12} /> Content Guidelines
                 </button>
                 <button 
                    onClick={() => setShowAIModal(true)}
                    className="w-full bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm border border-indigo-400/30"
                 >
                     <Sparkles size={16} className="text-yellow-400" /> AI Generator
                 </button>
                 <button 
                    onClick={() => setShowImageQuizModal(true)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm border border-white/10"
                 >
                     <ImageIcon size={16} className="text-rose-400" /> Image to Quiz
                 </button>
             </div>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
            <div className="bg-white/40 backdrop-blur-xl border-b border-white/40 p-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-white/50 rounded-lg shadow-sm">
                        <Menu size={24} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2 w-full max-w-lg">
                        <button onClick={onExit} className="p-2 hover:bg-white/80 rounded-lg text-slate-500 transition-colors" title="Exit">
                            <ArrowLeft size={24} />
                        </button>
                        <input 
                            type="text" 
                            value={quizTitle}
                            onChange={(e) => setQuizTitle((e.target as any).value)}
                            placeholder="Untitled Quiz"
                            className="text-xl sm:text-2xl font-black bg-transparent text-slate-900 border-none px-3 py-1 focus:ring-0 placeholder-slate-400 w-full"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={startPreview} className="hidden sm:flex items-center gap-2 text-slate-600 font-bold hover:bg-white/60 px-4 py-2 rounded-xl transition-all shadow-sm border border-white/40">
                        <Eye size={20} /> Preview
                    </button>
                    <button onClick={handleInitiateSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 border border-indigo-400/30">
                        Save Quiz
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="glass p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                         <div className="flex items-center gap-2">
                             <div className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-lg border border-white/60">
                                 <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions((e.target as any).checked)} id="shuffle" className="accent-indigo-600 w-4 h-4" />
                                 <label htmlFor="shuffle" className="text-sm font-bold text-slate-600 cursor-pointer select-none">Shuffle</label>
                             </div>
                             <button onClick={() => setShowMusicModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm ${bgMusic ? 'bg-indigo-50/80 border-indigo-200 text-indigo-600' : 'bg-white/40 border-white/60 text-slate-600 hover:bg-white/60'}`}>
                                 <Music size={16} /> {bgMusic ? 'Music On' : 'No Music'}
                             </button>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="flex items-center bg-white/30 backdrop-blur-md rounded-lg p-1 border border-white/40">
                                 {Object.entries(THEMES).map(([key, theme]) => (
                                     <button key={key} onClick={() => { setQuizTheme(key); setCustomTheme(undefined); }} className={`w-8 h-8 rounded-md transition-all ${quizTheme === key && !customTheme ? 'bg-white shadow-md scale-110' : 'opacity-50 hover:opacity-100'}`} title={theme.label}>
                                         <div className={`w-4 h-4 rounded-full mx-auto bg-gradient-to-br ${theme.gradient}`}></div>
                                     </button>
                                 ))}
                                 <button onClick={() => setShowThemeEditor(true)} className={`w-8 h-8 rounded-md transition-all flex items-center justify-center ${customTheme ? 'bg-white shadow-md scale-110 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="Custom Theme">
                                     <Palette size={16} />
                                 </button>
                             </div>
                         </div>
                    </div>

                    <div className="glass rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/60">
                        <div className="bg-white/20 border-b border-white/40 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="bg-white/40 text-slate-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-white/60">Question {currentQuestionIndex + 1}</span>
                                <select value={currentQ.type} onChange={(e) => updateQuestion(currentQuestionIndex, 'type', (e.target as any).value)} className="bg-white/60 backdrop-blur-md border border-white/60 text-slate-900 font-bold text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                                    <option value="multiple-choice">Multiple Choice</option>
                                    <option value="true-false">True / False</option>
                                    <option value="text-input">Text Input</option>
                                    <option value="fill-in-the-blank">Fill in Blank</option>
                                    <option value="ordering">Ordering</option>
                                    <option value="matching">Matching</option>
                                    <option value="slider">Slider / Range</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Time:</span>
                                    <input type="number" min="5" max="300" step="5" value={currentQ.timeLimit} onChange={(e) => updateQuestion(currentQuestionIndex, 'timeLimit', parseInt((e.target as any).value))} className="w-16 bg-white/60 border border-white/60 text-slate-900 rounded-lg px-2 py-1 text-center font-black focus:ring-2 focus:ring-indigo-500/30 outline-none" />
                                    <span>s</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="space-y-4">
                                <textarea value={currentQ.question} onChange={(e) => updateQuestion(currentQuestionIndex, 'question', (e.target as any).value)} placeholder="Type your question here..." className="w-full text-xl sm:text-2xl font-bold border-2 border-white/60 rounded-2xl p-6 bg-white/40 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white/60 focus:outline-none transition-all resize-none shadow-inner" rows={3} />
                                {currentQ.image ? (
                                    <div className="relative rounded-2xl overflow-hidden group max-w-md bg-white/30 border-2 border-white/60 shadow-lg">
                                        <img src={currentQ.image} alt="Question" className="w-full h-auto max-h-64 object-contain" />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button onClick={() => setShowImageModal(true)} className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg">Change</button>
                                            <button onClick={() => updateQuestion(currentQuestionIndex, 'image', '')} className="bg-red-500 text-white p-2 rounded-xl hover:scale-105 transition-transform shadow-lg"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowImageModal(true)} className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-white/60 px-6 py-3 rounded-2xl transition-all w-fit border-2 border-white shadow-sm">
                                        <ImageIcon size={20} /> Add Visual Media
                                    </button>
                                )}
                            </div>
                            <div className="h-px bg-white/40 w-full" />
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Answer Configuration</h4>
                                {currentQ.type === 'multiple-choice' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <button onClick={() => updateQuestion(currentQuestionIndex, 'correctAnswer', i)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${currentQ.correctAnswer === i ? 'bg-green-500 text-white border-green-400 shadow-lg scale-110' : 'bg-white/40 text-slate-400 hover:bg-white/60 border-white/60'}`}>{i === 0 ? 'A' : i === 1 ? 'B' : i === 2 ? 'C' : 'D'}</button>
                                                <input type="text" value={opt} onChange={(e) => updateOption(currentQuestionIndex, i, (e.target as any).value)} placeholder={`Option ${i + 1}`} className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all focus:outline-none bg-white/40 text-slate-900 ${currentQ.correctAnswer === i ? 'border-green-400 bg-white/60 shadow-md' : 'border-white/60 focus:border-indigo-400/50 focus:bg-white/60'}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {currentQ.type === 'true-false' && (<div className="flex gap-4">{['True', 'False'].map((opt, i) => (<button key={i} onClick={() => updateQuestion(currentQuestionIndex, 'correctAnswer', i)} className={`flex-1 py-8 rounded-[2rem] font-black text-2xl transition-all border-2 backdrop-blur-md ${currentQ.correctAnswer === i ? 'bg-green-500 border-green-400 text-white shadow-xl transform scale-105' : 'bg-white/30 border-white/60 text-slate-400 hover:bg-white/60'}`}>{opt}</button>))}</div>)}
                                {(currentQ.type === 'text-input' || currentQ.type === 'fill-in-the-blank') && (<div className="bg-white/20 p-6 rounded-[2rem] border border-white/40"><input type="text" value={currentQ.correctAnswer as string} onChange={(e) => updateQuestion(currentQuestionIndex, 'correctAnswer', (e.target as any).value)} className="w-full px-6 py-4 rounded-xl border-2 border-green-200/50 bg-white/40 text-slate-900 focus:border-green-400 focus:bg-white/60 focus:outline-none font-bold text-xl shadow-inner" placeholder="Enter correct answer..." /></div>)}
                                {currentQ.type === 'ordering' && (
                                    <div className="space-y-2">
                                        {currentQ.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/20 p-3 rounded-xl border border-white/40">
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => moveOrderingOption(currentQuestionIndex, i, 'up')} disabled={i === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                                                    <button onClick={() => moveOrderingOption(currentQuestionIndex, i, 'down')} disabled={i === currentQ.options.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                                                </div>
                                                <span className="font-black text-slate-300 w-6">{i + 1}</span>
                                                <input type="text" value={opt} onChange={(e) => updateOption(currentQuestionIndex, i, (e.target as any).value)} className="flex-1 px-4 py-2 rounded-lg border-2 border-white/40 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" placeholder={`Item ${i + 1}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {currentQ.type === 'matching' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500 font-bold ml-1 uppercase">Define Pairings (A ➔ B)</p>
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input type="text" value={currentQ.options[i * 2] || ''} onChange={(e) => updateOption(currentQuestionIndex, i * 2, (e.target as any).value)} className="flex-1 px-4 py-2 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" placeholder={`Left ${i + 1}`} />
                                                <ArrowRight size={16} className="text-indigo-300" />
                                                <input type="text" value={currentQ.options[i * 2 + 1] || ''} onChange={(e) => updateOption(currentQuestionIndex, i * 2 + 1, (e.target as any).value)} className="flex-1 px-4 py-2 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" placeholder={`Right ${i + 1}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {currentQ.type === 'slider' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Min Value</label><input type="number" value={currentQ.options[0]} onChange={(e) => updateOption(currentQuestionIndex, 0, (e.target as any).value)} className="w-full px-4 py-3 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" /></div>
                                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Max Value</label><input type="number" value={currentQ.options[1]} onChange={(e) => updateOption(currentQuestionIndex, 1, (e.target as any).value)} className="w-full px-4 py-3 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" /></div>
                                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Step Size</label><input type="number" value={currentQ.options[2]} onChange={(e) => updateOption(currentQuestionIndex, 2, (e.target as any).value)} className="w-full px-4 py-3 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" /></div>
                                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Unit Label</label><input type="text" value={currentQ.options[3]} onChange={(e) => updateOption(currentQuestionIndex, 3, (e.target as any).value)} className="w-full px-4 py-3 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 font-bold focus:border-indigo-400 focus:bg-white/60 focus:outline-none" /></div>
                                        <div className="col-span-2 mt-2"><label className="text-xs font-bold text-green-600 uppercase ml-1">Target Value</label><input type="number" value={currentQ.correctAnswer as number} onChange={(e) => updateQuestion(currentQuestionIndex, 'correctAnswer', Number((e.target as any).value))} className="w-full px-4 py-4 rounded-xl border-2 border-green-200 bg-white/60 text-slate-900 font-black text-center focus:border-green-400 focus:bg-white focus:outline-none shadow-md" /></div>
                                    </div>
                                )}
                            </div>
                            <div className="h-px bg-white/40 w-full" />
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Explanation (Optional)</label>
                                <textarea 
                                    value={currentQ.explanation || ''} 
                                    onChange={(e) => updateQuestion(currentQuestionIndex, 'explanation', (e.target as any).value)} 
                                    placeholder="Brief explanation for learners..." 
                                    className="w-full px-4 py-3 rounded-xl border-2 border-white/60 bg-white/40 text-slate-900 focus:outline-none focus:border-indigo-400 focus:bg-white/60 transition-all resize-none h-24 text-sm font-medium"
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