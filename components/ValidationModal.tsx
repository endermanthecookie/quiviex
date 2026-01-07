
import React from 'react';
import { AlertCircle, LogOut } from 'lucide-react';

interface ValidationModalProps {
  errors: string[];
  onClose: () => void;
  onExitWithoutSaving?: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({ errors, onClose, onExitWithoutSaving }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="flex items-center gap-3 text-red-600 mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Incomplete Quiz</h3>
        </div>
        
        <p className="text-slate-600 mb-4 font-medium leading-relaxed">
            You have some missing information. You can't save the quiz until these items are fixed:
        </p>
        
        <ul className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start gap-3 bg-red-50 p-4 rounded-xl text-sm font-bold text-red-800 border border-red-100">
              <span className="text-red-500 mt-0.5">•</span>
              <span>{error.replace(/^• /, '')}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex flex-col gap-3">
            <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
            I'll Fix It
            </button>
            
            {onExitWithoutSaving && (
                <button
                    onClick={onExitWithoutSaving}
                    className="w-full bg-white border-2 border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    Exit without Saving
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
