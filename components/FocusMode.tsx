
import React, { useState, useEffect } from 'react';
import { User, Quiz, Question } from '../types';
import { generateFocusSession } from '../services/aiService';
import { Brain, ArrowLeft, Target, Sparkles, Loader2, AlertCircle, Play, CheckCircle } from 'lucide-react';

interface FocusModeProps {
  user: User;
  quizzes: Quiz[];
  onBack: () => void;
  onStartQuiz: (quiz: Quiz) => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ user, quizzes, onBack, onStartQuiz }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{analysis: string, questions: Question[]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);

  const getWeakSpots = () => {
    const mistakes: any[] = [];
    const topics: Set<string> = new Set();
    const recentHistory = [...user.history].reverse().slice(0, 20);

    recentHistory.forEach(result => {
        const quiz = quizzes.find(q => q.id === result.quizId);
        if (!quiz) return;
        topics.add(quiz.title);
        result.answers.forEach((userAns, idx) => {
            const question = quiz.questions[idx];
            if (!question) return;
            let isCorrect = false;
            if (question.type === 'text-input') {
                isCorrect = typeof userAns === 'string' && typeof question.correctAnswer === 'string' && userAns.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
            } else if (question.type === 'ordering') {
                isCorrect = Array.isArray(userAns) && userAns.every((val, i) => val === i);
            } else {
                isCorrect = userAns === question.correctAnswer;
            }
            if (!isCorrect) {
                mistakes.push({
                    topic: quiz.title,
                    question: question.question,
                    theirWrongAnswer: typeof userAns === 'object' ? 'Incorrect Order' : userAns,
                    correctAnswer: question.correctAnswer
                });
            }
        });
    });
    return { mistakes, topics: Array.from(topics) };
  };

  useEffect(() => {
    const { mistakes } = getWeakSpots();
    setWrongAnswerCount(mistakes.length);
  }, [user.history, quizzes]);

  const handleGenerateFocus = async () => {
    const { mistakes, topics } = getWeakSpots();
    if (user.history.length === 0) {
        setError("Play at least one quiz first!");
        return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
        const result = await generateFocusSession({ mistakes, recentTopics: topics }, user.preferences);
        const validQuestions: Question[] = result.questions.map((q: any) => ({
            question: q.question,
            image: '',
            type: 'multiple-choice',
            options: q.options.slice(0, 4),
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit || 30,
            explanation: q.explanation
        }));
        setAnalysisResult({ analysis: result.analysis, questions: validQuestions });
    } catch (err) {
        setError("Failed to generate focus session.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const startFocusQuiz = () => {
      if (!analysisResult) return;
      const focusQuiz: Quiz = {
          id: Date.now(),
          userId: user.id,
          title: wrongAnswerCount > 0 ? "Drill: Weak Spots" : "Challenge Session",
          questions: analysisResult.questions,
          createdAt: new Date().toISOString(),
          theme: wrongAnswerCount > 0 ? 'nature' : 'cyberpunk', 
          shuffleQuestions: false
      };
      onStartQuiz(focusQuiz);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 p-5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500 p-2 rounded-xl"><Brain size={24} className="text-white" /></div>
             <h1 className="text-2xl font-black tracking-tight">Focus</h1>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"><ArrowLeft size={24} /></button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        {!analysisResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-12 group">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <Target size={100} className="text-indigo-400 relative z-10" />
                    {wrongAnswerCount > 0 && (
                        <div className="absolute -top-4 -right-4 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full border-2 border-slate-900 shadow-xl animate-in zoom-in">
                            {wrongAnswerCount} Issues Detected
                        </div>
                    )}
                </div>

                <h2 className="text-4xl font-black mb-4 tracking-tight">
                    {wrongAnswerCount > 0 ? "Target Your Weaknesses" : "Enhance Your Profile"}
                </h2>
                <h3 className="text-xl font-bold mb-4 tracking-tight text-slate-300">Target Weaknesses</h3>
                <p className="text-slate-400 text-lg max-w-lg mb-12 leading-relaxed">
                    {wrongAnswerCount > 0 
                        ? "AI has identified gaps in your performance. Establish a synchronization session to fix your mistakes."
                        : "Your core fidelity is high. Start a Challenge Session to push your limits."}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 max-w-md"><AlertCircle size={20} /><span className="text-sm font-medium">{error}</span></div>
                )}

                <button onClick={handleGenerateFocus} disabled={isAnalyzing || user.history.length === 0} className="group relative bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black py-6 px-12 rounded-[2rem] text-xl transition-all shadow-2xl hover:shadow-indigo-500/30 overflow-hidden click-scale">
                    <div className="flex items-center gap-3 relative z-10 uppercase tracking-widest text-sm">
                        {isAnalyzing ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} className="text-indigo-200" /> {wrongAnswerCount > 0 ? "Fix My Mistakes" : "Challenge Me"}</>}
                    </div>
                </button>
            </div>
        ) : (
            <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-800 border border-indigo-500/30 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Brain size={160} /></div>
                    <h3 className="text-indigo-300 font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2"><Sparkles size={14} /> Intelligence Insight</h3>
                    <p className="text-2xl text-white leading-relaxed font-bold relative z-10 italic">"{analysisResult.analysis}"</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col sm:row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Ready to Synchronize?</h3>
                        <p className="text-slate-400 font-medium">We've compiled 5 specialized modules to address your profile gaps.</p>
                    </div>
                    <button onClick={startFocusQuiz} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-xl click-scale uppercase tracking-widest text-xs"><Play size={20} fill="currentColor" /> Start Session</button>
                </div>
                <div className="text-center pt-8"><button onClick={() => setAnalysisResult(null)} className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">Start Over</button></div>
            </div>
        )}
      </div>
    </div>
  );
};
