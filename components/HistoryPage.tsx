
import React, { useState } from 'react';
import { User, QuizResult } from '../types';
import { ArrowLeft, Calendar, History, Trophy, Clock, X, Info } from 'lucide-react';

interface HistoryPageProps {
  user: User;
  onBack: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user, onBack }) => {
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  
  // Sort history by date descending
  const history = [...(user.history || [])].reverse();

  if (selectedResult) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col view-transition">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm animate-in slide-in-from-top duration-300">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors click-scale">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800">Result Details</h1>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-500">
                    <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 opacity-90"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2 tracking-tight">{selectedResult.quizTitle}</h2>
                            <p className="opacity-80 font-bold uppercase text-[10px] tracking-widest">Logged on {new Date(selectedResult.date).toLocaleDateString()}</p>
                            
                            <div className="mt-8 flex justify-center gap-12">
                                <div className="text-center group">
                                    <div className="text-5xl font-black group-hover:scale-110 transition-transform">{Math.round((selectedResult.score / selectedResult.totalQuestions) * 100)}%</div>
                                    <div className="text-xs uppercase tracking-widest opacity-70 font-bold mt-2">Accuracy</div>
                                </div>
                                <div className="text-center group">
                                    <div className="text-5xl font-black group-hover:scale-110 transition-transform">{selectedResult.score}/{selectedResult.totalQuestions}</div>
                                    <div className="text-xs uppercase tracking-widest opacity-70 font-bold mt-2">Core Units</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-slate-400" />
                            Performance Audit
                        </h3>
                        <div className="bg-yellow-50 text-yellow-800 p-6 rounded-2xl text-sm mb-8 border border-yellow-100 font-medium leading-relaxed">
                            Complete session telemetry is archived. Your core synchronization for this module reached terminal state with high fidelity.
                        </div>
                        
                         <button 
                            onClick={() => setSelectedResult(null)}
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all click-scale shadow-lg"
                        >
                            Close Archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-5 shadow-sm animate-in slide-in-from-top duration-500">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors click-scale">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <History className="text-blue-500" size={28} />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Transmission History</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-32 text-slate-400 animate-in zoom-in duration-700">
            <History size={64} className="mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-black mb-2 uppercase tracking-widest">No Logged Data</h3>
            <p className="font-medium">Complete modules to populate your history.</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-in">
            {history.map((result) => {
               const percent = Math.round((result.score / result.totalQuestions) * 100);
               const isPerfect = percent === 100;
               const date = new Date(result.date).toLocaleDateString(undefined, {
                   weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
               });
               const time = new Date(result.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

               return (
                <button 
                    key={result.id} 
                    onClick={() => setSelectedResult(result)}
                    className="w-full text-left bg-white rounded-[1.8rem] p-6 border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:shadow-xl hover:border-blue-400 hover-lift group"
                >
                    <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl text-white shadow-lg transition-all group-hover:scale-110 group-hover:rotate-6 ${
                        isPerfect ? 'bg-yellow-400 shadow-yellow-100' : percent >= 70 ? 'bg-green-500 shadow-green-100' : percent >= 40 ? 'bg-orange-400 shadow-orange-100' : 'bg-red-400 shadow-red-100'
                    }`}>
                        {percent}%
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xl text-slate-800 mb-1.5 truncate tracking-tight group-hover:text-blue-600 transition-colors">{result.quizTitle}</h3>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span className="flex items-center gap-1">
                                <Trophy size={14} className="text-yellow-500" /> {result.score}/{result.totalQuestions}
                             </span>
                             <span className="flex items-center gap-1">
                                <Calendar size={14} /> {date}
                             </span>
                             <span className="flex items-center gap-1">
                                <Clock size={14} /> {time}
                             </span>
                        </div>
                    </div>
                    <div className="text-slate-200 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1">
                        <ArrowLeft size={24} className="rotate-180" />
                    </div>
                </button>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
