import React from 'react';
import { motion } from 'framer-motion';
import { 
  ScaleIcon,
  BoltIcon,
  HeartIcon,
  FireIcon,
  SparklesIcon,
  ShieldCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import type { FitnessGoal } from '../../types';

interface OnboardingStep2Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const fitnessGoals = [
  {
    goal: 'lose_weight' as FitnessGoal,
    title: 'Lose Weight',
    description: 'Burn calories and reduce body fat',
    icon: ScaleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    goal: 'build_muscle' as FitnessGoal,
    title: 'Build Muscle',
    description: 'Increase muscle mass and strength',
    icon: BoltIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    goal: 'improve_cardio' as FitnessGoal,
    title: 'Improve Cardio',
    description: 'Enhance cardiovascular endurance',
    icon: HeartIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200'
  },
  {
    goal: 'increase_strength' as FitnessGoal,
    title: 'Increase Strength',
    description: 'Build functional strength and power',
    icon: FireIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    goal: 'improve_flexibility' as FitnessGoal,
    title: 'Improve Flexibility',
    description: 'Enhance mobility and range of motion',
    icon: SparklesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    goal: 'general_fitness' as FitnessGoal,
    title: 'General Fitness',
    description: 'Overall health and wellness',
    icon: ShieldCheckIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    goal: 'sport_specific' as FitnessGoal,
    title: 'Sport Specific',
    description: 'Train for specific sports or activities',
    icon: TrophyIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
];

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({
  data,
  onUpdate,
  onNext,
  onPrev
}) => {
  const handleGoalToggle = (goal: FitnessGoal) => {
    const currentGoals = data.fitnessGoals || [];
    const isSelected = currentGoals.includes(goal);
    
    let updatedGoals;
    if (isSelected) {
      updatedGoals = currentGoals.filter((g: FitnessGoal) => g !== goal);
    } else {
      updatedGoals = [...currentGoals, goal];
    }
    
    onUpdate({ fitnessGoals: updatedGoals });
  };

  const canProceed = data.fitnessGoals && data.fitnessGoals.length > 0;

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What are your fitness goals?
        </h2>
        <p className="text-gray-600">
          Select all that apply - we'll tailor your workouts accordingly
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {fitnessGoals.map((option, index) => {
          const isSelected = data.fitnessGoals?.includes(option.goal);
          
          return (
            <motion.div
              key={option.goal}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => handleGoalToggle(option.goal)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `${option.borderColor} ${option.bgColor} shadow-md`
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? option.bgColor : 'bg-gray-100'
                  }`}>
                    <option.icon className={`w-5 h-5 ${
                      isSelected ? option.color : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

      {data.fitnessGoals && data.fitnessGoals.length > 0 && (
        <div className="mb-6 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>Selected goals:</strong> {data.fitnessGoals.length} goal{data.fitnessGoals.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

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
