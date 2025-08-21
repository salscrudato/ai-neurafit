import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined' | 'glass' | 'fitness';
  inputSize?: 'sm' | 'md' | 'lg';
  showPasswordToggle?: boolean;
  animate?: boolean;
  focusRing?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  success,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  variant = 'default',
  inputSize = 'md',
  showPasswordToggle = false,
  animate = false,
  focusRing = true,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'text' : 'password')
    : type;

  const baseClasses = 'transition-all duration-300 focus:outline-none placeholder-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-5 py-4 text-lg rounded-2xl',
  };

  const variantClasses = {
    default: 'border border-neutral-300 bg-white hover:border-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    filled: 'border-0 bg-neutral-100 hover:bg-neutral-200 focus:ring-2 focus:ring-primary-500 focus:bg-white',
    outlined: 'border-2 border-neutral-300 bg-transparent hover:border-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    glass: 'border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60',
    fitness: 'border border-primary-200 bg-gradient-to-r from-primary-50 to-white hover:from-primary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-400',
  };

  const getStateClasses = () => {
    if (error) return 'border-error-300 focus:ring-error-500 focus:border-error-500 bg-error-50';
    if (success) return 'border-success-300 focus:ring-success-500 focus:border-success-500 bg-success-50';
    return variantClasses[variant];
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const hasIcon = icon || error || success || (showPasswordToggle && type === 'password');
  const iconPadding = hasIcon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : '';
  const focusRingClass = focusRing ? 'focus:ring-offset-2' : 'focus:ring-offset-0';

  const inputContent = (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <motion.label
          className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${
            variant === 'glass' ? 'text-white' :
            error ? 'text-error-600' :
            success ? 'text-success-600' :
            'text-neutral-700'
          }`}
          animate={animate ? { opacity: [0, 1], y: [-10, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </motion.label>
      )}

      <div className="relative group">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <div className={`w-5 h-5 transition-colors duration-200 ${
              variant === 'glass' ? 'text-white/60' :
              error ? 'text-error-400' :
              success ? 'text-success-400' :
              isFocused ? 'text-primary-500' : 'text-neutral-400'
            }`}>
              {icon}
            </div>
          </div>
        )}

        <motion.input
          ref={ref}
          type={inputType}
          className={`${baseClasses} ${sizeClasses[inputSize]} ${getStateClasses()} ${widthClass} ${iconPadding} ${focusRingClass} ${className}`}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          animate={animate ? {
            scale: isFocused ? 1.02 : 1,
            transition: { duration: 0.2 }
          } : {}}
          {...props}
        />

        {/* Right Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-2">
          {/* Success Icon */}
          {success && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <CheckCircleIcon className="w-5 h-5 text-success-500" />
            </motion.div>
          )}

          {/* Error Icon */}
          {error && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <ExclamationCircleIcon className="w-5 h-5 text-error-500" />
            </motion.div>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`p-1 rounded-md transition-colors duration-200 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                variant === 'glass' ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Right Icon */}
          {icon && iconPosition === 'right' && !error && !success && (
            <div className={`w-5 h-5 transition-colors duration-200 ${
              variant === 'glass' ? 'text-white/60' :
              isFocused ? 'text-primary-500' : 'text-neutral-400'
            }`}>
              {icon}
            </div>
          )}
        </div>

        {/* Focus Ring Animation */}
        {isFocused && animate && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-primary-500 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Helper Text / Error / Success Messages */}
      <AnimatePresence mode="wait">
        {(error || success || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {error && (
              <p className="text-sm text-error-600 flex items-center">
                <ExclamationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-sm text-success-600 flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {success}
              </p>
            )}
            {!error && !success && helperText && (
              <p className={`text-sm ${variant === 'glass' ? 'text-white/60' : 'text-neutral-500'}`}>
                {helperText}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {inputContent}
      </motion.div>
    );
  }

  return inputContent;
});

Input.displayName = 'Input';

// Fitness-specific input components
export const WeightInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'> & { unit?: 'lbs' | 'kg' }>(
  ({ unit = 'lbs', ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="number"
      variant="fitness"
      icon={<span className="text-xs font-semibold">{unit}</span>}
      iconPosition="right"
      min="0"
      step="0.5"
    />
  )
);

export const RepsInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  (props, ref) => (
    <Input
      {...props}
      ref={ref}
      type="number"
      variant="fitness"
      icon={<span className="text-xs font-semibold">reps</span>}
      iconPosition="right"
      min="1"
      step="1"
    />
  )
);

export const DurationInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  (props, ref) => (
    <Input
      {...props}
      ref={ref}
      type="number"
      variant="fitness"
      icon={<span className="text-xs font-semibold">min</span>}
      iconPosition="right"
      min="1"
      step="1"
    />
  )
);

export const HeartRateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  (props, ref) => (
    <Input
      {...props}
      ref={ref}
      type="number"
      variant="fitness"
      icon={<span className="text-xs font-semibold">bpm</span>}
      iconPosition="right"
      min="40"
      max="220"
      step="1"
    />
  )
);

WeightInput.displayName = 'WeightInput';
RepsInput.displayName = 'RepsInput';
DurationInput.displayName = 'DurationInput';
HeartRateInput.displayName = 'HeartRateInput';
