import React from 'react';

interface LogoProps {
  variant?: 'large' | 'medium' | 'small';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'medium', className = '' }) => {
  const config = {
    large: { container: 'w-32 h-32' },
    medium: { container: 'w-16 h-16' },
    small: { container: 'w-10 h-10' }
  };

  const { container } = config[variant];

  return (
    <div className={`${container} relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="brand_gradient_v2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9d33f5' }} /> 
            <stop offset="100%" style={{ stopColor: '#5c4cf4' }} />
          </linearGradient>
          
          <filter id="bolt-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="1.5" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded Square Background - Matches reference roundness */}
        <rect x="0" y="0" width="100" height="100" rx="28" fill="url(#brand_gradient_v2)" />

        {/* Golden Sparkle - Top Right (4-pointed star) */}
        <path 
          d="M 72 30 L 74 36 L 80 38 L 74 40 L 72 46 L 70 40 L 64 38 L 70 36 Z" 
          fill="#fcd34d" 
          className="animate-pulse"
          style={{ animationDuration: '2.5s' }}
        />

        {/* Golden Sparkle - Bottom Left (4-pointed star) */}
        <path 
          d="M 28 62 L 30 68 L 36 70 L 30 72 L 28 78 L 26 72 L 20 70 L 26 68 Z" 
          fill="#fcd34d" 
          className="animate-pulse"
          style={{ animationDuration: '3.5s' }}
        />

        {/* Central Lightning Bolt - Refined 1:1 shape */}
        <path 
          d="M 52 14 L 68 14 L 48 48 L 66 48 L 32 86 L 44 54 L 30 54 Z" 
          fill="white" 
          filter="url(#bolt-glow)"
        />
      </svg>
    </div>
  );
};