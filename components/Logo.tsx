import React from 'react';

interface LogoProps {
  variant?: 'large' | 'medium' | 'small';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'medium', className = '' }) => {
  const config = {
    large: { container: 'w-20 h-20' }, // Reduced from w-24
    medium: { container: 'w-8 h-8' },  // Reduced from w-9
    small: { container: 'w-6 h-6' }    // Reduced from w-7
  };

  const { container } = config[variant];

  return (
    <div className={`${container} relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="q_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" style={{ stopColor: '#6366f1' }} /> {/* Indigo */}
            <stop offset="100%" style={{ stopColor: '#d946ef' }} /> {/* Fuchsia */}
          </linearGradient>
        </defs>

        {/* 
            Q Ring (Donut shape)
            Center: 50,50
            Outer Radius: 35
            Inner Radius: 23
            Stroke width: 12
        */}
        <path 
            d="M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15 Z M 50 27 A 23 23 0 1 1 50 73 A 23 23 0 1 1 50 27 Z" 
            fill="url(#q_grad)" 
            fillRule="evenodd"
        />

        {/* 
            Lightning Bolt Tail
            Positioned to form the 'Q' tail (SE).
            Rotated -45 degrees to align diagonal.
            No stroke, seamless gradient merge.
        */}
        <g transform="translate(69, 69) rotate(-45)">
            <path
                d="M -7 -25 H 7 L -1 -5 H 9 L -4 35 L 1 5 H -9 Z"
                fill="url(#q_grad)"
            />
        </g>
      </svg>
    </div>
  );
};