import React, { memo, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../ui/Button';

interface OnboardingStep4Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext?: () => void;
  onComplete?: () => Promise<void> | void;
  onPrev: () => void;
  submitting?: boolean;
}

const daysPerWeekOptions = [
  { value: 2, label: '2 days', description: 'Light commitment' },
  { value: 3, label: '3 days', description: 'Balanced approach' },
  { value: 4, label: '4 days', description: 'Regular routine' },
  { value: 5, label: '5 days', description: 'Dedicated training' },
  { value: 6, label: '6 days', description: 'Intensive program' },
  { value: 7, label: '7 days', description: 'Daily activity' },
];

const minutesPerSessionOptions = [
  { value: 15, label: '15 min', description: 'Quick sessions' },
  { value: 30, label: '30 min', description: 'Standard length' },
  { value: 45, label: '45 min', description: 'Extended workout' },
  { value: 60, label: '60 min', description: 'Full hour' },
  { value: 90, label: '90 min', description: 'Long sessions' },
];

const preferredTimesOptions = [
  { value: 'early_morning', label: 'Early Morning', description: '5:00 – 8:00 AM' },
  { value: 'morning',       label: 'Morning',       description: '8:00 – 11:00 AM' },
  { value: 'midday',        label: 'Midday',        description: '11:00 AM – 2:00 PM' },
  { value: 'afternoon',     label: 'Afternoon',     description: '2:00 – 5:00 PM' },
  { value: 'evening',       label: 'Evening',       description: '5:00 – 8:00 PM' },
  { value: 'night',         label: 'Night',         description: '8:00 – 11:00 PM' },
];

