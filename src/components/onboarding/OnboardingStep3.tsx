import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import type { Equipment } from '../../types';

interface OnboardingStep3Props {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const equipmentOptions = [
  {
    equipment: 'bodyweight' as Equipment,
    title: 'Bodyweight Only',
    description: 'No equipment needed',
    emoji: '🏃‍♂️'
  },
  {
    equipment: 'dumbbells' as Equipment,
    title: 'Dumbbells',
    description: 'Adjustable or fixed weights',
    emoji: '🏋️‍♀️'
  },
  {
    equipment: 'barbell' as Equipment,
    title: 'Barbell',
    description: 'Olympic or standard barbell',
    emoji: '🏋️‍♂️'
  },
  {
    equipment: 'kettlebells' as Equipment,
    title: 'Kettlebells',
    description: 'Various weights available',
    emoji: '⚖️'
  },
  {
    equipment: 'resistance_bands' as Equipment,
    title: 'Resistance Bands',
    description: 'Loop bands or tube bands',
    emoji: '🎯'
  },
  {
    equipment: 'pull_up_bar' as Equipment,
    title: 'Pull-up Bar',
    description: 'Doorway or wall-mounted',
    emoji: '🚪'
  },
  {
    equipment: 'yoga_mat' as Equipment,
    title: 'Yoga Mat',
    description: 'For floor exercises',
    emoji: '🧘‍♀️'
  },
  {
    equipment: 'cardio_machine' as Equipment,
    title: 'Cardio Machine',
    description: 'Treadmill, bike, elliptical',
    emoji: '🚴‍♀️'
  },
  {
    equipment: 'gym_access' as Equipment,
    title: 'Full Gym Access',
    description: 'Complete gym facility',
    emoji: '🏢'
  }
];

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({
  data,
  onUpdate,
  onNext,
  onPrev
}) => {
  const handleEquipmentToggle = (equipment: Equipment) => {
    const currentEquipment = data.availableEquipment || [];
    const isSelected = currentEquipment.includes(equipment);
    
    let updatedEquipment;
    if (isSelected) {
      updatedEquipment = currentEquipment.filter((e: Equipment) => e !== equipment);
    } else {
      updatedEquipment = [...currentEquipment, equipment];
    }
    
    onUpdate({ availableEquipment: updatedEquipment });
  };

  const canProceed = data.availableEquipment && data.availableEquipment.length > 0;

  return (
    <div className="card">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What equipment do you have access to?
        </h2>
        <p className="text-gray-600">
          Select all equipment you can use for your workouts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {equipmentOptions.map((option, index) => {
          const isSelected = data.availableEquipment?.includes(option.equipment);
          
          return (
            <motion.div
              key={option.equipment}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => handleEquipmentToggle(option.equipment)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {option.description}
                </p>
                {isSelected && (
                  <div className="mt-2">
                    <div className="inline-flex items-center justify-center w-5 h-5 bg-primary-600 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {data.availableEquipment && data.availableEquipment.length > 0 && (
        <div className="mb-6 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>Selected equipment:</strong> {data.availableEquipment.length} item{data.availableEquipment.length !== 1 ? 's' : ''} selected
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
