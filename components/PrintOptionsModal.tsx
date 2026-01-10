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
              return `<div style="padding: 15px; background: #f8f8f8; border: 1px dashed #ccc; text-align: center; font-style: italic; font-size: 12px; color: #666;">This question type (${q.type}) requires interactive elements and is not supported in print format.</div>`;
          }
          if (q.type === 'fill-in-the-blank') {
              return `<div class="q-text">${q.question.replace(/\[\s*\]/g, '_______________')}</div>`;
          }
          if (q.type === 'text-input') {
              return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 40px; border-bottom: 2px solid #000; height: 30px; width: 100%; opacity: 0.3;"></div>
              `;
          }
          if (q.type === 'slider') {
               return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 25px; font-weight: bold; text-align: center; font-size: 14px;">
                    ${q.options[0]} &mdash;&mdash;&mdash; <span style="display: inline-block; border-bottom: 2px solid #000; width: 100px; margin: 0 10px;">&nbsp;</span> &mdash;&mdash;&mdash; ${q.options[1]}
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
          if (q.type === 'matching' || q.type === 'ordering') return 'N/A (Interactive)';
          if (q.type === 'multiple-choice' || q.type === 'true-false') return q.options[q.correctAnswer];
          if (q.type === 'slider') return q.correctAnswer;
          return q.correctAnswer;
      };

      let bodyContent = '';

      if (type === 'quiz') {
          bodyContent = `
            <div class="name-section">Name: ......................................................................</div>
            
            <h1>${quiz.title}</h1>
            <div class="meta">Created by @${quiz.creatorUsername || 'User'} • ${quiz.questions.length} Questions</div>
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
                <h1 style="border: none; padding: 0; margin: 0;">Answer Key</h1>
                <div style="font-size: 14px; margin-top: 5px; color: #555;">${quiz.title}</div>
            </div>
            
            ${quiz.questions.map((q, i) => `
                <div class="answer-row">
                    <div class="answer-q">Question ${i + 1}</div>
                    <div class="answer-val">${renderAnswer(q)}</div>
                </div>
            `).join('')}
          `;
      }

      const content = `
        <html>
        <head>
            <title>${quiz.title} - ${type === 'quiz' ? 'Questions' : 'Answers'}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: black; background: white; }
                
                .name-section { font-size: 24px; font-weight: bold; margin-bottom: 40px; font-family: sans-serif; }
                
                h1 { border-bottom: none; padding-bottom: 5px; margin-bottom: 5px; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
                .meta { font-size: 12px; color: #555; margin-bottom: 40px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                
                .q-block { margin-bottom: 30px; page-break-inside: avoid; border-bottom: 4px solid #000; padding-bottom: 30px; }
                .q-num { font-weight: 800; margin-bottom: 12px; font-size: 14px; color: #333; text-transform: uppercase; background: #eee; display: inline-block; padding: 4px 8px; border-radius: 4px; }
                .q-text { font-size: 18px; font-weight: 600; margin-bottom: 15px; line-height: 1.4; }
                
                .opt-list { padding-left: 0; list-style: none; margin: 0; }
                .opt { margin-bottom: 12px; font-size: 16px; display: flex; align-items: center; }
                
                .checkbox {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    border: 3px solid #000;
                    border-radius: 6px;
                    background: white;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
                
                .img-container { max-width: 300px; margin-top: 15px; border: 1px solid #eee; margin-bottom: 15px; border-radius: 8px; overflow: hidden; }
                img { width: 100%; height: auto; display: block; }
                
                .answer-key-header { margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
                .answer-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                .answer-row:last-child { border-bottom: none; }
                .answer-q { font-weight: bold; width: 100px; }
                .answer-val { flex-1; text-align: right; font-weight: 600; }
            </style>
        </head>
        <body>
            ${bodyContent}
            <script>window.print();</script>
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