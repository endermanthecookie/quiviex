import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Trophy, Info, Settings, Trash2, BellOff, X } from 'lucide-react';
import { QXNotification } from '../types';

interface NotificationBellProps {
  notifications: QXNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkRead, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply': return <MessageSquare size={16} className="text-indigo-500" />;
      case 'achievement': return <Trophy size={16} className="text-yellow-500" />;
      case 'system': return <Settings size={16} className="text-slate-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={bellRef}>
      <button 
        onClick={handleToggle}
        className={`p-3 rounded-2xl transition-all click-scale relative ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black tracking-tight">Notifications</h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Recent Activity</p>
            </div>
            <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(window.confirm("Clear all notifications?")) onClearAll();
                    }} 
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors" 
                    title="Clear All"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <button 
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BellOff size={28} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No Notifications</p>
                <p className="text-slate-300 text-[10px] font-bold mt-1 uppercase tracking-widest">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => { onMarkRead(n.id); setIsOpen(false); }}
                    className={`p-5 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 relative ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                  >
                    {!n.isRead && <div className="absolute top-1/2 left-2 w-1.5 h-1.5 bg-indigo-500 rounded-full -translate-y-1/2"></div>}
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center flex-shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-sm font-black text-slate-900 mb-0.5 truncate">{n.title}</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
             <button 
                onClick={handleClose}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
             >
               Dismiss List
             </button>
          </div>
        </div>
      )}
    </div>
  );
};