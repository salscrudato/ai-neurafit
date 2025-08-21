import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import type { WorkoutType } from '../../types';

interface OnboardingStep5Props {
  data: any;
  onUpdate: (data: any) => void;
  onComplete: () => void;
  onPrev: () => void;
}

const workoutTypeOptions = [
  { value: 'strength_training' as WorkoutType, label: 'Strength Training', emoji: '💪' },
  { value: 'cardio' as WorkoutType, label: 'Cardio', emoji: '🏃‍♀️' },
  { value: 'hiit' as WorkoutType, label: 'HIIT', emoji: '⚡' },
  { value: 'yoga' as WorkoutType, label: 'Yoga', emoji: '🧘‍♀️' },
  { value: 'pilates' as WorkoutType, label: 'Pilates', emoji: '🤸‍♀️' },
  { value: 'stretching' as WorkoutType, label: 'Stretching', emoji: '🤲' },
  { value: 'functional' as WorkoutType, label: 'Functional', emoji: '🏋️‍♂️' },
  { value: 'circuit' as WorkoutType, label: 'Circuit', emoji: '🔄' }
];

const intensityOptions = [
  { value: 'low', label: 'Low', description: 'Gentle, recovery-focused' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced challenge' },
  { value: 'high', label: 'High', description: 'Intense, challenging' }
];

export const OnboardingStep5: React.FC<OnboardingStep5Props> = ({
  data,
  onUpdate,
  onComplete,
  onPrev
}) => {
  const [loading, setLoading] = useState(false);

  const handleWorkoutTypeToggle = (workoutType: WorkoutType) => {
    const currentTypes = data.preferences?.workoutTypes || [];
    const isSelected = currentTypes.includes(workoutType);
    
    let updatedTypes;
    if (isSelected) {
      updatedTypes = currentTypes.filter((t: WorkoutType) => t !== workoutType);
    } else {
      updatedTypes = [...currentTypes, workoutType];
    }
    
    onUpdate({
      preferences: {
        ...data.preferences,
        workoutTypes: updatedTypes
      }
    });
  };

  const handleIntensityChange = (intensity: 'low' | 'moderate' | 'high') => {
    onUpdate({
      preferences: {
        ...data.preferences,
        intensity
      }
    });
  };

  const handleRestDayChange = (restDays: number) => {
    onUpdate({
      preferences: {
        ...data.preferences,
        restDayPreference: restDays
      }
    });
  };

  const handleInjuriesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const injuries = e.target.value.split(',').map(s => s.trim()).filter(s => s);
    onUpdate({
      preferences: {
        ...data.preferences,
        injuriesOrLimitations: injuries
      }
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete();
    } finally {
      setLoading(false);
    }
  };

  const canProceed = data.preferences?.workoutTypes?.length > 0 && 
                    data.preferences?.intensity;

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Final preferences
        </h2>
        <p className="text-gray-600">
          Let's fine-tune your workout experience
        </p>
      </div>

      <div className="space-y-8 mb-8">
        {/* Workout Types */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What types of workouts do you enjoy?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {workoutTypeOptions.map((option, index) => {
              const isSelected = data.preferences?.workoutTypes?.includes(option.value);
              
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleWorkoutTypeToggle(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {option.label}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Intensity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preferred workout intensity
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {intensityOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleIntensityChange(option.value as any)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  data.preferences?.intensity === option.value
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Rest Days */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How many rest days do you prefer per week?
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((days, index) => (
              <motion.button
                key={days}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleRestDayChange(days)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  data.preferences?.restDayPreference === days
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-xl font-bold text-gray-900">
                  {days}
                </div>
                <div className="text-sm text-gray-600">
                  day{days !== 1 ? 's' : ''}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Injuries/Limitations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Any injuries or limitations? (Optional)
          </h3>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="e.g., knee injury, lower back pain, shoulder issues (separate with commas)"
            onChange={handleInjuriesChange}
          />
          <p className="text-sm text-gray-500 mt-2">
            This helps us avoid exercises that might aggravate existing conditions
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Fitness Level:</strong> {data.fitnessLevel}
          </div>
          <div>
            <strong>Goals:</strong> {data.fitnessGoals?.length || 0} selected
          </div>
          <div>
            <strong>Equipment:</strong> {data.availableEquipment?.length || 0} items
          </div>
          <div>
            <strong>Schedule:</strong> {data.timeCommitment?.daysPerWeek} days/week, {data.timeCommitment?.minutesPerSession} min/session
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          size="lg"
          className="px-8"
        >
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canProceed}
          loading={loading}
          size="lg"
          className="px-8"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
};
