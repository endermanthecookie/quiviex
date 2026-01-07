import React from 'react';

interface LogoProps {
  variant?: 'large' | 'medium' | 'small';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'medium', className = '' }) => {
  const config = {
    large: { container: 'w-24 h-24', radius: 'rounded-[30%]' },
    medium: { container: 'w-12 h-12', radius: 'rounded-[28%]' },
    small: { container: 'w-9 h-9', radius: 'rounded-[25%]' }
  };

  const { container, radius } = config[variant];

  return (
    <div className={`${container} ${radius} bg-gradient-to-br from-[#d946ef] to-[#4f46e5] flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 relative overflow-hidden ${className}`}>
      {/* Golden 4-pointed stars matching the image */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {/* Top Right Star */}
        <path 
          d="M76 24 L78 29 L83 31 L78 33 L76 38 L74 33 L69 31 L74 29 Z" 
          fill="#ffcc33" 
          className="animate-pulse" 
        />
        {/* Bottom Left Star */}
        <path 
          d="M24 62 L26 67 L31 69 L26 71 L24 76 L22 71 L17 69 L22 67 Z" 
          fill="#ffcc33" 
          style={{ animationDelay: '0.5s' }} 
          className="animate-pulse" 
        />
      </svg>
      
      {/* Refined Lightning Bolt path for 1:1 match */}
      <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] fill-white drop-shadow-sm relative z-0">
        <path d="M58 18 L32 54 H48 L42 82 L68 44 H52 Z" />
      </svg>
    </div>
  );
};