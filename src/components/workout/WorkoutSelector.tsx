import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  ClockIcon, 
  FireIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { WorkoutGenerationModal } from './WorkoutGenerationModal';
import { useAuthStore } from '../../store/authStore';
import type { WorkoutPlan } from '../../types';

interface WorkoutSelectorProps {
  currentWorkout: WorkoutPlan | null;
  onStartWorkout: () => void;
}

export const WorkoutSelector: React.FC<WorkoutSelectorProps> = ({
  currentWorkout,
  onStartWorkout
}) => {
  const { profile } = useAuthStore();
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  if (!currentWorkout) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link to="/app" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Choose Your Workout</h1>
            <p className="text-gray-600 mt-2">Select or generate a workout to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate AI Workout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card gradient-bg text-white cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setShowGenerationModal(true)}
            >
              <div className="text-center py-8">
                <SparklesIcon className="w-16 h-16 text-white/80 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Generate AI Workout</h3>
                <p className="text-white/90 mb-6">
                  Create a personalized workout tailored to your goals and preferences
                </p>
                <Button className="bg-white text-primary-600 hover:bg-gray-100">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Now
                </Button>
              </div>
            </motion.div>

            {/* Quick Workouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card border-2 border-dashed border-gray-300 hover:border-primary-300 transition-colors duration-200"
            >
              <div className="text-center py-8">
                <FireIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Start</h3>
                <p className="text-gray-600 mb-6">
                  Browse pre-made workouts for immediate training
                </p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Recent Workouts */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Workouts</h2>
            <div className="card">
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent workouts</h3>
                <p className="text-gray-600 mb-4">
                  Generate your first AI workout to get started on your fitness journey!
                </p>
                <Button onClick={() => setShowGenerationModal(true)}>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Workout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <WorkoutGenerationModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          userProfile={profile}
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/app" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Ready to Start?</h1>
        <p className="text-gray-600 mt-2">Your personalized workout is ready</p>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentWorkout.name}</h2>
            <p className="text-gray-600 mb-4">{currentWorkout.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {currentWorkout.estimatedDuration} min
              </div>
              <div className="flex items-center">
                <FireIcon className="w-4 h-4 mr-1" />
                {currentWorkout.difficulty}
              </div>
              <div>
                {currentWorkout.exercises.length} exercises
              </div>
            </div>
          </div>
          
          {currentWorkout.aiGenerated && (
            <div className="flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI Generated
            </div>
          )}
        </div>

        {/* Exercise Preview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h3>
          <div className="space-y-3">
            {currentWorkout.exercises.slice(0, 5).map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{exercise.exercise.name}</h4>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps || exercise.duration + 's'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {exercise.restTime}s rest
                </div>
              </div>
            ))}
            
            {currentWorkout.exercises.length > 5 && (
              <div className="text-center py-2 text-gray-500 text-sm">
                +{currentWorkout.exercises.length - 5} more exercises
              </div>
            )}
          </div>
        </div>

        {/* Equipment Needed */}
        {currentWorkout.equipment.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Needed</h3>
            <div className="flex flex-wrap gap-2">
              {currentWorkout.equipment.map((equipment, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {equipment.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onStartWorkout}
            size="lg"
            className="flex-1 sm:flex-none px-8"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowGenerationModal(true)}
            size="lg"
            className="flex-1 sm:flex-none px-8"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      <WorkoutGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        userProfile={profile}
      />
    </div>
  );
};
