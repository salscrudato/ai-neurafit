// src/components/ui/Card.tsx
import React, { type KeyboardEvent, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;

  /** Visual style */
  variant?:
    | 'default'
    | 'gradient'
    | 'glass'
    | 'elevated'
    | 'energy'
    | 'workout'
    | 'exercise'
    | 'achievement';

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
      'bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300',
    gradient:
      'bg-gradient-primary text-white shadow-md',
    glass:
      'backdrop-blur-md bg-white/80 border border-white/30 shadow-glass',
    elevated:
      'bg-white border border-neutral-100 shadow-elevated',
    energy:
      'bg-gradient-energy text-white shadow-md',
    workout:
      'bg-white border-l-4 border-energy-500 shadow-sm hover:shadow-md hover:border-energy-600',
    exercise:
      'bg-white border border-neutral-200 hover:border-primary-300 shadow-sm hover:shadow-md',
    achievement:
      'bg-gradient-to-br from-success-50 to-white border border-success-200 shadow-sm',
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
                variant === 'gradient' || variant === 'glass' ? 'text-white' : ''
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
                variant === 'gradient' || variant === 'glass' ? 'text-white/80' : ''
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

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="glass" />
);

export const InteractiveCard: React.FC<Omit<CardProps, 'interactive' | 'hover'>> = (props) => (
  <Card {...props} interactive hover />
);

export const WorkoutCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="workout" hover interactive />
);

export const AchievementCard: React.FC<Omit<CardProps, 'variant' | 'glow' | 'animate'>> = (props) => (
  <Card {...props} variant="achievement" glow animate hover interactive />
);

export const StatsCard: React.FC<Omit<CardProps, 'variant' | 'hover'>> = (props) => (
  <Card {...props} variant="elevated" hover />
);