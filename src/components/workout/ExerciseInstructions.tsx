import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { Exercise } from '../../types';

interface ExerciseInstructionsProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseInstructions: React.FC<ExerciseInstructionsProps> = ({
  exercise,
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <InformationCircleIcon className="w-6 h-6 text-primary-600 mr-2" />
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Exercise Instructions
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Exercise Name and Description */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{exercise.name}</h3>
              <p className="text-gray-600">{exercise.description}</p>
            </div>

            {/* Exercise Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Difficulty</h4>
                <p className="text-gray-900 capitalize">{exercise.difficulty}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Equipment</h4>
                <p className="text-gray-900">
                  {exercise.equipment.map(eq => eq.replace('_', ' ')).join(', ')}
                </p>
              </div>
            </div>

            {/* Target Muscles */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Target Muscles</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.targetMuscles.map((muscle, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm capitalize"
                  >
                    {muscle.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">How to Perform</h4>
              <ol className="space-y-3">
                {exercise.instructions.map((instruction, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Tips & Safety</h4>
                <div className="space-y-2">
                  {exercise.tips.map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video/Image placeholder */}
            {(exercise.videoUrl || exercise.imageUrl) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Visual Guide</h4>
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Video/Image would be displayed here</p>
                  {exercise.videoUrl && (
                    <p className="text-sm text-primary-600 mt-2">Video available</p>
                  )}
                  {exercise.imageUrl && (
                    <p className="text-sm text-primary-600 mt-2">Image available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="btn-primary px-6 py-2"
            >
              Got it!
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
