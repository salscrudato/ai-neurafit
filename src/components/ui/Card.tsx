// src/components/ui/Card.tsx
import React, { type KeyboardEvent, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;

  /** Visual style */
  variant?:
    | 'default'
    | 'gradient'
    | 'accent'
    | 'glass'
    | 'elevated'
    // Fitness presets
    | 'workout'
    | 'exercise'
    | 'progress'
    | 'achievement'
    | 'cardio'
    | 'strength'
    | 'flexibility'
    | 'recovery'
    | 'hiit'
    | 'yoga'
    | 'pilates'
    // Intensities
    | 'intensity-low'
    | 'intensity-medium'
    | 'intensity-high'
    | 'intensity-extreme';

  /** Hover lift/scale */
  hover?: boolean;

  /** Adds button-like affordances (cursor, space/enter activation, focus ring) */
  interactive?: boolean;

  /** Internal padding scale */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /** Additional classes */
  className?: string;

  /** Click handler (enables keyboard activation when `interactive`) */
  onClick?: () => void;

  /** Fade/slide-in on mount */
  animate?: boolean;

  /** Stagger delay (seconds) */
  delay?: number;

  /** Soft glow keyframe */
  glow?: boolean;

  /** Pulse keyframe (fitness vibe) */
  pulse?: boolean;

  /** Subtle ring to call attention */
  borderAccent?: boolean;

  /** Busy state overlay + skeleton shimmer */
  loading?: boolean;

  /** Optional title/subtitle for quick use (or use slot components below) */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;

  /** ARIA label for interactive cards without visible text */
  ariaLabel?: string;
}

/** Lightweight utility */
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

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
  loading = false,
  title,
  subtitle,
  ariaLabel,
}) => {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const subId = useId();

  const base =
    'relative overflow-hidden rounded-3xl transition-all duration-300 focus:outline-none';
  const focusRing =
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';
  const pressable =
    interactive ? 'cursor-pointer select-none will-change-transform' : '';

  const paddingMap = {
    none: '',
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
    '2xl': 'p-12',
  } as const;

  const variantMap: Record<NonNullable<CardProps['variant']>, string> = {
    default:
      'bg-background border border-border/50 shadow-medium hover:border-neutral-300/70',
    gradient:
      'bg-gradient-primary text-white shadow-hard shadow-glow-primary',
    accent:
      'bg-gradient-accent text-white shadow-hard shadow-glow-accent',
    glass:
      'backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-glass',
    elevated:
      'bg-background border border-border/30 shadow-elevated',

    // Fitness-specific presets
    workout:
      'bg-background border-l-4 border-primary-500 shadow-medium hover:shadow-hard hover:border-primary-600',
    exercise:
      'bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 hover:from-primary-50/60 hover:border-primary-300',
    progress:
      'bg-gradient-to-br from-success-50 to-white border border-success-200 shadow-soft',
    achievement:
      'bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 shadow-achievement',

    // Workout type variants
    cardio:
      'bg-gradient-cardio-soft border border-fitness-cardio-200 shadow-cardio hover:shadow-cardio-lg',
    strength:
      'bg-gradient-strength-soft border border-fitness-strength-200 shadow-strength hover:shadow-strength-lg',
    flexibility:
      'bg-gradient-flexibility-soft border border-fitness-flexibility-200 shadow-flexibility hover:shadow-flexibility-lg',
    recovery:
      'bg-gradient-recovery-soft border border-fitness-recovery-200 shadow-recovery hover:shadow-recovery-lg',
    hiit:
      'bg-gradient-hiit-soft border border-fitness-hiit-200 shadow-hiit hover:shadow-hiit-lg',
    yoga:
      'bg-gradient-yoga-soft border border-fitness-yoga-200 shadow-yoga hover:shadow-yoga-lg',
    pilates:
      'bg-gradient-pilates-soft border border-fitness-pilates-200 shadow-pilates hover:shadow-pilates-lg',

    // Intensities
    'intensity-low':
      'bg-gradient-flexibility-soft border-l-4 border-fitness-flexibility-400 shadow-flexibility',
    'intensity-medium':
      'bg-gradient-strength-soft border-l-4 border-fitness-strength-400 shadow-strength',
    'intensity-high':
      'bg-gradient-cardio-soft border-l-4 border-fitness-cardio-400 shadow-cardio',
    'intensity-extreme':
      'bg-gradient-hiit-soft border-l-4 border-fitness-hiit-400 shadow-hiit',
  };

  const hoverFx = hover ? 'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-hard' : '';
  const glowFx = glow ? 'animate-glow' : '';
  const pulseFx = pulse ? 'animate-workout-pulse' : '';
  const ringFx = borderAccent ? 'ring-2 ring-primary-500/20 ring-offset-2' : '';

  const classes = cx(
    base,
    focusRing,
    pressable,
    variantMap[variant],
    paddingMap[padding],
    hoverFx,
    glowFx,
    pulseFx,
    ringFx,
    className
  );

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: reduceMotion ? 0 : 0.5, delay },
      }
    : {};

  const whileHover = interactive && !reduceMotion ? { y: -2, scale: 1.01 } : {};
  const whileTap = interactive && !reduceMotion ? { scale: 0.98 } : {};

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      {...motionProps}
      whileHover={whileHover}
      whileTap={whileTap}
      className={classes}
      data-variant={variant}
      role={interactive ? 'button' : 'group'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive && ariaLabel ? ariaLabel : undefined}
      aria-busy={loading || undefined}
      aria-describedby={subtitle ? subId : undefined}
      aria-labelledby={title ? headingId : undefined}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      {/* Optional quick header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3
              id={headingId}
              className={cx(
                'text-lg font-semibold text-neutral-900',
                variant === 'gradient' || variant === 'accent' ? 'text-white' : ''
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              id={subId}
              className={cx(
                'mt-1 text-sm text-neutral-600',
                variant === 'gradient' || variant === 'accent' ? 'text-white/80' : ''
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="relative">{children}</div>

      {/* Loading overlay */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/60">
          <div className="absolute inset-0 shimmer" />
        </div>
      )}
    </motion.div>
  );
};

/* ---------- Slots (optional, composable) ---------- */

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cx('mb-4 flex items-start justify-between gap-3', className)}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3 className={cx('text-lg font-semibold text-neutral-900', className)}>
    {children}
  </h3>
);

export const CardSubtitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <p className={cx('text-sm text-neutral-600', className)}>{children}</p>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cx('relative', className)}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cx('mt-6 pt-4 border-t border-border', className)}>{children}</div>;

export const CardDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('my-4 border-t border-border', className)} />
);

/* ---------- Specialized Cards (preserved API) ---------- */

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

// Fitness-specific specializations
export const WorkoutCard: React.FC<
  Omit<CardProps, 'variant'> & {
    workoutType?: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
    intensity?: 'low' | 'medium' | 'high' | 'extreme';
  }
> = ({ workoutType, intensity, ...props }) => {
  const variant = (intensity ? `intensity-${intensity}` : workoutType || 'workout') as CardProps['variant'];
  return <Card {...props} variant={variant} hover interactive />;
};

export const ExerciseCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="exercise" hover interactive borderAccent />
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

export const WorkoutTypeCard: React.FC<
  Omit<CardProps, 'variant'> & { type: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates' }
> = ({ type, ...props }) => <Card {...props} variant={type} hover interactive />;