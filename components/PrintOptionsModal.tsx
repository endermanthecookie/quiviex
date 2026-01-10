import React from 'react';
import { Quiz } from '../types';
import { Printer, FileText, CheckSquare, X } from 'lucide-react';

interface PrintOptionsModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({ quiz, onClose }) => {

  const handlePrint = (type: 'quiz' | 'answers') => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Popup blocked.");
      
      const renderQuestionContent = (q: any) => {
          if (q.type === 'matching' || q.type === 'ordering') {
              return `<div style="padding: 12px; background: #f8fafc; border: 1px dashed #cbd5e1; text-align: center; font-style: italic; font-size: 11px; color: #64748b; border-radius: 8px;">Interactive Question (${q.type}) - See online for full experience</div>`;
          }
          if (q.type === 'fill-in-the-blank') {
              return `<div class="q-text">${q.question.replace(/\[\s*\]/g, '<span style="display:inline-block; border-bottom: 2px solid #0f172a; width: 100px; margin: 0 4px;"></span>')}</div>`;
          }
          if (q.type === 'text-input') {
              return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 30px; border-bottom: 2px solid #e2e8f0; height: 30px; width: 100%;"></div>
              `;
          }
          if (q.type === 'slider') {
               return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 12px; gap: 15px; color: #475569;">
                    <span style="white-space: nowrap;">${q.options[0]}</span>
                    <div style="flex: 1; height: 4px; background: #e2e8f0; border-radius: 4px; position: relative;">
                        <div style="position: absolute; left: 50%; top: -6px; width: 12px; height: 12px; background: #94a3b8; border-radius: 50%;"></div>
                    </div>
                    <span style="white-space: nowrap;">${q.options[1]}</span>
                </div>
              `;
          }
          // Multiple Choice / True False
          return `
            <div class="q-text">${q.question}</div>
            <ul class="opt-list">
                ${q.options.map((o: string) => `<li class="opt"><span class="checkbox"></span> ${o}</li>`).join('')}
            </ul>
          `;
      };

      const renderAnswer = (q: any) => {
          if (q.type === 'matching' || q.type === 'ordering') return 'Interactive (See Online)';
          if (q.type === 'multiple-choice' || q.type === 'true-false' || q.type === 'fill-in-the-blank') return q.options[q.correctAnswer];
          if (q.type === 'slider') return `${q.correctAnswer} (Range: ${q.options[0]}-${q.options[1]})`;
          if (q.type === 'text-input') return q.correctAnswer;
          return q.correctAnswer;
      };

      const brandingHtml = `
        <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h5 style="margin: 0; font-weight: 700; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">QUIZ ID: ${quiz.id}</h5>
            </div>
            <div style="font-size: 10px; font-weight: 700; color: #94a3b8;">
                ${new Date().toLocaleDateString()}
            </div>
        </div>
      `;

