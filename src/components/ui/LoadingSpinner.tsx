import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'accent' | 'white' | 'neutral';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'border-neutral-200 border-t-primary-600',
    accent: 'border-neutral-200 border-t-accent-600',
    white: 'border-white/30 border-t-white',
    neutral: 'border-neutral-300 border-t-neutral-600',
  };

  const borderWidth = size === 'xs' || size === 'sm' ? 'border-2' : 'border-3';

  return (
    <div
      className={`animate-spin rounded-full ${borderWidth} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
