
import React from 'react';
// Fix: Added missing Cpu import from lucide-react
import { X, Shield, Book, Gavel, Lock, Eye, ShieldCheck, Database, Trash2, Heart, ShieldAlert, Sparkles, Clock, Scale, Info, Cpu } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'guidelines' | 'privacy';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const lastUpdated = "January 14, 2026";

  return (
    <div className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] animate-in zoom-in duration-300 border border-slate-200">
        
        {/* Professional Header */}
        <div className="bg-slate-900 p-8 sm:p-10 flex justify-between items-start rounded-t-[3rem] border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 scale-150 pointer-events-none text-white">
             {type === 'terms' ? <Scale size={300} /> : type === 'privacy' ? <Lock size={300} /> : <Shield size={300} />}
          </div>
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 text-indigo-400 font-black uppercase text-[10px] tracking-[0.4em] mb-3">
                <Clock size={14} /> Last Updated: {lastUpdated}
            </div>
            <div className="flex items-center gap-4 text-white">
               <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                {type === 'terms' ? <Gavel className="text-yellow-400" size={28} /> : type === 'privacy' ? <Lock className="text-indigo-400" size={28} /> : <Shield className="text-emerald-400" size={28} />}
               </div>
               <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                    {type === 'terms' ? 'Terms of Service' : type === 'privacy' ? 'Privacy Protocol' : 'Community Standards'}
                </h2>
                <p className="text-slate-400 text-sm font-bold opacity-80 uppercase tracking-widest mt-1">Official Legal Documentation</p>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all click-scale border border-white/10">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar leading-relaxed text-slate-600 bg-slate-50/30">
            {type === 'privacy' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex gap-6 items-center">
                        <Info className="text-indigo-600 flex-shrink-0" size={32} />
                        <p className="font-bold text-indigo-900 italic text-lg">
                            "At Quiviex, we prioritize your academic integrity and data privacy. Our systems are built to minimize data retention while maximizing your learning potential."
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b border-slate-200 pb-4">
                            <Database size={20} className="text-indigo-600" /> Article I: Data Collection
                        </h3>
                        <div className="space-y-4 pl-4 border-l-2 border-indigo-100">
                            <div>
                                <p className="font-black text-slate-800 text-sm uppercase mb-1">1.1 Identity Profiles</p>
                                <p className="text-sm">Registered usernames are used solely for content attribution and leaderboard synchronization. No real-world identity mapping is performed for standard accounts.</p>
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-sm uppercase mb-1">1.2 Age Verification</p>
                                <p className="text-sm">Birthdates are utilized strictly for compliance with COPPA/GDPR age requirements. Users under 13 are automatically moved to an anonymized "Child Safety" tier where emails are not stored.</p>
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-sm uppercase mb-1">1.3 Operational Telemetry</p>
                                <p className="text-sm">Quiz performance metrics and interaction logs are stored to improve AI recommendation algorithms and provide personal progress tracking.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b border-slate-200 pb-4">
                            <Eye size={20} className="text-indigo-600" /> Article II: Visibility & Disclosure
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <p className="font-black text-slate-900 mb-2">Public Repositories</p>
                                <p>Quizzes marked 'Public' are visible to the entire global community and indexable by search engines.</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <p className="font-black text-slate-900 mb-2">Third-Party Processing</p>
                                <p>We utilize encrypted tunnels to communicate with AI providers. Your API keys (OpenAI/GitHub) are stored in your profile but never shared with other users.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
                        <div className="flex-1">
                             <h4 className="font-black text-indigo-400 uppercase text-xs mb-2 flex items-center gap-2 tracking-widest"><ShieldCheck size={14}/> Sovereignty Guarantee</h4>
                             <p className="text-sm font-medium text-slate-300">You may decommission your account at any time. Upon request, all historical quiz data and profile records will be permanently purged from the active registry within 48 hours.</p>
                        </div>
                        <Trash2 className="text-rose-500 opacity-50" size={48} />
                    </div>
                </div>
            ) : type === 'terms' ? (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b border-slate-200 pb-4">
                            <Scale size={20} className="text-indigo-600" /> Article I: Infrastructure Agreement
                        </h3>
                        <div className="space-y-4 text-sm pl-4">
                            <p><strong>1.1 Acceptance:</strong> By accessing the Quiviex infrastructure, you acknowledge that you have read and agreed to these Master Terms. Quiviex is provided "as is" for educational purposes.</p>
                            <p><strong>1.2 Eligibility:</strong> Users must be at least 13 years of age to register an email-bound account. Minor users must have parental consent for platform interaction.</p>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 border-b border-slate-200 pb-4">
                            <Cpu size={20} className="text-indigo-600" /> Article II: AI & Content Ownership
                        </h3>
                        <div className="space-y-4 text-sm pl-4">
                            <p><strong>2.1 Intellectual Property:</strong> You retain ownership of original text within your quizzes. By setting a quiz to "Public," you grant Quiviex a non-exclusive license to host and distribute said content.</p>
                            <p><strong>2.2 AI Limitations:</strong> Quiz data generated via automated intelligence models may contain factual inaccuracies. Users are responsible for verifying the academic validity of AI output before public distribution.</p>
                        </div>
                    </section>

                    <section className="space-y-6 bg-rose-50 p-8 rounded-[2.5rem] border-2 border-rose-100">
                        <h3 className="text-xl font-black text-rose-600 uppercase tracking-tight flex items-center gap-3 mb-4">
                            <ShieldAlert size={20} className="text-rose-500" /> Article III: Three-Strike Protocol
                        </h3>
                        <div className="space-y-4 text-sm text-rose-900">
                            <p className="font-bold">Quiviex operates a zero-tolerance policy for prohibited content. Violations are tracked via our Internal Audit System:</p>
                            <ul className="space-y-3">
                                <li className="flex gap-3"><span className="font-black text-rose-500">Strike 01:</span> Formal Warning & Content Sanitization.</li>
                                <li className="flex gap-3"><span className="font-black text-rose-500">Strike 02:</span> Public Visibility Restriction & 7-Day Creative Suspension.</li>
                                <li className="flex gap-3"><span className="font-black text-rose-500 text-lg underline">Strike 03:</span> Permanent Account Termination & Email Blacklisting.</li>
                            </ul>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[2.5rem] flex gap-6 items-center">
                        <div className="bg-emerald-500 p-3 rounded-2xl text-white"><Sparkles size={24} /></div>
                        <div className="flex-1">
                            <h4 className="font-black text-emerald-900 uppercase text-xs tracking-widest mb-1">Architect Ethos</h4>
                            <p className="text-emerald-800 font-bold italic text-lg">"We build for the future, with respect for the present."</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-slate-400">01</div>
                            <div>
                                <h4 className="font-black text-slate-900 uppercase text-sm mb-2 tracking-tight">Academic Integrity</h4>
                                <p className="text-sm">Quizzes should be constructive. Harassment, targeted misinformation, or content designed to bully specific individuals is strictly prohibited.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-slate-400">02</div>
                            <div>
                                <h4 className="font-black text-slate-900 uppercase text-sm mb-2 tracking-tight">Safety Standards</h4>
                                <p className="text-sm">Maintain a PG-13 environment. Sexual content, gratuitous violence, or promotion of illegal activities will result in an immediate Strike 03 purge.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center font-black text-slate-400">03</div>
                            <div>
                                <h4 className="font-black text-slate-900 uppercase text-sm mb-2 tracking-tight">Respectful Remixing</h4>
                                <p className="text-sm">When remixing modules from other Architects, preserve the educational intent and respect the original creator's vision.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-10 border-t border-slate-100 bg-slate-50 rounded-b-[3rem] flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
                Document Code: QX-LEGAL-{type.toUpperCase()} // REV-04
            </p>
            <button 
                onClick={onClose}
                className="w-full sm:w-auto bg-[#1a1f2e] hover:bg-black text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl click-scale flex items-center justify-center gap-3"
            >
                <ShieldCheck size={18} className="text-emerald-400" />
                Commit and Close
            </button>
        </div>
      </div>
    </div>
  );
};
