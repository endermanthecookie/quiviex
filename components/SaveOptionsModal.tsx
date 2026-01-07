
import React from 'react';
import { Globe, Lock, Link, X, CheckCircle2 } from 'lucide-react';
import { QuizVisibility } from '../types';

interface SaveOptionsModalProps {
  onConfirm: (visibility: QuizVisibility) => void;
  onCancel: () => void;
}

export const SaveOptionsModal: React.FC<SaveOptionsModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
        
        <div className="bg-slate-900 p-8 text-white relative">
            <button onClick={onCancel} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
            </button>
            <h3 className="text-3xl font-black mb-2 tracking-tight">Quiz Visibility</h3>
            <p className="text-slate-400 font-medium">Choose how others can find and play your quiz.</p>
        </div>

        <div className="p-8 space-y-4">
            <button
                onClick={() => onConfirm('public')}
                className="w-full bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 p-5 rounded-3xl flex items-center gap-5 group transition-all text-left relative overflow-hidden"
            >
                <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <Globe size={28} />
                </div>
                <div>
                    <div className="font-black text-indigo-900 text-lg">Public</div>
                    <div className="text-indigo-600/70 text-xs font-bold uppercase tracking-wider">Gallery + Direct Link</div>
                    <p className="text-indigo-900/60 text-sm mt-1">Visible to everyone in the community gallery.</p>
                </div>
            </button>

            <button
                onClick={() => onConfirm('unlisted')}
                className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 p-5 rounded-3xl flex items-center gap-5 group transition-all text-left relative overflow-hidden"
            >
                <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <Link size={28} />
                </div>
                <div>
                    <div className="font-black text-blue-900 text-lg">Unlisted</div>
                    <div className="text-blue-600/70 text-xs font-bold uppercase tracking-wider">Direct Link Only</div>
                    <p className="text-blue-900/60 text-sm mt-1">Hidden from gallery. Only people with the link can play.</p>
                </div>
            </button>

            <button
                onClick={() => onConfirm('private')}
                className="w-full bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 p-5 rounded-3xl flex items-center gap-5 group transition-all text-left relative overflow-hidden"
            >
                <div className="bg-slate-600 text-white p-3.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <Lock size={28} />
                </div>
                <div>
                    <div className="font-black text-slate-900 text-lg">Private</div>
                    <div className="text-slate-600/70 text-xs font-bold uppercase tracking-wider">Only You</div>
                    <p className="text-slate-900/60 text-sm mt-1">Only you can see and play this quiz from your dashboard.</p>
                </div>
            </button>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel and continue editing</button>
        </div>
      </div>
    </div>
  );
};
