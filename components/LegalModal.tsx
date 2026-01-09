
import React from 'react';
// Added missing Sparkles import
import { X, Shield, Book, Gavel, Lock, Eye, ShieldCheck, Database, Trash2, Heart, ShieldAlert, Sparkles } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'guidelines' | 'privacy';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="bg-[#1a1f2e] p-8 flex justify-between items-center rounded-t-[3rem] border-b border-white/5">
          <div className="flex items-center gap-4 text-white">
             {type === 'terms' ? <Gavel className="text-yellow-400" /> : type === 'privacy' ? <Lock className="text-indigo-400" /> : <Shield className="text-green-400" />}
             <h2 className="text-3xl font-black text-white tracking-tight">
                {type === 'terms' ? 'Terms & Conditions' : type === 'privacy' ? 'Privacy Policy' : 'Community Guidelines'}
             </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-10 overflow-y-auto custom-scrollbar leading-relaxed text-slate-700">
            {type === 'privacy' ? (
                <div className="space-y-8">
                    <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                        <p className="font-bold text-indigo-900 italic">"Quiviex respects your privacy. Here’s what you need to know:"</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Database size={20} className="text-indigo-600" /> Data We Collect
                        </h3>
                        <ul className="space-y-3 pl-2">
                            <li className="flex gap-3"><span className="text-indigo-600 font-bold">→</span> <div><strong>Nickname / Username:</strong> Used to show your quizzes and scores</div></li>
                            <li className="flex gap-3"><span className="text-indigo-600 font-bold">→</span> <div><strong>Email:</strong> Only for users 13+ (optional for account recovery)</div></li>
                            <li className="flex gap-3"><span className="text-indigo-600 font-bold">→</span> <div><strong>Birthday / Age:</strong> Used to check if you are 13+</div></li>
                            <li className="flex gap-3"><span className="text-indigo-600 font-bold">→</span> <div><strong>Profile picture:</strong> Optional, visible in your profile</div></li>
                            <li className="flex gap-3"><span className="text-indigo-600 font-bold">→</span> <div><strong>Quizzes & Scores:</strong> Stored in your user profile in the database</div></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Eye size={20} className="text-indigo-600" /> Who Can See Your Data
                        </h3>
                        <ul className="space-y-3 pl-2">
                            <li className="flex gap-2"><div>• Other users can see your nickname, optional profile picture, and quizzes if you choose to share them in the Community Tab.</div></li>
                            <li className="flex gap-2"><div>• Private quizzes are only accessible via link.</div></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <ShieldAlert size={20} className="text-rose-600" /> We Do Not Collect
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-500">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Full name</div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Address</div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Phone number</div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Personal info for users &lt; 13</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                             <h4 className="font-black text-emerald-900 uppercase text-xs mb-2 flex items-center gap-2"><Sparkles size={14}/> Ads</h4>
                             <p className="text-sm font-bold text-emerald-800">No ads are used in this version of the app.</p>
                        </div>
                        <div className="bg-indigo-900 p-6 rounded-[2rem] text-white">
                             <h4 className="font-black text-indigo-300 uppercase text-xs mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Safety</h4>
                             <p className="text-sm font-bold">All user data is stored safely and securely. Users under 13 do not provide email.</p>
                        </div>
                    </div>
                </div>
            ) : type === 'terms' ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Infrastructure Usage</h3>
                        <p>Welcome to Quiviex. By initializing an account on our infrastructure, you agree to these Master Terms of Service.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">2. Strike Policy</h3>
                        <p className="font-black text-red-600 uppercase tracking-tighter">Warning Policy: Quiviex operates on a 3-strike system. Upon detection of prohibited content, a warning is issued. The 3rd warning results in permanent account termination.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-800 font-bold mb-4">
                        <Book className="inline-block mr-2 mb-1" size={16} />
                        Community Content Standard
                    </div>
                    <p><strong>1. Be Respectful:</strong> Do not create content that promotes hate speech or violence.</p>
                    <p><strong>2. Safe for Work:</strong> Quiviex is a platform for all ages. Explicit content is strictly prohibited.</p>
                </div>
            )}
        </div>
        
        <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[3rem] flex justify-end">
            <button 
                onClick={onClose}
                className="bg-[#1a1f2e] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-colors shadow-lg"
            >
                Acknowledged
            </button>
        </div>
      </div>
    </div>
  );
};
