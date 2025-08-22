import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';
import type { WorkoutType } from '../../types';

interface OnboardingStep5Props {
  data: any;
  onUpdate: (data: any) => void;
  onComplete: () => Promise<void> | void;
  onPrev: () => void;
  submitting?: boolean;
}

/* ----------------------------- Options ----------------------------- */

const workoutTypeOptions: ReadonlyArray<{ value: WorkoutType; label: string; emoji: string; emojiLabel: string }> = [
  { value: 'strength_training', label: 'Strength Training', emoji: '💪', emojiLabel: 'strength' },
  { value: 'cardio',            label: 'Cardio',            emoji: '🏃‍♀️', emojiLabel: 'cardio' },
  { value: 'hiit',              label: 'HIIT',              emoji: '⚡',   emojiLabel: 'hiit' },
  { value: 'yoga',              label: 'Yoga',              emoji: '🧘‍♀️', emojiLabel: 'yoga' },
  { value: 'pilates',           label: 'Pilates',           emoji: '🤸‍♀️', emojiLabel: 'pilates' },
  { value: 'stretching',        label: 'Stretching',        emoji: '🤲',   emojiLabel: 'stretching' },
  { value: 'functional',        label: 'Functional',        emoji: '🏋️‍♂️', emojiLabel: 'functional' },
  { value: 'circuit',           label: 'Circuit',           emoji: '🔄',   emojiLabel: 'circuit' },
];

const intensityOptions = [
  { value: 'low' as const,      label: 'Low',      description: 'Gentle, recovery‑focused' },
  { value: 'moderate' as const, label: 'Moderate', description: 'Balanced challenge' },
  { value: 'high' as const,     label: 'High',     description: 'Intense, challenging' },
];

// Align with profile schema (0..6)
const restDayOptions = Array.from({ length: 7 }, (_, n) => ({
  value: n,
  label: `${n}`,
  description: `Rest day${n !== 1 ? 's' : ''} / week`,
}));

/* ----------------------------- Component ----------------------------- */

