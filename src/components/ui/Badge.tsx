import React from 'react';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'gradient' | 'glass' |
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates' |
           'intensity-low' | 'intensity-medium' | 'intensity-high' | 'intensity-extreme' |
           'achievement-bronze' | 'achievement-silver' | 'achievement-gold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  dot?: boolean;
  glow?: boolean;
  animate?: boolean;
  pulse?: boolean;
  icon?: React.ReactElement<any> | null;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  glow = false,
  animate = false,
  pulse = false,
  icon,
  iconPosition = 'left',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center font-semibold rounded-full transition-all duration-300 select-none';

  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200 hover:bg-primary-200',
    secondary: 'bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200',
    success: 'bg-success-100 text-success-800 border border-success-200 hover:bg-success-200',
    warning: 'bg-warning-100 text-warning-800 border border-warning-200 hover:bg-warning-200',
    error: 'bg-error-100 text-error-800 border border-error-200 hover:bg-error-200',
    accent: 'bg-accent-100 text-accent-800 border border-accent-200 hover:bg-accent-200',
    gradient: 'bg-gradient-primary text-white shadow-glow-primary hover:shadow-glow-primary-lg',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-glass hover:bg-white/20',

    // Fitness-specific variants
    cardio: 'bg-fitness-cardio-100 text-fitness-cardio-800 border border-fitness-cardio-200 hover:bg-fitness-cardio-200',
    strength: 'bg-fitness-strength-100 text-fitness-strength-800 border border-fitness-strength-200 hover:bg-fitness-strength-200',
    flexibility: 'bg-fitness-flexibility-100 text-fitness-flexibility-800 border border-fitness-flexibility-200 hover:bg-fitness-flexibility-200',
    recovery: 'bg-fitness-recovery-100 text-fitness-recovery-800 border border-fitness-recovery-200 hover:bg-fitness-recovery-200',
    hiit: 'bg-fitness-hiit-100 text-fitness-hiit-800 border border-fitness-hiit-200 hover:bg-fitness-hiit-200',
    yoga: 'bg-fitness-yoga-100 text-fitness-yoga-800 border border-fitness-yoga-200 hover:bg-fitness-yoga-200',
    pilates: 'bg-fitness-pilates-100 text-fitness-pilates-800 border border-fitness-pilates-200 hover:bg-fitness-pilates-200',

    // Intensity variants
    'intensity-low': 'bg-gradient-flexibility-soft text-fitness-flexibility-800 border border-fitness-flexibility-300',
    'intensity-medium': 'bg-gradient-strength-soft text-fitness-strength-800 border border-fitness-strength-300',
    'intensity-high': 'bg-gradient-cardio-soft text-fitness-cardio-800 border border-fitness-cardio-300',
    'intensity-extreme': 'bg-gradient-hiit-soft text-fitness-hiit-800 border border-fitness-hiit-300',

    // Achievement variants
    'achievement-bronze': 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-achievement',
    'achievement-silver': 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-achievement',
    'achievement-gold': 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-achievement',
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs min-h-[20px]',
    sm: 'px-2.5 py-1 text-xs min-h-[24px]',
    md: 'px-3 py-1.5 text-sm min-h-[28px]',
    lg: 'px-4 py-2 text-base min-h-[32px]',
    xl: 'px-5 py-2.5 text-lg min-h-[36px]',
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const dotClasses: Record<Exclude<NonNullable<BadgeProps['variant']>, 'gradient' | 'glass' | 'achievement-bronze' | 'achievement-silver' | 'achievement-gold'>, string> = {
    primary: 'bg-primary-500',
    secondary: 'bg-neutral-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    accent: 'bg-accent-500',
    cardio: 'bg-fitness-cardio-500',
    strength: 'bg-fitness-strength-500',
    flexibility: 'bg-fitness-flexibility-500',
    recovery: 'bg-fitness-recovery-500',
    hiit: 'bg-fitness-hiit-500',
    yoga: 'bg-fitness-yoga-500',
    pilates: 'bg-fitness-pilates-500',
    'intensity-low': 'bg-fitness-flexibility-500',
    'intensity-medium': 'bg-fitness-strength-500',
    'intensity-high': 'bg-fitness-cardio-500',
    'intensity-extreme': 'bg-fitness-hiit-500',
  };

  const glowClass = glow ? 'animate-glow' : '';
  const pulseClass = pulse ? 'animate-pulse' : '';

  const renderIcon = (iconElement: React.ReactElement<any> | null) => {
    if (!iconElement) return null;

    return React.cloneElement(iconElement, {
      className: `${iconSizeClasses[size]} ${
        iconPosition === 'left' ? 'mr-1.5' : 'ml-1.5'
      } transition-transform duration-300`,
    });
  };

  const badgeContent = (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${glowClass} ${pulseClass} ${className}`}>
      {dot && (
        <span className={`w-2 h-2 rounded-full mr-2 ${(variant && dotClasses[variant as keyof typeof dotClasses]) || dotClasses.primary}`} />
      )}
      {icon && iconPosition === 'left' && renderIcon(icon)}
      <span className="font-medium">{children}</span>
      {icon && iconPosition === 'right' && renderIcon(icon)}
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return badgeContent;
};

// Specialized badge components
export const StatusBadge: React.FC<{ status: 'online' | 'offline' | 'busy'; children: React.ReactNode }> = ({ status, children }) => {
  const statusVariants = {
    online: 'success' as const,
    offline: 'secondary' as const,
    busy: 'warning' as const,
  };

  return (
    <Badge variant={statusVariants[status]} dot>
      {children}
    </Badge>
  );
};

export const CountBadge: React.FC<{ count: number; max?: number; className?: string }> = ({ count, max = 99, className }) => {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant="error" size="sm" className={className}>
      {displayCount}
    </Badge>
  );
};

// Fitness-specific badge components
export const WorkoutTypeBadge: React.FC<{
  type: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}> = ({ type, children, size = 'md', animate = false }) => {
  return (
    <Badge variant={type} size={size} animate={animate}>
      {children}
    </Badge>
  );
};

export const IntensityBadge: React.FC<{
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  pulse?: boolean;
}> = ({ intensity, children, size = 'sm', pulse = false }) => {
  const variant = `intensity-${intensity}` as const;

  return (
    <Badge variant={variant} size={size} pulse={pulse}>
      {children}
    </Badge>
  );
};

export const AchievementBadge: React.FC<{
  level: 'bronze' | 'silver' | 'gold';
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  animate?: boolean;
}> = ({ level, children, size = 'md', glow = true, animate = true }) => {
  const variant = `achievement-${level}` as const;

  return (
    <Badge variant={variant} size={size} glow={glow} animate={animate}>
      {children}
    </Badge>
  );
};

export const StreakBadge: React.FC<{
  days: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}> = ({ days, size = 'md', animate = true }) => {
  const getVariant = (days: number) => {
    if (days >= 30) return 'achievement-gold';
    if (days >= 14) return 'achievement-silver';
    if (days >= 7) return 'achievement-bronze';
    return 'gradient';
  };

  return (
    <Badge
      variant={getVariant(days)}
      size={size}
      animate={animate}
      glow={days >= 7}
      pulse={days >= 30}
    >
      🔥 {days} day{days !== 1 ? 's' : ''}
    </Badge>
  );
};
