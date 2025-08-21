import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'accent' | 'glass' | 'elevated' |
           'workout' | 'exercise' | 'progress' | 'achievement' |
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates' |
           'intensity-low' | 'intensity-medium' | 'intensity-high' | 'intensity-extreme';
  hover?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
  glow?: boolean;
  pulse?: boolean;
  borderAccent?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hover = false,
  interactive = false,
  padding = 'md',
  className = '',
  onClick,
  animate = false,
  delay = 0,
  glow = false,
  pulse = false,
  borderAccent = false,
}) => {
  const baseClasses = 'rounded-3xl transition-all duration-300 relative overflow-hidden';

  const variantClasses = {
    default: 'bg-white shadow-medium border border-neutral-200/50 hover:border-neutral-300/70',
    gradient: 'bg-gradient-primary text-white shadow-hard shadow-glow-primary',
    accent: 'bg-gradient-accent text-white shadow-hard shadow-glow-accent',
    glass: 'backdrop-blur-md bg-white/10 border border-white/20 shadow-glass',
    elevated: 'bg-white shadow-elevated border border-neutral-100 hover:shadow-elevated-lg',

    // Fitness-specific variants
    workout: 'bg-white border-l-4 border-primary-500 shadow-medium hover:shadow-hard hover:border-primary-600',
    exercise: 'bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 hover:from-primary-50 hover:border-primary-300',
    progress: 'bg-gradient-to-br from-success-50 to-white border border-success-200 shadow-success',
    achievement: 'bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 shadow-achievement',

    // Workout type variants
    cardio: 'bg-gradient-cardio-soft border border-fitness-cardio-200 shadow-cardio hover:shadow-cardio-lg',
    strength: 'bg-gradient-strength-soft border border-fitness-strength-200 shadow-strength hover:shadow-strength-lg',
    flexibility: 'bg-gradient-flexibility-soft border border-fitness-flexibility-200 shadow-flexibility hover:shadow-flexibility-lg',
    recovery: 'bg-gradient-recovery-soft border border-fitness-recovery-200 shadow-recovery hover:shadow-recovery-lg',
    hiit: 'bg-gradient-hiit-soft border border-fitness-hiit-200 shadow-hiit hover:shadow-hiit-lg',
    yoga: 'bg-gradient-yoga-soft border border-fitness-yoga-200 shadow-yoga hover:shadow-yoga-lg',
    pilates: 'bg-gradient-pilates-soft border border-fitness-pilates-200 shadow-pilates hover:shadow-pilates-lg',

    // Intensity variants
    'intensity-low': 'bg-gradient-flexibility-soft border-l-4 border-fitness-flexibility-400 shadow-flexibility',
    'intensity-medium': 'bg-gradient-strength-soft border-l-4 border-fitness-strength-400 shadow-strength',
    'intensity-high': 'bg-gradient-cardio-soft border-l-4 border-fitness-cardio-400 shadow-cardio',
    'intensity-extreme': 'bg-gradient-hiit-soft border-l-4 border-fitness-hiit-400 shadow-hiit',
  };

  const hoverClasses = hover ? 'hover:shadow-hard hover:-translate-y-1 hover:scale-[1.01]' : '';
  const interactiveClasses = interactive ? 'cursor-pointer active:scale-[0.98] transition-transform select-none' : '';
  const glowClasses = glow ? 'animate-glow' : '';
  const pulseClasses = pulse ? 'animate-workout-pulse' : '';
  const borderAccentClasses = borderAccent ? 'ring-2 ring-primary-500/20 ring-offset-2' : '';

  const paddingClasses = {
    none: '',
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
    '2xl': 'p-12',
  };

  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${interactiveClasses} ${glowClasses} ${pulseClasses} ${borderAccentClasses} ${paddingClasses[padding]} ${className}`;

  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  } : {};

  if (animate) {
    return (
      <motion.div
        className={cardClasses}
        onClick={onClick}
        {...animationProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

// Specialized card components
export const GradientCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="gradient" />
);

export const AccentCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="accent" />
);

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="glass" />
);

export const InteractiveCard: React.FC<Omit<CardProps, 'interactive' | 'hover'>> = (props) => (
  <Card {...props} interactive hover />
);

// Fitness-specific card components
export const WorkoutCard: React.FC<Omit<CardProps, 'variant'> & {
  workoutType?: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
}> = ({ workoutType, intensity, ...props }) => {
  const variant = intensity ? `intensity-${intensity}` as const : workoutType || 'workout';
  return <Card {...props} variant={variant} hover interactive />;
};

export const ExerciseCard: React.FC<Omit<CardProps, 'variant'> & {
  isActive?: boolean;
}> = ({ isActive, ...props }) => (
  <Card
    {...props}
    variant="exercise"
    hover
    interactive
    borderAccent={isActive}
    glow={isActive}
  />
);

export const ProgressCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="progress" hover />
);

export const AchievementCard: React.FC<Omit<CardProps, 'variant' | 'glow' | 'animate'>> = (props) => (
  <Card {...props} variant="achievement" glow animate hover interactive />
);

export const StatsCard: React.FC<Omit<CardProps, 'variant' | 'hover'>> = (props) => (
  <Card {...props} variant="elevated" hover />
);

export const WorkoutTypeCard: React.FC<Omit<CardProps, 'variant'> & {
  type: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
}> = ({ type, ...props }) => (
  <Card {...props} variant={type} hover interactive />
);
