import React, { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  BackwardIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Timer } from './Timer';
import { Button, StartWorkoutButton } from './Button';
import { Badge } from './Badge';
import { Progress } from './Progress';
import { ExerciseInstructionModal, RestModal } from './Modal';

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  duration?: number; // in seconds
  reps?: number;
  sets?: number;
  restTime?: number; // in seconds
  instructions: string[];
  tips?: string[];
  targetMuscles?: string[];
}

interface MobileWorkoutInterfaceProps {
  exercises: Exercise[];
  onWorkoutComplete: () => void;
  onWorkoutExit: () => void;
  className?: string;
}

export const MobileWorkoutInterface: React.FC<MobileWorkoutInterfaceProps> = ({
  exercises,
  onWorkoutComplete,
  onWorkoutExit,
  className = '',
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [_isResting, setIsResting] = useState(false); // used for UI state during rest
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  const currentExercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      if (currentExercise.restTime && currentExercise.restTime > 0) {
        setRestTimeLeft(currentExercise.restTime);
        setShowRestModal(true);
        setIsResting(true);
      } else {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      }
    } else {
      onWorkoutComplete();
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSet(1);
    }
  };

  const handleRestComplete = () => {
    setShowRestModal(false);
    setIsResting(false);
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
    } else {
      onWorkoutComplete();
    }
  };

  const handleSwipe = (info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      handlePreviousExercise();
    } else if (info.offset.x < -threshold) {
      handleNextExercise();
    }
  };

  if (!currentExercise) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-white z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onWorkoutExit}
            icon={<XMarkIcon />}
          >Back</Button>
          <div>
            <h1 className="font-bold text-lg text-neutral-900">Workout</h1>
            <p className="text-sm text-neutral-600">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInstructions(true)}
          icon={<InformationCircleIcon />}
        >Info</Button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-white">
        <Progress
          value={progress}
          variant={currentExercise.type}
          size="sm"
          animate
        />
      </div>

      {/* Main Exercise Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentExerciseIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => handleSwipe(info)}
            className="h-full flex flex-col p-6"
          >
            {/* Exercise Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Badge variant="primary" size="sm">{currentExercise.type}</Badge>
                <Badge variant="secondary" size="sm">{currentExercise.intensity}</Badge>
              </div>
              
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                {currentExercise.name}
              </h2>
              
              {currentExercise.sets && (
                <p className="text-lg text-neutral-600">
                  Set {currentSet} of {currentExercise.sets}
                </p>
              )}
            </div>

            {/* Timer/Counter */}
            <div className="flex-1 flex items-center justify-center">
              {currentExercise.duration ? (
                <Timer
                  initialTime={currentExercise.duration}
                  type="workout"
                  intensity={currentExercise.intensity}
                  showControls={false}
                  size="large"
                  onComplete={() => {
                    if (currentExercise.sets && currentSet < currentExercise.sets) {
                      setCurrentSet(currentSet + 1);
                    } else {
                      handleNextExercise();
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary-600 mb-4">
                    {currentExercise.reps || '∞'}
                  </div>
                  <p className="text-xl text-neutral-600">
                    {currentExercise.reps ? 'Reps' : 'Until complete'}
                  </p>
                </div>
              )}
            </div>

            {/* Exercise Instructions (Brief) */}
            <div className="bg-neutral-50 rounded-2xl p-4 mb-6">
              <p className="text-neutral-700 text-center">
                {currentExercise.instructions[0]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-white border-t border-neutral-200 safe-area-bottom">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            icon={<BackwardIcon />}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            <StartWorkoutButton
              onClick={() => setIsWorkoutActive(!isWorkoutActive)}
              icon={isWorkoutActive ? <PauseIcon /> : <PlayIcon />}
              size="lg"
            >
              {isWorkoutActive ? 'Pause' : 'Start'}
            </StartWorkoutButton>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleNextExercise}
            icon={<ForwardIcon />}
            iconPosition="right"
          >
            {currentExerciseIndex === exercises.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(true)}
          >
            Instructions
          </Button>
          
          {currentExercise.restTime && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRestTimeLeft(currentExercise.restTime!);
                setShowRestModal(true);
              }}
            >
              Rest ({currentExercise.restTime}s)
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      <ExerciseInstructionModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        exercise={currentExercise}
        onStartExercise={() => {
          setShowInstructions(false);
          setIsWorkoutActive(true);
        }}
      />

      <RestModal
        isOpen={showRestModal}
        onClose={() => setShowRestModal(false)}
        restTime={restTimeLeft}
        nextExercise={
          currentExerciseIndex < exercises.length - 1
            ? exercises[currentExerciseIndex + 1].name
            : undefined
        }
        onSkipRest={handleRestComplete}
      />
    </div>
  );
};
