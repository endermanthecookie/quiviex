import React, { useState } from 'react';
import { X, MessageSquare, Send, Bug, Lightbulb, HelpCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { User, Feedback } from '../types';

interface FeedbackModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ user, onClose, onSubmit }) => {
  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newFeedback: Feedback = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        type,
        content,
        date: new Date().toISOString(),
        status: 'new'
    };
    
    try {
      await onSubmit(newFeedback);
      setIsSuccess(true);
      // Fix: Access setTimeout via window to resolve "Cannot find name 'setTimeout'" error
      (window as any).setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Fix: Access console and alert via window
      (window as any).console.error("Feedback submission failed:", error);
      (window as any).alert("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-12 animate-in fade-in zoom-in duration-200 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-2">Thank You!</h3>
          <p className="text-slate-500 font-medium">Your feedback has been sent and we'll review it shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-violet-500" />
                Feedback
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'bug' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <Bug size={20} />
                    <span className="font-bold text-xs uppercase">Bug</span>
                </button>
                <button
                    type="button"
                    onClick={() => setType('suggestion')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'suggestion' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <Lightbulb size={20} />
                    <span className="font-bold text-xs uppercase">Idea</span>
                </button>
                <button
                    type="button"
                    onClick={() => setType('other')}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'other' ? 'border-slate-500 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    <HelpCircle size={20} />
                    <span className="font-bold text-xs uppercase">Other</span>
                </button>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Your Message</label>
                <textarea
                    value={content}
                    // Fix: Cast e.target to any to access value property
                    onChange={(e) => setContent((e.target as any).value)}
                    placeholder="Tell us what you think..."
                    className="w-full px-4 py-3 bg-white text-black border-2 border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 min-h-[120px] resize-none"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
        </form>
      </div>
    </div>
  );
};