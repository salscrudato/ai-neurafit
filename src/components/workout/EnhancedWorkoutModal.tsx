import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,

  LightBulbIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

import { WorkoutService } from '../../services/workoutService';
import { useAuthStore } from '../../store/authStore';
import { useWorkoutStore } from '../../store/workoutStore';
import type { WorkoutType, UserProfile, WorkoutGenerationRequest } from '../../types';

interface EnhancedWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

const workoutTypes = [
  { 
    value: 'strength_training', 
    label: 'Strength Training', 
    emoji: '💪', 
    description: 'Build muscle and power',
    benefits: ['Increased muscle mass', 'Better bone density', 'Improved metabolism']
  },
  { 
    value: 'cardio', 
    label: 'Cardio', 
    emoji: '🏃‍♀️', 
    description: 'Improve cardiovascular health',
    benefits: ['Better heart health', 'Increased endurance', 'Calorie burning']
  },
  { 
    value: 'hiit', 
    label: 'HIIT', 
    emoji: '⚡', 
    description: 'High-intensity interval training',
    benefits: ['Time efficient', 'Afterburn effect', 'Improved VO2 max']
  },
  { 
    value: 'yoga', 
    label: 'Yoga', 
    emoji: '🧘‍♀️', 
    description: 'Flexibility and mindfulness',
    benefits: ['Increased flexibility', 'Stress reduction', 'Better balance']
  },
  { 
    value: 'functional', 
    label: 'Functional', 
    emoji: '🏋️‍♂️', 
    description: 'Real-world movement patterns',
    benefits: ['Better daily movement', 'Injury prevention', 'Core stability']
  },
  { 
    value: 'circuit', 
    label: 'Circuit', 
    emoji: '🔄', 
    description: 'Mixed exercises in sequence',
    benefits: ['Full body workout', 'Cardio + strength', 'Time efficient']
  }
];

const intensityLevels = [
  { value: 'low', label: 'Gentle', emoji: '🌱', description: 'Light activity, recovery focused' },
  { value: 'moderate', label: 'Balanced', emoji: '⚖️', description: 'Steady challenge, sustainable' },
  { value: 'high', label: 'Intense', emoji: '🔥', description: 'Push your limits, maximum effort' }
];

export const EnhancedWorkoutModal: React.FC<EnhancedWorkoutModalProps> = ({
  isOpen,
  onClose,
  userProfile
}) => {
  const { user } = useAuthStore();
  const { setCurrentWorkout } = useWorkoutStore();
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('strength_training');
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const focusAreaOptions = [
    'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Flexibility', 
    'Balance', 'Power', 'Endurance', 'Mobility', 'Stability'
  ];

  const handleGenerateWorkout = async () => {
    if (!userProfile || !user) {
      setError('User profile not found. Please complete onboarding first.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const request: WorkoutGenerationRequest = {
        userId: user.id,
        fitnessLevel: userProfile.fitnessLevel,
        fitnessGoals: userProfile.fitnessGoals,
        availableEquipment: userProfile.availableEquipment,
        timeCommitment: userProfile.timeCommitment,
        workoutType: selectedWorkoutType,
        preferences: {
          ...userProfile.preferences,
          intensity: selectedIntensity
        },
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
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

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const selectedWorkoutTypeData = workoutTypes.find(t => t.value === selectedWorkoutType);
  const selectedIntensityData = intensityLevels.find(i => i.value === selectedIntensity);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-3xl shadow-large max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-2xl font-bold text-neutral-900">
                  AI Workout Generator
                </Dialog.Title>
                <p className="text-neutral-600">Personalized workouts powered by advanced AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<XMarkIcon />}
              className="rounded-full"
            >Close</Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <AnimatePresence mode="wait">
              {!generatedWorkout ? (
                <motion.div
                  key="configuration"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Workout Type Selection */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                      Choose Your Workout Style
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {workoutTypes.map((type) => (
                        <Card
                          key={type.value}
                          interactive
                          onClick={() => setSelectedWorkoutType(type.value as WorkoutType)}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedWorkoutType === type.value
                              ? 'ring-2 ring-primary-500 bg-primary-50'
                              : 'hover:bg-neutral-50'
                          }`}
                          padding="lg"
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-3">{type.emoji}</div>
                            <h4 className="font-semibold text-neutral-900 mb-2">{type.label}</h4>
                            <p className="text-sm text-neutral-600 mb-3">{type.description}</p>
                            <div className="space-y-1">
                              {type.benefits.map((benefit, index) => (
                                <Badge key={index} variant="secondary" size="sm">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Intensity Selection */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                      <FireIcon className="w-5 h-5 mr-2" />
                      Intensity Level
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {intensityLevels.map((intensity) => (
                        <Card
                          key={intensity.value}
                          interactive
                          onClick={() => setSelectedIntensity(intensity.value as any)}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedIntensity === intensity.value
                              ? 'ring-2 ring-accent-500 bg-accent-50'
                              : 'hover:bg-neutral-50'
                          }`}
                          padding="lg"
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{intensity.emoji}</div>
                            <h4 className="font-semibold text-neutral-900 mb-1">{intensity.label}</h4>
                            <p className="text-sm text-neutral-600">{intensity.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                      <LightBulbIcon className="w-5 h-5 mr-2" />
                      Focus Areas (Optional)
                    </h3>
                    <p className="text-neutral-600 mb-4">Select specific areas you want to target in this workout</p>
                    <div className="flex flex-wrap gap-2">
                      {focusAreaOptions.map((area) => (
                        <button
                          key={area}
                          onClick={() => toggleFocusArea(area)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            focusAreas.includes(area)
                              ? 'bg-success-100 text-success-800 ring-2 ring-success-300'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workout Preview */}
                  {selectedWorkoutTypeData && (
                    <Card variant="gradient" padding="lg">
                      <div className="text-white">
                        <h3 className="text-xl font-bold mb-2">Your Workout Preview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/90 mb-2">
                              <strong>Type:</strong> {selectedWorkoutTypeData.label} {selectedWorkoutTypeData.emoji}
                            </p>
                            <p className="text-white/90 mb-2">
                              <strong>Intensity:</strong> {selectedIntensityData?.label} {selectedIntensityData?.emoji}
                            </p>
                            <p className="text-white/90">
                              <strong>Duration:</strong> {userProfile?.timeCommitment.minutesPerSession} minutes
                            </p>
                          </div>
                          <div>
                            {focusAreas.length > 0 && (
                              <div>
                                <p className="text-white/90 mb-2"><strong>Focus Areas:</strong></p>
                                <div className="flex flex-wrap gap-1">
                                  {focusAreas.map((area) => (
                                    <Badge key={area} variant="accent" size="sm">
                                      {area}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Error Display */}
                  {error && (
                    <Card className="border-error-200 bg-error-50">
                      <p className="text-error-800">{error}</p>
                    </Card>
                  )}

                  {/* Generate Button */}
                  <div className="flex justify-end space-x-4">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateWorkout}
                      loading={generating}
                      size="lg"
                      icon={<SparklesIcon />}
                      className="min-w-[200px]"
                    >
                      {generating ? 'Generating...' : 'Generate AI Workout'}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SparklesIcon className="w-10 h-10 text-success-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                    Your AI Workout is Ready! 🎉
                  </h3>
                  <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                    {generatedWorkout.name} has been generated and is ready for you to start.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={() => setGeneratedWorkout(null)}>
                      Generate Another
                    </Button>
                    <Button onClick={onClose} size="lg">
                      Start Workout
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
