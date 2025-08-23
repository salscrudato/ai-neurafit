// src/components/workout/WorkoutGenerationModal.tsx
import React, { useEffect, useRef, useState, useId } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ClipboardIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  FaDumbbell,
  FaRunning,
  FaHeartbeat,
  FaUserFriends,
  FaArrowUp,
  FaArrowDown,
  FaCircle,
  FaFire,
  FaEdit,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { fadeUp } from '../../utils/animations';

import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

import { WorkoutService } from '../../services/workoutService';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';

import type {
  UserProfile,
  WorkoutType,
  WorkoutGenerationRequest,
  Equipment,
} from '../../types';

/* ----------------------------- Constants / UI ---------------------------- */

const workoutTypes = [
  { value: 'push_day', label: 'Push Day (Chest/Triceps)', icon: FaDumbbell, description: 'Chest, shoulders, triceps focus' },
  { value: 'pull_day', label: 'Pull Day (Back/Biceps)', icon: FaArrowDown, description: 'Back, biceps, rear delts focus' },
  { value: 'legs', label: 'Legs', icon: FaArrowUp, description: 'Quads, hamstrings, glutes, calves' },
  { value: 'upper_body', label: 'Upper Body', icon: FaUserFriends, description: 'Complete upper body workout' },
  { value: 'full_body', label: 'Full Body', icon: FaCircle, description: 'Total body compound movements' },
  { value: 'cardio', label: 'Cardio', icon: FaRunning, description: 'Cardiovascular endurance training' },
  { value: 'hiit', label: 'HIIT', icon: FaFire, description: 'High-intensity interval training' },
  { value: 'strength_training', label: 'Strength Training', icon: FaDumbbell, description: 'Progressive overload focused' },
  { value: 'core_abs', label: 'Core & Abs', icon: FaHeartbeat, description: 'Core stability and strength' },
  { value: 'custom', label: 'Custom', icon: FaEdit, description: 'Describe your own workout' },
] as const;



