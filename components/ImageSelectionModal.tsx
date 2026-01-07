
import React, { useState } from 'react';
import { X, Upload, Link, Image as ImageIcon, Sparkles, Loader2, Monitor, Smartphone, Square, AlertCircle } from 'lucide-react';
import { generateImageForQuestion } from '../services/genAI';
import { compressImage } from '../services/imageUtils';

interface ImageSelectionModalProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  onAiUsed: () => void;
}

type Tab = 'upload' | 'url' | 'generate';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({ onSelect, onClose, onAiUsed }) => {
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
    // Fix: Cast e.target to any
    const file = (e.target as any).files?.[0];
    if (file) {
      // Fix: Use window.FileReader
      const reader = new (window as any).FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const compressed = await compressImage(rawBase64);
            onSelect(compressed);
        } catch (e) {
            // Fix: Use window.console
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
        // Use the centralized OpenAI service
        const imageUrl = await generateImageForQuestion(genPrompt, 'dall-e-3');
        
        if (imageUrl) {
            // Compress generated image
            const compressed = await compressImage(imageUrl);
            
            onSelect(compressed);
            onAiUsed(); // Trigger stat
            onClose();
        } else {
            // Fix: Use window.alert
            (window as any).alert("No image generated. Please check your OpenAI API Key in Settings.");
        }
    } catch (error) {
        // Fix: Use window.console and window.alert
        (window as any).console.error("Generation failed", error);
        (window as any).alert("Failed to generate image. Please try again.");
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
            { id: 'generate', icon: Sparkles, label: 'AI Gen' }
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
                // Fix: Cast e.target to any
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
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-2">
                    <p className="text-amber-800 text-sm font-medium flex gap-2">
                        <Sparkles size={16} className="mt-0.5" />
                        AI will create a unique image for you!
                    </p>
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { id: '1:1', icon: Square, label: 'Square' },
                            { id: '4:3', icon: Monitor, label: 'Landscape' },
                            { id: '16:9', icon: Monitor, label: 'Wide' },
                            { id: '3:4', icon: Smartphone, label: 'Portrait' },
                            { id: '9:16', icon: Smartphone, label: 'Tall' },
                        ].map((ratio) => (
                            <button
                                key={ratio.id}
                                onClick={() => setAspectRatio(ratio.id as AspectRatio)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                                    aspectRatio === ratio.id 
                                    ? 'border-violet-600 bg-violet-50 text-violet-700' 
                                    : 'border-gray-200 hover:border-violet-300 text-gray-500'
                                }`}
                                title={ratio.label}
                            >
                                <ratio.icon size={20} className={ratio.id.includes('9') ? 'scale-x-125' : ''} />
                                <span className="text-[10px] font-bold mt-1">{ratio.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Image Prompt</label>
                    {/* Fix: Cast e.target to any */}
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
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-bold disabled:opacity-70 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-violet-200"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Image
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