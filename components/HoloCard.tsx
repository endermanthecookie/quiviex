import React, { useRef } from 'react';

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
}

export const HoloCard: React.FC<HoloCardProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    cardRef.current.style.setProperty('--x', `${x * 100}%`);
    cardRef.current.style.setProperty('--y', `${y * 100}%`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden group ${className}`}
      style={{
        '--x': '50%',
        '--y': '50%'
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-soft-light"
        style={{
          background: `radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`
        }}
      />
      <div 
        className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-500 mix-blend-color-dodge"
        style={{
          background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
          transform: `translateX(calc((var(--x) - 50%) * 2)) translateY(calc((var(--y) - 50%) * 2))`
        }}
      />
      {children}
    </div>
  );
};