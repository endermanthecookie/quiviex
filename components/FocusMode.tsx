import React, { useState, useEffect } from 'react';
import { User, Quiz, Question } from '../types';
import { generateFocusSession } from '../services/genAI';
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

  // Helper to find wrong answers from history
  const getWeakSpots = () => {
    const mistakes: any[] = [];
    const topics: Set<string> = new Set();
    
    // Look at last 20 quiz attempts to keep it recent
    const recentHistory = [...user.history].reverse().slice(0, 20);

    recentHistory.forEach(result => {
        const quiz = quizzes.find(q => q.id === result.quizId);
        if (!quiz) return;
        
        topics.add(quiz.title);

        result.answers.forEach((userAns, idx) => {
            const question = quiz.questions[idx];
            if (!question) return;

            let isCorrect = false;
            // Logic matching QuizTaker
            if (question.type === 'text-input') {
                isCorrect = typeof userAns === 'string' && 
                           typeof question.correctAnswer === 'string' &&
                           userAns.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
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
    
    // Allow generation if they have ANY history, even if no mistakes
    if (user.history.length === 0) {
        setError("Play at least one quiz first so AI can analyze your performance!");
        return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
        const result = await generateFocusSession({ 
            mistakes, 
            recentTopics: topics 
        }, user.preferences);
        
        // Transform AI questions to ensure they match app structure
        const validQuestions: Question[] = result.questions.map((q: any) => ({
            question: q.question,
            image: '',
            type: 'multiple-choice', // Focus mode defaults to MC for simplicity
            options: q.options.slice(0, 4),
            correctAnswer: q.correctAnswer,
            timeLimit: q.timeLimit || 30,
            explanation: q.explanation
        }));

        setAnalysisResult({
            analysis: result.analysis,
            questions: validQuestions
        });
    } catch (err) {
        (window as any).console.error(err);
        setError("Failed to generate focus session. Please check your API settings and try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const startFocusQuiz = () => {
      if (!analysisResult) return;

      const focusQuiz: Quiz = {
          id: Date.now(),
          userId: user.id,
          title: wrongAnswerCount > 0 ? "⚡ Focus Session: Weak Spots" : "🔥 Challenge Session: Advanced",
          questions: analysisResult.questions,
          createdAt: new Date().toISOString(),
          theme: wrongAnswerCount > 0 ? 'nature' : 'cyberpunk', 
          shuffleQuestions: false
      };

      onStartQuiz(focusQuiz);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500 p-2 rounded-xl">
                <Brain size={24} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-bold">Focus Mode</h1>
                <p className="text-xs text-indigo-300 uppercase font-black tracking-widest">Powered by LLM Core</p>
             </div>
          </div>
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
        
        {!analysisResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse"></div>
                    <Target size={80} className="text-indigo-400 relative z-10" />
                    {wrongAnswerCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-900">
                            {wrongAnswerCount} Issues
                        </div>
                    )}
                     {wrongAnswerCount === 0 && user.history.length > 0 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-slate-900">
                            Perfect!
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-black mb-4">
                    {wrongAnswerCount > 0 ? "Target Your Weaknesses" : "Level Up Your Knowledge"}
                </h2>
                <p className="text-slate-400 text-lg max-w-lg mb-8 leading-relaxed">
                    {wrongAnswerCount > 0 
                        ? "AI will analyze your recent quiz history, identify gaps in your knowledge, and create a custom drilling session."
                        : "You're crushing it! Let AI generate a tougher Challenge Session based on your recent topics."}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 flex items-center gap-3 max-w-md">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <button
                    onClick={handleGenerateFocus}
                    disabled={isAnalyzing || user.history.length === 0}
                    className="group relative bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-5 px-10 rounded-2xl text-xl transition-all shadow-xl hover:shadow-indigo-500/30 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Processing Analytics...
                            </>
                        ) : (
                            <>
                                <Sparkles className="text-indigo-200" />
                                {wrongAnswerCount > 0 ? "Fix My Mistakes" : "Challenge Me"}
                            </>
                        )}
                    </div>
                </button>
                
                {user.history.length === 0 && (
                    <p className="mt-4 text-slate-500 text-sm">
                        (Play at least 1 quiz first!)
                    </p>
                )}
            </div>
        ) : (
            <div className="animate-in fade-in zoom-in duration-300 space-y-6">
                
                {/* Analysis Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-800 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Brain size={120} />
                    </div>
                    
                    <h3 className="text-indigo-300 font-bold uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
                        <Sparkles size={16} /> Insight Analysis
                    </h3>
                    <p className="text-xl text-white leading-relaxed font-medium relative z-10">
                        "{analysisResult.analysis}"
                    </p>
                </div>

                {/* Ready Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to Practice?</h3>
                        <p className="text-slate-400">
                            We've generated <span className="text-white font-bold">5 questions</span> custom tailored for you.
                        </p>
                    </div>
                    <button 
                        onClick={startFocusQuiz}
                        className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-green-500/20 whitespace-nowrap"
                    >
                        <Play size={20} className="fill-current" />
                        Start Session
                    </button>
                </div>

                <div className="text-center pt-8">
                    <button 
                        onClick={() => setAnalysisResult(null)}
                        className="text-slate-500 hover:text-slate-300 font-medium transition-colors"
                    >
                        Start Over
                    </button>
                </div>

            </div>
        )}
      </div>
    </div>
  );
};