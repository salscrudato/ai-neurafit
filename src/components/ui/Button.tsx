import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'success' | 'warning' | 'error' | 'gradient' | 'glass' |
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates' |
           'intensity-low' | 'intensity-medium' | 'intensity-high' | 'intensity-extreme' |
           'energy' | 'power' | 'zen' | 'achievement';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  pulse?: boolean;
  animation?: 'none' | 'bounce' | 'pulse' | 'wiggle' | 'scale' | 'workout-pulse' | 'motivation-bounce';
  focusRing?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  glow = false,
  pulse = false,
  animation = 'none',
  focusRing = true,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group touch-manipulation select-none';

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white focus:ring-primary-500 shadow-medium hover:shadow-hard hover:shadow-glow-primary',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900 focus:ring-neutral-500 shadow-medium hover:shadow-hard border border-neutral-200',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white active:bg-primary-700 focus:ring-primary-500 shadow-medium hover:shadow-hard hover:shadow-glow-primary backdrop-blur-sm',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 active:bg-neutral-200/80 focus:ring-neutral-500 backdrop-blur-sm',
    accent: 'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white focus:ring-accent-500 shadow-medium hover:shadow-hard hover:shadow-glow-accent',
    success: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white focus:ring-success-500 shadow-medium hover:shadow-hard',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white focus:ring-warning-500 shadow-medium hover:shadow-hard',
    error: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white focus:ring-error-500 shadow-medium hover:shadow-hard',
    gradient: 'bg-gradient-primary hover:opacity-90 text-white focus:ring-primary-500 shadow-medium hover:shadow-hard hover:shadow-glow-primary',
    glass: 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white focus:ring-white/50 shadow-glass',

    // Fitness-specific variants
    cardio: 'bg-gradient-cardio hover:opacity-90 text-white focus:ring-fitness-cardio-500 shadow-cardio hover:shadow-cardio-lg',
    strength: 'bg-gradient-strength hover:opacity-90 text-white focus:ring-fitness-strength-500 shadow-strength hover:shadow-strength-lg',
    flexibility: 'bg-gradient-flexibility hover:opacity-90 text-white focus:ring-fitness-flexibility-500 shadow-flexibility hover:shadow-flexibility-lg',
    recovery: 'bg-gradient-recovery hover:opacity-90 text-white focus:ring-fitness-recovery-500 shadow-recovery hover:shadow-recovery-lg',
    hiit: 'bg-gradient-hiit hover:opacity-90 text-white focus:ring-fitness-hiit-500 shadow-hiit hover:shadow-hiit-lg',
    yoga: 'bg-gradient-yoga hover:opacity-90 text-white focus:ring-fitness-yoga-500 shadow-yoga hover:shadow-yoga-lg',
    pilates: 'bg-gradient-pilates hover:opacity-90 text-white focus:ring-fitness-pilates-500 shadow-pilates hover:shadow-pilates-lg',

    // Intensity variants
    'intensity-low': 'bg-gradient-flexibility-soft hover:bg-gradient-flexibility text-fitness-flexibility-800 hover:text-white focus:ring-fitness-flexibility-500 shadow-flexibility',
    'intensity-medium': 'bg-gradient-strength-soft hover:bg-gradient-strength text-fitness-strength-800 hover:text-white focus:ring-fitness-strength-500 shadow-strength',
    'intensity-high': 'bg-gradient-cardio-soft hover:bg-gradient-cardio text-fitness-cardio-800 hover:text-white focus:ring-fitness-cardio-500 shadow-cardio',
    'intensity-extreme': 'bg-gradient-hiit-soft hover:bg-gradient-hiit text-fitness-hiit-800 hover:text-white focus:ring-fitness-hiit-500 shadow-hiit',

    // Motivational variants
    energy: 'bg-gradient-energy hover:opacity-90 text-white focus:ring-orange-500 shadow-energy animate-energy-wave bg-[length:200%_200%]',
    power: 'bg-gradient-power hover:opacity-90 text-white focus:ring-red-500 shadow-power',
    zen: 'bg-gradient-zen hover:opacity-90 text-white focus:ring-green-500 shadow-yoga',
    achievement: 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white focus:ring-yellow-500 shadow-achievement',
  };

  const sizeClasses = {
    xs: 'px-3 py-2 text-xs min-h-[32px]',
    sm: 'px-4 py-2.5 text-sm min-h-[36px]',
    md: 'px-6 py-3.5 text-base min-h-[44px]',
    lg: 'px-8 py-4.5 text-lg min-h-[48px]',
    xl: 'px-10 py-5.5 text-xl min-h-[56px]',
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const glowClasses = glow ? 'animate-glow' : '';
  const pulseClasses = pulse ? 'animate-workout-pulse' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const animationClasses = animation !== 'none' ? `animate-${animation}` : '';

  const renderIcon = (iconElement: React.ReactNode) => {
    if (!iconElement) return null;

    return React.cloneElement(iconElement as React.ReactElement<any>, {
      className: `${iconSizeClasses[size]} ${
        iconPosition === 'left' ? 'mr-2' : 'ml-2'
      } transition-transform duration-300 group-hover:scale-110`,
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${glowClasses} ${pulseClasses} ${animationClasses} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? 'polite' : undefined}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {loading ? (
          <>
            <LoadingSpinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} className="mr-2" />
            <span className="animate-pulse">{children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && renderIcon(icon)}
            <span className="transition-all duration-300 group-hover:tracking-wide">
              {children}
            </span>
            {icon && iconPosition === 'right' && renderIcon(icon)}
          </>
        )}
      </div>
    </motion.button>
  );
};

// Fitness-specific button components
export const WorkoutButton: React.FC<Omit<ButtonProps, 'variant'> & {
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
}> = ({ workoutType, ...props }) => (
  <Button {...props} variant={workoutType} />
);

export const IntensityButton: React.FC<Omit<ButtonProps, 'variant'> & {
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}> = ({ intensity, ...props }) => (
  <Button {...props} variant={`intensity-${intensity}` as any} />
);

export const StartWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'glow' | 'pulse'>> = (props) => (
  <Button {...props} variant="energy" glow pulse size="lg" />
);

export const CompleteWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'animation'>> = (props) => (
  <Button {...props} variant="achievement" animation="motivation-bounce" />
);

export const RestButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="zen" pulse />
);

export const EmergencyStopButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="error" pulse size="lg" />
);
