import React, { memo, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';
import type { Equipment } from '../../types';

interface OnboardingStep3Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

type EquipmentOption = {
  equipment: Equipment;
  title: string;
  description: string;
  emoji: string;
  emojiLabel: string;
};

const equipmentOptions: ReadonlyArray<EquipmentOption> = [
  { equipment: 'bodyweight',       title: 'Bodyweight Only',   description: 'No equipment needed',              emoji: '🏃‍♂️', emojiLabel: 'bodyweight' },
  { equipment: 'dumbbells',        title: 'Dumbbells',         description: 'Adjustable or fixed weights',      emoji: '🏋️‍♀️', emojiLabel: 'dumbbells' },
  { equipment: 'barbell',          title: 'Barbell',           description: 'Olympic or standard barbell',      emoji: '🏋️‍♂️', emojiLabel: 'barbell' },
  { equipment: 'kettlebells',      title: 'Kettlebells',       description: 'Various weights available',        emoji: '⚖️',   emojiLabel: 'kettlebell' },
  { equipment: 'resistance_bands', title: 'Resistance Bands',  description: 'Loop bands or tube bands',         emoji: '🎯',   emojiLabel: 'resistance bands' },
  { equipment: 'pull_up_bar',      title: 'Pull-up Bar',       description: 'Doorway or wall-mounted',          emoji: '🚪',   emojiLabel: 'pull-up bar' },
  { equipment: 'yoga_mat',         title: 'Yoga Mat',          description: 'For floor exercises',              emoji: '🧘‍♀️', emojiLabel: 'yoga mat' },
  { equipment: 'cardio_machine',   title: 'Cardio Machine',    description: 'Treadmill, bike, elliptical',      emoji: '🚴‍♀️', emojiLabel: 'cardio machine' },
  { equipment: 'gym_access',       title: 'Full Gym Access',   description: 'Complete gym facility',            emoji: '🏢',   emojiLabel: 'gym' },
];

export const OnboardingStep3: React.FC<OnboardingStep3Props> = memo(
  ({ data, onUpdate, onNext, onPrev }) => {
    const reduceMotion = useReducedMotion();
    const groupId = useId();
    const descId = `${groupId}-desc`;
    const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);

    const selected: Equipment[] = useMemo(
      () => Array.isArray(data?.availableEquipment) ? data.availableEquipment : [],
      [data?.availableEquipment],
    );

    const isSelected = (eq: Equipment) => selected.includes(eq);

    const toggle = (eq: Equipment) => {
      const next = isSelected(eq)
        ? selected.filter((e) => e !== eq)
        : Array.from(new Set([...selected, eq])); // dedupe
      onUpdate({ availableEquipment: next });
    };

    const clearAll = () => onUpdate({ availableEquipment: [] });

    // Roving focus index (default to first)
    const firstIdx = selected.length
      ? Math.max(0, equipmentOptions.findIndex((o) => selected.includes(o.equipment)))
      : 0;

    const moveFocus = (nextIndex: number) => {
      const idx = (nextIndex + equipmentOptions.length) % equipmentOptions.length;
      itemsRef.current[idx]?.focus();
    };

    const onItemKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      index: number,
      eq: Equipment,
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
          moveFocus(equipmentOptions.length - 1);
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          toggle(eq);
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
          style={{ animation: reduceMotion ? undefined : 'gradientPan 10s ease infinite' }}
        />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            What equipment do you have access to?
          </h2>
          <p id={descId} className="text-neutral-600">
            Select all that apply. Don’t have any? That’s fine—bodyweight programs work great.
          </p>
        </div>

        {/* Multi-select group */}
        <div
          role="group"
          aria-labelledby={`${groupId}-label`}
          aria-describedby={descId}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
        >
          <span id={`${groupId}-label`} className="sr-only">
            Choose available equipment
          </span>

          {equipmentOptions.map((option, index) => {
            const selectedNow = isSelected(option.equipment);
            return (
              <motion.div
                key={option.equipment}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <button
                  ref={(el) => { itemsRef.current[index] = el; }}
                  type="button"
                  role="checkbox"
                  aria-checked={selectedNow}
                  tabIndex={index === firstIdx ? 0 : -1}
                  onKeyDown={(e) => onItemKeyDown(e, index, option.equipment)}
                  onClick={() => toggle(option.equipment)}
                  className={[
                    'w-full p-4 rounded-xl border-2 transition-all duration-200 text-center bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selectedNow
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="text-3xl mb-2">
                    <span role="img" aria-label={option.emojiLabel}>
                      {option.emoji}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">{option.title}</h3>
                  <p className="text-sm text-neutral-600">{option.description}</p>

                  {selectedNow && (
                    <div className="mt-2 inline-flex items-center justify-center w-5 h-5 bg-primary-600 rounded-full">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick help when nothing selected */}
        {selected.length === 0 && (
          <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            Not sure where to start?{' '}
            <button
              type="button"
              className="font-medium text-primary-700 hover:text-primary-800 underline underline-offset-2"
              onClick={() => toggle('bodyweight' as Equipment)}
            >
              Choose Bodyweight Only
            </button>
            — you can always add gear later.
          </div>
        )}

        {/* Selection summary */}
        {selected.length > 0 && (
          <div className="mb-6 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2">
            <p className="text-sm text-primary-700">
              <strong>Selected equipment:</strong> {selected.length} item{selected.length !== 1 ? 's' : ''} selected
            </p>
            <div className="mt-2 flex flex-wrap gap-2" aria-live="polite">
              {equipmentOptions
                .filter((o) => selected.includes(o.equipment))
                .map((o) => (
                  <span
                    key={o.equipment}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700"
                  >
                    {o.title}
                    <button
                      type="button"
                      aria-label={`Remove ${o.title}`}
                      onClick={() => toggle(o.equipment)}
                      className="ml-1 rounded-full p-0.5 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    >
                      <XIcon className="h-3.5 w-3.5 text-neutral-500" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              {selected.length > 1 && (
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
          {/* Equipment is optional: allow continuing even if empty */}
          <Button onClick={onNext} size="lg" className="px-8">
            Continue
          </Button>
        </div>
      </div>
    );
  },
);