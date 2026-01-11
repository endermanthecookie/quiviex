import React, { useState, useEffect, useRef } from 'react';
import { Search, Home, PlusCircle, Trophy, Settings, User, Globe, Zap, X, Command } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { id: 'home', label: 'Go to Dashboard', icon: Home, view: 'home', shortcut: 'G D' },
    { id: 'create', label: 'Create New Quiz', icon: PlusCircle, view: 'create', shortcut: 'C N' },
    { id: 'explore', label: 'Explore Community', icon: Globe, view: 'community', shortcut: 'G E' },
    { id: 'leaderboard', label: 'View Leaderboard', icon: Trophy, view: 'leaderboard', shortcut: 'G L' },
    { id: 'history', label: 'My Profile & History', icon: User, view: 'history', shortcut: 'G P' },
    { id: 'settings', label: 'Settings', icon: Settings, view: 'settings', shortcut: 'G S' },
    { id: 'join', label: 'Join Game PIN', icon: Zap, view: 'join_pin', shortcut: 'J G' },
  ];

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          handleSelect(filteredActions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex]);

  const handleSelect = (action: any) => {
    onNavigate(action.view);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 transition-all duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-slate-100 p-4 gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-lg font-medium placeholder:text-slate-300"
          />
          <div className="flex gap-2">
             <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">
                Esc
             </kbd>
             <button onClick={onClose} className="sm:hidden p-1 bg-slate-100 rounded text-slate-500"><X size={16} /></button>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">No results found.</div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</div>
              {filteredActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-100 group ${
                    index === selectedIndex ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <action.icon size={18} className={index === selectedIndex ? 'text-indigo-200' : 'text-slate-400'} />
                    <span className="font-bold">{action.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono opacity-0 transition-opacity ${index === selectedIndex ? 'text-indigo-200 opacity-100' : 'text-slate-400 group-hover:opacity-100'}`}>
                    {action.shortcut}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5">
            <span>Quiviex Omni-Command</span>
            <div className="flex items-center gap-2">
                <span>Select</span> <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200">↵</kbd>
                <span>Navigate</span> <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200">↑↓</kbd>
            </div>
        </div>
      </div>
    </div>
  );
};