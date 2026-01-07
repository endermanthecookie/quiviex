
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Brain, GripHorizontal, Scaling, Settings, HelpCircle } from 'lucide-react';
import { TUTORIAL_STEPS } from '../constants';

interface TutorialWidgetProps {
  step: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export const TutorialWidget: React.FC<TutorialWidgetProps> = ({ step, onClose, onNext, onPrev, onOpenSettings, onOpenHelp }) => {
  const currentStep = TUTORIAL_STEPS[step];
  
  // Fix: Use window.innerHeight
  const [position, setPosition] = useState({ x: 20, y: (window as any).innerHeight - 300 }); // Initial position roughly bottom left
  const [size, setSize] = useState({ width: 384, height: 320 }); // Slightly taller for buttons
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    // Initial positioning to ensure it's on screen
    // Fix: Use window.innerHeight
    setPosition({ x: 20, y: (window as any).innerHeight - 350 });
  }, []);

  useEffect(() => {
    // Fix: Cast e to any for MouseEvent properties
    const handleMouseMove = (e: any) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        });
      } else if (isResizing) {
        setSize({
          width: Math.max(300, e.clientX - position.x),
          height: Math.max(250, e.clientY - position.y)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      // Fix: Use window.addEventListener
      (window as any).addEventListener('mousemove', handleMouseMove);
      (window as any).addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      // Fix: Use window.removeEventListener
      (window as any).removeEventListener('mousemove', handleMouseMove);
      (window as any).removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, position.x, position.y]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };
  
  return (
    <div 
      className="fixed bg-white rounded-2xl shadow-2xl border-2 border-red-100 z-50 flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={startDrag}
        className="bg-gradient-to-r from-red-600 to-orange-600 p-3 flex justify-between items-center text-white cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Brain size={18} />
          <span className="font-bold text-sm">Quick Tutorial</span>
        </div>
        <div className="flex items-center gap-2">
            <GripHorizontal size={16} className="opacity-50" />
            <button
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors cursor-pointer"
            >
            <X size={16} />
            </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <h3 className="font-bold text-lg text-gray-800 mb-2">
          {currentStep.title}
        </h3>
        
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {currentStep.content}
            </p>

            {currentStep.showTokenActions && (
                <div className="flex flex-col gap-2 mt-4 pb-2">
                    <button 
                        onClick={onOpenSettings}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors text-xs"
                    >
                        <Settings size={14} /> Open AI Settings
                    </button>
                    <button 
                        onClick={onOpenHelp}
                        className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors text-sm"
                    >
                        <HelpCircle size={16} /> Get Token Help
                    </button>
                </div>
            )}
        </div>

        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4 flex-shrink-0">
          <div
            className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium select-none">
            Step {step + 1} of {TUTORIAL_STEPS.length}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={onPrev}
              disabled={step === 0}
              className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            
            {step < TUTORIAL_STEPS.length - 1 ? (
              <button
                onClick={onNext}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={startResize}
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center text-gray-300 hover:text-gray-500 z-10"
      >
        <Scaling size={12} className="transform rotate-90" />
      </div>
    </div>
  );
};