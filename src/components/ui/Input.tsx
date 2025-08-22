import React, { forwardRef, useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    | 'size'
    | 'onDrag'
    | 'onDragEnd'
    | 'onDragStart'
    | 'onAnimationStart'
    | 'onAnimationEnd'
  > {
  label?: string;
  error?: string;
  helperText?: string;
  success?: string;
  /** left/right adornment icon/content (non-interactive) */
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  /** visual style */
  variant?: 'default' | 'filled' | 'outlined' | 'glass' | 'fitness';
  inputSize?: 'sm' | 'md' | 'lg';
  /** only active when type="password" */
  showPasswordToggle?: boolean;
  /** subtle entrance / focus animations */
  animate?: boolean;
  /** include offset ring utilities on focus */
  focusRing?: boolean;
}

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(' ');

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
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
    id,
    required,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const reactId = useId();
  const fieldId = id ?? `nf-input-${reactId}`;
  const shouldReduceMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType =
    showPasswordToggle && type === 'password'
      ? showPassword
        ? 'text'
        : 'password'
      : type;

  /* --------- sizing & paddings --------- */
  const sizeCls: Record<NonNullable<InputProps['inputSize']>, string> = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-5 py-4 text-lg rounded-2xl',
  };

  /* When both sides have adornments, pad both */
  const hasLeftIcon = !!icon && iconPosition === 'left';
  const hasRightIcon = !!icon && iconPosition === 'right';
  const hasToggle = showPasswordToggle && type === 'password';
  const needsLeftPad = hasLeftIcon;
  const needsRightPad = hasRightIcon || hasToggle || !!error || !!success;

  const leftPadCls = needsLeftPad ? 'pl-12' : '';
  const rightPadCls = needsRightPad ? 'pr-12' : '';

  /* --------- visual variants (aligned to tokens) --------- */
  const tokenDefault = 'input-field';
  const tokenFilled = 'input-field-filled';

  const variantBase: Record<NonNullable<InputProps['variant']>, string> = {
    default: tokenDefault,
    filled: tokenFilled,
    outlined:
      'border-2 border-neutral-300 bg-transparent hover:border-neutral-400 focus:ring-2 focus:ring-energy-500 focus:border-energy-500',
    glass:
      'border border-white/30 bg-white/80 backdrop-blur-md hover:bg-white/90 focus:ring-2 focus:ring-energy-500 focus:border-energy-500 text-neutral-900 placeholder-neutral-500',
    fitness:
      'border border-energy-200 bg-gradient-to-r from-energy-50 to-white hover:from-energy-100 focus:ring-2 focus:ring-energy-500 focus:border-energy-400',
  };

  const stateVariant = () => {
    if (error) return 'border-error-300 focus:ring-error-500 focus:border-error-500 bg-error-50';
    if (success) return 'border-success-300 focus:ring-success-500 focus:border-success-500 bg-success-50';
    return variantBase[variant];
    // Note: tokenDefault and tokenFilled include base border/bg/ring in CSS.
  };

  const focusRingCls = focusRing
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
    : 'focus-visible:ring-0 focus-visible:ring-offset-0';

  const baseInput =
    'transition-all duration-300 focus:outline-none placeholder-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const describedByIds = [
    helperText ? `${fieldId}-desc` : null,
    error ? `${fieldId}-err` : null,
    success ? `${fieldId}-ok` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const labelColor =
    variant === 'glass'
      ? 'text-white'
      : error
      ? 'text-error-600'
      : success
      ? 'text-success-600'
      : 'text-neutral-700';

  /* ------------------ markup ------------------ */
  const content = (
    <div className={fullWidth ? 'w-full' : undefined}>
      {label && (
        <motion.label
          htmlFor={fieldId}
          className={cx('block text-sm font-semibold mb-2 transition-colors duration-200', labelColor)}
          animate={animate && !shouldReduceMotion ? { opacity: [0, 1], y: [-10, 0] } : undefined}
          transition={{ duration: 0.25 }}
        >
          {label}
          {required && <span className="text-error-600 ml-1">*</span>}
        </motion.label>
      )}

      <div className="relative group">
        {/* Left adornment */}
        {hasLeftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <div
              className={cx(
                'w-5 h-5 transition-colors duration-200',
                variant === 'glass'
                  ? 'text-white/70'
                  : error
                  ? 'text-error-500'
                  : success
                  ? 'text-success-500'
                  : isFocused
                  ? 'text-primary-500'
                  : 'text-neutral-400'
              )}
            >
              {icon}
            </div>
          </div>
        )}

        {/* Input */}
        <motion.input
          id={fieldId}
          ref={ref}
          type={inputType}
          aria-invalid={!!error || undefined}
          aria-describedby={describedByIds || undefined}
          required={required}
          className={cx(
            baseInput,
            sizeCls[inputSize],
            stateVariant(),
            focusRingCls,
            leftPadCls,
            rightPadCls,
            fullWidth && 'w-full',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          animate={
            animate && !shouldReduceMotion
              ? { scale: isFocused ? 1.02 : 1, transition: { duration: 0.18 } }
              : undefined
          }
          {...props}
        />

        {/* Right adornments */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1.5">
          {/* success / error */}
          {success && !error && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              aria-hidden="true"
            >
              <CheckCircleIcon className="w-5 h-5 text-success-500" />
            </motion.span>
          )}
          {error && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              aria-hidden="true"
            >
              <ExclamationCircleIcon className="w-5 h-5 text-error-500" />
            </motion.span>
          )}

          {/* password toggle (interactive) */}
          {hasToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className={cx(
                'p-1 rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                variant === 'glass'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          )}

          {/* right icon (non-interactive) */}
          {hasRightIcon && !error && !success && (
            <span
              className={cx(
                'w-5 h-5 transition-colors duration-200',
                variant === 'glass'
                  ? 'text-white/70'
                  : isFocused
                  ? 'text-primary-500'
                  : 'text-neutral-400'
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>

        {/* Focus halo */}
        {isFocused && animate && !shouldReduceMotion && (
          <motion.div
            className={cx(
              'absolute inset-0 pointer-events-none rounded-xl',
              variant === 'glass' ? 'border-2 border-white/50' : 'border-2 border-primary-500'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {(error || success || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2"
          >
            {error && (
              <p id={`${fieldId}-err`} role="alert" className="text-sm text-error-600 flex items-center">
                <ExclamationCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {error}
              </p>
            )}
            {success && !error && (
              <p id={`${fieldId}-ok`} className="text-sm text-success-600 flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                {success}
              </p>
            )}
            {!error && !success && helperText && (
              <p
                id={`${fieldId}-desc`}
                className={cx('text-sm', variant === 'glass' ? 'text-white/70' : 'text-neutral-500')}
              >
                {helperText}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (animate && !shouldReduceMotion) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {content}
      </motion.div>
    );
  }
  return content;
});

Input.displayName = 'Input';

/* ===================== Fitness-specific inputs ===================== */

export const WeightInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type' | 'icon' | 'inputSize'> & { unit?: 'lbs' | 'kg' }
>(function WeightInput({ unit = 'lbs', ...props }, ref) {
  return (
    <Input
      {...props}
      ref={ref}
      type="number"
      variant="fitness"
      icon={<span className="text-xs font-semibold">{unit}</span>}
      iconPosition="right"
      min="0"
      step="0.5"
      inputMode="decimal"
    />
  );
});

export const RepsInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  function RepsInput(props, ref) {
    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        variant="fitness"
        icon={<span className="text-xs font-semibold">reps</span>}
        iconPosition="right"
        min="1"
        step="1"
        inputMode="numeric"
      />
    );
  }
);

export const DurationInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  function DurationInput(props, ref) {
    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        variant="fitness"
        icon={<span className="text-xs font-semibold">min</span>}
        iconPosition="right"
        min="1"
        step="1"
        inputMode="numeric"
      />
    );
  }
);

export const HeartRateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'icon' | 'inputSize'>>(
  function HeartRateInput(props, ref) {
    return (
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
        inputMode="numeric"
      />
    );
  }
);

WeightInput.displayName = 'WeightInput';
RepsInput.displayName = 'RepsInput';
DurationInput.displayName = 'DurationInput';
HeartRateInput.displayName = 'HeartRateInput';