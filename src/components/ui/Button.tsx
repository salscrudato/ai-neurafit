import React, { forwardRef, type ReactNode, type ReactElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

type FitnessVariant =
  | 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
type IntensityVariant =
  | 'intensity-low' | 'intensity-medium' | 'intensity-high' | 'intensity-extreme';
type MotivationVariant =
  | 'energy' | 'power' | 'zen' | 'achievement';

export type ButtonVariant =
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'success' | 'warning' | 'error' | 'gradient' | 'glass'
  | FitnessVariant | IntensityVariant | MotivationVariant;

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    // Framer merges these; omit to avoid TS conflicts with HTMLButtonElement
    'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  pulse?: boolean;
  /** Predefined animations (maps to Tailwind `animate-*` classes) */
  animation?: 'none' | 'bounce' | 'pulse' | 'wiggle' | 'scale' | 'workout-pulse' | 'motivation-bounce';
  /** Toggle focus ring utilities */
  focusRing?: boolean;
  /** Optional text to show while loading (falls back to children) */
  loadingText?: string;
}

/** lightweight class combiner */
const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** Base visual styles (no focus ring here to keep `focusRing` togglable) */
const VARIANT_BASE: Record<ButtonVariant, string> = {
  // Core
  primary:   'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-medium hover:shadow-hard hover:shadow-glow-primary',
  secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900 shadow-medium hover:shadow-hard border border-neutral-200',
  outline:   'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white active:bg-primary-700 shadow-medium hover:shadow-hard hover:shadow-glow-primary backdrop-blur-sm',
  ghost:     'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 active:bg-neutral-200/80 backdrop-blur-sm',
  accent:    'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white shadow-medium hover:shadow-hard hover:shadow-glow-accent',
  success:   'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white shadow-medium hover:shadow-hard',
  warning:   'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white shadow-medium hover:shadow-hard',
  error:     'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white shadow-medium hover:shadow-hard',
  gradient:  'bg-gradient-primary hover:opacity-90 text-white shadow-medium hover:shadow-hard hover:shadow-glow-primary',
  glass:     'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-glass',

  // Fitness
  cardio:      'bg-gradient-cardio hover:opacity-90 text-white shadow-cardio hover:shadow-cardio-lg',
  strength:    'bg-gradient-strength hover:opacity-90 text-white shadow-strength hover:shadow-strength-lg',
  flexibility: 'bg-gradient-flexibility hover:opacity-90 text-white shadow-flexibility hover:shadow-flexibility-lg',
  recovery:    'bg-gradient-recovery hover:opacity-90 text-white shadow-recovery hover:shadow-recovery-lg',
  hiit:        'bg-gradient-hiit hover:opacity-90 text-white shadow-hiit hover:shadow-hiit-lg',
  yoga:        'bg-gradient-yoga hover:opacity-90 text-white shadow-yoga hover:shadow-yoga-lg',
  pilates:     'bg-gradient-pilates hover:opacity-90 text-white shadow-pilates hover:shadow-pilates-lg',

  // Intensity (soft → full on hover)
  'intensity-low':     'bg-gradient-flexibility-soft hover:bg-gradient-flexibility text-fitness-flexibility-800 hover:text-white shadow-flexibility',
  'intensity-medium':  'bg-gradient-strength-soft hover:bg-gradient-strength text-fitness-strength-800 hover:text-white shadow-strength',
  'intensity-high':    'bg-gradient-cardio-soft hover:bg-gradient-cardio text-fitness-cardio-800 hover:text-white shadow-cardio',
  'intensity-extreme': 'bg-gradient-hiit-soft hover:bg-gradient-hiit text-fitness-hiit-800 hover:text-white shadow-hiit',

  // Motivation
  energy:      'bg-gradient-energy hover:opacity-90 text-white shadow-energy animate-energy-wave bg-[length:200%_200%]',
  power:       'bg-gradient-power hover:opacity-90 text-white shadow-power',
  zen:         'bg-gradient-zen hover:opacity-90 text-white shadow-yoga',
  achievement: 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white shadow-achievement',
};

