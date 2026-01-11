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
      
      const shuffle = (array: any[]) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
      };

      const renderQuestionContent = (q: any) => {
          if (q.type === 'matching') {
              const lefts: string[] = [];
              const rights: string[] = [];
              for(let i=0; i<q.options.length; i+=2) {
                  if(q.options[i]) lefts.push(q.options[i]);
                  if(q.options[i+1]) rights.push(q.options[i+1]);
              }
              const shuffledRights = shuffle(rights);
              
              return `
                <div class="question-text">${q.question || 'Match the following items:'}</div>
                <div class="matching-container">
                    <div class="col-left">
                        ${lefts.map((item, i) => `
                            <div class="match-item">
                                <span class="match-line">_______</span> <span class="match-idx">${i+1}.</span> ${item}
                            </div>
                        `).join('')}
                    </div>
                    <div class="col-right">
                        ${shuffledRights.map((item, i) => `
                            <div class="match-item">
                                <span class="match-idx">${String.fromCharCode(65+i)}.</span> ${item}
                            </div>
                        `).join('')}
                    </div>
                </div>
              `;
          }
          
          if (q.type === 'ordering') {
              const shuffledOptions = shuffle(q.options);
              return `
                <div class="question-text">${q.question || 'Order the following items:'}</div>
                <div class="ordering-container">
                    ${shuffledOptions.map((opt: string) => `
                        <div class="order-item">
                            <div class="order-box"></div> ${opt}
                        </div>
                    `).join('')}
                </div>
              `;
          }

          if (q.type === 'fill-in-the-blank') {
              let bankHtml = '';
              if (q.options && q.options.length > 0) {
                  const shuffledBank = shuffle(q.options);
                  bankHtml = `
                    <div class="word-bank">
                        <div class="wb-label">WORD BANK</div>
                        <div class="words">
                            ${shuffledBank.map((opt: string) => `<span class="word">${opt}</span>`).join('')}
                        </div>
                    </div>
                  `;
              }
              
              const parts = q.question.split(/(\[\s*\])/g);
              const processedQuestion = parts.map((part: string) => {
                  if (part.match(/\[\s*\]/)) {
                      return '<span class="blank-line"></span>';
                  }
                  return part;
              }).join('');

              return `
                ${bankHtml}
                <div class="question-text large-text">${processedQuestion}</div>
              `;
          }
          
          if (q.type === 'text-input') {
              return `
                <div class="question-text">${q.question}</div>
                <div class="write-area-box"></div>
              `;
          }
          
          if (q.type === 'slider') {
               return `
                <div class="question-text">${q.question}</div>
                <div class="slider-print">
                    <div class="range-labels">
                        <span>${q.options[0]}</span>
                        <span>${q.options[1]}</span>
                    </div>
                    <div class="range-track"></div>
                    <div class="write-val">Value: ________________</div>
                </div>
              `;
          }
          
          // Multiple Choice / True False
          return `
            <div class="question-text">${q.question}</div>
            <div class="options-grid">
                ${q.options.map((o: string, idx: number) => `
                    <div class="option-item">
                        <div class="bubble">${String.fromCharCode(65 + idx)}</div>
                        <div class="option-text">${o}</div>
                    </div>
                `).join('')}
            </div>
          `;
      };

      const renderAnswer = (q: any) => {
          if (q.type === 'fill-in-the-blank') {
              if (Array.isArray(q.correctAnswer)) {
                  return q.correctAnswer.map((idx: number) => q.options[idx]).join(', ');
              }
              return 'Refer to Word Bank';
          }
          if (q.type === 'matching') {
              const pairs = [];
              for(let i=0; i<q.options.length; i+=2) {
                  if(q.options[i] && q.options[i+1]) {
                      pairs.push(`${q.options[i]} &rarr; ${q.options[i+1]}`);
                  }
              }
              return pairs.join('<br>');
          }
          if (q.type === 'ordering') {
              return q.options.map((o:string, i:number) => `${i+1}. ${o}`).join('<br>');
          }
          if (q.type === 'slider') {
              return q.correctAnswer;
          }
          if (q.type === 'text-input') {
              return q.correctAnswer;
          }
          if (typeof q.correctAnswer === 'number' && q.options) {
              return `(${String.fromCharCode(65 + q.correctAnswer)}) ${q.options[q.correctAnswer]}`;
          }
          return q.correctAnswer || 'N/A';
      };

      const headerHtml = `
        <div class="header">
            <div class="header-main">
                <h1>${quiz.title}</h1>
                <div class="meta">Created by <strong>${quiz.creatorUsername || 'Instructor'}</strong> &bull; ${quiz.questions.length} Questions</div>
            </div>
            <div class="student-fields">
                <div class="field"><span class="label">Name:</span> <span class="line"></span></div>
                <div class="field"><span class="label">Date:</span> <span class="line"></span></div>
                <div class="field"><span class="label">Score:</span> <span class="line short"></span> <span class="total">/ ${quiz.questions.length}</span></div>
            </div>
        </div>
      `;

      let bodyContent = '';

      if (type === 'quiz') {
          bodyContent = `
            ${headerHtml}
            <div class="worksheet-body">
            ${quiz.questions.map((q, i) => `
                <div class="question-block">
                    <div class="q-num">${i + 1}.</div>
                    <div class="q-content">
                        ${q.image ? `<div class="q-image"><img src="${q.image}" /></div>` : ''}
                        ${renderQuestionContent(q)}
                    </div>
                </div>
            `).join('')}
            </div>
          `;
      } else {
          bodyContent = `
            <div class="header simple">
                <h1>Answer Key</h1>
                <p class="subtitle">${quiz.title}</p>
            </div>
            
            <div class="answer-key-container">
                <table class="key-table">
                    <thead>
                        <tr>
                            <th class="col-num">#</th>
                            <th class="col-ans">Correct Answer</th>
                            <th class="col-exp">Notes / Explanation</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${quiz.questions.map((q, i) => `
                        <tr>
                            <td class="col-num"><strong>${i + 1}</strong></td>
                            <td class="col-ans"><strong>${renderAnswer(q)}</strong></td>
                            <td class="col-exp">${q.explanation || '<span class="text-muted">--</span>'}</td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table>
            </div>
          `;
      }

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${quiz.title} - ${type === 'quiz' ? 'Worksheet' : 'Key'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                @page { margin: 15mm; size: A4; }
                body {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    color: #1e293b;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                /* Header */
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 24px;
                    margin-bottom: 32px;
                }
                .header.simple {
                    display: block;
                    text-align: center;
                    border-bottom: 1px solid #e2e8f0;
                }
                .header-main h1 {
                    font-size: 24px;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .header-main .meta {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .subtitle {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 600;
                    margin: 0;
                }
                
                .student-fields {
                    text-align: right;
                    min-width: 240px;
                }
                .field {
                    margin-bottom: 10px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #475569;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    text-transform: uppercase;
                }
                .field .label { margin-right: 8px; font-size: 10px; color: #94a3b8; }
                .field .line {
                    border-bottom: 1px solid #cbd5e1;
                    width: 140px;
                    display: inline-block;
                }
                .field .line.short { width: 50px; }
                .field .total { margin-left: 4px; color: #94a3b8; }

                /* Questions */
                .question-block {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 28px;
                    page-break-inside: avoid;
                }
                .q-num {
                    font-size: 16px;
                    font-weight: 800;
                    color: #334155;
                    width: 24px;
                    flex-shrink: 0;
                }
                .q-content { flex: 1; }
                
                .q-image {
                    margin-bottom: 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    max-width: 250px;
                }
                .q-image img { width: 100%; display: block; }

                .question-text {
                    font-size: 15px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #0f172a;
                }
                .question-text.large-text {
                    font-size: 16px;
                    line-height: 1.8;
                }

                /* Options Grid (MC) */
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .option-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .bubble {
                    width: 20px;
                    height: 20px;
                    border: 1.5px solid #94a3b8;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    color: #94a3b8;
                    flex-shrink: 0;
                }
                .option-text {
                    font-size: 14px;
                    color: #334155;
                }

                /* Word Bank */
                .word-bank {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 20px;
                    background: #f8fafc;
                }
                .wb-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; }
                .words { display: flex; flex-wrap: wrap; gap: 8px; }
                .word {
                    background: white;
                    border: 1px solid #cbd5e1;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                }

                .blank-line {
                    display: inline-block;
                    width: 100px;
                    border-bottom: 1px solid #0f172a;
                    margin: 0 4px;
                }

                .write-area-box {
                    height: 100px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    margin-top: 8px;
                    background-image: linear-gradient(to bottom, transparent 31px, #f1f5f9 32px);
                    background-size: 100% 32px;
                }
                
                /* Matching */
                .matching-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    font-size: 13px;
                }
                .match-item {
                    margin-bottom: 12px;
                    color: #334155;
                }
                .match-line { color: #cbd5e1; margin-right: 4px; font-weight: bold; }
                .match-idx { font-weight: 800; color: #64748b; margin-right: 4px; }

                /* Ordering */
                .ordering-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .order-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    color: #334155;
                }
                .order-box {
                    width: 24px;
                    height: 24px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 4px;
                }
                
                /* Slider */
                .slider-print {
                    margin-top: 20px;
                    border: 1px solid #e2e8f0;
                    padding: 20px;
                    border-radius: 8px;
                }
                .range-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
                .range-track { height: 4px; background: #e2e8f0; border-radius: 2px; margin-bottom: 16px; }
                .write-val { font-size: 12px; font-weight: 700; color: #0f172a; text-align: center; }

                /* Answer Key Table */
                .key-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 20px;
                }
                .key-table th {
                    text-align: left;
                    background: #f1f5f9;
                    padding: 10px 16px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                    font-size: 10px;
                    letter-spacing: 0.05em;
                }
                .key-table td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: top;
                }
                .key-table tr:nth-child(even) { background-color: #fcfcfc; }
                .col-num { width: 40px; text-align: center; color: #64748b; }
                .col-ans { font-weight: 700; color: #0f172a; width: 40%; }
                .col-exp { color: #64748b; }
                .text-muted { color: #cbd5e1; }

                .footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9px;
                    color: #cbd5e1;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding-top: 10px;
                    border-top: 1px solid #f1f5f9;
                }
            </style>
        </head>
        <body>
            ${bodyContent}
            <div class="footer">Generated by Quiviex Learning Labs</div>
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
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Student Copy</div>
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
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Instructor Copy</div>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};