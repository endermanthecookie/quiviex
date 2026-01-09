
import React from 'react';
import { Users, User, X, Zap } from 'lucide-react';
import { Quiz } from '../types';

interface PlaySelectionModalProps {
  quiz: Quiz;
  onSolo: (quiz: Quiz) => void;
  onMultiplayer: (quiz: Quiz) => void;
  onClose: () => void;
}

export const PlaySelectionModal: React.FC<PlaySelectionModalProps> = ({ quiz, onSolo, onMultiplayer, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-500 border border-white/20">
        <div className="bg-[#1a1f2e] p-10 text-center relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
            <Zap size={36} className="text-yellow-400" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">Initialize Session</h3>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Module: {quiz.title}</p>
        </div>

        <div className="p-10 space-y-6">
          <p className="text-center text-slate-600 font-bold text-lg mb-4">
            Do you want to play with other people?
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => onMultiplayer(quiz)}
              className="group flex items-center gap-6 p-6 bg-indigo-50 hover:bg-indigo-600 border-2 border-indigo-100 hover:border-indigo-400 rounded-[2.5rem] transition-all text-left click-scale"
            >
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                <Users size={28} />
              </div>
              <div>
                <div className="font-black text-indigo-900 text-xl group-hover:text-white transition-colors">Yes, Multiplayer</div>
                <div className="text-indigo-600/70 text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-200 transition-colors">Host a live session</div>
              </div>
            </button>

            <button 
              onClick={() => onSolo(quiz)}
              className="group flex items-center gap-6 p-6 bg-slate-50 hover:bg-slate-900 border-2 border-slate-100 hover:border-slate-700 rounded-[2.5rem] transition-all text-left click-scale"
            >
              <div className="w-16 h-16 bg-slate-300 text-slate-600 rounded-2xl flex items-center justify-center shadow-md group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <User size={28} />
              </div>
              <div>
                <div className="font-black text-slate-800 text-xl group-hover:text-white transition-colors">No, Solo Sync</div>
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest group-hover:text-slate-500 transition-colors">Single player mode</div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Cancel Request</button>
        </div>
      </div>
    </div>
  );
};
