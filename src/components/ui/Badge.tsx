import React, { forwardRef, type ReactElement, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ===== Types ===== */
type AchievementVariant = 'achievement-bronze' | 'achievement-silver' | 'achievement-gold';

export type BadgeVariant =
  | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'gradient' | 'glass'
  | AchievementVariant;

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  glow?: boolean;
  animate?: boolean; // entrance/hover/tap micro-interactions
  pulse?: boolean;   // subtle attention animation
  icon?: ReactElement | null;
  iconPosition?: 'left' | 'right';
  srLabel?: string;  // optional screen reader label
  className?: string;
}

/* ===== Utils ===== */
const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

/* ===== Tokens -> Classes ===== */
const VARIANT_CLS: Record<BadgeVariant, string> = {
  // Core
  primary:   'bg-primary-100 text-primary-800 border border-primary-200 hover:bg-primary-200',
  secondary: 'bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200',
  success:   'bg-success-100 text-success-800 border border-success-200 hover:bg-success-200',
  warning:   'bg-warning-100 text-warning-800 border border-warning-200 hover:bg-warning-200',
  error:     'bg-error-100 text-error-800 border border-error-200 hover:bg-error-200',
  accent:    'bg-accent-100 text-accent-800 border border-accent-200 hover:bg-accent-200',
  gradient:  'bg-gradient-primary text-white shadow-glow-primary hover:shadow-glow-primary-lg',
  glass:     'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-glass hover:bg-white/20',

  // Achievements
  'achievement-bronze': 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-achievement',
  'achievement-silver': 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-achievement',
  'achievement-gold':   'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-achievement',
};

const SIZE_CLS: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-xs min-h-[20px]',
  sm: 'px-2.5 py-1 text-xs min-h-[24px]',
  md: 'px-3 py-1.5 text-sm min-h-[28px]',
  lg: 'px-4 py-2 text-base min-h-[32px]',
  xl: 'px-5 py-2.5 text-lg min-h-[36px]',
};

const ICON_CLS: Record<BadgeSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const DOT_CLS: Partial<Record<BadgeVariant, string>> = {
  primary: 'bg-primary-500',
  secondary: 'bg-neutral-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

/* ===== Component ===== */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    glow = false,
    animate = false,
    pulse = false,
    icon,
    iconPosition = 'left',
    srLabel,
    className,
    ...rest
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  const root = cn(
    'inline-flex items-center font-semibold rounded-full select-none transition-all duration-300',
    VARIANT_CLS[variant],
    SIZE_CLS[size],
    glow && !shouldReduceMotion && 'animate-glow',
    pulse && !shouldReduceMotion && 'animate-pulse',
    className
  );

  const iconClass = cn(
    ICON_CLS[size],
    icon ? (iconPosition === 'left' ? 'mr-1.5' : 'ml-1.5') : '',
    'transition-transform duration-300'
  );

  const Dot = dot ? (
    <span
      aria-hidden="true"
      className={cn('w-2 h-2 rounded-full mr-2', DOT_CLS[variant] ?? 'bg-neutral-400')}
    />
  ) : null;

  const Icon = icon
    ? React.cloneElement(icon as ReactElement<any>, { 'aria-hidden': true, className: iconClass })
    : null;

  if (animate && !shouldReduceMotion) {
    return (
      <motion.span
        ref={ref}
        className={root}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
      >
        {srLabel && <span className="sr-only">{srLabel}</span>}
        {iconPosition === 'left' && Icon}
        {Dot}
        <span className="font-medium">{children}</span>
        {iconPosition === 'right' && Icon}
      </motion.span>
    );
  }

  return (
    <span ref={ref} className={root} {...rest}>
      {srLabel && <span className="sr-only">{srLabel}</span>}
      {iconPosition === 'left' && Icon}
      {Dot}
      <span className="font-medium">{children}</span>
      {iconPosition === 'right' && Icon}
    </span>
  );
});

/* ===== Specializations ===== */

export const StatusBadge: React.FC<{
  status: 'online' | 'offline' | 'busy';
  children: ReactNode;
  size?: BadgeSize;
  className?: string;
}> = ({ status, children, size = 'sm', className }) => {
  const map: Record<'online' | 'offline' | 'busy', BadgeVariant> = {
    online: 'success',
    offline: 'secondary',
    busy: 'warning',
  };
  return (
    <Badge variant={map[status]} size={size} dot srLabel={`Status: ${status}`} className={className}>
      {children}
    </Badge>
  );
};

export const CountBadge: React.FC<{
  count: number;
  max?: number;
  className?: string;
  size?: BadgeSize;
  ariaLabel?: string;
}> = ({ count, max = 99, className, size = 'sm', ariaLabel }) => {
  const display = count > max ? `${max}+` : `${count}`;
  return (
    <Badge
      variant="error"
      size={size}
      className={className}
      srLabel={ariaLabel ?? `Count ${display}`}
    >
      {display}
    </Badge>
  );
};



export const AchievementBadge: React.FC<{
  level: 'bronze' | 'silver' | 'gold';
  children: ReactNode;
  size?: BadgeSize;
  glow?: boolean;
  animate?: boolean;
}> = ({ level, children, size = 'md', glow = true, animate = true }) => {
  const variant = `achievement-${level}` as AchievementVariant;
  return (
    <Badge
      variant={variant}
      size={size}
      glow={glow}
      animate={animate}
      srLabel={`Achievement level: ${level}`}
    >
      {children}
    </Badge>
  );
};

export const StreakBadge: React.FC<{
  days: number;
  size?: BadgeSize;
  animate?: boolean;
}> = ({ days, size = 'md', animate = true }) => {
  const variant: BadgeVariant =
    days >= 30 ? 'achievement-gold'
      : days >= 14 ? 'achievement-silver'
      : days >= 7 ? 'achievement-bronze'
      : 'gradient';

  return (
    <Badge
      variant={variant}
      size={size}
      animate={animate}
      glow={days >= 7}
      pulse={days >= 30}
      srLabel={`Streak ${days} day${days !== 1 ? 's' : ''}`}
    >
      🔥 {days} day{days !== 1 ? 's' : ''}
    </Badge>
  );
};