import React, { useState } from 'react';
import { X, Sparkles, Loader2, BookOpen, BarChart, AlertCircle, PlusCircle, Info, Image as ImageIcon } from 'lucide-react';
import { Question } from '../types';
import { generateQuizWithAI } from '../services/githubAI';
import { generateImageForQuestion } from '../services/genAI';
import { compressImage } from '../services/imageUtils';

export const GitHubAIModal: React.FC<any> = ({ onGenerate, onClose, onAiUsed, user }) => {
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
    setLoadingStatus(`Querying AI Service...`);

    try {
      const result = await generateQuizWithAI(topic, difficulty, count, user.preferences, quizType);
      setGeneratedData(result);
      const allIndices = new Set<number>();
      result.questions.forEach((_, i) => allIndices.add(i));
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
        processedQuestions = await Promise.all(finalQuestions.map(async (q, _idx) => {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 h-[85vh]">
        <div className="bg-gradient-to-r from-slate-800 to-gray-900 p-4 flex justify-between items-center text-white flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sparkles size={20} className="text-yellow-400" />
            AI Quiz Generator
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded p-1">
            <X size={20} />
          </button>
        </div>

        {step === 'config' ? (
            <div className="p-6 space-y-5 bg-white overflow-y-auto flex-1">
            {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-600" /> Topic
                </label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic((e.target as any).value)}
                    placeholder="e.g., Quantum Physics, Italian Cooking"
                    className="w-full px-4 py-3 bg-white text-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-600"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Count</label>
                    <select value={count} onChange={(e) => setCount(Number((e.target as any).value))} className="w-full px-4 py-3 bg-white text-black border-2 border-gray-200 rounded-xl">
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty((e.target as any).value)} className="w-full px-4 py-3 bg-white text-black border-2 border-gray-200 rounded-xl">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-70"
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} className="text-yellow-400" />}
                {isGenerating ? loadingStatus : 'Generate Preview'}
            </button>
            </div>
        ) : (
            <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
                <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-slate-800">Review Questions</h3>
                    <button onClick={() => setStep('config')} className="text-sm font-bold text-blue-600 hover:underline">Change Settings</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {generatedData?.questions.map((q, idx) => (
                        <div key={idx} className="p-4 rounded-xl border-2 bg-white border-slate-200">
                             <p className="font-bold text-slate-800">{q.question}</p>
                             <div className="mt-2 flex flex-wrap gap-2">
                                {q.options.map((o, i) => (
                                    <span key={i} className={`text-xs px-2 py-1 rounded border ${i === q.correctAnswer ? 'bg-green-100 border-green-200 text-green-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{o}</span>
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600 px-2">
                        <span className="flex items-center gap-2"><ImageIcon size={16} /> Generate AI Illustrations (DALL-E)</span>
                        <input type="checkbox" checked={autoImages} onChange={(e) => setAutoImages((e.target as any).checked)} className="accent-violet-600 h-5 w-5" />
                    </div>
                    <button onClick={handleConfirmSelection} disabled={isGenerating} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">
                        {isGenerating ? <Loader2 className="animate-spin" /> : <PlusCircle size={20} />}
                        {isGenerating ? loadingStatus : `Add ${generatedData?.questions.length} Questions to Quiz`}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};