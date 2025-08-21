import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface OnboardingStep4Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const daysPerWeekOptions = [
  { value: 2, label: '2 days', description: 'Light commitment' },
  { value: 3, label: '3 days', description: 'Balanced approach' },
  { value: 4, label: '4 days', description: 'Regular routine' },
  { value: 5, label: '5 days', description: 'Dedicated training' },
  { value: 6, label: '6 days', description: 'Intensive program' },
  { value: 7, label: '7 days', description: 'Daily activity' }
];

const minutesPerSessionOptions = [
  { value: 15, label: '15 min', description: 'Quick sessions' },
  { value: 30, label: '30 min', description: 'Standard length' },
  { value: 45, label: '45 min', description: 'Extended workout' },
  { value: 60, label: '60 min', description: 'Full hour' },
  { value: 90, label: '90 min', description: 'Long sessions' }
];

const preferredTimesOptions = [
  { value: 'early_morning', label: 'Early Morning', description: '5:00 - 8:00 AM' },
  { value: 'morning', label: 'Morning', description: '8:00 - 11:00 AM' },
  { value: 'midday', label: 'Midday', description: '11:00 AM - 2:00 PM' },
  { value: 'afternoon', label: 'Afternoon', description: '2:00 - 5:00 PM' },
  { value: 'evening', label: 'Evening', description: '5:00 - 8:00 PM' },
  { value: 'night', label: 'Night', description: '8:00 - 11:00 PM' }
];

export const OnboardingStep4: React.FC<OnboardingStep4Props> = ({
  data,
  onUpdate,
  onNext,
  onPrev
}) => {
  const handleDaysPerWeekChange = (days: number) => {
    onUpdate({
      timeCommitment: {
        ...data.timeCommitment,
        daysPerWeek: days
      }
    });
  };

  const handleMinutesPerSessionChange = (minutes: number) => {
    onUpdate({
      timeCommitment: {
        ...data.timeCommitment,
        minutesPerSession: minutes
      }
    });
  };

  const handlePreferredTimeToggle = (time: string) => {
    const currentTimes = data.timeCommitment?.preferredTimes || [];
    const isSelected = currentTimes.includes(time);
    
    let updatedTimes;
    if (isSelected) {
      updatedTimes = currentTimes.filter((t: string) => t !== time);
    } else {
      updatedTimes = [...currentTimes, time];
    }
    
    onUpdate({
      timeCommitment: {
        ...data.timeCommitment,
        preferredTimes: updatedTimes
      }
    });
  };

  const canProceed = data.timeCommitment?.daysPerWeek && 
                    data.timeCommitment?.minutesPerSession &&
                    data.timeCommitment?.preferredTimes?.length > 0;

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How much time can you commit?
        </h2>
        <p className="text-gray-600">
          Help us create a realistic schedule that fits your lifestyle
        </p>
      </div>

      <div className="space-y-8 mb-8">
        {/* Days per week */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How many days per week?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {daysPerWeekOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleDaysPerWeekChange(option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  data.timeCommitment?.daysPerWeek === option.value
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Minutes per session */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How long per session?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {minutesPerSessionOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleMinutesPerSessionChange(option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  data.timeCommitment?.minutesPerSession === option.value
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preferred times */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            When do you prefer to work out?
          </h3>
          <p className="text-sm text-gray-600 mb-4">Select all that work for you</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {preferredTimesOptions.map((option, index) => {
              const isSelected = data.timeCommitment?.preferredTimes?.includes(option.value);
              
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handlePreferredTimeToggle(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {option.description}
                  </div>
                  {isSelected && (
                    <div className="mt-2">
                      <div className="inline-flex items-center justify-center w-5 h-5 bg-primary-600 rounded-full">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          size="lg"
          className="px-8"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
