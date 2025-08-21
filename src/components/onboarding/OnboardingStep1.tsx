import React from 'react';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  TrophyIcon, 
  FireIcon 
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import type { FitnessLevel } from '../../types';

interface OnboardingStep1Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const fitnessLevels = [
  {
    level: 'beginner' as FitnessLevel,
    title: 'Beginner',
    description: 'New to fitness or getting back into it',
    icon: AcademicCapIcon,
    details: [
      'Little to no exercise experience',
      'Looking to build healthy habits',
      'Want to start slow and steady'
    ]
  },
  {
    level: 'intermediate' as FitnessLevel,
    title: 'Intermediate',
    description: 'Regular exercise routine for 6+ months',
    icon: TrophyIcon,
    details: [
      'Exercise 2-4 times per week',
      'Comfortable with basic movements',
      'Ready for more challenging workouts'
    ]
  },
  {
    level: 'advanced' as FitnessLevel,
    title: 'Advanced',
    description: 'Experienced athlete or fitness enthusiast',
    icon: FireIcon,
    details: [
      'Exercise 5+ times per week',
      'Strong foundation in fitness',
      'Looking for intense, varied workouts'
    ]
  }
];

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  data,
  onUpdate,
  onNext
}) => {
  const handleLevelSelect = (level: FitnessLevel) => {
    onUpdate({ fitnessLevel: level });
  };

  const canProceed = data.fitnessLevel !== null;

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's your fitness level?
        </h2>
        <p className="text-gray-600">
          This helps us create workouts that are perfect for you
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {fitnessLevels.map((option, index) => (
          <motion.div
            key={option.level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <button
              onClick={() => handleLevelSelect(option.level)}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                data.fitnessLevel === option.level
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  data.fitnessLevel === option.level
                    ? 'bg-primary-100'
                    : 'bg-gray-100'
                }`}>
                  <option.icon className={`w-6 h-6 ${
                    data.fitnessLevel === option.level
                      ? 'text-primary-600'
                      : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {option.description}
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {option.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                {data.fitnessLevel === option.level && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
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
