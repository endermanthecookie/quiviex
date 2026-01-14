
import React, { useState } from 'react';
import { X, Shield, Gavel, Lock, Eye, ShieldCheck, Database, Trash2, ShieldAlert, Sparkles, Clock, Scale, Info, Cpu, Printer, Download, CheckCircle, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'guidelines' | 'privacy';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const [activeArticle, setActiveArticle] = useState(0);
  const lastUpdated = "January 14, 2026";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-[#05010d]/95 z-[120] flex items-center justify-center p-4 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-5xl w-full flex flex-col md:flex-row h-[90vh] md:h-[80vh] overflow-hidden animate-in zoom-in duration-500 border border-white/20">
        
        {/* Sidebar - Professional Navigation */}
        <div className="md:w-72 bg-slate-950 text-white p-8 flex flex-col border-r border-white/5">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                 <Shield size={20} />
               </div>
               <span className="font-black tracking-tighter text-xl">Quiviex</span>
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Compliance Registry</p>
          </div>

          <nav className="flex-1 space-y-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Navigation Index</p>
            {[
              { id: 0, label: 'Preamble', icon: FileText },
              { id: 1, label: 'Article I: Licensing', icon: Cpu },
              { id: 2, label: 'Article II: AI Ethics', icon: Sparkles },
              { id: 3, label: 'Article III: Strikes', icon: ShieldAlert },
              { id: 4, label: 'Official Endorsement', icon: CheckCircle }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveArticle(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeArticle === item.id ? 'bg-white/10 text-white shadow-inner border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <item.icon size={14} className={activeArticle === item.id ? 'text-indigo-400' : ''} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
             <button onClick={handlePrint} className="w-full flex items-center justify-between px-4 py-2 text-slate-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider group">
                <span>Print Registry</span>
                <Printer size={14} className="group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <header className="p-8 border-b border-slate-200 bg-white flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-indigo-600 font-black uppercase text-[10px] tracking-[0.4em] mb-2">
                  <Clock size={12} /> Last Revised: {lastUpdated}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                  {type === 'terms' ? 'Master Terms of Service' : type === 'privacy' ? 'Privacy & Data Protocol' : 'Community Standards'}
              </h2>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all click-scale">
              <X size={20} />
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-12">
              
              <section className="bg-indigo-50 border-l-4 border-indigo-500 p-8 rounded-r-3xl">
                <h4 className="text-indigo-900 font-black text-sm uppercase tracking-widest mb-4">I. Preamble</h4>
                <p className="text-indigo-900/80 font-serif italic text-lg leading-relaxed">
                   This document serves as the formal governance framework for the Quiviex Intelligence Suite. By accessing any educational node, the unit (User) acknowledges irrevocable adherence to these architectural constraints as of January 2026.
                </p>
              </section>

              <div className="space-y-10 font-serif text-slate-700 leading-relaxed text-justify">
                <div className="space-y-4">
                  <h3 className="font-sans font-black text-slate-900 uppercase text-xs tracking-[0.3em] flex items-center gap-2">
                    <Scale size={16} className="text-indigo-500" /> § 1.0 Infrastructure Licensing
                  </h3>
                  <p className="text-sm">
                    <strong>1.1 Limited Use:</strong> Quiviex grants the user a non-exclusive, limited license to access and use the platform strictly for educational purposes. Any extraction of proprietary system data is prohibited.
                  </p>
                </div>

                <div className="space-y-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl border border-white/5">
                  <h3 className="font-sans font-black text-indigo-400 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                    <ShieldAlert size={16} /> § 3.0 Three-Strike Audit Protocol
                  </h3>
                  <div className="space-y-4 text-xs font-sans font-medium text-slate-300">
                    <p className="font-bold text-white uppercase tracking-wide">Infrastructure Security measures are strictly enforced:</p>
                    <ul className="space-y-4">
                      <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">01</span>
                        <div><strong>Strike 01: Initial Violation:</strong> Formal warning. Content is immediately sequestered for sanitization.</div>
                      </li>
                      <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center font-black text-[10px] flex-shrink-0 text-slate-900">02</span>
                        <div><strong>Strike 02: Escalated Breach:</strong> <span className="text-white font-bold underline">Public Visibility Restriction & 7-Day Creative Suspension.</span> The unit is locked from platform access for 168 hours.</div>
                      </li>
                      <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">03</span>
                        <div><strong>Strike 03: Terminal Ejection:</strong> Permanent account decommissioning. Identity UID is blacklisted globally.</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-200 flex flex-col items-center opacity-50">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner mb-4">
                    <Gavel size={32} className="text-slate-400" />
                 </div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] text-center leading-relaxed">
                    Authenticated Quiviex Governance Ledger <br/> Registry ID: QX-LEGAL-2026-SYS-09
                 </p>
              </div>
            </div>
          </div>
          
          <footer className="p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                      <ShieldCheck size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Document Status</p>
                      <p className="text-xs font-black text-emerald-600 uppercase">Certified & Binding</p>
                  </div>
              </div>
              <button 
                  onClick={onClose}
                  className="w-full sm:w-auto bg-slate-950 hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl click-scale flex items-center justify-center gap-3"
              >
                  Confirm and Acknowledge
              </button>
          </footer>
        </div>
      </div>
    </div>
  );
};
