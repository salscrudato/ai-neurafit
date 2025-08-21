import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient' |
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  striped?: boolean;
  pulse?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  showLabel = false,
  label,
  animate = true,
  striped = false,
  pulse = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  };

  const variantClasses = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gradient: 'bg-gradient-primary',
    cardio: 'bg-gradient-cardio',
    strength: 'bg-gradient-strength',
    flexibility: 'bg-gradient-flexibility',
    recovery: 'bg-gradient-recovery',
    hiit: 'bg-gradient-hiit',
    yoga: 'bg-gradient-yoga',
    pilates: 'bg-gradient-pilates',
  };

  const getProgressColor = (): string => {
    if (percentage >= 100) return 'bg-success-500';
    if (percentage >= 75) return variantClasses[variant];
    if (percentage >= 50) return variantClasses[variant];
    if (percentage >= 25) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const stripedClass = striped ? 'bg-stripes' : '';
  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {label || 'Progress'}
          </span>
          {showValue && (
            <span className="text-sm font-semibold text-neutral-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-neutral-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${getProgressColor()} ${stripedClass} ${pulseClass} h-full rounded-full transition-all duration-300`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient' | 
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  showLabel = false,
  label,
  animate = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors: Record<NonNullable<CircularProgressProps['variant']>, string> = {
    default: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    error: 'stroke-error-500',
    gradient: 'stroke-primary-500',
    cardio: 'stroke-fitness-cardio-500',
    strength: 'stroke-fitness-strength-500',
    flexibility: 'stroke-fitness-flexibility-500',
    recovery: 'stroke-fitness-recovery-500',
    hiit: 'stroke-fitness-hiit-500',
    yoga: 'stroke-fitness-yoga-500',
    pilates: 'stroke-fitness-pilates-500',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={variantColors[variant]}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : strokeDashoffset}
          animate={animate ? { strokeDashoffset } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            className="text-2xl font-bold text-neutral-900"
            initial={animate ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
        {showLabel && label && (
          <span className="text-sm text-neutral-600 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

// Fitness-specific progress components
export const WorkoutProgress: React.FC<Omit<ProgressProps, 'variant'> & { 
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
}> = ({ workoutType, ...props }) => (
  <Progress {...props} variant={workoutType} />
);

export const SetProgress: React.FC<{ 
  currentSet: number; 
  totalSets: number; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}> = ({ currentSet, totalSets, size = 'md', animate = true }) => (
  <Progress
    value={(currentSet / totalSets) * 100}
    size={size}
    variant="strength"
    showValue
    label={`Set ${currentSet} of ${totalSets}`}
    animate={animate}
  />
);

export const CalorieProgress: React.FC<{ 
  burned: number; 
  goal: number; 
  size?: number;
  animate?: boolean;
}> = ({ burned, goal, size = 120, animate = true }) => (
  <CircularProgress
    value={(burned / goal) * 100}
    size={size}
    variant="cardio"
    showValue
    label="Calories"
    animate={animate}
  />
);

export const HeartRateZone: React.FC<{ 
  currentHR: number; 
  maxHR: number; 
  size?: number;
  animate?: boolean;
}> = ({ currentHR, maxHR, size = 100, animate = true }) => {
  const percentage = (currentHR / maxHR) * 100;
  
  const getZoneVariant = () => {
    if (percentage < 50) return 'recovery';
    if (percentage < 60) return 'flexibility';
    if (percentage < 70) return 'cardio';
    if (percentage < 85) return 'strength';
    return 'hiit';
  };

  return (
    <CircularProgress
      value={percentage}
      size={size}
      variant={getZoneVariant()}
      showValue
      label="HR Zone"
      animate={animate}
    />
  );
};
