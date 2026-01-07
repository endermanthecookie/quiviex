import React, { useState, useRef } from 'react';
import { X, Music, Upload, Play, Pause, Check } from 'lucide-react';
import { DEFAULT_MUSIC_TRACKS } from './constants';

interface MusicSelectionModalProps {
  currentMusic: string;
  onSelect: (musicUrl: string) => void;
  onClose: () => void;
}

export const MusicSelectionModal: React.FC<MusicSelectionModalProps> = ({ currentMusic, onSelect, onClose }) => {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePreview = (url: string) => {
    if (playingPreview === url) {
      (audioRef.current as any)?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        (audioRef.current as any).pause();
      }
      if (url) {
        audioRef.current = new (window as any).Audio(url);
        (audioRef.current as any).volume = 0.5;
        (audioRef.current as any).play().catch((e: any) => (window as any).console.log("Preview error", e));
        (audioRef.current as any).onended = () => setPlayingPreview(null);
        setPlayingPreview(url);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as any).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        (window as any).alert("File is too large! Please upload an MP3 under 2MB.");
        return;
      }

      if (!file.type.startsWith('audio/')) {
         (window as any).alert("Please upload a valid audio file.");
         return;
      }

      const reader = new (window as any).FileReader();
      reader.onload = (e: any) => {
        const result = e.target?.result as string;
        onSelect(result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  React.useEffect(() => {
    return () => {
        if(audioRef.current) (audioRef.current as any).pause();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Music size={20} />
            Background Music
          </div>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-2">Default Tracks</p>
            {DEFAULT_MUSIC_TRACKS.map((track: any) => {
                const isSelected = track.url === currentMusic || (track.id === 'none' && !currentMusic);
                const isPreviewing = playingPreview === track.url;

                return (
                    <div 
                        key={track.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected ? 'border-violet-500 bg-violet-50' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => togglePreview(track.url)}
                                disabled={!track.url}
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    !track.url ? 'bg-slate-200 text-slate-400' : 
                                    isPreviewing ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-violet-200'
                                }`}
                            >
                                {isPreviewing ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <span className={`font-medium ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>
                                {track.label}
                            </span>
                        </div>
                        <button
                            onClick={() => { onSelect(track.url); onClose(); }}
                            className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
                                isSelected ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {isSelected ? 'Selected' : 'Select'}
                        </button>
                    </div>
                );
            })}

            <div className="my-4 border-t border-slate-100 pt-4">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-2">Custom Upload</p>
                 <div 
                    onClick={() => (fileInputRef.current as any)?.click()}
                    className={`border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all ${
                        currentMusic && !DEFAULT_MUSIC_TRACKS.find((t: any) => t.url === currentMusic) ? 'bg-green-50 border-green-300' : ''
                    }`}
                 >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="audio/mp3,audio/mpeg"
                        onChange={handleFileUpload} 
                    />
                    <Upload size={24} className={currentMusic && !DEFAULT_MUSIC_TRACKS.find((t: any) => t.url === currentMusic) ? 'text-green-500' : 'text-slate-400'} />
                    <span className="text-sm font-bold text-slate-600 mt-1">
                        {currentMusic && !DEFAULT_MUSIC_TRACKS.find((t: any) => t.url === currentMusic) 
                            ? 'Custom Track Active (Click to change)' 
                            : 'Upload MP3 (Max 2MB)'
                        }
                    </span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};