
import React from 'react';
import { X, Shield, Book, Gavel } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'guidelines';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 flex justify-between items-center rounded-t-3xl border-b border-slate-800">
          <div className="flex items-center gap-3 text-white">
             {type === 'terms' ? <Gavel className="text-yellow-400" /> : <Shield className="text-green-400" />}
             <h2 className="text-2xl font-black">
                {type === 'terms' ? 'Terms & Conditions' : 'Community Guidelines'}
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
                        <h3 className="text-lg font-bold text-slate-900 mb-2">1. Introduction</h3>
                        <p>Welcome to Quiviex ("Company", "we", "our", "us"). These Terms and Conditions ("Terms") govern your use of our app located at quiviex.vercel.app (together or individually "Service") operated by Quiviex.</p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">2. Accounts</h3>
                        <p>When you create an account with us, you guarantee that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.</p>
                        <p className="mt-2">You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">3. Content and Intellectual Property</h3>
                        <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.</p>
                        <p className="mt-2">By posting Content on or through the Service, You represent and warrant that: (i) the Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">4. AI Features</h3>
                        <p>Our Service utilizes artificial intelligence services provided by third parties (OpenAI, GitHub). By using these features, you agree to abide by their respective Usage Policies. You agree not to use the AI generation tools to create illegal, harmful, sexually explicit, or hateful content. We reserve the right to ban users who misuse AI generation tools.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">5. Termination</h3>
                        <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">6. Limitation of Liability</h3>
                        <p>In no event shall Quiviex, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-green-800 font-bold mb-4">
                        <Book className="inline-block mr-2 mb-1" size={16} />
                        All public quizzes are subject to AI moderation before publishing.
                    </div>
                    <p><strong>1. Be Respectful:</strong> Do not create content that promotes hate speech, violence, discrimination, or harassment.</p>
                    <p><strong>2. Safe for Work:</strong> Quiviex is a platform for all ages. Explicit sexual content, gore, or disturbing imagery is strictly prohibited.</p>
                    <p><strong>3. Accuracy:</strong> While quizzes are for fun, avoid spreading dangerous misinformation or presenting opinion as absolute fact in educational categories.</p>
                    <p><strong>4. Copyright:</strong> Ensure you have the right to use any images or text you include in your quizzes.</p>
                    <p><strong>5. Spam:</strong> Do not create repetitive, low-quality, or "spam" quizzes designed solely to clutter the community feed.</p>
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
            <button 
                onClick={onClose}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
                I Understand
            </button>
        </div>
      </div>
    </div>
  );
};
