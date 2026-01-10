import React, { useState } from 'react';
import { X, Upload, Link, Image as ImageIcon, Sparkles, Loader2, Monitor, Smartphone, Square, AlertCircle } from 'lucide-react';
import { generateImageForQuestion } from '../services/aiService';
import { compressImage } from '../services/imageUtils';
import { UserPreferences } from '../types';

interface ImageSelectionModalProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  onAiUsed: () => void;
  preferences?: UserPreferences;
}

type Tab = 'upload' | 'url' | 'generate';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({ onSelect, onClose, onAiUsed, preferences }) => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [urlInput, setUrlInput] = useState('');
  
  // AI Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onSelect(urlInput);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0];
    if (file) {
      const reader = new (window as any).FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const compressed = await compressImage(rawBase64);
            onSelect(compressed);
        } catch (e) {
            (window as any).console.error("Compression failed", e);
            onSelect(rawBase64);
        }
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);

    try {
        const imageUrl = await generateImageForQuestion(genPrompt, preferences);
        
        if (imageUrl) {
            const compressed = await compressImage(imageUrl);
            onSelect(compressed);
            onAiUsed();
            onClose();
        } else {
            (window as any).alert("Generation failed. Ensure you have a valid OpenAI key in settings.");
        }
    } catch (error) {
        (window as any).console.error("Generation failed", error);
        (window as any).alert("AI provider failed to generate image. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 h-[80vh] sm:h-auto sm:max-h-[85vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg">
            <ImageIcon size={20} />
            Select Image
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b overflow-x-auto flex-shrink-0">
          {[
            { id: 'upload', icon: Upload, label: 'Upload' },
            { id: 'url', icon: Link, label: 'URL' },
            { id: 'generate', icon: Sparkles, label: 'DALL-E 2 AI' }
          ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'upload' && (
            <div className="h-full flex flex-col justify-center">
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors cursor-pointer relative group">
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                    <Upload className="mx-auto text-violet-300 mb-3" size={48} />
                </div>
                <p className="font-bold text-gray-700 text-lg">Click to Upload</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, GIF, WEBP</p>
                </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Image URL</label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput((e.target as any).value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 bg-white text-black"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg hover:shadow-violet-200"
              >
                Use URL
              </button>
            </div>
          )}

          {activeTab === 'generate' && (
             <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-2">
                    <p className="text-indigo-800 text-sm font-medium flex gap-2">
                        <Sparkles size={16} className="mt-0.5" />
                        DALL-E 2 will generate a custom masterpiece for you.
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Visual Prompt</label>
                    <textarea
                        value={genPrompt}
                        onChange={(e) => setGenPrompt((e.target as any).value)}
                        placeholder="e.g. A futuristic city with flying cars, neon lights, digital art style"
                        className="w-full px-4 py-3 bg-white text-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 min-h-[80px] resize-none placeholder-gray-400"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !genPrompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold disabled:opacity-70 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-violet-200"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating Visual...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate with OpenAI
                        </>
                    )}
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};