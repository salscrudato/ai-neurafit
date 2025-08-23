import React, { memo, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import type { FitnessLevel } from '../../types';

interface OnboardingStep1Props {
  data: { fitnessLevel: FitnessLevel | null };
  onUpdate: (data: Partial<{ fitnessLevel: FitnessLevel }>) => void;
  onNext: () => void;
}

type LevelOption = {
  level: FitnessLevel;
  title: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
};

const fitnessLevels: ReadonlyArray<LevelOption> = [
  {
    level: 'beginner',
    title: 'Beginner',
    description: 'New to fitness or getting back into it',
    icon: AcademicCapIcon,
  },
  {
    level: 'intermediate',
    title: 'Intermediate',
    description: 'Regular exercise routine for 6+ months',
    icon: TrophyIcon,
  },
  {
    level: 'advanced',
    title: 'Advanced',
    description: 'Experienced athlete or fitness enthusiast',
    icon: FireIcon,
  },
];

export const OnboardingStep1: React.FC<OnboardingStep1Props> = memo(
  ({ data, onUpdate, onNext }) => {
    const reduceMotion = useReducedMotion();
    const groupId = useId();
    const descId = `${groupId}-desc`;
    const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);

    const selectedIndex = useMemo(() => {
      return fitnessLevels.findIndex((o) => o.level === data.fitnessLevel);
    }, [data.fitnessLevel]);

    const canProceed = data.fitnessLevel !== null;

    const selectLevel = (level: FitnessLevel) => {
      onUpdate({ fitnessLevel: level });
    };

    const moveFocus = (nextIndex: number) => {
      const idx =
        (nextIndex + fitnessLevels.length) % fitnessLevels.length; // wrap
      const el = itemsRef.current[idx];
      if (el) el.focus();
    };

    const onItemKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      index: number,
      level: FitnessLevel,
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
          moveFocus(fitnessLevels.length - 1);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          selectLevel(level);
          break;
        default:
          break;
      }
    };

    return (
      <div className="card relative overflow-hidden">
        {/* Subtle moving gradient accent */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-primary-200 via-cyan-200 to-primary-200 bg-[length:200%_100%]"
          style={{
            animation: reduceMotion ? undefined : 'gradientPan 10s ease infinite',
          }}
        />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            What’s your fitness level?
          </h2>
          <p id={descId} className="text-neutral-600">
            This helps us tailor your plan. You can change this later in your profile.
          </p>
        </div>

        {/* Radio group */}
        <div
          role="radiogroup"
          aria-labelledby={`${groupId}-label`}
          aria-describedby={descId}
          className="space-y-4 mb-8"
        >
          <span id={`${groupId}-label`} className="sr-only">
            Select your fitness level
          </span>

          {fitnessLevels.map((option, index) => {
            const selected = data.fitnessLevel === option.level;
            return (
              <motion.div
                key={option.level}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <button
                  ref={(el) => { itemsRef.current[index] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selectedIndex === -1 ? (index === 0 ? 0 : -1) : selected ? 0 : -1}
                  onKeyDown={(e) => onItemKeyDown(e, index, option.level)}
                  onClick={() => selectLevel(option.level)}
                  className={[
                    'w-full p-6 rounded-xl border-2 transition-all duration-200 text-left focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary-400 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        selected ? 'bg-primary-100' : 'bg-neutral-100'
                      }`}
                    >
                      <option.icon
                        className={`h-6 w-6 ${
                          selected ? 'text-primary-600' : 'text-neutral-600'
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-neutral-600">{option.description}</p>
                    </div>

                    {/* Selected check */}
                    {selected && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 bg-primary-600 rounded-full grid place-items-center">
                          <svg
                            className="w-4 h-4 text-white"
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

        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!canProceed} size="lg" className="px-8">
            Continue
          </Button>
        </div>
      </div>
    );
  },
);