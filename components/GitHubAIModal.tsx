
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
      setError('Please enter a topic identity');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setLoadingStatus(`Querying Infrastructure...`);

    try {
      const result = await generateQuizWithAI(topic, difficulty, count, user.preferences, quizType);
      setGeneratedData(result);
      const allIndices = new Set<number>();
      result.questions.forEach((_: any, i: number) => allIndices.add(i));
      setSelectedIndices(allIndices);
      setStep('review');
    } catch (err: any) {
      setError(err.message || "Failed to generate blueprint.");
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
        setLoadingStatus(`Synchronizing Visuals...`);
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
    <div className="fixed inset-0 bg-slate-950/80 z-[70] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in duration-500 h-[85vh] border border-white/20">
        <div className="bg-[#1a1f2e] p-8 flex justify-between items-center text-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <Sparkles size={28} className="text-yellow-400" />
            <h2 className="text-2xl font-black uppercase tracking-tight">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 rounded-2xl p-3 transition-colors">
            <X size={24} />
          </button>
        </div>

        {step === 'config' ? (
            <div className="p-12 space-y-10 bg-white overflow-y-auto flex-1">
            {error && <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-6 rounded-3xl text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2">{error}</div>}

            <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Topic</label>
                <div className="p-1 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus-within:border-indigo-500 transition-all shadow-inner">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Quantum Physics, Cooking, etc..."
                        className="w-full px-8 py-6 bg-transparent border-none focus:ring-0 font-bold text-2xl text-slate-800 italic"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-slate-800 uppercase tracking-widest text-xs focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Questions</label>
                    <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-slate-800 uppercase tracking-widest text-xs focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-8 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 transition-all shadow-2xl disabled:opacity-50 click-scale"
            >
                {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} className="text-yellow-400" />}
                {isGenerating ? loadingStatus : 'Generate Quiz'}
            </button>
            </div>
        ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
                <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center flex-shrink-0 shadow-sm">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Blueprint Review</h3>
                    <button onClick={() => setStep('config')} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Edit Configuration</button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {generatedData?.questions.map((q, idx) => (
                        <div key={idx} className="p-8 rounded-[2.5rem] border-2 bg-white border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                             <p className="font-bold text-slate-800 text-xl mb-6 italic">"{q.question}"</p>
                             <div className="flex flex-wrap gap-3">
                                {q.options.map((o, i) => (
                                    <span key={i} className={`text-[10px] px-5 py-2.5 rounded-full font-black uppercase tracking-widest ${i === q.correctAnswer ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{o}</span>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
                <div className="p-10 bg-white border-t border-slate-100 space-y-8 shadow-2xl">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><ImageIcon size={18} /> Visual Synchronization</span>
                        <input type="checkbox" checked={autoImages} onChange={(e) => setAutoImages(e.target.checked)} className="accent-indigo-600 h-6 w-6 rounded-xl cursor-pointer" />
                    </div>
                    <button onClick={handleConfirmSelection} disabled={isGenerating} className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 shadow-2xl transition-all disabled:opacity-50 click-scale">
                        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <PlusCircle size={24} />}
