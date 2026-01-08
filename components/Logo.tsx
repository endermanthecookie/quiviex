import React from 'react';

interface LogoProps {
  variant?: 'large' | 'medium' | 'small';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'medium', className = '' }) => {
  // Config determines the container size
  const config = {
    large: { container: 'w-32 h-32' },
    medium: { container: 'w-16 h-16' },
    small: { container: 'w-10 h-10' }
  };

  const { container } = config[variant];

  return (
    <div className={`${container} flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${className}`}>
      <img 
        src="/image.png" 
        alt="Quiviex Logo" 
        className="w-full h-full object-contain drop-shadow-md"
      />
    </div>
  );
};