export const OnboardingStep5: React.FC<OnboardingStep5Props> = ({
  data,
  onUpdate,
  onComplete,
  onPrev,
}) => {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);

  // IDs for a11y
  const groupIdTypes = useId();
  const groupIdIntensity = useId();
  const groupIdRest = useId();
  const descTypes = `${groupIdTypes}-desc`;
  const descIntensity = `${groupIdIntensity}-desc`;
  const descRest = `${groupIdRest}-desc`;

  // State slices
  const selectedTypes: WorkoutType[] = useMemo(
    () => (Array.isArray(data?.preferences?.workoutTypes) ? data.preferences.workoutTypes : []),
    [data?.preferences?.workoutTypes],
  );
  const selectedIntensity: 'low' | 'moderate' | 'high' | null =
    (data?.preferences?.intensity as any) ?? null;
  const selectedRestDays: number | null =
    typeof data?.preferences?.restDayPreference === 'number'
      ? data.preferences.restDayPreference
      : null;

  const injuries: string[] = useMemo(
    () => (Array.isArray(data?.preferences?.injuriesOrLimitations) ? data.preferences.injuriesOrLimitations : []),
    [data?.preferences?.injuriesOrLimitations],
  );

  // Editable injuries text
  const [injuriesText, setInjuriesText] = useState(injuries.join(', '));
  useEffect(() => {
    // Sync from external changes if any
    setInjuriesText(injuries.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injuries.length]);

  /* ----------------------------- Focus management ----------------------------- */

  const typesRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const intensityRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const restRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const firstTypesIndex = Math.max(0, workoutTypeOptions.findIndex((o) => selectedTypes.includes(o.value)));
  const firstIntensityIndex = Math.max(0, intensityOptions.findIndex((o) => o.value === selectedIntensity));
  const firstRestIndex = Math.max(0, restDayOptions.findIndex((o) => o.value === selectedRestDays));

  const moveFocus = (
    refs: React.MutableRefObject<Array<HTMLButtonElement | null>>,
    nextIndex: number,
  ) => {
    const len = refs.current.length;
    if (!len) return;
    const idx = (nextIndex + len) % len;
    refs.current[idx]?.focus();
  };

  const onGridKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    refs: React.MutableRefObject<Array<HTMLButtonElement | null>>,
    index: number,
    onActivate: () => void,
    _mode: 'radio' | 'checkbox', // Prefixed with _ to indicate intentionally unused
  ) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(refs, index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(refs, index - 1);
        break;
      case 'Home':
        e.preventDefault();
        moveFocus(refs, 0);
        break;
      case 'End':
        e.preventDefault();
        moveFocus(refs, refs.current.length - 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        onActivate();
        break;
      default:
        break;
    }
  };

  /* ----------------------------- Updaters ----------------------------- */

  const patchPreferences = (patch: any) =>
    onUpdate({ preferences: { ...data.preferences, ...patch } });

  const toggleType = (t: WorkoutType) => {
    const next = selectedTypes.includes(t)
      ? selectedTypes.filter((x) => x !== t)
      : [...selectedTypes, t];
    patchPreferences({ workoutTypes: next });
  };

  const setIntensity = (v: 'low' | 'moderate' | 'high') => {
    patchPreferences({ intensity: v });
  };

  const setRestDays = (n: number) => {
    patchPreferences({ restDayPreference: n });
  };

  const parseInjuries = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const onInjuriesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInjuriesText(text);
    patchPreferences({ injuriesOrLimitations: parseInjuries(text) });
  };

  const removeInjury = (name: string) => {
    const next = injuries.filter((i) => i.toLowerCase() !== name.toLowerCase());
    patchPreferences({ injuriesOrLimitations: next });
    setInjuriesText(next.join(', '));
  };

  const clearTypes = () => patchPreferences({ workoutTypes: [] });
  const clearInjuries = () => {
    patchPreferences({ injuriesOrLimitations: [] });
    setInjuriesText('');
  };

  /* ----------------------------- Completion ----------------------------- */

  const canProceed =
    selectedTypes.length > 0 &&
    typeof selectedIntensity === 'string' &&
    selectedRestDays !== null &&
    selectedRestDays >= 0 &&
    selectedRestDays <= 6;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete();
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <div className="card relative overflow-hidden">
      {/* Subtle moving gradient accent */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-primary-200 via-cyan-200 to-primary-200 bg-[length:200%_100%]"
        style={{ animation: reduceMotion ? undefined : 'gradientPan 10s ease infinite' }}
      />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Final preferences</h2>
        <p className="text-neutral-600">Let’s fine‑tune your workout experience</p>
      </div>

      <div className="space-y-8 mb-8">
        {/* Workout Types — Checkbox group */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            What types of workouts do you enjoy?
          </h3>
          <p id={descTypes} className="sr-only">
            Select one or more workout types
          </p>
          <div
            role="group"
            aria-labelledby={`${groupIdTypes}-label`}
            aria-describedby={descTypes}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <span id={`${groupIdTypes}-label`} className="sr-only">
              Workout types
            </span>
            {workoutTypeOptions.map((option, index) => {
              const selected = selectedTypes.includes(option.value);
              return (
                <motion.button
                  key={option.value}
                  ref={(el) => { typesRefs.current[index] = el; }}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={index === (firstTypesIndex >= 0 ? firstTypesIndex : 0) ? 0 : -1}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  onKeyDown={(e) => onGridKeyDown(e, typesRefs, index, () => toggleType(option.value), 'checkbox')}
                  onClick={() => toggleType(option.value)}
                  className={[
                    'p-3 rounded-lg border-2 transition-all duration-200 text-center bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="text-2xl mb-1">
                    <span role="img" aria-label={option.emojiLabel}>
                      {option.emoji}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{option.label}</div>
                </motion.button>
              );
            })}
          </div>

          {/* Selected types summary */}
          {selectedTypes.length > 0 && (
            <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
              <p className="text-sm text-primary-700">
                <strong>Selected:</strong> {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}.
              </p>
              <div className="mt-2 flex flex-wrap gap-2" aria-live="polite">
                {workoutTypeOptions
                  .filter((o) => selectedTypes.includes(o.value))
                  .map((o) => (
                    <span
                      key={o.value}
                      className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                    >
                      {o.label}
                      <button
                        type="button"
                        aria-label={`Remove ${o.label}`}
                        onClick={() => toggleType(o.value)}
                        className="ml-1 rounded-full p-0.5 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                      >
                        <XIcon className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                {selectedTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={clearTypes}
                    className="text-xs font-medium text-primary-700 hover:text-primary-800 underline underline-offset-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Intensity — Radiogroup */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Preferred workout intensity</h3>
          <p id={descIntensity} className="sr-only">
            Select one intensity level
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${groupIdIntensity}-label`}
            aria-describedby={descIntensity}
            className="grid grid-cols-3 gap-3"
          >
            <span id={`${groupIdIntensity}-label`} className="sr-only">
              Intensity
            </span>
            {intensityOptions.map((option, index) => {
              const selected = selectedIntensity === option.value;
              return (
                <motion.button
                  key={option.value}
                  ref={(el) => { intensityRefs.current[index] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={index === (firstIntensityIndex >= 0 ? firstIntensityIndex : 0) ? 0 : -1}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  onKeyDown={(e) => onGridKeyDown(e, intensityRefs, index, () => setIntensity(option.value), 'radio')}
                  onClick={() => setIntensity(option.value)}
                  className={[
                    'p-4 rounded-lg border-2 transition-all duration-200 text-center bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="font-semibold text-neutral-900 mb-1">{option.label}</div>
                  <div className="text-sm text-neutral-600">{option.description}</div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Rest days — Radiogroup (0..6) */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            How many rest days do you prefer per week?
          </h3>
          <p id={descRest} className="sr-only">
            Select one rest day count between 0 and 6
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${groupIdRest}-label`}
            aria-describedby={descRest}
            className="grid grid-cols-4 sm:grid-cols-7 gap-3"
          >
            <span id={`${groupIdRest}-label`} className="sr-only">
              Rest days per week
            </span>
            {restDayOptions.map((option, index) => {
              const selected = selectedRestDays === option.value;
              return (
                <motion.button
                  key={option.value}
                  ref={(el) => { restRefs.current[index] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={index === (firstRestIndex >= 0 ? firstRestIndex : 0) ? 0 : -1}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  onKeyDown={(e) => onGridKeyDown(e, restRefs, index, () => setRestDays(option.value), 'radio')}
                  onClick={() => setRestDays(option.value)}
                  className={[
                    'p-4 rounded-lg border-2 transition-all duration-200 text-center bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="text-xl font-bold text-neutral-900">{option.label}</div>
                  <div className="text-sm text-neutral-600">{option.description}</div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Injuries / Limitations */}
        <section>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Any injuries or limitations? <span className="text-neutral-500 font-normal">(Optional)</span>
          </h3>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="e.g., knee injury, lower back pain, shoulder issues (separate with commas)"
            value={injuriesText}
            onChange={onInjuriesChange}
            aria-describedby={`${groupIdTypes}-injuries-help`}
          />
          <p id={`${groupIdTypes}-injuries-help`} className="text-sm text-neutral-500 mt-2">
            This helps us avoid exercises that might aggravate existing conditions.
          </p>

          {injuries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
              {injuries.map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                >
                  {i}
                  <button
                    type="button"
                    aria-label={`Remove ${i}`}
                    onClick={() => removeInjury(i)}
                    className="ml-1 rounded-full p-0.5 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    <XIcon className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {injuries.length > 1 && (
                <button
                  type="button"
                  onClick={clearInjuries}
                  className="text-xs font-medium text-primary-700 hover:text-primary-800 underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Summary */}
      <div className="bg-neutral-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Fitness Level:</strong> {String(data.fitnessLevel || '').replace('_', ' ')}
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
          <div className="md:col-span-2">
            <strong>Preferences:</strong>{' '}
            {selectedTypes.length > 0
              ? workoutTypeOptions
                  .filter((o) => selectedTypes.includes(o.value))
                  .map((o) => o.label)
                  .join(', ')
              : '—'}
            {selectedIntensity ? ` • Intensity: ${selectedIntensity}` : ''}
            {selectedRestDays !== null ? ` • Rest days: ${selectedRestDays}` : ''}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg" className="px-8">
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!canProceed || loading}
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