/** Focus ring color per variant (opt‑in via `focusRing`) */
const VARIANT_RING: Partial<Record<ButtonVariant, string>> = {
  primary: 'focus-visible:ring-primary-500',
  secondary: 'focus-visible:ring-neutral-500',
  outline: 'focus-visible:ring-primary-500',
  ghost: 'focus-visible:ring-neutral-500',
  accent: 'focus-visible:ring-accent-500',
  success: 'focus-visible:ring-success-500',
  warning: 'focus-visible:ring-warning-500',
  error: 'focus-visible:ring-error-500',
  gradient: 'focus-visible:ring-primary-500',
  glass: 'focus-visible:ring-white/50',

  cardio: 'focus-visible:ring-fitness-cardio-500',
  strength: 'focus-visible:ring-fitness-strength-500',
  flexibility: 'focus-visible:ring-fitness-flexibility-500',
  recovery: 'focus-visible:ring-fitness-recovery-500',
  hiit: 'focus-visible:ring-fitness-hiit-500',
  yoga: 'focus-visible:ring-fitness-yoga-500',
  pilates: 'focus-visible:ring-fitness-pilates-500',

  'intensity-low': 'focus-visible:ring-fitness-flexibility-500',
  'intensity-medium': 'focus-visible:ring-fitness-strength-500',
  'intensity-high': 'focus-visible:ring-fitness-cardio-500',
  'intensity-extreme': 'focus-visible:ring-fitness-hiit-500',

  energy: 'focus-visible:ring-orange-500',
  power: 'focus-visible:ring-red-500',
  zen: 'focus-visible:ring-green-500',
  achievement: 'focus-visible:ring-yellow-500',
};

/** Height/spacing are sized; icon gets its own scale */
const SIZE_ROOT: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base', // 44px touch target
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-7 text-xl',
};
const SIZE_ICON: Record<ButtonSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
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
    loadingText,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isIconOnly = !!icon && !children;
  const shouldReduceMotion = useReducedMotion();

  const motionHover = !shouldReduceMotion && !disabled && !loading ? { scale: 1.02, y: -1 } : undefined;
  const motionTap = !shouldReduceMotion && !disabled && !loading ? { scale: 0.98 } : undefined;

  const focusClasses = focusRing
    ? cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', VARIANT_RING[variant])
    : 'focus-visible:ring-0 focus-visible:ring-offset-0';

  const root = cn(
    // base
    'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300',
    'disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group touch-manipulation select-none',
    VARIANT_BASE[variant],
    SIZE_ROOT[size],
    focusClasses,
    fullWidth && 'w-full',
    glow && 'animate-glow',
    pulse && 'animate-workout-pulse',
    animation !== 'none' && `animate-${animation}`,
    isIconOnly && 'aspect-square px-0',
    className
  );

  const iconCls = cn(
    SIZE_ICON[size],
    isIconOnly ? '' : iconPosition === 'left' ? 'mr-2' : 'ml-2',
    'transition-transform duration-300 group-hover:scale-110'
  );

  const renderIcon = (node: ReactNode) => {
    if (!node) return null;
    return React.cloneElement(node as ReactElement<any>, { className: iconCls });
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={motionHover}
      whileTap={motionTap}
      className={root}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? 'polite' : undefined}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? '' : undefined}
      {...props}
    >
      {/* sheen / shimmer */}
      <div className="pointer-events-none absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300" />

      {/* content */}
      <span className="relative z-10 inline-flex items-center">
        {loading ? (
          <>
            <LoadingSpinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} className={children ? 'mr-2' : ''} />
            <span className="animate-pulse">{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && renderIcon(icon)}
            {children && <span className="transition-all duration-300 group-hover:tracking-wide">{children}</span>}
            {icon && iconPosition === 'right' && renderIcon(icon)}
            {isIconOnly && !props['aria-label'] && (
              <span className="sr-only">Button</span>
            )}
          </>
        )}
      </span>
    </motion.button>
  );
});

/* Convenience wrappers */
export const WorkoutButton: React.FC<Omit<ButtonProps, 'variant'> & { workoutType: FitnessVariant }> = ({ workoutType, ...props }) => (
  <Button {...props} variant={workoutType} />
);

export const IntensityButton: React.FC<Omit<ButtonProps, 'variant'> & { intensity: 'low' | 'medium' | 'high' | 'extreme' }> = ({
  intensity,
  ...props
}) => <Button {...props} variant={`intensity-${intensity}` as IntensityVariant} />;

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