      // Inline Logo SVG
      const logoSvg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
          <defs>
            <linearGradient id="g_print" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#9d33f5"/>
              <stop offset="100%" style="stop-color:#5c4cf4"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" rx="28" fill="url(#g_print)"/>
          <path d="M 72 30 L 74 36 L 80 38 L 74 40 L 72 46 L 70 40 L 64 38 L 70 36 Z" fill="#fcd34d"/>
          <path d="M 28 62 L 30 68 L 36 70 L 30 72 L 28 78 L 26 72 L 20 70 L 26 68 Z" fill="#fcd34d"/>
          <path d="M 52 14 L 68 14 L 48 48 L 66 48 L 32 86 L 44 54 L 30 54 Z" fill="white"/>
        </svg>
      `;

      let bodyContent = '';

      if (type === 'quiz') {
          bodyContent = `
            ${brandingHtml}
            <div style="margin-bottom: 40px;">
                <h1 style="font-size: 36px; font-weight: 900; line-height: 1.1; margin-bottom: 10px; letter-spacing: -1px;">${quiz.title}</h1>
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                    By @${quiz.creatorUsername || 'User'} • ${quiz.questions.length} Questions
                </div>
            </div>

            <div class="name-section">
                <span style="color: #cbd5e1; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-right: 10px;">Student Name</span>
            </div>
            
            ${quiz.questions.map((q, i) => `
                <div class="q-block">
                    <div class="q-num">Question ${i + 1}</div>
                    ${q.image ? `<div class="img-container"><img src="${q.image}" /></div>` : ''}
                    ${renderQuestionContent(q)}
                </div>
            `).join('')}
          `;
      } else {
          bodyContent = `
            <div class="answer-key-header">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <h1 style="font-size: 28px; font-weight: 900; margin: 0;">Answer Key</h1>
                    <span style="background: #f1f5f9; padding: 6px 12px; border-radius: 99px; font-size: 11px; font-weight: 800; color: #64748b;">INSTRUCTOR COPY</span>
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #333; border-left: 4px solid #5c4cf4; padding-left: 12px;">${quiz.title}</div>
            </div>
            
            <div style="column-count: 2; column-gap: 40px;">
                ${quiz.questions.map((q, i) => `
                    <div class="answer-row">
                        <div class="answer-q">Q${i + 1}</div>
                        <div class="answer-val">${renderAnswer(q)}</div>
                    </div>
                `).join('')}
            </div>
          `;
      }

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${quiz.title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: A4;
                    margin: 20mm;
                }
                body { 
                    font-family: 'Plus Jakarta Sans', sans-serif; 
                    margin: 0;
                    padding: 0;
                    color: #0f172a;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                /* Footer Styles */
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 999;
                    opacity: 0.8;
                }
                
                .footer-text {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #5c4cf4;
                    margin-top: 4px;
                }

                .name-section { 
                    margin-bottom: 40px; 
                    border-bottom: 2px solid #e2e8f0; 
                    padding-bottom: 8px; 
                    display: inline-block; 
                    width: 100%;
                    max-width: 400px;
                }
                
                .q-block { 
                    margin-bottom: 25px; 
                    page-break-inside: avoid; 
                    padding-bottom: 25px; 
                    border-bottom: 1px dashed #f1f5f9;
                }
                
                .q-block:last-child { border-bottom: none; }

                .q-num { 
                    font-weight: 800; 
                    font-size: 11px; 
                    color: #5c4cf4; 
                    text-transform: uppercase; 
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                
                .q-text { 
                    font-size: 15px; 
                    font-weight: 600; 
                    margin-bottom: 12px; 
                    line-height: 1.5; 
                    color: #1e293b;
                }
                
                .opt-list { padding-left: 0; list-style: none; margin: 0; }
                .opt { margin-bottom: 8px; font-size: 13px; display: flex; align-items: flex-start; color: #475569; }
                
                .checkbox {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #cbd5e1;
                    border-radius: 4px;
                    margin-right: 10px;
                    margin-top: 1px;
                    flex-shrink: 0;
                }
                
                .img-container { 
                    max-width: 300px; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 8px; 
                    overflow: hidden; 
                    margin: 8px 0 16px 0;
                }
                img { width: 100%; height: auto; display: block; }
                
                .answer-key-header { margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
                .answer-row { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: baseline; 
                    padding: 6px 0; 
                    border-bottom: 1px solid #f8fafc; 
                    font-size: 12px; 
                    page-break-inside: avoid;
                }
                .answer-q { font-weight: 800; width: 60px; color: #94a3b8; }
                .answer-val { flex: 1; text-align: right; font-weight: 700; color: #0f172a; }
            </style>
        </head>
        <body>
            <div class="print-footer">
                ${logoSvg}
                <div class="footer-text">Quiviex</div>
            </div>
            
            ${bodyContent}

            <script>
                window.onload = function() {
                    // Failsafe: Automatically close the window after 1.5 minutes (90000ms)
                    setTimeout(function() {
                        window.close();
                    }, 90000);

                    // Slight delay to ensure all styles/images are rendered
                    setTimeout(function() {
                        window.print();
                        
                        // Handler for browsers that support it (Firefox, IE)
                        window.onafterprint = function() {
                            window.close();
                        };

                        // Fallback logic for Chrome/Safari where print() is blocking
                        // This code typically runs after the print dialog is closed in those browsers
                        if (document.hasFocus()) {
                            window.close();
                        } else {
                            // If window lost focus (e.g. print dialog open), wait for it to return
                            window.onfocus = function() { window.close(); }
                        }
                    }, 500);
                };
            </script>
        </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in border-4 border-slate-100">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
            </button>
            
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                    <Printer size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Print Options</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Select document format</p>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={() => handlePrint('quiz')}
                    className="w-full bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 p-4 rounded-2xl flex items-center gap-4 transition-all click-scale group"
                >
                    <div className="bg-slate-100 group-hover:bg-white p-2 rounded-lg text-slate-500 group-hover:text-indigo-500 transition-colors">
                        <FileText size={24} />
                    </div>
                    <div className="text-left">
                        <div className="font-black text-sm">Print Quiz</div>
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Questions Only</div>
                    </div>
                </button>

                <button 
                    onClick={() => handlePrint('answers')}
                    className="w-full bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 p-4 rounded-2xl flex items-center gap-4 transition-all click-scale group"
                >
                    <div className="bg-slate-100 group-hover:bg-white p-2 rounded-lg text-slate-500 group-hover:text-emerald-500 transition-colors">
                        <CheckSquare size={24} />
                    </div>
                    <div className="text-left">
                        <div className="font-black text-sm">Print Answer Sheet</div>
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Solutions Key</div>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};