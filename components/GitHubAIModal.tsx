
import React, { useState } from 'react';
import { X, Sparkles, Loader2, BookOpen, BarChart, AlertCircle, PlusCircle, Info, Image as ImageIcon } from 'lucide-react';
import { Question, User } from '../types';
import { generateQuizWithAI } from '../services/githubAI';
import { generateImageForQuestion } from '../services/aiService';
import { compressImage } from '../services/imageUtils';

interface GitHubAIModalProps {
  onGenerate: (questions: Question[], title: string) => void;
  onClose: () => void;
  onAiUsed: () => void;
  user: User;
}

export const GitHubAIModal: React.FC<GitHubAIModalProps> = ({ onGenerate, onClose, onAiUsed, user }) => {
  const [step, setStep] = useState<'config' | 'review'>('config');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('mixed');
  const [autoImages, setAutoImages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<{title: string, questions: Question[]} | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setLoadingStatus(`Querying AI...`);

    try {
      const result = await generateQuizWithAI(topic, difficulty, count, user.preferences, quizType);
      setGeneratedData(result);
      const allIndices = new Set<number>();
      result.questions.forEach((_: any, i: number) => allIndices.add(i));
      setSelectedIndices(allIndices);
      setStep('review');
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  const handleConfirmSelection = async () => {
      if (!generatedData) return;
      const finalQuestions = generatedData.questions.filter((_, i) => selectedIndices.has(i));
      setIsGenerating(true);
      let processedQuestions = finalQuestions;

      if (autoImages) {
        setLoadingStatus(`Creating visuals (0/${finalQuestions.length})...`);
        processedQuestions = await Promise.all(finalQuestions.map(async (q, idx) => {
            try {
                const imageUrl = await generateImageForQuestion(q.question, user.preferences);
                if (imageUrl) {
                    const compressedUrl = await compressImage(imageUrl);
                    return { ...q, image: compressedUrl };
                }
                return q;
            } catch (e) {
                return q;
            }
        }));
      }

      onAiUsed();
      onGenerate(processedQuestions, generatedData.title);
      onClose();
      setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh]">
        <div className="bg-[#1a1f2e] p-6 flex justify-between items-center text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400" />
            <h2 className="text-xl font-black uppercase tracking-tight">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 rounded-full p-2 transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 'config' ? (
            <div className="p-10 space-y-8 bg-white overflow-y-auto flex-1">
            {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-xs font-black uppercase tracking-widest">{error}</div>}

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Topic Identity</label>
                <div className="p-1 bg-slate-50 border-2 border-slate-100 rounded-3xl focus-within:border-indigo-500 transition-all">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Quantum Physics, Cooking, etc..."
                        className="w-full px-6 py-4 bg-transparent border-none focus:ring-0 font-bold text-lg text-slate-800 italic"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Complexity</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-800 uppercase tracking-widest text-xs focus:outline-none focus:border-indigo-500">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Module Count</label>
                    <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-800 uppercase tracking-widest text-xs focus:outline-none focus:border-indigo-500">
                        <option value={5}>5 Units</option>
                        <option value={10}>10 Units</option>
                        <option value={15}>15 Units</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
            >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-yellow-400" />}
                {isGenerating ? loadingStatus : 'Generate Blueprint'}
            </button>
            </div>
        ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
                <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Blueprint Review</h3>
                    <button onClick={() => setStep('config')} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Change Configuration</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {generatedData?.questions.map((q, idx) => (
                        <div key={idx} className="p-6 rounded-[2rem] border-2 bg-white border-slate-100 hover:border-indigo-100 transition-all">
                             <p className="font-bold text-slate-800 mb-4">{q.question}</p>
                             <div className="flex flex-wrap gap-2">
                                {q.options.map((o, i) => (
                                    <span key={i} className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${i === q.correctAnswer ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{o}</span>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
                <div className="p-8 bg-white border-t border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> Auto-Generate Visuals</span>
                        <input type="checkbox" checked={autoImages} onChange={(e) => setAutoImages(e.target.checked)} className="accent-indigo-600 h-5 w-5 rounded-lg" />
                    </div>
                    <button onClick={handleConfirmSelection} disabled={isGenerating} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50">
                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
                        {isGenerating ? loadingStatus : `Commit ${generatedData?.questions.length} Units`}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
