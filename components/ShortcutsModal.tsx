import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { keys: ['⌘', 'K'], action: 'Open Command Palette' },
    { keys: ['?'], action: 'Show Shortcuts' },
    { keys: ['Esc'], action: 'Close Modals' },
    { keys: ['Space'], action: 'Flip Flashcard' },
    { keys: ['←', '→'], action: 'Navigate Flashcards' },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Keyboard className="text-indigo-600" size={24} />
            <h3 className="font-black text-slate-900 text-lg">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
              <span className="font-bold text-slate-600 text-sm">{s.action}</span>
              <div className="flex gap-2">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="bg-white border-b-2 border-slate-200 px-2.5 py-1.5 rounded-lg font-mono text-xs font-black text-slate-500 shadow-sm min-w-[30px] text-center">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Power User Tools</p>
        </div>
      </div>
    </div>
  );
};