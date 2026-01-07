import React from 'react';

interface LogoProps {
  variant?: 'large' | 'medium' | 'small';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'medium', className = '' }) => {
  const config = {
    large: { container: 'w-20 h-20', radius: 'rounded-[1.5rem]' },
    medium: { container: 'w-10 h-10', radius: 'rounded-xl' },
    small: { container: 'w-8 h-8', radius: 'rounded-lg' }
  };

  const { container, radius } = config[variant];

  return (
    <div className={`${container} ${radius} bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] fill-white filter drop-shadow-md">
        <path d="M55 5L25 55H48L42 95L75 40H50L55 5Z" />
      </svg>
    </div>
  );
};