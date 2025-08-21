import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { WorkoutService } from '../../services/workoutService';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';
import type { UserProfile, WorkoutType, WorkoutGenerationRequest } from '../../types';

interface WorkoutGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

const workoutTypes = [
  { value: 'strength_training', label: 'Strength Training', emoji: '💪', description: 'Build muscle and power' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃‍♀️', description: 'Improve cardiovascular health' },
  { value: 'hiit', label: 'HIIT', emoji: '⚡', description: 'High-intensity interval training' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘‍♀️', description: 'Flexibility and mindfulness' },
  { value: 'functional', label: 'Functional', emoji: '🏋️‍♂️', description: 'Real-world movement patterns' },
  { value: 'circuit', label: 'Circuit', emoji: '🔄', description: 'Mixed exercises in sequence' }
];

export const WorkoutGenerationModal: React.FC<WorkoutGenerationModalProps> = ({
  isOpen,
  onClose,
  userProfile
}) => {
  const { user } = useAuthStore();
  const { setCurrentWorkout, setError, clearError } = useWorkoutStore();
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('strength_training');
  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  const handleGenerateWorkout = async () => {
    if (!userProfile || !user) {
      setError('User profile not found. Please complete onboarding first.');
      return;
    }

    setGenerating(true);
    clearError();

    try {
      const request: WorkoutGenerationRequest = {
        userId: user.id,
        fitnessLevel: userProfile.fitnessLevel,
        fitnessGoals: userProfile.fitnessGoals,
        availableEquipment: userProfile.availableEquipment,
        timeCommitment: userProfile.timeCommitment,
        workoutType: selectedWorkoutType,
        preferences: userProfile.preferences,
      };

      const workout = await WorkoutService.generateWorkout(request);
      setGeneratedWorkout(workout);
      setCurrentWorkout(workout);
    } catch (error: any) {
      setError(error.message || 'Failed to generate workout');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = () => {
    if (generatedWorkout) {
      setCurrentWorkout(generatedWorkout);
      onClose();
      // Navigate to workout page would happen here
      window.location.href = '/app/workout';
    }
  };

  const handleClose = () => {
    setGeneratedWorkout(null);
    setSelectedWorkoutType('strength_training');
    clearError();
    onClose();
  };

  if (!userProfile) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="card max-w-md w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Complete Your Profile
              </h3>
              <p className="text-gray-600 mb-4">
                Please complete your onboarding to generate personalized workouts.
              </p>
              <Button onClick={() => window.location.href = '/onboarding'}>
                Complete Onboarding
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-primary-600 mr-2" />
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Generate AI Workout
              </Dialog.Title>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!generatedWorkout ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    What type of workout would you like?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {workoutTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedWorkoutType(type.value as WorkoutType)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          selectedWorkoutType === type.value
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{type.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{type.label}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Profile Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Level:</strong> {userProfile.fitnessLevel}
                    </div>
                    <div>
                      <strong>Duration:</strong> {userProfile.timeCommitment.minutesPerSession} min
                    </div>
                    <div>
                      <strong>Goals:</strong> {userProfile.fitnessGoals.length} selected
                    </div>
                    <div>
                      <strong>Equipment:</strong> {userProfile.availableEquipment.length} items
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateWorkout}
                    loading={generating}
                    className="px-6"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate Workout
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Your Workout is Ready! 🎉
                  </h3>
                  <p className="text-gray-600">
                    AI has generated a personalized workout just for you
                  </p>
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {generatedWorkout.name}
                  </h4>
                  <p className="text-gray-600 mb-4">{generatedWorkout.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Duration:</strong> {generatedWorkout.estimatedDuration} min
                    </div>
                    <div>
                      <strong>Exercises:</strong> {generatedWorkout.exercises?.length || 0}
                    </div>
                    <div>
                      <strong>Difficulty:</strong> {generatedWorkout.difficulty}
                    </div>
                    <div>
                      <strong>Type:</strong> {generatedWorkout.type}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setGeneratedWorkout(null)}>
                    Generate Another
                  </Button>
                  <Button onClick={handleStartWorkout} className="px-6">
                    Start Workout
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
