// src/components/workout/WorkoutGenerationModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

import { WorkoutService } from '../../services/workoutService';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';

import type { UserProfile, WorkoutType, WorkoutGenerationRequest, Equipment } from '../../types';

/* ----------------------------- Constants / UI ---------------------------- */

const workoutTypes = [
  { value: 'strength_training', label: 'Strength Training', emoji: '💪', description: 'Build muscle and power' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃‍♀️', description: 'Improve cardiovascular health' },
  { value: 'hiit', label: 'HIIT', emoji: '⚡', description: 'High‑intensity intervals' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘‍♀️', description: 'Flexibility & mindfulness' },
  { value: 'functional', label: 'Functional', emoji: '🏋️‍♂️', description: 'Real‑world movement patterns' },
  { value: 'circuit', label: 'Circuit', emoji: '🔄', description: 'Mixed exercises in sequence' },
] as const;

const intensityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
] as const;

const focusOptions = [
  { value: 'full_body', label: 'Full Body' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'core', label: 'Core' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'power', label: 'Power' },
] as const;

const durationPresets = [10, 20, 30, 45];

/** Simple chip button */
const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ selected, onClick, children, className = '', ariaLabel }) => (
  <button
    type="button"
    aria-pressed={selected}
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-smooth border',
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-soft hover:bg-primary-700'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

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
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { setCurrentWorkout, setError, clearError } = useWorkoutStore();

  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('strength_training');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [focusAreas, setFocusAreas] = useState<string[]>(['full_body']);
  const [duration, setDuration] = useState<number>(userProfile?.timeCommitment?.minutesPerSession ?? 20);
  const [equipment, setEquipment] = useState<Equipment[]>(userProfile?.availableEquipment ?? []);
  const [bodyweightOnly, setBodyweightOnly] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      setDuration(userProfile.timeCommitment?.minutesPerSession ?? 20);
      setEquipment(userProfile.availableEquipment ?? []);
      setFocusAreas(['full_body']);
      setIntensity('moderate');
      setBodyweightOnly(false);
      setSelectedWorkoutType('strength_training');
      setLocalError('');
    }
  }, [userProfile, isOpen]);

  const toggleArrayValue = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleClose = () => {
    setGeneratedWorkout(null);
    setLocalError('');
    clearError();
    onClose();
  };

  const validate = () => {
    if (!user || !userProfile) {
      setLocalError('User profile not found. Please complete onboarding first.');
      setError('User profile not found. Please complete onboarding first.');
      return false;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setLocalError('Please set a valid session duration (minutes).');
      return false;
    }
    return true;
  };

  const handleGenerateWorkout = async () => {
    if (!validate()) return;

    setGenerating(true);
    setLocalError('');
    clearError();

    try {
      // Keep the original request shape; put overrides into preferences
      const request: WorkoutGenerationRequest = {
        userId: user!.id,
        fitnessLevel: userProfile!.fitnessLevel,
        fitnessGoals: userProfile!.fitnessGoals,
        availableEquipment: bodyweightOnly ? [] : equipment,
        timeCommitment: {
          ...userProfile!.timeCommitment,
          minutesPerSession: duration,
        },
        workoutType: selectedWorkoutType,
        focusAreas, // array of strings
        preferences: {
          ...(userProfile!.preferences || {}),
          intensity, // low | moderate | high
        },
      };

      const workout = await WorkoutService.generateWorkout(request);
      setGeneratedWorkout(workout);
      setCurrentWorkout(workout);
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

  /* ------------------------------ Instant Preview ------------------------------ */

  const preview = useMemo(() => {
    // Lightweight, friendly preview that adapts to selections
    const blocks: { title: string; hint: string }[] = [];

    const dur = Math.max(8, Math.min(90, Math.round(duration || 20)));
    const warmup = Math.min(10, Math.max(3, Math.round(dur * 0.15)));
    const work = Math.max(5, dur - warmup - 2);

    const labelFromType: Record<WorkoutType, string> = {
      strength_training: 'Strength Blocks',
      cardio: 'Cardio Segments',
      hiit: 'HIIT Rounds',
      yoga: 'Flows & Holds',
      pilates: 'Pilates Movements',
      stretching: 'Stretching Sequences',
      functional: 'Functional Sets',
      circuit: 'Circuit Laps',
    };

    const workLabel = labelFromType[selectedWorkoutType] || 'Blocks';

    blocks.push({ title: `Warm‑up • ~${warmup} min`, hint: 'Mobility + activation' });
    if (selectedWorkoutType === 'hiit') {
      blocks.push({ title: `${workLabel} • ~${work} min`, hint: `${intensity.toUpperCase()} intervals (work/rest)` });
    } else if (selectedWorkoutType === 'yoga') {
      blocks.push({ title: `${workLabel} • ~${work} min`, hint: focusAreas.includes('mobility') ? 'Mobility‑focused flow' : 'Balanced vinyasa' });
    } else {
      blocks.push({
        title: `${workLabel} • ~${work} min`,
        hint:
          focusAreas.includes('full_body')
            ? 'Full‑body emphasis'
            : `Focus: ${focusAreas.map((f) => f.replace('_', ' ')).join(', ')}`,
      });
    }
    blocks.push({ title: 'Cool‑down • ~2‑5 min', hint: 'Breathing + stretches' });

    return { dur, blocks };
  }, [selectedWorkoutType, intensity, focusAreas, duration]);

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

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
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
            </div>
            <button
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
                >
                  <p className="text-sm text-error-700">{localError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Selection area (hidden when result is shown) --- */}
            <AnimatePresence mode="wait">
              {!generatedWorkout ? (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                >
                  {/* 1) Type */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Workout Type</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {workoutTypes.map((type) => {
                        const selected = selectedWorkoutType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedWorkoutType(type.value as WorkoutType)}
                            aria-pressed={selected}
                            className={[
                              'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-smooth',
                              selected
                                ? 'border-primary-500 bg-primary-50 shadow-medium'
                                : 'border-neutral-200 hover:border-neutral-300 hover:shadow-soft',
                            ].join(' ')}
                          >
                            <span className="text-2xl leading-none">{type.emoji}</span>
                            <div>
                              <p className="font-semibold text-neutral-900">{type.label}</p>
                              <p className="text-sm text-neutral-600">{type.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* 2) Quick presets */}
                  <section className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ClockIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Duration</h3>
                      <Badge variant="secondary" size="xs">{preview.dur} min</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {durationPresets.map((m) => (
                        <Chip
                          key={m}
                          selected={duration === m}
                          onClick={() => setDuration(m)}
                          ariaLabel={`Set duration to ${m} minutes`}
                        >
                          {m} min
                        </Chip>
                      ))}

                      <div className="inline-flex items-center gap-2">
                        <Input
                          label="Custom"
                          type="number"
                          min={5}
                          max={120}
                          step={1}
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-28"
                          aria-label="Custom duration (minutes)"
                        />
                      </div>
                    </div>
                  </section>

                  {/* 3) Intensity & Focus */}
                  <section className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <FireIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Intensity & Focus</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Intensity */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">Intensity</p>
                        <div className="flex flex-wrap gap-2">
                          {intensityOptions.map((opt) => (
                            <Chip
                              key={opt.value}
                              selected={intensity === opt.value}
                              onClick={() => setIntensity(opt.value as any)}
                              ariaLabel={`Select intensity ${opt.label}`}
                            >
                              {opt.label}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      {/* Focus Areas */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">Focus Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {focusOptions.map((opt) => (
                            <Chip
                              key={opt.value}
                              selected={focusAreas.includes(opt.value)}
                              onClick={() => setFocusAreas((prev) => toggleArrayValue(prev, opt.value))}
                              ariaLabel={`Toggle focus ${opt.label}`}
                            >
                              {opt.label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
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
                          if (!bodyweightOnly) setEquipment([]); // toggling ON clears equipment
                        }}
                        ariaLabel="Toggle bodyweight only"
                      >
                        Bodyweight only
                      </Chip>

                      {!bodyweightOnly && (userProfile.availableEquipment?.length ?? 0) > 0 && (
                        <>
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
                    </div>
                  </section>

                  {/* 5) Instant Preview */}
                  <section className="mb-6">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary-600" aria-hidden />
                        <h4 className="font-semibold text-neutral-900">Instant Preview</h4>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        A quick look at how your session could be structured:
                      </p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {preview.blocks.map((b, i) => (
                          <li key={i} className="rounded-xl bg-white p-3 shadow-soft border border-neutral-200">
                            <p className="font-medium text-neutral-900">{b.title}</p>
                            <p className="text-sm text-neutral-600">{b.hint}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateWorkout} loading={generating} className="px-6">
                      <SparklesIcon className="w-5 h-5 mr-2" aria-hidden />
                      Generate Workout
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* ---------------------------- Generated Result ---------------------------- */
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -20 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                >
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                      <SparklesIcon className="h-8 w-8 text-success-600" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">Your Workout is Ready! 🎉</h3>
                    <p className="text-neutral-600">AI has generated a personalized workout just for you.</p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 mb-6 border border-neutral-200">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-2">{generatedWorkout.name}</h4>
                    {generatedWorkout.description && (
                      <p className="text-neutral-700 mb-4">{generatedWorkout.description}</p>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <strong>Duration:</strong> {generatedWorkout.estimatedDuration ?? preview.dur} min
                      </div>
                      <div>
                        <strong>Exercises:</strong> {generatedWorkout.exercises?.length ?? 0}
                      </div>
                      <div>
                        <strong>Difficulty:</strong> {generatedWorkout.difficulty ?? '—'}
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
                              <p className="font-medium text-neutral-900">{ex.name ?? `Exercise ${idx + 1}`}</p>
                              {ex.sets && ex.reps && (
                                <p className="text-sm text-neutral-600">
                                  {ex.sets} sets × {ex.reps} reps
                                </p>
                              )}
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
                    <Button onClick={handleStartWorkout} className="px-6">
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