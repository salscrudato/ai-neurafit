import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingStep1 } from '../components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../components/onboarding/OnboardingStep3';
import { OnboardingStep4 } from '../components/onboarding/OnboardingStep4';
import { OnboardingStep5 } from '../components/onboarding/OnboardingStep5';
import { UserProfileService } from '../services/userProfileService';
import { useUserStore } from '../store/userStore';
import type { FitnessLevel, FitnessGoal, Equipment, WorkoutType } from '../types';

interface OnboardingData {
  fitnessLevel: FitnessLevel | null;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: string[];
  };
  preferences: {
    workoutTypes: WorkoutType[];
    intensity: 'low' | 'moderate' | 'high';
    restDayPreference: number;
    injuriesOrLimitations: string[];
  };
}

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setOnboardingCompleted, setError, clearError } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fitnessLevel: null,
    fitnessGoals: [],
    availableEquipment: [],
    timeCommitment: {
      daysPerWeek: 3,
      minutesPerSession: 30,
      preferredTimes: [],
    },
    preferences: {
      workoutTypes: [],
      intensity: 'moderate',
      restDayPreference: 1,
      injuriesOrLimitations: [],
    },
  });

  const totalSteps = 5;

  const updateOnboardingData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      clearError();

      // Save the onboarding data to the backend
      await UserProfileService.createUserProfile({
        fitnessLevel: onboardingData.fitnessLevel!,
        fitnessGoals: onboardingData.fitnessGoals,
        availableEquipment: onboardingData.availableEquipment,
        timeCommitment: onboardingData.timeCommitment,
        preferences: onboardingData.preferences,
      });

      // Mark onboarding as completed
      setOnboardingCompleted(true);

      // Navigate to the app
      navigate('/app');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingStep1
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <OnboardingStep2
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <OnboardingStep3
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <OnboardingStep4
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <OnboardingStep5
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onComplete={handleComplete}
            onPrev={prevStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-bg bg-clip-text text-transparent">
            NeuraFit
          </h1>
          <p className="text-gray-600 mt-2">Let's personalize your fitness journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
