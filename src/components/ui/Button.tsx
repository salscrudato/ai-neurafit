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
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'energy' | 'success' | 'warning' | 'error' | 'gradient' | 'glass'
  | FitnessVariant | IntensityVariant | MotivationVariant;

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
  animation?: 'none' | 'bounce' | 'pulse' | 'wiggle' | 'scale' | 'workout-pulse' | 'motivation-bounce';
  focusRing?: boolean;
  loadingText?: string;
}

/** lightweight class combiner */
const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/**
 * Light-theme, subtle-glow base styles:
 * - Softer shadows (md → lg on hover)
 * - Lighter surfaces (white/neutral backgrounds)
 * - Reduced intensity on gradients and glass
 */
const VARIANT_BASE: Record<ButtonVariant, string> = {
  // Core (light theme)
  primary:
    'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md hover:shadow-lg',
  secondary:
    'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-sm hover:shadow-md',
  outline:
    'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100 shadow-sm hover:shadow-md',
  ghost:
    'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/70 active:bg-neutral-200/70',

  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md hover:shadow-lg',
  warning:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md hover:shadow-lg',
  error:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md hover:shadow-lg',

  // Subtle gradient (softer than before)
  gradient:
    'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg',

  // Light glass (readable on light backgrounds)
  glass:
    'bg-white/60 hover:bg-white/75 backdrop-blur-sm border border-neutral-200 text-neutral-900 shadow-sm hover:shadow-md',

  // Fitness (softened)
  cardio:      'bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  strength:    'bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  flexibility: 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  recovery:    'bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  hiit:        'bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  yoga:        'bg-gradient-to-r from-violet-500 to-cyan-400 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  pilates:     'bg-gradient-to-r from-pink-400 to-violet-500 hover:opacity-95 text-white shadow-md hover:shadow-lg',

  // Intensity (soft base → full palette on hover)
  'intensity-low':
    'bg-cyan-50 text-cyan-800 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-sky-600 hover:text-white shadow-sm hover:shadow-md',
  'intensity-medium':
    'bg-emerald-50 text-emerald-800 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-600 hover:text-white shadow-sm hover:shadow-md',
  'intensity-high':
    'bg-rose-50 text-rose-800 hover:bg-gradient-to-r hover:from-rose-500 hover:to-orange-500 hover:text-white shadow-sm hover:shadow-md',
  'intensity-extreme':
    'bg-amber-50 text-amber-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-600 hover:text-white shadow-sm hover:shadow-md',

  // Modern energy variant - Nike inspired
  energy:
    'bg-energy-500 hover:bg-energy-600 active:bg-energy-700 text-white shadow-sm hover:shadow-md',
  power:
    'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md hover:shadow-lg',
  zen:
    'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md hover:shadow-lg',
  achievement:
    'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white shadow-md hover:shadow-lg',
};

/** Focus ring color per variant (light accent ring) */
const VARIANT_RING: Partial<Record<ButtonVariant, string>> = {
  primary: 'focus-visible:ring-primary-400',
  secondary: 'focus-visible:ring-neutral-300',
  outline: 'focus-visible:ring-primary-400',
  ghost: 'focus-visible:ring-neutral-300',
  energy: 'focus-visible:ring-energy-400',
  success: 'focus-visible:ring-success-400',
  warning: 'focus-visible:ring-amber-400',
  error: 'focus-visible:ring-rose-400',
  gradient: 'focus-visible:ring-primary-400',
  glass: 'focus-visible:ring-neutral-300',

  cardio: 'focus-visible:ring-rose-300',
  strength: 'focus-visible:ring-emerald-300',
  flexibility: 'focus-visible:ring-cyan-300',
  recovery: 'focus-visible:ring-teal-300',
  hiit: 'focus-visible:ring-amber-300',
  yoga: 'focus-visible:ring-violet-300',
  pilates: 'focus-visible:ring-pink-300',

  'intensity-low': 'focus-visible:ring-cyan-300',
  'intensity-medium': 'focus-visible:ring-emerald-300',
  'intensity-high': 'focus-visible:ring-rose-300',
  'intensity-extreme': 'focus-visible:ring-amber-300',


  power: 'focus-visible:ring-red-300',
  zen: 'focus-visible:ring-teal-300',
  achievement: 'focus-visible:ring-amber-300',
};

/** Height/spacing are sized; icon gets its own scale */
const SIZE_ROOT: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base', // ≥44px touch target
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

  // Softer motion
  const motionHover =
    !shouldReduceMotion && !disabled && !loading ? { scale: 1.01, y: -0.5 } : undefined;
  const motionTap =
    !shouldReduceMotion && !disabled && !loading ? { scale: 0.985 } : undefined;

  // Subtle glow: gentle primary-tinted drop shadow (no neon)
  const subtleGlow =
    glow &&
    'shadow-lg shadow-primary-500/10 hover:shadow-primary-500/15 hover:shadow-xl';

  const focusClasses = focusRing
    ? cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', VARIANT_RING[variant])
    : 'focus-visible:ring-0 focus-visible:ring-offset-0';

  const root = cn(
    'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group touch-manipulation select-none',
    VARIANT_BASE[variant],
    SIZE_ROOT[size],
    focusClasses,
    fullWidth && 'w-full',
    subtleGlow,
    pulse && 'animate-workout-pulse',
    animation !== 'none' && `animate-${animation}`,
    isIconOnly && 'aspect-square px-0',
    className
  );

  const iconCls = cn(
    SIZE_ICON[size],
    isIconOnly ? '' : iconPosition === 'left' ? 'mr-2' : 'ml-2',
    'transition-transform duration-200 group-hover:scale-105'
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
      {/* Subtle sheen (lighter & only on hover) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

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
            {children && <span className="transition-all duration-200 group-hover:tracking-wide">{children}</span>}
            {icon && iconPosition === 'right' && renderIcon(icon)}
            {isIconOnly && !props['aria-label'] && <span className="sr-only">Button</span>}
          </>
        )}
      </span>
    </motion.button>
  );
});

/* Convenience wrappers (kept but with gentler styling by virtue of base changes) */
export const WorkoutButton: React.FC<Omit<ButtonProps, 'variant'> & { workoutType: FitnessVariant }> = ({ workoutType, ...props }) => (
  <Button {...props} variant={workoutType} />
);

export const IntensityButton: React.FC<Omit<ButtonProps, 'variant'> & { intensity: 'low' | 'medium' | 'high' | 'extreme' }> = ({
  intensity,
  ...props
}) => <Button {...props} variant={`intensity-${intensity}` as IntensityVariant} />;

export const StartWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'glow' | 'pulse'>> = (props) => (
  <Button {...props} variant="energy" glow size="lg" />
);

export const CompleteWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'animation'>> = (props) => (
  <Button {...props} variant="achievement" animation="motivation-bounce" />
);

export const RestButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="zen" />
);

export const EmergencyStopButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="error" size="lg" />
);