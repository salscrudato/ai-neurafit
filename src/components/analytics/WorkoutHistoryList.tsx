import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClockIcon, 
  FireIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { WorkoutSession } from '../../types';

interface WorkoutHistoryListProps {
  workouts: WorkoutSession[];
}

export const WorkoutHistoryList: React.FC<WorkoutHistoryListProps> = ({ workouts }) => {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return 'In progress';
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    return `${duration} min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'cancelled':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No workouts found</h4>
        <p className="text-gray-600">Try adjusting your filter or start a new workout!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout, index) => {
        const StatusIcon = getStatusIcon(workout.status);
        const isExpanded = expandedWorkout === workout.id;
        const completedExercises = workout.completedExercises?.filter(ex => !ex.skipped).length || 0;
        const totalExercises = workout.workoutPlan?.exercises.length || 0;
        
        return (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(workout.status)}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {workout.workoutPlan?.name || 'Workout'}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{formatDate(workout.startTime)}</span>
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {formatDuration(workout.startTime, workout.endTime)}
                      </span>
                      <span className="flex items-center">
                        <FireIcon className="w-4 h-4 mr-1" />
                        {workout.workoutPlan?.difficulty || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Rating */}
                  {workout.rating && (
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className={`w-4 h-4 ${
                            i < workout.rating! ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Progress */}
                  {workout.status === 'completed' && (
                    <div className="text-sm text-gray-600">
                      {completedExercises}/{totalExercises} exercises
                    </div>
                  )}

                  {/* Expand/Collapse */}
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 bg-gray-50"
                >
                  <div className="p-4 space-y-4">
                    {/* Workout Description */}
                    {workout.workoutPlan?.description && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                        <p className="text-gray-600 text-sm">{workout.workoutPlan.description}</p>
                      </div>
                    )}

                    {/* Exercise Progress */}
                    {workout.completedExercises && workout.completedExercises.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Exercise Progress</h5>
                        <div className="space-y-2">
                          {workout.workoutPlan?.exercises.map((exercise, idx) => {
                            const completed = workout.completedExercises?.find(
                              ce => ce.exerciseId === exercise.exercise.id
                            );
                            
                            return (
                              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                                <span className="text-sm text-gray-700">
                                  {exercise.exercise.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {completed ? (
                                    <>
                                      {completed.skipped ? (
                                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                          Skipped
                                        </span>
                                      ) : (
                                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                          {completed.sets.length} sets
                                        </span>
                                      )}
                                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                    </>
                                  ) : (
                                    <XCircleIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {workout.feedback && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                        <p className="text-gray-600 text-sm italic">"{workout.feedback}"</p>
                      </div>
                    )}

                    {/* Workout Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatDuration(workout.startTime, workout.endTime)}
                        </div>
                        <div className="text-xs text-gray-600">Duration</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {completedExercises}/{totalExercises}
                        </div>
                        <div className="text-xs text-gray-600">Exercises</div>
                      </div>
                      
                      {workout.rating && (
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {workout.rating}/5
                          </div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                      )}
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 capitalize">
                          {workout.status.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-600">Status</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