export const OnboardingStep4: React.FC<OnboardingStep4Props> = memo(
  ({ data, onUpdate, onNext, onComplete, onPrev, submitting = false }) => {
    const reduceMotion = useReducedMotion();
    const [loading, setLoading] = useState(false);

    const groupIdDays = useId();
    const groupIdMinutes = useId();
    const groupIdTimes = useId();
    const descDays = `${groupIdDays}-desc`;
    const descMinutes = `${groupIdMinutes}-desc`;
    const descTimes = `${groupIdTimes}-desc`;

    const daysSelected = data?.timeCommitment?.daysPerWeek ?? 0;
    const minutesSelected = data?.timeCommitment?.minutesPerSession ?? 0;
    const timesSelected: string[] = Array.isArray(data?.timeCommitment?.preferredTimes)
      ? data.timeCommitment.preferredTimes
      : [];



    // Refs for roving focus
    const daysRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const minutesRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const timesRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const firstDaysIndex = Math.max(
      0,
      daysPerWeekOptions.findIndex((o) => o.value === daysSelected)
    );
    const firstMinutesIndex = Math.max(
      0,
      minutesPerSessionOptions.findIndex((o) => o.value === minutesSelected)
    );
    const firstTimesIndex = Math.max(
      0,
      preferredTimesOptions.findIndex((o) => timesSelected.includes(o.value))
    );

    /* ------------------------------ Updaters ------------------------------ */
    const updateTimeCommitment = (patch: Partial<typeof data.timeCommitment>) => {
      onUpdate({
        timeCommitment: {
          ...data.timeCommitment,
          ...patch,
        },
      });
    };

    const handleDaysPerWeekChange = (days: number) => {
      updateTimeCommitment({ daysPerWeek: days });
    };

    const handleMinutesPerSessionChange = (minutes: number) => {
      updateTimeCommitment({ minutesPerSession: minutes });
    };

    const handlePreferredTimeToggle = (time: string) => {
      const currentTimes = timesSelected;
      const next = currentTimes.includes(time)
        ? currentTimes.filter((t) => t !== time)
        : [...currentTimes, time];
      updateTimeCommitment({ preferredTimes: next });
    };



    /* ------------------------------ Keyboard ------------------------------ */
    const moveFocus = (refs: React.MutableRefObject<Array<HTMLButtonElement | null>>, nextIndex: number) => {
      const list = refs.current;
      const len = list.length;
      if (!len) return;
      const idx = (nextIndex + len) % len;
      list[idx]?.focus();
    };

    const onRadioKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      refs: React.MutableRefObject<Array<HTMLButtonElement | null>>,
      currentIndex: number,
      onActivate: () => void
    ) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(refs, currentIndex + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(refs, currentIndex - 1);
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

    const onCheckboxKeyDown = (
      e: React.KeyboardEvent<HTMLButtonElement>,
      refs: React.MutableRefObject<Array<HTMLButtonElement | null>>,
      currentIndex: number,
      onToggle: () => void
    ) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(refs, currentIndex + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(refs, currentIndex - 1);
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
          onToggle();
          break;
        default:
          break;
      }
    };

    /* ------------------------------- Proceed ------------------------------ */
    const canProceed =
      !!daysSelected &&
      !!minutesSelected &&
      Array.isArray(timesSelected) &&
      timesSelected.length > 0;

    const handleComplete = async () => {
      if (onComplete) {
        setLoading(true);
        try {
          await onComplete();
        } finally {
          setLoading(false);
        }
      }
    };

    const handleNext = () => {
      if (onNext) {
        onNext();
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
            How much time can you commit?
          </h2>
          <p className="text-neutral-600">
            Help us create a realistic schedule that fits your lifestyle.
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {/* Days per week — Radiogroup */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">How many days per week?</h3>
            <p id={descDays} className="sr-only">Select one option for training days per week</p>
            <div
              role="radiogroup"
              aria-labelledby={`${groupIdDays}-label`}
              aria-describedby={descDays}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <span id={`${groupIdDays}-label`} className="sr-only">Days per week</span>
              {daysPerWeekOptions.map((option, index) => {
                const selected = daysSelected === option.value;
                return (
                  <motion.button
                    key={option.value}
                    ref={(el) => { daysRefs.current[index] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={index === (firstDaysIndex >= 0 ? firstDaysIndex : 0) ? 0 : -1}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    onKeyDown={(e) =>
                      onRadioKeyDown(e, daysRefs, index, () => handleDaysPerWeekChange(option.value))
                    }
                    onClick={() => handleDaysPerWeekChange(option.value)}
                    className={[
                      'p-4 rounded-lg border-2 transition-all duration-200 text-center bg-white',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                      selected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                    ].join(' ')}
                  >
                    <div className="text-xl font-bold text-neutral-900 mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-neutral-600">{option.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Minutes per session — Radiogroup */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">How long per session?</h3>
            <p id={descMinutes} className="sr-only">Select one option for minutes per session</p>
            <div
              role="radiogroup"
              aria-labelledby={`${groupIdMinutes}-label`}
              aria-describedby={descMinutes}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              <span id={`${groupIdMinutes}-label`} className="sr-only">Minutes per session</span>
              {minutesPerSessionOptions.map((option, index) => {
                const selected = minutesSelected === option.value;
                return (
                  <motion.button
                    key={option.value}
                    ref={(el) => { minutesRefs.current[index] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={index === (firstMinutesIndex >= 0 ? firstMinutesIndex : 0) ? 0 : -1}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    onKeyDown={(e) =>
                      onRadioKeyDown(e, minutesRefs, index, () =>
                        handleMinutesPerSessionChange(option.value)
                      )
                    }
                    onClick={() => handleMinutesPerSessionChange(option.value)}
                    className={[
                      'p-4 rounded-lg border-2 transition-all duration-200 text-center bg-white',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                      selected
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
                    ].join(' ')}
                  >
                    <div className="text-xl font-bold text-neutral-900 mb-1">
                      {option.label}
                    </div>
                    <div className="text-sm text-neutral-600">{option.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Preferred times — Checkbox group */}
          <section>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">When do you prefer to work out?</h3>
            <p className="text-sm text-neutral-600 mb-4">Select all that work for you</p>
            <p id={descTimes} className="sr-only">Select one or more preferred time windows</p>

            <div
              role="group"
              aria-labelledby={`${groupIdTimes}-label`}
              aria-describedby={descTimes}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              <span id={`${groupIdTimes}-label`} className="sr-only">Preferred times</span>
              {preferredTimesOptions.map((option, index) => {
                const selected = timesSelected.includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    ref={(el) => { timesRefs.current[index] = el; }}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    tabIndex={index === (firstTimesIndex >= 0 ? firstTimesIndex : 0) ? 0 : -1}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    onKeyDown={(e) => onCheckboxKeyDown(e, timesRefs, index, () => handlePreferredTimeToggle(option.value))}
                    onClick={() => handlePreferredTimeToggle(option.value)}
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
                    {selected && (
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
                  </motion.button>
                );
              })}
            </div>


          </section>
        </div>



        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrev} size="lg" className="px-8">
            Back
          </Button>
          <Button
            onClick={onComplete ? handleComplete : handleNext}
            disabled={!canProceed || loading || submitting}
            loading={loading || submitting}
            size="lg"
            className="px-8"
          >
            {onComplete ? 'Complete Setup' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }
);