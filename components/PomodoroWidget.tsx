
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, ChevronDown, CheckCircle2, Plus, Minus, Music, Volume2, Upload, X } from 'lucide-react';
import { sfx } from '../services/soundService';
import { DEFAULT_MUSIC_TRACKS } from '../constants';

interface PomodoroWidgetProps {
    stopAudio?: boolean;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({ stopAudio }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'music'>('timer');
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [duration, setDuration] = useState(25 * 60); 
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [task, setTask] = useState('');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // Audio State
  const [currentTrack, setCurrentTrack] = useState<string>('');
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Input State
  const [manualHours, setManualHours] = useState('00');
  const [manualMinutes, setManualMinutes] = useState('25');
  const [manualSeconds, setManualSeconds] = useState('00');

  // Constants for Circular Progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (timeLeft / duration) * circumference;

  useEffect(() => {
      // Auto-stop music if prop changes (e.g. entering quiz)
      if (stopAudio && audioRef.current) {
          audioRef.current.pause();
          setIsPlayingMusic(false);
      }
      // Added: Cleanup to stop audio on unmount to prevent leaks and music playing during quizzes
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
          }
      };
  }, [stopAudio]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      sfx.play('complete');
      if (mode === 'focus') setSessionsCompleted(prev => prev + 1);
      
      // Auto-switch suggestion
      if (mode === 'focus') {
          setMode('break');
          setDuration(5 * 60);
          setTimeLeft(5 * 60);
          updateManualInputs(5 * 60);
      } else {
          setMode('focus');
          setDuration(25 * 60);
          setTimeLeft(25 * 60);
          updateManualInputs(25 * 60);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
      sfx.play('click');
      setIsActive(!isActive);
  };

