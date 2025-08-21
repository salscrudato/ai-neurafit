import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';

interface SuspenseFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCard?: boolean;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  message = 'Loading...',
  size = 'md',
  showCard = false
}) => {
  const sizeClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[400px]',
    lg: 'min-h-[600px]',
    full: 'min-h-screen'
  };

  const content = (
    <div className={`${sizeClasses[size]} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">{message}</h3>
        <p className="text-neutral-600">Please wait while we load your content...</p>
      </motion.div>
    </div>
  );

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return content;
};

// Specialized fallbacks for different sections
export const PageSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <SuspenseFallback message={message} size="full" />
);

export const ComponentSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading component...' 
}) => (
  <SuspenseFallback message={message} size="md" showCard />
);

export const InlineSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <SuspenseFallback message={message} size="sm" />
);

// Skeleton loading components
export const SkeletonCard: React.FC = () => (
  <Card className="animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
      <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      <div className="h-32 bg-neutral-200 rounded"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-neutral-200 rounded w-20"></div>
        <div className="h-8 bg-neutral-200 rounded w-24"></div>
      </div>
    </div>
  </Card>
);

export const SkeletonWorkoutCard: React.FC = () => (
  <Card className="animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-neutral-200 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-neutral-200 rounded-full w-16"></div>
          <div className="h-6 bg-neutral-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  </Card>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);
