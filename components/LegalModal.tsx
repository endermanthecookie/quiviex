import React from 'react';
import { X, Shield, Book, Gavel, Lock, Eye, ShieldCheck, Database, Trash2 } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'guidelines' | 'privacy';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 flex justify-between items-center rounded-t-3xl border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
             {type === 'terms' ? <Gavel className="text-yellow-400" /> : type === 'privacy' ? <Lock className="text-indigo-400" /> : <Shield className="text-green-400" />}
             <h2 className="text-2xl font-black text-white">
                {type === 'terms' ? 'Terms & Conditions' : type === 'privacy' ? 'Privacy Policy' : 'Community Guidelines'}
             </h2>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar leading-relaxed text-slate-700 text-sm">
            {type === 'terms' ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Infrastructure Usage</h3>
                        <p>Welcome to Quiviex. By initializing an account on our infrastructure, you agree to these Master Terms of Service. This platform is provided as-is, utilizing third-party LLM inference from OpenAI and GitHub.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">2. Prohibited Content & Automated Moderation</h3>
                        <p>Quiviex implements strict automated content moderation. You are prohibited from generating content related to violence, hate speech, explicit materials, or illegal acts. Our system scans all quiz data for prohibited keywords.</p>
                        <p className="mt-2 font-black text-red-600 uppercase tracking-tighter">Warning Policy: Quiviex operates on a 3-strike system. Upon detection of prohibited content, a warning is issued. The 3rd warning results in permanent account termination and email blacklisting.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">3. Intellectual Property License</h3>
                        <p>By publishing a quiz to the Quiviex Community Library, you grant us a worldwide, perpetual, irrevocable license to host, display, and analyze your content for the purpose of improving our AI models and educational dataset.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">4. AI Liability Disclaimer</h3>
                        <p>Quiviex uses experimental AI. We do not guarantee factual accuracy. Reliance on AI-generated quizzes for high-stakes educational or professional assessment is at the user's sole risk.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">5. Data Retention</h3>
                        <p>We retain user profile data and quiz history to provide personalized analytics. Deleting an account permanently wipes this data from our production clusters within 30 days.</p>
                    </div>
                </div>
            ) : type === 'privacy' ? (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 text-indigo-700 font-black uppercase text-xs mb-3">
                            <Eye size={18} /> Data Sovereignty Notice
                        </div>
                        <p className="text-indigo-900 font-bold leading-relaxed">Your privacy is managed through cryptographic protocols and industry-standard RLS (Row Level Security) on our Supabase clusters.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-500" /> 1. Data We Collect</h3>
                        <p>We collect essential identity metrics: email address, username, profile avatar, and encrypted authentication tokens. We also store quiz interaction logs to calculate your performance achievements.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Database size={20} className="text-blue-500" /> 2. Processing & Storage</h3>
                        <p>Data is stored on Supabase (PostgreSQL). AI interactions are processed by OpenAI or GitHub Models. We use Resend for transactional email infrastructure. None of these partners are authorized to use your email for marketing purposes.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Trash2 size={20} className="text-rose-500" /> 3. Right to Erasure</h3>
                        <p>You maintain the absolute right to delete your digital footprint. Initiating account deletion via the Settings menu will trigger a cascaded delete across our database clusters, removing all quizzes, history, and profile records.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2"><Lock size={20} className="text-violet-500" /> 4. Security Protocols</h3>
                        <p>All data transit is encrypted via TLS 1.3. We implement strict RLS policies ensuring only you can access your private quizzes and personal settings.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-800 font-bold mb-4">
                        <Book className="inline-block mr-2 mb-1" size={16} />
                        Community Content Standard v2.0
                    </div>
                    <p><strong>1. Be Respectful:</strong> Do not create content that promotes hate speech, violence, discrimination, or harassment.</p>
                    <p><strong>2. Safe for Work:</strong> Quiviex is a platform for all ages. Explicit sexual content, gore, or disturbing imagery is strictly prohibited.</p>
                    <p><strong>3. Accuracy:</strong> While quizzes are for fun, avoid spreading dangerous misinformation or presenting opinion as absolute fact in educational categories.</p>
                    <p><strong>4. Copyright:</strong> Ensure you have the right to use any images or text you include in your quizzes.</p>
                    <p><strong>5. Moderation Enforcement:</strong> Violating these guidelines will result in automated warnings. Upon reaching 3 warnings, the account is terminated.</p>
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
            <button 
                onClick={onClose}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-lg"
            >
                Acknowledged
            </button>
        </div>
      </div>
    </div>
  );
};