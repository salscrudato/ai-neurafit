import React, { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { FocusTrap } from './AccessibilityProvider';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'workout' | 'achievement';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
}) => {
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const variantClasses = {
    default: 'bg-white border border-neutral-200',
    success: 'bg-white border border-success-200 shadow-success',
    warning: 'bg-white border border-warning-200 shadow-warning',
    error: 'bg-white border border-error-200 shadow-error',
    workout: 'bg-gradient-to-br from-primary-50 to-white border border-primary-200 shadow-glow-primary',
    achievement: 'bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 shadow-achievement',
  };

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants: Variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: {
        duration: 0.2
      }
    },
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      // Move focus to modal container for accessibility
      modalRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Modal */}
          <FocusTrap active={isOpen}>
            <motion.div
              ref={modalRef}
              className={`relative w-full ${sizeClasses[size]} ${variantClasses[variant]} rounded-3xl shadow-elevated-lg overflow-hidden ${className}`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${titleId}-title` : undefined}
              tabIndex={-1}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                  {title && (
                    <h2 id={`${titleId}-title`} className="text-xl font-bold text-neutral-900">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      icon={<XMarkIcon />}
                      aria-label="Close modal"
                      className="ml-auto"
                    />
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </FocusTrap>
        </div>
      )}
    </AnimatePresence>
  );
};

// Fitness-specific modal components
export const WorkoutCompleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  workoutData: {
    name: string;
    duration: number;
    calories: number;
    exercises: number;
  };
  onSaveWorkout?: () => void;
  onShareWorkout?: () => void;
}> = ({ isOpen, onClose, workoutData, onSaveWorkout, onShareWorkout }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="🎉 Workout Complete!"
    variant="achievement"
    size="md"
  >
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-neutral-900">{workoutData.name}</h3>
        <p className="text-neutral-600">Great job completing your workout!</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{workoutData.duration}</div>
          <div className="text-sm text-neutral-500">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fitness-cardio-600">{workoutData.calories}</div>
          <div className="text-sm text-neutral-500">Calories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fitness-strength-600">{workoutData.exercises}</div>
          <div className="text-sm text-neutral-500">Exercises</div>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button variant="primary" onClick={onSaveWorkout} fullWidth>
          Save Workout
        </Button>
        <Button variant="secondary" onClick={onShareWorkout} fullWidth>
          Share
        </Button>
      </div>
    </div>
  </Modal>
);

export const RestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  restTime: number;
  nextExercise?: string;
  onSkipRest?: () => void;
}> = ({ isOpen, onClose, restTime, nextExercise, onSkipRest }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="😌 Rest Time"
    variant="workout"
    size="sm"
    closeOnOverlayClick={false}
  >
    <div className="text-center space-y-6">
      <div className="text-6xl font-mono font-bold text-fitness-recovery-500">
        {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
      </div>
      
      {nextExercise && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-600">Next up:</p>
          <p className="font-semibold text-neutral-900">{nextExercise}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <Button variant="zen" onClick={onClose} fullWidth>
          Continue Rest
        </Button>
        {onSkipRest && (
          <Button variant="primary" onClick={onSkipRest} fullWidth>
            Skip Rest
          </Button>
        )}
      </div>
    </div>
  </Modal>
);

export const ExerciseInstructionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    name: string;
    instructions: string[];
    tips?: string[];
    targetMuscles?: string[];
  };
  onStartExercise?: () => void;
}> = ({ isOpen, onClose, exercise, onStartExercise }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={exercise.name}
    variant="workout"
    size="lg"
  >
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-semibold text-neutral-900">Instructions:</h4>
        <ol className="list-decimal list-inside space-y-2">
          {exercise.instructions.map((instruction, index) => (
            <li key={index} className="text-neutral-700">{instruction}</li>
          ))}
        </ol>
      </div>

      {exercise.tips && exercise.tips.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Tips:</h4>
          <ul className="list-disc list-inside space-y-2">
            {exercise.tips.map((tip, index) => (
              <li key={index} className="text-neutral-700">{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-900">Target Muscles:</h4>
          <div className="flex flex-wrap gap-2">
            {exercise.targetMuscles.map((muscle, index) => (
              <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button variant="secondary" onClick={onClose} fullWidth>
          Got It
        </Button>
        {onStartExercise && (
          <Button variant="energy" onClick={onStartExercise} fullWidth>
            Start Exercise
          </Button>
        )}
      </div>
    </div>
  </Modal>
);
