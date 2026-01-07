import React, { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ title, message, isVisible, onClose }) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    if (isVisible) {
      // Fix: Use window.setTimeout
      const timer = (window as any).setTimeout(() => {
        onClose();
      }, 5000); // Auto hide after 5 seconds
      // Fix: Use window.clearTimeout
      return () => (window as any).clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 max-w-sm w-full pointer-events-auto transform transition-all duration-500 ease-out animate-in slide-in-from-top-10 flex items-center gap-4">
        <div className="bg-yellow-100 p-3 rounded-full flex-shrink-0">
          <Trophy className="text-yellow-600" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">Achievement Unlocked!</h4>
          <p className="font-bold text-slate-600 text-base">{title}</p>
          <p className="text-slate-400 text-xs truncate">{message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};