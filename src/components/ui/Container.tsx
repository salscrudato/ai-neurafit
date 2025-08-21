import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-4 sm:px-6 sm:py-6',
    md: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
    lg: 'px-4 py-8 sm:px-6 sm:py-12 lg:px-8',
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Specialized containers
export const PageContainer: React.FC<Omit<ContainerProps, 'size' | 'padding'> & { children: React.ReactNode }> = ({ children, className = '' }) => (
  <Container size="xl" padding="lg" className={className}>
    {children}
  </Container>
);

export const SectionContainer: React.FC<Omit<ContainerProps, 'size' | 'padding'> & { children: React.ReactNode }> = ({ children, className = '' }) => (
  <Container size="lg" padding="md" className={className}>
    {children}
  </Container>
);
