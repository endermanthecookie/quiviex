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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800">Result Details</h1>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-600 opacity-90"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2">{selectedResult.quizTitle}</h2>
                            <p className="opacity-80 font-medium">Played on {new Date(selectedResult.date).toLocaleDateString()} at {new Date(selectedResult.date).toLocaleTimeString()}</p>
                            
                            <div className="mt-8 flex justify-center gap-8">
                                <div className="text-center">
                                    <div className="text-5xl font-black">{Math.round((selectedResult.score / selectedResult.totalQuestions) * 100)}%</div>
                                    <div className="text-xs uppercase tracking-widest opacity-70 font-bold mt-1">Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-black">{selectedResult.score}/{selectedResult.totalQuestions}</div>
                                    <div className="text-xs uppercase tracking-widest opacity-70 font-bold mt-1">Correct</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-slate-400" />
                            Quiz Performance
                        </h3>
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm mb-6">
                            Note: Detailed question history is not currently stored to save space. Only score data is preserved.
                        </div>
                        
                         <button 
                            onClick={() => setSelectedResult(null)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-colors"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <History className="text-blue-500" size={28} />
            <h1 className="text-2xl font-black text-slate-800">History</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <History size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No history yet</h3>
            <p>Play some quizzes to see your results here!</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                    className="w-full text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:border-blue-300 group"
                >
                    <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl text-white shadow-lg transition-transform group-hover:scale-110 ${
                        isPerfect ? 'bg-yellow-400' : percent >= 70 ? 'bg-green-500' : percent >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}>
                        {percent}%
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">{result.quizTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                             <span className="flex items-center gap-1">
                                <Trophy size={14} /> {result.score} / {result.totalQuestions} Correct
                             </span>
                             <span className="flex items-center gap-1">
                                <Calendar size={14} /> {date}
                             </span>
                             <span className="flex items-center gap-1">
                                <Clock size={14} /> {time}
                             </span>
                        </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-blue-500">
                        <ArrowLeft size={20} className="rotate-180" />
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