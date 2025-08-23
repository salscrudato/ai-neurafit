import React, { memo, useId, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';
import {
  UserIcon,
  CubeIcon,
  Bars3BottomLeftIcon,
  ScaleIcon,
  LinkIcon,
  Bars3Icon,
  RectangleGroupIcon,
  BoltIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
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
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const equipmentOptions: ReadonlyArray<EquipmentOption> = [
  { equipment: 'bodyweight',       title: 'Bodyweight Only',   icon: UserIcon,              color: 'text-blue-600' },
  { equipment: 'dumbbells',        title: 'Dumbbells',         icon: CubeIcon,              color: 'text-purple-600' },
  { equipment: 'barbell',          title: 'Barbell',           icon: Bars3BottomLeftIcon,   color: 'text-orange-600' },
  { equipment: 'kettlebells',      title: 'Kettlebells',       icon: ScaleIcon,             color: 'text-red-600' },
  { equipment: 'resistance_bands', title: 'Resistance Bands',  icon: LinkIcon,              color: 'text-green-600' },
  { equipment: 'pull_up_bar',      title: 'Pull-up Bar',       icon: Bars3Icon,             color: 'text-indigo-600' },
  { equipment: 'yoga_mat',         title: 'Yoga Mat',          icon: RectangleGroupIcon,    color: 'text-pink-600' },
  { equipment: 'cardio_machine',   title: 'Cardio Machine',    icon: BoltIcon,              color: 'text-yellow-600' },
  { equipment: 'gym_access',       title: 'Full Gym Access',   icon: BuildingOffice2Icon,   color: 'text-gray-600' },
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
            What equipment do you have?
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
          className="grid grid-cols-2 gap-4 mb-6"
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
                    'w-full p-6 rounded-xl border-2 transition-all duration-200 text-center',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                    selectedNow
                      ? `border-primary-500 bg-primary-50 shadow-md`
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="mb-3 flex justify-center">
                    <option.icon className={`h-8 w-8 ${selectedNow ? 'text-primary-600' : 'text-neutral-400'} transition-colors duration-200`} />
                  </div>
                  <h3 className={`font-semibold ${selectedNow ? 'text-primary-900' : 'text-neutral-900'} transition-colors duration-200`}>
                    {option.title}
                  </h3>
                </button>
              </motion.div>
            );
          })}
        </div>





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