/** Simple chip button */
const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}> = ({ selected, onClick, children, className = '', ariaLabel, disabled, title }) => (
  <button
    type="button"
    aria-pressed={selected}
    aria-label={ariaLabel}
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-smooth border focus-visible-enhanced',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-soft hover:bg-primary-700'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

/* --------------------------------- Helpers -------------------------------- */

type Intensity = 'low' | 'moderate' | 'high';

const clampDuration = (n: number) => Math.max(5, Math.min(120, Math.round(n || 20)));

const intensityFromLevel = (fitnessLevel?: string): Intensity => {
  const level = (fitnessLevel || '').toLowerCase();
  if (level.includes('begin')) return 'low';
  if (level.includes('adv')) return 'high';
  return 'moderate';
};





/* --------------------------------- Modal -------------------------------- */

interface WorkoutGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export const WorkoutGenerationModal: React.FC<WorkoutGenerationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCurrentWorkout, setError, clearError } = useWorkoutStore();

  // ---- Local state
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('push_day');
  const [duration, setDuration] = useState<number>(20);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bodyweightOnly, setBodyweightOnly] = useState<boolean>(false);
  const [customWorkoutDescription, setCustomWorkoutDescription] = useState<string>('');

  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [localError, setLocalError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const durationSliderId = useId();

  // ---- Load / reset when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Defaults from user profile
    const defaultDuration = clampDuration(userProfile?.timeCommitment?.minutesPerSession ?? 20);
    const defaultEquip = userProfile?.availableEquipment ?? [];
    const defaultType: WorkoutType = 'push_day';

    // Set defaults
    setSelectedWorkoutType(defaultType);
    setDuration(defaultDuration);
    setEquipment(defaultEquip);
    setBodyweightOnly(false);
    setCustomWorkoutDescription('');

    // UI resets
    setLocalError('');
    setGeneratedWorkout(null);
    setCopied(false);

    // Move focus to first major control for a11y
    setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);
  }, [isOpen, userProfile]);



  const toggleArrayValue = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleClose = () => {
    if (generating) return; // prevent accidental close mid-generation
    setGeneratedWorkout(null);
    setLocalError('');
    clearError();
    onClose();
  };

  const validate = () => {
    if (!user || !userProfile) {
      const msg = 'User profile not found. Please complete onboarding first.';
      setLocalError(msg);
      setError(msg);
      return false;
    }
    if (!Number.isFinite(duration) || clampDuration(duration) <= 0) {
      setLocalError('Please set a valid session duration (5–120 minutes).');
      return false;
    }

    return true;
  };

  const resolvedIntensity: Intensity = intensityFromLevel(userProfile?.fitnessLevel);

  // ---- Generate workout
  const handleGenerateWorkout = async () => {
    if (!validate()) return;

    setGenerating(true);
    setLocalError('');
    clearError();

    try {
      const request: WorkoutGenerationRequest = {
        fitnessLevel: userProfile!.fitnessLevel,
        fitnessGoals: userProfile!.fitnessGoals,
        availableEquipment: bodyweightOnly ? [] : equipment,
        timeCommitment: {
          ...userProfile!.timeCommitment,
          minutesPerSession: clampDuration(duration),
        },
        workoutType: selectedWorkoutType,
        preferences: {
          ...(userProfile!.preferences || {}),
          intensity: resolvedIntensity,
        },
        ...(selectedWorkoutType === 'custom' && customWorkoutDescription && {
          customDescription: customWorkoutDescription,
        }),
      };

      const workout = await WorkoutService.generateWorkout(request);
      setGeneratedWorkout(workout);
      setCurrentWorkout(workout);
      setCopied(false);
      // move focus to the "Start Workout" button for a11y
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate workout';
      setLocalError(message);
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = () => {
    if (generatedWorkout) {
      setCurrentWorkout(generatedWorkout);
      handleClose();
      navigate('/app/workout');
    }
  };



  /* ---------------------------------- UI ---------------------------------- */

  if (!userProfile) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px]" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="card w-full max-w-md">
            <div className="text-center p-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Complete Your Profile</h3>
              <p className="text-neutral-600 mb-4">
                Please complete onboarding to generate personalized workouts.
              </p>
              <Button onClick={() => (window.location.href = '/onboarding')}>Complete Onboarding</Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  // Derived UI helpers
  const profileHasEquipment = (userProfile.availableEquipment?.length ?? 0) > 0;





  const copyPlan = async () => {
    if (!generatedWorkout) return;
    try {
      const summary = {
        name: generatedWorkout.name ?? 'Workout',
        type: generatedWorkout.type ?? selectedWorkoutType,
        duration: generatedWorkout.estimatedDuration ?? duration,
        difficulty: generatedWorkout.difficulty ?? resolvedIntensity,
        exercises: (generatedWorkout.exercises ?? []).map((x: any) => ({
          name: x.name,
          sets: x.sets,
          reps: x.reps,
          duration: x.duration,
          rest: x.rest,
        })),
      };
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore; clipboard might be unavailable
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
      // prevent closing on overlay click while generating
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-2 sm:p-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-primary-600 mr-2" aria-hidden />
              <Dialog.Title className="text-xl font-semibold text-neutral-900">
                Generate AI Workout
              </Dialog.Title>
              <Badge variant="secondary" size="xs" className="ml-2">Beta</Badge>
            </div>
            <button
              ref={closeBtnRef}
              onClick={handleClose}
              className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 transition-smooth focus-visible-enhanced"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Error banner */}
            <AnimatePresence>
              {localError && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3"
                  data-testid="generation-error"
                >
                  <div className="flex items-start gap-2">
                    <span className="sr-only">Error</span>
                    <p className="text-sm text-error-700">{localError}</p>
                    <div className="ml-auto">
                      <Button size="xs" variant="ghost" onClick={() => setLocalError('')}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Selection area (hidden when result is shown) --- */}
            <AnimatePresence mode="wait">
              {!generatedWorkout ? (
                <motion.form
                  key="selection"
                  variants={fadeUp()}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGenerateWorkout();
                  }}
                  aria-describedby="instant-preview"
                >
                  {/* 1) Duration - Moved to top */}
                  <section className="mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <ClockIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Duration</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Slider */}
                      <div>
                        <label htmlFor={durationSliderId} className="sr-only">Duration slider</label>
                        <input
                          id={durationSliderId}
                          type="range"
                          min={5}
                          max={120}
                          step={5}
                          value={duration}
                          onChange={(e) => setDuration(clampDuration(Number(e.target.value)))}
                          className="w-full accent-primary-600"
                          aria-valuemin={5}
                          aria-valuemax={120}
                          aria-valuenow={duration}
                        />
                        <div className="mt-1 flex justify-between text-xs text-neutral-500">
                          <span>5 min</span>
                          <span>60 min</span>
                          <span>120 min</span>
                        </div>
                      </div>


                    </div>
                  </section>

                  {/* 2) Workout Type */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Workout Type</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {workoutTypes.map((type, idx) => {
                        const selected = selectedWorkoutType === type.value;
                        return (
                          <button
                            key={type.value}
                            ref={idx === 0 ? initialFocusRef : undefined}
                            type="button"
                            onClick={() => {
                              setSelectedWorkoutType(type.value as WorkoutType);
                            }}
                            aria-pressed={selected}
                            className={[
                              'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-smooth',
                              selected
                                ? 'border-primary-500 bg-primary-50 shadow-medium'
                                : 'border-neutral-200 hover:border-neutral-300 hover:shadow-soft',
                            ].join(' ')}
                          >
                            <type.icon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-neutral-900">{type.label}</p>
                              <p className="text-sm text-neutral-600">{type.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom workout description field */}
                    {selectedWorkoutType === 'custom' && (
                      <div className="mt-4">
                        <label htmlFor="custom-description" className="block text-sm font-medium text-neutral-700 mb-2">
                          Describe your workout
                        </label>
                        <textarea
                          id="custom-description"
                          value={customWorkoutDescription}
                          onChange={(e) => setCustomWorkoutDescription(e.target.value)}
                          placeholder="Describe the type of workout you want (e.g., 'Upper body strength with focus on shoulders and arms')"
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          rows={3}
                        />
                      </div>
                    )}
                  </section>





                  {/* 4) Equipment */}
                  <section className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <WrenchScrewdriverIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Equipment</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        selected={bodyweightOnly}
                        onClick={() => {
                          setBodyweightOnly((s) => !s);
                          setEquipment((prev) => (!bodyweightOnly ? [] : prev));
                        }}
                        ariaLabel="Toggle bodyweight only"
                        title="Use no equipment"
                      >
                        Bodyweight only
                      </Chip>

                      {!bodyweightOnly && profileHasEquipment && (
                        <>
                          <Chip
                            onClick={() => setEquipment(userProfile.availableEquipment!)}
                            ariaLabel="Select all equipment"
                            title="Select all"
                          >
                            Select all
                          </Chip>
                          <Chip
                            onClick={() => setEquipment([])}
                            ariaLabel="Clear equipment"
                            title="Clear all"
                          >
                            Clear
                          </Chip>
                          {userProfile.availableEquipment!.map((eq) => (
                            <Chip
                              key={eq}
                              selected={equipment.includes(eq)}
                              onClick={() => setEquipment((prev) => toggleArrayValue(prev, eq))}
                              ariaLabel={`Toggle equipment ${eq}`}
                            >
                              {eq}
                            </Chip>
                          ))}
                        </>
                      )}

                      {!profileHasEquipment && !bodyweightOnly && (
                        <p className="text-sm text-neutral-500">
                          No equipment saved in profile. Add some in Settings to see quick chips.
                        </p>
                      )}
                    </div>


                  </section>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={generating} className="px-6" data-testid="generate-btn">
                      <SparklesIcon className="w-5 h-5 mr-2" aria-hidden />
                      Generate Workout
                    </Button>
                  </div>

                  {/* Loading overlay (subtle) */}
                  <AnimatePresence>
                    {generating && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <div className="flex gap-2 mb-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="h-2 w-2 rounded-full bg-primary-600"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-neutral-700">Crafting your workout…</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.form>
              ) : (
                /* ---------------------------- Generated Result ---------------------------- */
                <motion.div
                  key="result"
                  variants={fadeUp()}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                      <SparklesIcon className="h-8 w-8 text-success-600" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      Your Workout is Ready! 🎉
                    </h3>
                    <p className="text-neutral-600">
                      AI generated a personalized session from your selections.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 mb-6 border border-neutral-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {generatedWorkout.name ?? 'Personalized Workout'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setGeneratedWorkout(null)}>
                          Edit selections
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyPlan} title="Copy summary JSON to clipboard">
                          {copied ? <CheckIcon className="w-4 h-4 mr-2" /> : <ClipboardIcon className="w-4 h-4 mr-2" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {generatedWorkout.description && (
                      <p className="text-neutral-700 mb-4">{generatedWorkout.description}</p>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <strong>Duration:</strong> {generatedWorkout.estimatedDuration ?? duration} min
                      </div>
                      <div>
                        <strong>Exercises:</strong> {generatedWorkout.exercises?.length ?? 0}
                      </div>
                      <div>
                        <strong>Difficulty:</strong> {generatedWorkout.difficulty ?? resolvedIntensity}
                      </div>
                      <div>
                        <strong>Type:</strong> {generatedWorkout.type ?? selectedWorkoutType}
                      </div>
                    </div>

                    {Array.isArray(generatedWorkout.exercises) && generatedWorkout.exercises.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-neutral-700 mb-2">First few exercises</p>
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {generatedWorkout.exercises.slice(0, 6).map((ex: any, idx: number) => (
                            <li key={idx} className="rounded-xl bg-white p-3 shadow-soft border border-neutral-200">
                              <p className="font-medium text-neutral-900">
                                {ex.name ?? `Exercise ${idx + 1}`}
                              </p>
                              <p className="text-sm text-neutral-600">
                                {ex.sets && ex.reps ? (
                                  <>
                                    {ex.sets} sets × {ex.reps} reps
                                  </>
                                ) : ex.duration ? (
                                  <>~{ex.duration} sec</>
                                ) : (
                                  <>Details provided in workout</>
                                )}
                                {ex.rest ? <span className="text-neutral-500"> • Rest {ex.rest}s</span> : null}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => setGeneratedWorkout(null)}>
                      Generate Another
                    </Button>
                    <Button onClick={handleStartWorkout} className="px-6" data-testid="start-workout-btn">
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