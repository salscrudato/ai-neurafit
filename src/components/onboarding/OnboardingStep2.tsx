import React, { memo, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ScaleIcon,
  BoltIcon,
  HeartIcon,
  FireIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon,
  XMarkIcon as XIcon, // if not available, swap with a small "×" text
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import type { FitnessGoal } from '../../types';

interface OnboardingStep2Props {
  data: { fitnessGoals: FitnessGoal[] } & Record<string, any>;
  onUpdate: (data: Partial<{ fitnessGoals: FitnessGoal[] }>) => void;
  onNext: () => void;
  onPrev: () => void;
}

type GoalOption = {
  goal: FitnessGoal;
  title: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  color: string;
  bgColor: string;
  borderColor: string;
};

const GOALS: ReadonlyArray<GoalOption> = [
  {
    goal: 'lose_weight' as FitnessGoal,
    title: 'Lose Weight',
    description: 'Burn calories and reduce body fat',
    icon: ScaleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    goal: 'build_muscle' as FitnessGoal,
    title: 'Build Muscle',
    description: 'Increase muscle mass and strength',
    icon: BoltIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    goal: 'improve_cardio' as FitnessGoal,
    title: 'Improve Cardio',
    description: 'Enhance cardiovascular endurance',
    icon: HeartIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  {
    goal: 'increase_strength' as FitnessGoal,
    title: 'Increase Strength',
    description: 'Build functional strength and power',
    icon: FireIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    goal: 'improve_flexibility' as FitnessGoal,
    title: 'Improve Flexibility',
    description: 'Enhance mobility and range of motion',
    icon: SparklesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    goal: 'general_fitness' as FitnessGoal,
    title: 'General Fitness',
    description: 'Overall health and wellness',
    icon: ShieldCheckIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    goal: 'sport_specific' as FitnessGoal,
    title: 'Sport Specific',
    description: 'Train for specific sports or activities',
    icon: TrophyIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
];

export const OnboardingStep2: React.FC<OnboardingStep2Props> = memo(
  ({ data, onUpdate, onNext, onPrev }) => {
    const reduceMotion = useReducedMotion();
    const groupId = useId();
    const descId = `${groupId}-desc`;
    const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);

    const selected: FitnessGoal[] = useMemo(
      () => Array.isArray(data.fitnessGoals) ? data.fitnessGoals : [],
      [data.fitnessGoals],
    );

    const canProceed = selected.length > 0;

    const toggle = (goal: FitnessGoal) => {
      const isSelected = selected.includes(goal);
      const next = isSelected ? selected.filter((g) => g !== goal) : [...selected, goal];
      onUpdate({ fitnessGoals: next });
    };

    const selectedIndex = useMemo(() => {
      const first = GOALS.findIndex((g) => selected.includes(g.goal));
      return first >= 0 ? first : -1;
    }, [selected]);

    const moveFocus = (nextIndex: number) => {
      const idx = (nextIndex + GOALS.length) % GOALS.length;
      itemsRef.current[idx]?.focus();
    };

    const onItemKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      index: number,
      goal: FitnessGoal,
    ) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(index - 1);
          break;
        case 'Home':
          e.preventDefault();
          moveFocus(0);
          break;
        case 'End':
          e.preventDefault();
          moveFocus(GOALS.length - 1);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          toggle(goal);
          break;
        default:
          break;
      }
    };

    const clearAll = () => onUpdate({ fitnessGoals: [] });

    const selectedMeta = useMemo(
      () => GOALS.filter((g) => selected.includes(g.goal)),
      [selected],
    );

    return (
      <div className="card relative overflow-hidden">
        {/* Subtle moving gradient accent */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-primary-200 via-cyan-200 to-primary-200 bg-[length:200%_100%]"
          style={{ animation: reduceMotion ? undefined : 'gradientPan 10s ease infinite' }}
        />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            What are your fitness goals?
          </h2>
          <p id={descId} className="text-neutral-600">
            Select all that apply — we’ll tailor your workouts accordingly.
          </p>
        </div>

        {/* Multi-select group (checkbox semantics) */}
        <div
          role="group"
          aria-labelledby={`${groupId}-label`}
          aria-describedby={descId}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        >
          <span id={`${groupId}-label`} className="sr-only">
            Choose your fitness goals
          </span>

          {GOALS.map((option, idx) => {
            const isSelected = selected.includes(option.goal);
            return (
              <motion.div
                key={option.goal}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
              >
                <button
                  ref={(el) => { itemsRef.current[idx] = el; }}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={
                    selectedIndex === -1 ? (idx === 0 ? 0 : -1) : (idx === selectedIndex ? 0 : -1)
                  }
                  onKeyDown={(e) => onItemKeyDown(e, idx, option.goal)}
                  onClick={() => toggle(option.goal)}
                  className={[
                    'w-full p-4 rounded-xl border-2 transition-all duration-200 text-left bg-white focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    isSelected
                      ? `${option.borderColor} ${option.bgColor} shadow-md`
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? option.bgColor : 'bg-neutral-100'}`}>
                      <option.icon
                        className={`w-5 h-5 ${isSelected ? option.color : 'text-neutral-600'}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">{option.title}</h3>
                      <p className="text-sm text-neutral-600">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-primary-600 rounded-full grid place-items-center">
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Selection summary */}
        {selectedMeta.length > 0 && (
          <div className="mb-6 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
            <p className="text-sm text-primary-700">
              <strong>Selected:</strong> {selectedMeta.length}{' '}
              goal{selectedMeta.length !== 1 ? 's' : ''} chosen.
            </p>
            <div className="mt-2 flex flex-wrap gap-2" aria-live="polite">
              {selectedMeta.map((g) => (
                <span
                  key={g.goal}
                  className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                >
                  {g.title}
                  <button
                    type="button"
                    aria-label={`Remove ${g.title}`}
                    onClick={() => toggle(g.goal)}
                    className="ml-1 rounded-full p-0.5 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    {/* If XIcon isn't available, replace with &times; */}
                    <XIcon className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {selectedMeta.length > 1 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-primary-700 hover:text-primary-800 underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrev} size="lg" className="px-8">
            Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed} size="lg" className="px-8">
            Continue
          </Button>
        </div>
      </div>
    );
  },
);