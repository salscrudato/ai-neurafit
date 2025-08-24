import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ClockIcon,
  FireIcon,
  ArrowRightIcon,
  XMarkIcon,
  TrophyIcon,

  LightBulbIcon,
  SpeakerWaveIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card, GradientCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Timer } from '../ui/Timer';
import { ExerciseInstructions } from './ExerciseInstructions';
import { PageContainer } from '../ui/Container';
import type { WorkoutSession, CompletedExercise, CompletedSet } from '../../types';

interface ActiveWorkoutProps {
  session: WorkoutSession;
  currentExerciseIndex: number;
  onCompleteExercise: (exerciseData: CompletedExercise) => void;
  onCompleteWorkout: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
}

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  session,
  currentExerciseIndex,
  onCompleteExercise,
  onCompleteWorkout,
  onPause,
  onResume,
  isPaused
}) => {
  const [currentSet, setCurrentSet] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [workoutTimeElapsed, setWorkoutTimeElapsed] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  // const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  // const [setStartTime, setSetStartTime] = useState<Date | null>(null);
  const [heartRate] = useState<number | null>(null);
  const [rpe] = useState<number | null>(null); // Rate of Perceived Exertion

  const currentExercise = session.workoutPlan.exercises[currentExerciseIndex];
  const totalExercises = session.workoutPlan.exercises.length;
  const progress = ((currentExerciseIndex + (currentSet / currentExercise.sets)) / totalExercises) * 100;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;
  const isLastSet = currentSet === currentExercise.sets - 1;

  // Handle both nested (exercise.exercise) and flat (exercise) structures
  const exerciseData = currentExercise.exercise || currentExercise;

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    const messages = [
      "You're crushing it! 💪",
      "Keep that energy up! 🔥",
      "Form over speed - you've got this! 🎯",
      "Every rep counts! 💯",
      "Push through - you're stronger than you think! 🚀",
      "Focus on your breathing! 🧘‍♀️",
      "Mind over muscle! 🧠",
      "You're building something amazing! 🏗️"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Workout timer
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setWorkoutTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimeRemaining > 0 && !isPaused) {
      const interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isResting, restTimeRemaining, isPaused]);

  const handleCompleteSet = (reps?: number, weight?: number, duration?: number) => {
    const completedSet: CompletedSet = {
      reps,
      weight,
      duration,
      completed: true,
    };

    const updatedSets = [...completedSets, completedSet];
    setCompletedSets(updatedSets);

    if (currentSet + 1 < currentExercise.sets) {
      // More sets to go, start rest period
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTimeRemaining(currentExercise.restTime);
    } else {
      // Exercise complete
      const completedExercise: CompletedExercise = {
        exerciseId: exerciseData.id || `exercise-${currentExerciseIndex}`,
        sets: updatedSets,
        skipped: false,
        completedAt: new Date(),
      };

      onCompleteExercise(completedExercise);
      
      // Reset for next exercise
      setCurrentSet(0);
      setCompletedSets([]);
      setIsResting(false);
      setRestTimeRemaining(0);
    }
  };

  const handleSkipExercise = () => {
    const completedExercise: CompletedExercise = {
      exerciseId: exerciseData.id || `exercise-${currentExerciseIndex}`,
      sets: completedSets,
      skipped: true,
      completedAt: new Date(),
    };

    onCompleteExercise(completedExercise);
    
    // Reset for next exercise
    setCurrentSet(0);
    setCompletedSets([]);
    setIsResting(false);
    setRestTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Enhanced Header */}
      <div className="glass border-b border-white/20 backdrop-blur-xl sticky top-0 z-40">
        <PageContainer>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <FireIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{session.workoutPlan.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
                    <Badge variant="primary" size="sm">
                      Set {currentSet + 1} of {currentExercise.sets}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                  <span className="font-medium">Workout Progress</span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Workout Timer */}
              <Card padding="sm" className="text-center">
                <div className="text-xs text-neutral-600 mb-1">Workout Time</div>
                <div className="font-mono text-lg font-bold text-neutral-900">
                  {formatTime(workoutTimeElapsed)}
                </div>
              </Card>

              {/* Heart Rate (if available) */}
              {heartRate && (
                <Card padding="sm" className="text-center">
                  <div className="text-xs text-neutral-600 mb-1">Heart Rate</div>
                  <div className="flex items-center justify-center space-x-1">
                    <HeartIcon className="w-4 h-4 text-error-500" />
                    <span className="font-bold text-error-600">{heartRate}</span>
                  </div>
                </Card>
              )}

              {/* Pause/Resume Button */}
              <Button
                variant={isPaused ? "energy" : "secondary"}
                onClick={isPaused ? onResume : onPause}
                size="lg"
                icon={isPaused ? <PlayIcon /> : <PauseIcon />}
                className="min-w-[120px]"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        <AnimatePresence mode="wait">
          {isResting ? (
            /* Enhanced Rest Period */
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <GradientCard className="text-center text-white" padding="xl">
                <div className="py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <ClockIcon className="w-10 h-10 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-3">Rest & Recover</h2>
                  <p className="text-white/90 mb-8 text-lg">
                    {isLastSet ? "Great set! Prepare for the next exercise" : "Excellent work! Get ready for your next set"}
                  </p>

                  <div className="mb-8">
                    <Timer
                      initialTime={restTimeRemaining}
                      isActive={!isPaused}
                      onComplete={() => setIsResting(false)}
                      size="large"
                    />
                  </div>

                  {/* Motivational tip during rest */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
                    <div className="flex items-center space-x-3">
                      <LightBulbIcon className="w-5 h-5 text-white" />
                      <p className="text-white/90 text-sm">
                        Use this time to focus on your breathing and visualize your next set
                      </p>
                    </div>
                  </Card>

                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setIsResting(false)}
                      variant="secondary"
                      size="lg"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      Skip Rest
                    </Button>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
        ) : (
            /* Enhanced Active Exercise */
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Exercise Header Card */}
              <Card hover className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-full -translate-y-16 translate-x-16" />

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                          {exerciseData.name || 'Exercise'}
                        </h2>
                        <p className="text-neutral-600">{exerciseData.description || 'Complete this exercise with proper form.'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="primary" size="lg">
                        Set {currentSet + 1} of {currentExercise.sets}
                      </Badge>
                      <Badge variant="secondary">
                        <FireIcon className="w-4 h-4 mr-1" />
                        {exerciseData.difficulty || 'beginner'}
                      </Badge>
                      <Badge variant="accent">
                        {(exerciseData.targetMuscles || []).join(', ') || 'Full Body'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowInstructions(true)}
                      size="lg"
                      icon={<LightBulbIcon />}
                    >
                      Instructions
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowMotivation(!showMotivation)}
                      size="lg"
                      icon={<SpeakerWaveIcon />}
                    >
                      Tips
                    </Button>
                  </div>
                </div>

                {/* Motivational message */}
                <AnimatePresence>
                  {showMotivation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-accent-50 rounded-xl border border-accent-200"
                    >
                      <p className="text-accent-800 font-medium text-center">
                        💪 {getMotivationalMessage()}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Enhanced Set Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {currentExercise.reps || `${currentExercise.duration}s`}
                    </div>
                    <div className="text-sm font-medium text-primary-700 mb-3">
                      {currentExercise.reps ? 'Target Reps' : 'Duration'}
                    </div>
                    {(exerciseData.formCues || exerciseData.tips) && (
                      <div className="text-xs text-primary-600">
                        💡 {(exerciseData.formCues || exerciseData.tips)?.[0]}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent-600 mb-2">
                      {currentExercise.restTime}s
                    </div>
                    <div className="text-sm font-medium text-accent-700 mb-3">Rest Time</div>
                    <div className="text-xs text-accent-600">
                      ⏱️ Recovery between sets
                    </div>
                  </div>
                </Card>
              </div>

              {/* Progress Visualization */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Set Progress</h3>
                  <Badge variant="success" size="sm">
                    {completedSets.length} / {currentExercise.sets} completed
                  </Badge>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: currentExercise.sets }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{
                        scale: index < completedSets.length ? 1.1 : index === currentSet ? 1.05 : 1,
                        opacity: index < completedSets.length ? 1 : index === currentSet ? 0.8 : 0.5
                      }}
                      className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        index < completedSets.length
                          ? 'bg-success-500 text-white'
                          : index === currentSet
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {index < completedSets.length ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Completed Sets Details */}
                {completedSets.length > 0 && (
                  <div className="space-y-2">
                    {completedSets.map((set, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-success-50 rounded-xl border border-success-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-success-800">
                            Set {index + 1}: {set.reps || `${set.duration}s`}
                          </span>
                        </div>
                        {rpe && (
                          <Badge variant="success" size="sm">
                            RPE: {rpe}/10
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Enhanced Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleCompleteSet(currentExercise.reps, undefined, currentExercise.duration)}
                  size="xl"
                  className="h-16"
                  icon={<CheckIcon />}
                >
                  <div className="text-center">
                    <div className="font-bold">Complete Set</div>
                    <div className="text-sm opacity-90">
                      {isLastSet ? 'Finish Exercise' : `${currentExercise.sets - currentSet - 1} sets left`}
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSkipExercise}
                  size="xl"
                  className="h-16"
                  icon={<XMarkIcon />}
                >
                  <div className="text-center">
                    <div className="font-bold">Skip Exercise</div>
                    <div className="text-sm opacity-90">Move to next</div>
                  </div>
                </Button>
              </div>

              {/* Next Exercise Preview */}
              {currentExerciseIndex < totalExercises - 1 && (
                <Card className="bg-neutral-50 border-neutral-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-200 rounded-xl flex items-center justify-center">
                        <ArrowRightIcon className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-700 mb-1">Up Next</h3>
                        <p className="text-neutral-900 font-semibold">
                          {(() => {
                            const nextExercise = session.workoutPlan.exercises[currentExerciseIndex + 1];
                            const nextExerciseData = nextExercise?.exercise || nextExercise;
                            return nextExerciseData?.name || 'Next Exercise';
                          })()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {session.workoutPlan.exercises[currentExerciseIndex + 1]?.sets || 1} sets
                    </Badge>
                  </div>
                </Card>
              )}

              {/* Finish Workout Celebration */}
              {isLastExercise && isLastSet && (
                <GradientCard className="text-center text-white" padding="xl">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrophyIcon className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-3">
                      Final Set! 🎉
                    </h3>
                    <p className="text-white/90 mb-6 text-lg">
                      You're about to complete this amazing workout!
                    </p>
                    <Button
                      onClick={onCompleteWorkout}
                      variant="secondary"
                      size="xl"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                      icon={<TrophyIcon />}
                    >
                      Complete Workout! 🏆
                    </Button>
                  </motion.div>
                </GradientCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>

      {/* Exercise Instructions Modal */}
      <ExerciseInstructions
        exercise={exerciseData}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
};
