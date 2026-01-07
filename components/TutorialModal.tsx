import React from 'react';
import { X } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

interface TutorialModalProps {
  step: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ step, onClose, onNext, onPrev }) => {
  const currentStep = TUTORIAL_STEPS[step];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-800">
              {currentStep.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          {currentStep.content}
        </p>
        
        <div className="flex gap-3 justify-between">
          <button
            onClick={onPrev}
            disabled={step === 0}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 font-bold rounded-xl transition-colors"
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-500 flex items-center">
            {step + 1} / {TUTORIAL_STEPS.length}
          </div>
          
          {step < TUTORIAL_STEPS.length - 1 ? (
            <button
              onClick={onNext}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};