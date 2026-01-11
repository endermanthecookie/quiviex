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
              return `<div style="padding: 12px; background: #f9f9f9; border: 1px dashed #ccc; text-align: center; font-style: italic; font-size: 11px; border-radius: 4px;">Question Type Not Supported in Print Format</div>`;
          }
          if (q.type === 'fill-in-the-blank') {
              let bankHtml = '';
              if (q.options && q.options.length > 0) {
                  bankHtml = `
                    <div style="margin-bottom: 12px; padding: 10px; border: 1px solid #ddd; background: #fafafa; border-radius: 4px; font-size: 11px;">
                        <strong style="display:block; margin-bottom: 4px; text-transform: uppercase; font-size: 10px;">Word Bank:</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${q.options.map((opt: string) => `<span style="border: 1px solid #ccc; padding: 2px 6px; border-radius: 4px; background: white;">${opt}</span>`).join('')}
                        </div>
                    </div>
                  `;
              }
              
              const parts = q.question.split(/(\[\s*\])/g);
              const processedQuestion = parts.map((part: string) => {
                  if (part.match(/\[\s*\]/)) {
                      return '<span class="dotted-line"></span>';
                  }
                  return part;
              }).join('');

              return `
                ${bankHtml}
                <div class="q-text">${processedQuestion}</div>
              `;
          }
          if (q.type === 'text-input') {
              return `
                <div class="q-text">${q.question}</div>
                <div class="write-box"></div>
              `;
          }
          if (q.type === 'slider') {
               return `
                <div class="q-text">${q.question}</div>
                <div style="margin-top: 15px; display: flex; align-items: center; justify-content: space-between; font-weight: bold; font-size: 11px;">
                    <span>${q.options[0]}</span>
                    <div style="flex: 1; height: 1px; background: #000; margin: 0 10px; position: relative;">
                        <div style="position: absolute; left: 0; width: 1px; height: 6px; background: #000; top: -3px;"></div>
                        <div style="position: absolute; right: 0; width: 1px; height: 6px; background: #000; top: -3px;"></div>
                    </div>
                    <span>${q.options[1]}</span>
                </div>
              `;
          }
          
          // Multiple Choice / True False
          return `
            <div class="q-text">${q.question}</div>
            <ul class="opt-list">
                ${q.options.map((o: string, idx: number) => `
                    <li class="opt">
                        <span class="bubble">${String.fromCharCode(65 + idx)}</span>
                        ${o}
                    </li>
                `).join('')}
            </ul>
          `;
      };

      const renderAnswer = (q: any) => {
          if (q.type === 'fill-in-the-blank') {
              if (Array.isArray(q.correctAnswer)) {
                  return q.correctAnswer.map((idx: number) => q.options[idx]).join(', ');
              }
              return 'See Online';
          }
          if (typeof q.correctAnswer === 'number' && q.options) return q.options[q.correctAnswer];
          return q.correctAnswer;
      };

      const brandingHtml = `
        <div class="header">
            <div class="header-left">
                <h1>${quiz.title}</h1>
                <p>Created by @${quiz.creatorUsername || 'User'}</p>
            </div>
            <div class="header-fields">
                <div class="field">Name: <span class="line"></span></div>
                <div class="field">Date: <span class="line"></span></div>
                <div class="field">Score: <span class="line short"></span> / ${quiz.questions.length}</div>
            </div>
        </div>
      `;

      let bodyContent = '';

      if (type === 'quiz') {
          bodyContent = `
            ${brandingHtml}
            
            <div class="questions-container">
            ${quiz.questions.map((q, i) => `
                <div class="q-block">
                    <div class="q-num">${i + 1}.</div>
                    <div class="q-content">
                        ${q.image ? `<div class="img-container"><img src="${q.image}" /></div>` : ''}
                        ${renderQuestionContent(q)}
                    </div>
                </div>
            `).join('')}
            </div>
          `;
      } else {
          bodyContent = `
            <div class="header">
                <h1>Answer Key</h1>
                <p>${quiz.title}</p>
            </div>
            
            <table class="answer-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Correct Answer</th>
                        <th>Explanation</th>
                    </tr>
                </thead>
                <tbody>
                ${quiz.questions.map((q, i) => `
                    <tr>
                        <td><strong>${i + 1}</strong></td>
                        <td><strong>${renderAnswer(q)}</strong></td>
                        <td style="color: #666; font-style: italic;">${q.explanation || ''}</td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
          `;
      }

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${quiz.title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;700&family=Roboto:wght@400;700&display=swap');
                
                @page {
                    size: A4;
                    margin: 20mm;
                }
                body { 
                    font-family: 'Times New Roman', Times, serif;
                    margin: 0;
                    padding: 0;
                    color: #000;
                    background: white;
                    line-height: 1.4;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    font-family: 'Helvetica', 'Arial', sans-serif;
                    font-size: 24px;
                    margin: 0 0 5px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .header p { margin: 0; font-size: 12px; color: #555; }
                
                .header-fields {
                    text-align: right;
                    font-family: 'Helvetica', 'Arial', sans-serif;
                    font-size: 12px;
                }
                .field { margin-bottom: 8px; }
                .line {
                    display: inline-block;
                    border-bottom: 1px solid #000;
                    width: 150px;
                }
                .line.short { width: 50px; }

                .q-block { 
                    margin-bottom: 20px; 
                    page-break-inside: avoid; 
                    display: flex;
                    gap: 10px;
                }
                .q-num { font-weight: bold; font-size: 14px; min-width: 25px; }
                .q-content { flex: 1; }
                .q-text { margin-bottom: 8px; font-weight: bold; }
                
                .opt-list { padding-left: 0; list-style: none; margin: 0; }
                .opt { margin-bottom: 6px; font-size: 13px; display: flex; align-items: center; }
                
                .bubble {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    border: 1px solid #000;
                    border-radius: 50%;
                    margin-right: 10px;
                    font-size: 10px;
                    font-family: sans-serif;
                    font-weight: bold;
                }
                
                .dotted-line {
                    display: inline-block;
                    border-bottom: 1px dotted #000;
                    width: 100px;
                    margin: 0 5px;
                    vertical-align: bottom;
                }
                
                .write-box {
                    border-bottom: 1px solid #ccc;
                    height: 25px;
                    width: 100%;
                    margin-top: 5px;
                }

                .img-container { 
                    max-width: 200px; 
                    border: 1px solid #eee; 
                    margin: 5px 0 10px 0;
                }
                img { width: 100%; height: auto; display: block; }
                
                .answer-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                .answer-table th, .answer-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                }
                .answer-table th { background: #eee; }

                .footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    font-family: sans-serif;
                }
            </style>
        </head>
        <body>
            <div class="footer">Generated by Quiviex Learning Labs</div>
            ${bodyContent}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
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
                <h3 className="text-2xl font-black text-slate-900 mb-1">Print Worksheet</h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Academic Format</p>
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
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Standard Worksheet</div>
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
                        <div className="font-black text-sm">Print Answer Key</div>
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Teacher Copy</div>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};