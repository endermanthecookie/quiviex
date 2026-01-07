
import React from 'react';
import { ArrowLeft, ExternalLink, Key } from 'lucide-react';

interface GitHubTokenHelpModalProps {
  onClose: () => void;
}

export const GitHubTokenHelpModal: React.FC<GitHubTokenHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in duration-200 h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Key className="text-yellow-400" />
                    Get Your GitHub Token
                </h2>
                <p className="text-slate-400 text-sm mt-1">Follow these steps to enable AI powers (Free!)</p>
            </div>
            <button 
            onClick={onClose} 
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
            <ArrowLeft size={18} />
            Back
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
            <div className="space-y-8 max-w-xl mx-auto">
            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">1</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Sign in to GitHub</h3>
                    <p className="text-slate-600 mb-2">You need a GitHub account to access their free AI models.</p>
                    <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">Create Account / Sign In <ExternalLink size={14} /></a>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-xl">2</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Go to Token Settings</h3>
                    <p className="text-slate-600 mb-3">Navigate to the Personal Access Tokens page.</p>
                    <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl">Open Token Page <ExternalLink size={16} /></a>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-black text-xl">3</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Generate Token</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 mt-2 shadow-sm space-y-3 text-sm">
                        <div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Name</span><span>Give it a name (e.g., "Quiviex")</span></div>
                        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg"><span className="font-bold text-yellow-800 block mb-1">⚠️ Required Permission:</span><span>Scroll down to <b>"Account permissions"</b>. You MUST select the <b>"Models"</b> permission (Read & Write).</span></div>
                        <div className="flex items-center gap-2"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Final</span><span>Click "Generate token" at the bottom</span></div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-black text-xl">4</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Copy & Paste</h3>
                    <p className="text-slate-600 mb-2">Copy the token starting with <code>github_pat_...</code> and paste it into the AI Settings.</p>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
  );
};