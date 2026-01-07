import React, { useState } from 'react';
import { X, Upload, Sparkles, Loader2, Image as ImageIcon, BarChart, Hash, AlertCircle, Info } from 'lucide-react';
import { Question } from '../types';
import { generateQuizFromImage, generateImageForQuestion } from '../services/genAI';
import { compressImage } from '../services/imageUtils';

export const ImageQuizModal: React.FC<any> = ({ onGenerate, onClose, onAiUsed, imageModel = 'dall-e-3' }) => {
  const [image, setImage] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoImages, setAutoImages] = useState(true);

  // Fix: Use window.localStorage
  const openaiKey = (window as any).localStorage.getItem('openai_api_key');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Cast e.target to any
    const file = (e.target as any).files?.[0];
    if (file) {
      // Fix: Use window.FileReader
      const reader = new (window as any).FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImage(compressed);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!openaiKey) {
        setError("OpenAI API Key is missing. Add it in Settings.");
        return;
    }
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    setIsGenerating(true);
    setLoadingStatus('Analyzing image with GPT-4o...');
    setError(null);

    try {
      const result = await generateQuizFromImage(image, difficulty, count);
      let finalQuestions = result.questions;

      if (autoImages) {
        setLoadingStatus(`Creating visuals...`);
        finalQuestions = await Promise.all(result.questions.map(async (q) => {
            try {
                const imageUrl = await generateImageForQuestion(q.question, imageModel);
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
      onGenerate(finalQuestions, result.title);
      onClose();
    } catch (err: any) {
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsGenerating(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <ImageIcon size={24} />
            <h2 className="font-black text-xl">Image to Quiz</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-2">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!openaiKey && <div className="bg-amber-50 p-3 rounded-xl text-amber-800 text-sm font-bold border border-amber-100">OpenAI Key Required in Settings</div>}
          {error && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

          <div className="relative">
            {image ? (
                <div className="relative rounded-2xl overflow-hidden border-2 h-64 bg-slate-50">
                    <img src={image} alt="Upload" className="w-full h-full object-contain" />
                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg"><X size={20} /></button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center h-64 border-3 border-dashed border-slate-300 rounded-3xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all group">
                    <Upload size={32} className="text-slate-400 group-hover:text-pink-500 mb-4" />
                    <p className="font-bold text-slate-600">Click to Upload Image</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fix: Cast e.target to any */}
            <select value={count} onChange={(e) => setCount(Number((e.target as any).value))} className="px-4 py-3 bg-slate-50 border-2 rounded-xl">
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
            </select>
            {/* Fix: Cast e.target to any */}
            <select value={difficulty} onChange={(e) => setDifficulty((e.target as any).value)} className="px-4 py-3 bg-slate-50 border-2 rounded-xl">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !image || !openaiKey}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {isGenerating ? loadingStatus : 'Generate Quiz with GPT-4o'}
          </button>
        </div>
      </div>
    </div>
  );
};