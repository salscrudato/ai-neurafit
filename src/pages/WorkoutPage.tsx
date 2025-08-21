import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSelector } from '../components/workout/WorkoutSelector';
import { ActiveWorkout } from '../components/workout/ActiveWorkout';
import { WorkoutComplete } from '../components/workout/WorkoutComplete';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { WorkoutService } from '../services/workoutService';
import type { WorkoutSession, CompletedExercise } from '../types';

type WorkoutState = 'selecting' | 'active' | 'paused' | 'completed';

export const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentWorkout, activeSession, setActiveSession, addToHistory } = useWorkoutStore();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('selecting');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  useEffect(() => {
    if (currentWorkout && !activeSession) {
      // If we have a workout but no active session, we're in selection mode
      setWorkoutState('selecting');
    } else if (activeSession) {
      // If we have an active session, determine the state
      if (activeSession.status === 'completed') {
        setWorkoutState('completed');
      } else if (activeSession.status === 'paused') {
        setWorkoutState('paused');
      } else {
        setWorkoutState('active');
      }
    }
  }, [currentWorkout, activeSession]);

  const handleStartWorkout = async () => {
    if (!currentWorkout || !user) return;

    try {
      const session: WorkoutSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        workoutPlanId: currentWorkout.id || '',
        workoutPlan: currentWorkout,
        startTime: new Date(),
        completedExercises: [],
        status: 'in_progress',
      };

      setActiveSession(session);
      setWorkoutState('active');
      setCurrentExerciseIndex(0);
      setCompletedExercises([]);
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const handleCompleteExercise = (exerciseData: CompletedExercise) => {
    setCompletedExercises(prev => [...prev, exerciseData]);

    if (currentExerciseIndex < (currentWorkout?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    if (!activeSession) return;

    const completedSession: WorkoutSession = {
      ...activeSession,
      endTime: new Date(),
      completedExercises,
      status: 'completed',
    };

    setActiveSession(completedSession);
    addToHistory(completedSession);
    setWorkoutState('completed');

    try {
      await WorkoutService.completeWorkoutSession(
        activeSession.id,
        completedExercises
      );
    } catch (error) {
      console.error('Error saving workout session:', error);
    }
  };

  const handleWorkoutRating = async (rating: number, feedback?: string) => {
    if (!activeSession) return;

    try {
      await WorkoutService.completeWorkoutSession(
        activeSession.id,
        completedExercises,
        rating,
        feedback
      );
    } catch (error) {
      console.error('Error saving workout rating:', error);
    }
  };

  const handleFinish = () => {
    setActiveSession(null);
    setWorkoutState('selecting');
    setCurrentExerciseIndex(0);
    setCompletedExercises([]);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {workoutState === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WorkoutSelector
              currentWorkout={currentWorkout}
              onStartWorkout={handleStartWorkout}
            />
          </motion.div>
        )}

        {(workoutState === 'active' || workoutState === 'paused') && activeSession && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveWorkout
              session={activeSession}
              currentExerciseIndex={currentExerciseIndex}
              onCompleteExercise={handleCompleteExercise}
              onCompleteWorkout={handleCompleteWorkout}
              onPause={() => setWorkoutState('paused')}
              onResume={() => setWorkoutState('active')}
              isPaused={workoutState === 'paused'}
            />
          </motion.div>
        )}

        {workoutState === 'completed' && activeSession && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WorkoutComplete
              session={activeSession}
              onRating={handleWorkoutRating}
              onFinish={handleFinish}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
