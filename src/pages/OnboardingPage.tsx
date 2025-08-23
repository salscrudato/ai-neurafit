import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OnboardingStep1 } from '../components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../components/onboarding/OnboardingStep3';
import { OnboardingStep4 } from '../components/onboarding/OnboardingStep4';
import { UserProfileService } from '../services/userProfileService';
import { useAuthStore } from '../store/authStore';
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
    restDayPreference: number; // 0..6
    injuriesOrLimitations: string[];
  };
}

const STORAGE_KEY = 'onboardingDraft:v1';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { setOnboardingCompleted, setError, clearError } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fitnessLevel: null,
    fitnessGoals: [],
    availableEquipment: [],
    timeCommitment: {
      daysPerWeek: 3,
      minutesPerSession: 30,
      preferredTimes: ['morning'], // Default to morning
    },
    preferences: {
      workoutTypes: ['strength_training'], // Default to strength training
      intensity: 'moderate',
      restDayPreference: 1, // Default to Monday as rest day
      injuriesOrLimitations: [],
    },
  });

  const [stepError, setStepError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const dirtyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = 'Onboarding • NeuraFit';
  }, []);

  /* ------------------------------ Draft: load/save ------------------------------ */

  // Load draft on mount (once)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.data) {
        setOnboardingData(parsed.data);
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= totalSteps) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch {
      // ignore corrupted drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: onboardingData, currentStep }),
        );
        dirtyRef.current = true;
      } catch {
        // storage may be full/blocked; ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [onboardingData, currentStep]);

  // Warn on unload if editing
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [submitting]);

  // Online/offline banner
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);



  /* -------------------------------- Validation -------------------------------- */

  const validateStep = (step: number, data: OnboardingData): string | null => {
    if (step === 1) {
      if (!data.fitnessLevel) return 'Please choose your current fitness level.';
    }
    if (step === 2) {
      if (!data.fitnessGoals.length) return 'Select at least one primary goal.';
    }
    if (step === 3) {
      // equipment optional; no-op
    }
    if (step === 4) {
      const { daysPerWeek, minutesPerSession, preferredTimes } = data.timeCommitment;
      if (daysPerWeek < 1 || daysPerWeek > 7) return 'Days per week must be between 1 and 7.';
      if (minutesPerSession < 10 || minutesPerSession > 180)
        return 'Minutes per session must be between 10 and 180.';
      if (!preferredTimes || !preferredTimes.length)
        return 'Select at least one preferred time of day.';
    }

    return null;
  };

  /* --------------------------------- Handlers --------------------------------- */

  const updateOnboardingData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...stepData }));
    setStepError('');
  };

  const nextStep = () => {
    const err = validateStep(currentStep, onboardingData);
    if (err) {
      setStepError(err);
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      setStepError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setStepError('');
    }
  };

  const handleComplete = async () => {
    // Validate final step before submit
    const err = validateStep(currentStep, onboardingData) || validateStep(5, onboardingData);
    if (err) {
      setStepError(err);
      return;
    }

    clearError();
    setSubmitting(true);
    setStepError('');
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      await UserProfileService.createUserProfile({
        fitnessLevel: onboardingData.fitnessLevel!,
        fitnessGoals: onboardingData.fitnessGoals,
        availableEquipment: onboardingData.availableEquipment,
        timeCommitment: onboardingData.timeCommitment,
        preferences: onboardingData.preferences,
      });

      // Clear draft and mark complete
      localStorage.removeItem(STORAGE_KEY);
      dirtyRef.current = false;
      setOnboardingCompleted(true);
      navigate('/app');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error?.message || 'Failed to complete onboarding');
      setStepError(error?.message || 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- Rendering -------------------------------- */

  const renderStep = () => {
    const stepProps = {
      data: onboardingData,
      onUpdate: updateOnboardingData,
    };
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 {...stepProps} onNext={nextStep} />;
      case 2:
        return <OnboardingStep2 {...stepProps} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <OnboardingStep3 {...stepProps} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return (
          <OnboardingStep4
            {...stepProps}
            onComplete={handleComplete}
            onPrev={prevStep}
            submitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* subtle moving gradient accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-100 via-cyan-100 to-primary-100 opacity-60 blur-2xl bg-[length:200%_100%]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.35 }
            : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
        }
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* offline banner */}
      {!online && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You’re offline. Changes are saved locally and will sync when you’re back online.
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            NeuraFit
          </h1>
          <p className="text-neutral-600 mt-2">Let’s personalize your fitness journey</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-neutral-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>



        {/* Step Error */}
        {stepError && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {stepError}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>


      </div>
    </div>
  );
};