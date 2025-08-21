import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  ClockIcon, 
  FireIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../ui/Button';
import type { WorkoutSession } from '../../types';

interface WorkoutCompleteProps {
  session: WorkoutSession;
  onRating: (rating: number, feedback?: string) => void;
  onFinish: () => void;
}

export const WorkoutComplete: React.FC<WorkoutCompleteProps> = ({
  session,
  onRating,
  onFinish
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const workoutDuration = session.endTime && session.startTime 
    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
    : 0;

  const completedExercises = session.completedExercises.filter(ex => !ex.skipped).length;
  const totalExercises = session.workoutPlan.exercises.length;
  const completionRate = Math.round((completedExercises / totalExercises) * 100);

  const handleRatingSubmit = () => {
    if (rating > 0) {
      onRating(rating, feedback.trim() || undefined);
      setHasRated(true);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full mx-4"
      >
        <div className="card text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <TrophyIcon className="w-12 h-12 text-green-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Workout Complete! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            Great job completing "{session.workoutPlan.name}"
          </motion.p>

          {/* Workout Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-6 mb-8"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatTime(workoutDuration)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completedExercises}/{totalExercises}</div>
              <div className="text-sm text-gray-600">Exercises</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FireIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </motion.div>

          {/* Completion Rate Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-green-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.7, duration: 1 }}
              />
            </div>
          </motion.div>

          {/* Rating Section */}
          {!hasRated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How was your workout?
              </h3>
              
              {/* Star Rating */}
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors duration-200"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Feedback */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any feedback about this workout? (optional)"
                className="input-field resize-none mb-4"
                rows={3}
              />

              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="mb-4"
              >
                Submit Rating
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-green-50 rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-5 h-5 ${
                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-green-700 text-sm">Thanks for your feedback!</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <Button
              onClick={onFinish}
              size="lg"
              className="w-full"
            >
              Back to Dashboard
            </Button>
            
            <div className="text-sm text-gray-500">
              Your workout has been saved to your history
            </div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <p className="text-gray-600 italic">
            "The only bad workout is the one that didn't happen. Great job today!"
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