  const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(duration);
      updateManualInputs(duration);
  };

  const updateManualInputs = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setManualHours(h.toString().padStart(2, '0'));
      setManualMinutes(m.toString().padStart(2, '0'));
      setManualSeconds(s.toString().padStart(2, '0'));
  };

  const handleManualTimeChange = () => {
      const h = parseInt(manualHours) || 0;
      const m = parseInt(manualMinutes) || 0;
      const s = parseInt(manualSeconds) || 0;
      const totalSec = (h * 3600) + (m * 60) + s;
      if (totalSec > 0) {
          setDuration(totalSec);
          setTimeLeft(totalSec);
          setIsActive(false);
      }
  };

  const adjustTime = (minutes: number) => {
      const newDuration = Math.max(60, duration + (minutes * 60));
      setDuration(newDuration);
      if (!isActive) {
          setTimeLeft(newDuration);
      } else {
          setTimeLeft(prev => Math.max(0, prev + (minutes * 60)));
      }
      updateManualInputs(newDuration);
  };

  const setPreset = (mins: number) => {
      setIsActive(false);
      const secs = mins * 60;
      setDuration(secs);
      setTimeLeft(secs);
      updateManualInputs(secs);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Music Logic
  const handleTrackSelect = (url: string) => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = url;
          if (url) {
              audioRef.current.play();
              setIsPlayingMusic(true);
          } else {
              setIsPlayingMusic(false);
          }
      } else {
          // Initialize audio if not present
          const audio = new Audio(url);
          audio.loop = true;
          audio.volume = 0.5;
          audioRef.current = audio;
          audio.play();
          setIsPlayingMusic(true);
      }
      setCurrentTrack(url);
  };

  const toggleMusic = () => {
      if (!audioRef.current || !currentTrack) return;
      if (isPlayingMusic) {
          audioRef.current.pause();
      } else {
          audioRef.current.play();
      }
      setIsPlayingMusic(!isPlayingMusic);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          handleTrackSelect(url);
      }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[80] transition-all duration-300 ease-in-out font-['Plus_Jakarta_Sans'] ${isExpanded ? 'w-80' : 'w-auto'}`}>
        <div 
            className={`bg-slate-900 text-white rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden transition-all relative ${isExpanded ? 'p-6' : 'p-3 cursor-pointer hover:scale-105 active:scale-95'}`} 
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            
            {/* Minimized View */}
            {!isExpanded && (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${isActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-800'}`}>
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path 
                                className={isActive ? "text-white" : "text-slate-500"} 
                                strokeDasharray={`${(timeLeft / duration) * 100}, 100`} 
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                            />
                        </svg>
                        <Timer size={16} className={isActive ? 'text-white relative z-10' : 'text-slate-400 relative z-10'} />
                    </div>
                    {isActive && <span className="font-mono font-bold text-sm pr-2 tabular-nums">{formatTime(timeLeft)}</span>}
                </div>
            )}

            {/* Expanded View */}
            {isExpanded && (
                <div className="animate-in zoom-in duration-200 flex flex-col items-center">
                    
                    {/* Header Controls */}
                    <div className="flex justify-between items-center w-full mb-6">
                        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                            <button 
                                onClick={() => setActiveTab('timer')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'timer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Timer
                            </button>
                            <button 
                                onClick={() => setActiveTab('music')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'music' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Music
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronDown size={18} />
                        </button>
                    </div>

                    {activeTab === 'timer' ? (
                        <>
                            {/* Circular Timer */}
                            <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90 transform drop-shadow-2xl">
                                    <circle cx="50%" cy="50%" r={radius} fill="transparent" stroke="#1e293b" strokeWidth="6" />
                                    <circle
                                        cx="50%" cy="50%" r={radius}
                                        fill="transparent"
                                        stroke={mode === 'focus' ? '#6366f1' : '#10b981'}
                                        strokeWidth="6"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={progressOffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <button onClick={() => adjustTime(-1)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"><Minus size={16} /></button>
                                        <div className="flex flex-col items-center">
                                            <div className="text-4xl font-mono font-black tracking-tighter tabular-nums text-white">
                                                {formatTime(timeLeft)}
                                            </div>
                                            {/* Manual Input Trigger */}
                                            <div className="flex gap-1 mt-1">
                                                <input type="text" value={manualHours} onChange={(e) => setManualHours(e.target.value)} onBlur={handleManualTimeChange} className="w-6 bg-transparent text-center text-[10px] text-slate-500 focus:text-white focus:outline-none border-b border-transparent focus:border-indigo-500" maxLength={2} />
                                                <span className="text-[10px] text-slate-500">:</span>
                                                <input type="text" value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} onBlur={handleManualTimeChange} className="w-6 bg-transparent text-center text-[10px] text-slate-500 focus:text-white focus:outline-none border-b border-transparent focus:border-indigo-500" maxLength={2} />
                                                <span className="text-[10px] text-slate-500">:</span>
                                                <input type="text" value={manualSeconds} onChange={(e) => setManualSeconds(e.target.value)} onBlur={handleManualTimeChange} className="w-6 bg-transparent text-center text-[10px] text-slate-500 focus:text-white focus:outline-none border-b border-transparent focus:border-indigo-500" maxLength={2} />
                                            </div>
                                        </div>
                                        <button onClick={() => adjustTime(1)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors"><Plus size={16} /></button>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {isActive ? (mode === 'focus' ? 'Focusing...' : 'Resting...') : 'Paused'}
                                    </div>
                                </div>
                            </div>

                            {/* Task Input */}
                            <div className="w-full mb-6 relative">
                                <input 
                                    type="text" 
                                    placeholder="What are you working on?" 
                                    value={task}
                                    onChange={(e) => setTask(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-center text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all"
                                />
                                {task && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none animate-in zoom-in">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Main Controls */}
                            <div className="flex items-center gap-4 mb-6 w-full justify-center">
                                <button 
                                    onClick={toggleTimer}
                                    className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all active:scale-95 ${isActive ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white hover:bg-indigo-50 text-indigo-600'}`}
                                >
                                    {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                                <button 
                                    onClick={resetTimer}
                                    className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-slate-700"
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </div>

                            {/* Presets */}
                            <div className="grid grid-cols-4 gap-2 w-full border-t border-slate-800 pt-4">
                                {[15, 25, 45, 60].map(mins => (
                                    <button 
                                        key={mins} 
                                        onClick={() => setPreset(mins)}
                                        className={`py-2 rounded-lg text-xs font-black transition-all ${duration === mins * 60 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center">
                                <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isPlayingMusic ? 'bg-indigo-600 animate-pulse' : 'bg-slate-700'}`}>
                                    <Music size={24} className="text-white" />
                                </div>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Background Ambience</p>
                                
                                {currentTrack && (
                                    <div className="flex justify-center gap-4 mb-2">
                                        <button onClick={toggleMusic} className="bg-white text-slate-900 rounded-full p-3 hover:scale-110 transition-transform">
                                            {isPlayingMusic ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {DEFAULT_MUSIC_TRACKS.filter(t => t.id !== 'none').map(track => (
                                    <button
                                        key={track.id}
                                        onClick={() => handleTrackSelect(track.url)}
                                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${currentTrack === track.url ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        <span className="text-xs font-bold">{track.label}</span>
                                        {currentTrack === track.url && isPlayingMusic && <Volume2 size={14} className="animate-pulse" />}
                                    </button>
                                ))}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full text-left p-3 rounded-xl flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all"
                                >
                                    <Upload size={14} />
                                    <span className="text-xs font-bold">Upload MP3</span>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="audio/mp3" onChange={handleFileUpload} />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'timer' && sessionsCompleted > 0 && (
                        <div className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {sessionsCompleted} Session{sessionsCompleted !== 1 ? 's' : ''} Completed
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
