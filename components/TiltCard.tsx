import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  // Fix: Added style prop to TiltCardProps to resolve assignability error in QuizHome.tsx
  style?: React.CSSProperties;
}

export const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', onClick, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shadow, setShadow] = useState('');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Calculate position relative to center (-1 to 1)
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    
    // Rotate values
    const rotateX = y * -8; // Invert Y for tilt
    const rotateY = x * 8;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setShadow(`${-x * 20}px ${-y * 20}px 30px rgba(0,0,0,0.1)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setShadow('');
  };

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-200 ease-out transform-gpu`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ 
        transform, 
        boxShadow: shadow,
        transformStyle: 'preserve-3d',
        // Fix: spread the style prop onto the div
        ...style
      }}
    >
      {children}
    </div>
  );
};