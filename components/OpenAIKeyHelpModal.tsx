import React from 'react';
import { ArrowLeft, ExternalLink, Key, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

interface OpenAIKeyHelpModalProps {
  onClose: () => void;
}

export const OpenAIKeyHelpModal: React.FC<OpenAIKeyHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in duration-200 h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center border-b border-slate-800">
            <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-indigo-400" />
                    Get OpenAI Secret Key
                </h2>
                <p className="text-slate-400 text-sm mt-1">Unlock Advanced AI & Image Generation</p>
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
            
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl flex gap-3">
                <AlertCircle className="text-indigo-600 flex-shrink-0" size={20} />
                <p className="text-indigo-900 text-sm font-medium">
                    OpenAI is a paid service. Unlike GitHub tokens, you generally need to add at least <strong>$5.00</strong> in credits to your account for the API to work.
                </p>
            </div>

            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl">1</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Create OpenAI Account</h3>
                    <p className="text-slate-600 mb-2">Visit the OpenAI Platform and sign up or sign in.</p>
                    <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline">Open OpenAI Platform <ExternalLink size={14} /></a>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black text-xl">2</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Add API Credits</h3>
                    <p className="text-slate-600 mb-3">Go to Billing and add a minimum credit balance. The "Free Trial" credits often expire quickly.</p>
                    <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md">Open Billing Page <CreditCard size={16} className="ml-1" /></a>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-black text-xl">3</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Generate Secret Key</h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 mt-2 shadow-sm space-y-3 text-sm">
                        <p className="text-slate-600 font-medium">Navigate to the <b>API Keys</b> section under your profile.</p>
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="inline-block text-indigo-600 font-bold hover:underline mb-2">Go to API Keys Section <ExternalLink size={12} /></a>
                        <div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Action</span><span>Click <b>"+ Create new secret key"</b></span></div>
                        <div className="flex items-center gap-2"><span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Note</span><span>Give it a name like "Quiviex Pro"</span></div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center font-black text-xl">4</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Final Step</h3>
                    <p className="text-slate-600 mb-2">Copy the key starting with <code>sk-...</code> and paste it into the Quiviex Settings. <b>Never share this key with anyone!</b></p>
                </div>
            </div>

            </div>
        </div>
        </div>
    </div>
  );
};