
import React, { useState } from 'react';
import { X, Image as ImageIcon, Check, Palette, Type, Layout } from 'lucide-react';
import { CustomTheme } from '../types';
import { ImageSelectionModal } from './ImageSelectionModal';

interface ThemeEditorModalProps {
  initialTheme?: CustomTheme;
  onSave: (theme: CustomTheme) => void;
  onClose: () => void;
  onAiUsed: () => void;
}

export const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({ initialTheme, onSave, onClose, onAiUsed }) => {
  const [theme, setTheme] = useState<CustomTheme>(initialTheme || {
    background: '#0f172a',
    text: '#ffffff',
    accent: '#8b5cf6',
    cardColor: '#ffffff',
    cardOpacity: 0.1,
    backgroundImage: ''
  });

  const [showImageModal, setShowImageModal] = useState(false);

  const handleColorChange = (key: keyof CustomTheme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleOpacityChange = (value: number) => {
    setTheme(prev => ({ ...prev, cardOpacity: value }));
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
      {showImageModal && (
        <ImageSelectionModal 
            onSelect={(url) => {
                setTheme(prev => ({ ...prev, backgroundImage: url }));
                setShowImageModal(false);
            }}
            onClose={() => setShowImageModal(false)}
            onAiUsed={onAiUsed}
        />
      )}
      
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden h-[90vh] md:h-auto animate-in fade-in zoom-in duration-200">
        
        {/* Controls Sidebar */}
        <div className="md:w-96 bg-slate-50 border-r border-slate-200 flex flex-col h-full md:h-auto">
            {/* Fixed Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Palette className="text-violet-600" /> Custom Theme
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
                {/* Background */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Background</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Base Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={theme.background}
                                    // Fix: Cast e.target to any to access value property
                                    onChange={(e) => handleColorChange('background', (e.target as any).value)}
                                    className="w-8 h-8 rounded cursor-pointer border-none p-0"
                                />
                                <span className="text-xs font-mono text-slate-600">{theme.background}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowImageModal(true)}
                            className={`p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-1 transition-all ${
                                theme.backgroundImage ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            <ImageIcon size={20} />
                            <span className="text-xs font-bold">{theme.backgroundImage ? 'Change Image' : 'Add Image'}</span>
                        </button>
                    </div>
                    {theme.backgroundImage && (
                        <div className="relative rounded-lg overflow-hidden h-20 border border-slate-200 group">
                            <img src={theme.backgroundImage} alt="Background" className="w-full h-full object-cover" />
                            <button 
                                onClick={() => handleColorChange('backgroundImage', '')}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Colors */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <Type size={14} /> Colors
                    </label>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Text Color</span>
                            <input 
                                type="color" 
                                value={theme.text}
                                // Fix: Cast e.target to any to access value property
                                onChange={(e) => handleColorChange('text', (e.target as any).value)}
                                className="w-8 h-8 rounded cursor-pointer border-none p-0"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Buttons / Accent</span>
                            <input 
                                type="color" 
                                value={theme.accent}
                                // Fix: Cast e.target to any to access value property
                                onChange={(e) => handleColorChange('accent', (e.target as any).value)}
                                className="w-8 h-8 rounded cursor-pointer border-none p-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <Layout size={14} /> Cards
                    </label>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Card Base Color</span>
                            <input 
                                type="color" 
                                value={theme.cardColor}
                                // Fix: Cast e.target to any to access value property
                                onChange={(e) => handleColorChange('cardColor', (e.target as any).value)}
                                className="w-8 h-8 rounded cursor-pointer border-none p-0"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-700">Opacity</span>
                                <span className="text-xs font-mono text-slate-500">{Math.round(theme.cardOpacity * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05"
                                value={theme.cardOpacity}
                                // Fix: Cast e.target to any to access value property
                                onChange={(e) => handleOpacityChange(parseFloat((e.target as any).value))}
                                className="w-full accent-violet-600"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onSave(theme)}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg mt-auto"
                >
                    <Check size={20} /> Apply Theme
                </button>
            </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md z-10">
                Live Preview
            </div>

            <div 
                className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
                style={{
                    backgroundColor: theme.background,
                    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: theme.text
                }}
            >
                {/* Simulated Quiz UI */}
                <div className="w-full max-w-md space-y-6">
                    {/* Header Simulation */}
                    <div 
                        className="p-4 rounded-xl flex items-center justify-between"
                        style={{
                            backgroundColor: hexToRgba(theme.cardColor, Math.max(0.1, theme.cardOpacity - 0.1)),
                            backdropFilter: 'blur(8px)',
                            border: `1px solid ${hexToRgba(theme.text, 0.1)}`
                        }}
                    >
                         <div className="font-bold text-lg">Quiviex</div>
                         <div className="text-sm font-bold opacity-70">5/10</div>
                    </div>

                    {/* Question Card */}
                    <div 
                        className="p-8 rounded-3xl shadow-xl text-center"
                        style={{
                            backgroundColor: hexToRgba(theme.cardColor, theme.cardOpacity),
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${hexToRgba(theme.text, 0.1)}`
                        }}
                    >
                        <h2 className="text-2xl font-black mb-6">What is the capital of France?</h2>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {['London', 'Berlin', 'Paris', 'Madrid'].map((opt, i) => (
                                <div 
                                    key={i}
                                    className="p-4 rounded-xl font-bold text-left transition-transform transform hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: i === 2 ? theme.accent : hexToRgba(theme.cardColor, 0.5),
                                        color: i === 2 ? '#ffffff' : theme.text,
                                        border: `1px solid ${hexToRgba(theme.text, 0.1)}`
                                    }}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
