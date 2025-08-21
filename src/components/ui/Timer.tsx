import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon, FireIcon } from '@heroicons/react/24/outline';
import { Button, StartWorkoutButton, RestButton, EmergencyStopButton } from './Button';

interface TimerProps {
  initialTime: number; // in seconds
  onComplete?: () => void;
  onTick?: (timeLeft: number) => void;
  autoStart?: boolean;
  showControls?: boolean;
  className?: string;
  type?: 'workout' | 'rest' | 'preparation';
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  showMotivation?: boolean;
  warningThreshold?: number; // seconds when to show warning
  // Legacy props for backward compatibility
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  onComplete,
  onTick,
  autoStart = false,
  showControls = true,
  className = '',
  type = 'workout',
  intensity = 'medium',
  showMotivation = true,
  warningThreshold = 10,
  // Legacy props
  isActive,
  size = 'medium',
  showProgress = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart || isActive || false);
  const [isCompleted, setIsCompleted] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
    setIsCompleted(false);
  }, [initialTime]);

  const toggle = useCallback(() => {
    if (isCompleted) {
      reset();
    } else {
      setIsRunning(!isRunning);
    }
  }, [isRunning, isCompleted, reset]);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isActive !== undefined) {
      setIsRunning(isActive);
    }
  }, [isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          onTick?.(newTime);

          if (newTime === 0) {
            setIsRunning(false);
            setIsCompleted(true);
            onComplete?.();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete, onTick]);

  const progress = ((initialTime - timeLeft) / initialTime) * 100;
  const isWarning = timeLeft <= warningThreshold && timeLeft > 0;
  const isLowTime = timeLeft <= 5 && timeLeft > 0;

  const getTimerColor = () => {
    if (isCompleted) return 'text-success-500';
    if (isLowTime) return 'text-error-500';
    if (isWarning) return 'text-warning-500';

    switch (type) {
      case 'rest': return 'text-fitness-recovery-500';
      case 'preparation': return 'text-primary-500';
      default:
        switch (intensity) {
          case 'low': return 'text-fitness-flexibility-500';
          case 'medium': return 'text-fitness-strength-500';
          case 'high': return 'text-fitness-cardio-500';
          case 'extreme': return 'text-fitness-hiit-500';
          default: return 'text-primary-500';
        }
    }
  };

  const getProgressColor = () => {
    if (isCompleted) return 'text-success-500';
    if (isLowTime) return 'text-error-500';
    if (isWarning) return 'text-warning-500';
    return getTimerColor();
  };

  const getMotivationalMessage = () => {
    if (isCompleted) return "🎉 Great job!";
    if (isLowTime) return "💪 Final push!";
    if (isWarning) return "🔥 Almost there!";
    if (type === 'rest') return "😌 Take a breath";

    const messages = {
      low: ["🌱 Steady pace", "🧘 Stay focused"],
      medium: ["💪 Keep going", "🎯 You got this"],
      high: ["🔥 Push harder", "⚡ Feel the burn"],
      extreme: ["🚀 Beast mode", "💥 Unleash power"]
    };

    return messages[intensity][Math.floor(Math.random() * messages[intensity].length)];
  };

  // Legacy size mapping
  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-40 h-40',
    large: 'w-48 h-48'
  };

  const timerSize = sizeClasses[size] || 'w-40 h-40 md:w-48 md:h-48';

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      {/* Circular Progress */}
      <div className="relative">
        <motion.div
          className={`relative ${timerSize}`}
          animate={isLowTime && isRunning ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {showProgress && (
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-neutral-200 dark:text-neutral-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className={getProgressColor()}
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100),
                  filter: isLowTime ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </svg>
          )}

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={`text-3xl md:text-4xl font-mono font-bold tabular-nums ${getTimerColor()}`}
              animate={isLowTime && isRunning ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatTime(timeLeft)}
            </motion.span>

            {/* Type indicator */}
            {showMotivation && (
              <span className="text-xs uppercase tracking-wider text-neutral-500 mt-1">
                {type}
              </span>
            )}
          </div>

          {/* Intensity indicator */}
          {type === 'workout' && showMotivation && (
            <div className="absolute -top-2 -right-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                intensity === 'low' ? 'bg-fitness-flexibility-500' :
                intensity === 'medium' ? 'bg-fitness-strength-500' :
                intensity === 'high' ? 'bg-fitness-cardio-500' :
                'bg-fitness-hiit-500'
              }`}>
                {intensity === 'extreme' ? <FireIcon className="w-4 h-4" /> : intensity.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Motivational message */}
      {showMotivation && (
        <AnimatePresence mode="wait">
          <motion.div
            key={getMotivationalMessage()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <span className="text-lg font-semibold bg-gradient-energy bg-clip-text text-transparent">
              {getMotivationalMessage()}
            </span>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Enhanced Controls */}
      {showControls && (
        <div className="flex items-center space-x-3">
          {type === 'workout' ? (
            <StartWorkoutButton
              onClick={toggle}
              icon={isRunning ? <PauseIcon /> : <PlayIcon />}
              disabled={isCompleted}
            >
              {isRunning ? 'Pause' : 'Start'}
            </StartWorkoutButton>
          ) : type === 'rest' ? (
            <RestButton
              onClick={toggle}
              icon={isRunning ? <PauseIcon /> : <PlayIcon />}
            >
              {isRunning ? 'Pause Rest' : 'Start Rest'}
            </RestButton>
          ) : (
            <Button
              variant="primary"
              onClick={toggle}
              icon={isRunning ? <PauseIcon /> : <PlayIcon />}
            >
              {isCompleted ? 'Restart' : isRunning ? 'Pause' : 'Start'}
            </Button>
          )}

          <EmergencyStopButton
            onClick={reset}
            icon={<StopIcon />}
            size="md"
          >
            Reset
          </EmergencyStopButton>
        </div>
      )}

      {/* Legacy completion message */}
      {timeLeft === 0 && !showMotivation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-success-600 font-semibold"
        >
          Time's up!
        </motion.div>
      )}
    </div>
  );
};
