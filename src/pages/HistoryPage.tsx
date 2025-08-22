import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
// Simplified history page without complex analytics
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { WorkoutService } from '../services/workoutService';
import type { WorkoutSession } from '../types';

type FilterType = 'all' | 'completed' | 'this_week' | 'this_month';

export const HistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { workoutHistory, setWorkoutHistory } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const loadWorkoutHistory = async () => {
      if (!user) return;

      try {
        const history = await WorkoutService.getWorkoutHistory(user.id, 50);
        setWorkoutHistory(history);
      } catch (error) {
        console.error('Error loading workout history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutHistory();
  }, [user, setWorkoutHistory]);

  useEffect(() => {
    let filtered = workoutHistory;

    switch (filter) {
      case 'completed':
        filtered = workoutHistory.filter(w => w.status === 'completed');
        break;
      case 'this_week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = workoutHistory.filter(w => w.startTime > weekAgo);
        break;
      case 'this_month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = workoutHistory.filter(w => w.startTime > monthAgo);
        break;
      default:
        filtered = workoutHistory;
    }

    setFilteredWorkouts(filtered);
  }, [workoutHistory, filter]);

  const stats = {
    totalWorkouts: workoutHistory.filter(w => w.status === 'completed').length,
    totalTime: Math.round(workoutHistory.reduce((acc, w) => {
      if (w.endTime && w.startTime && w.status === 'completed') {
        return acc + (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0)),
    averageRating: workoutHistory.filter(w => w.rating).length > 0
      ? workoutHistory.reduce((acc, w) => acc + (w.rating || 0), 0) / workoutHistory.filter(w => w.rating).length
      : 0,
    thisWeekWorkouts: workoutHistory.filter(w => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return w.startTime > weekAgo && w.status === 'completed';
    }).length
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
        <p className="text-gray-600 mt-2">Track your progress and achievements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrophyIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalTime)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <StarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">
                  {stats.averageRating.toFixed(1)}
                </p>
                <StarIconSolid className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <FireIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekWorkouts}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Simplified analytics - removed complex charts for cleaner architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Insights</h3>
          <p className="text-gray-600">
            Detailed analytics and charts will be available in a future update.
            For now, you can view your basic workout statistics above and browse your workout history below.
          </p>
        </motion.div>
      </div>

      {/* Workout History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Workouts</option>
              <option value="completed">Completed Only</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <FunnelIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Simple workout list */}
        <div className="space-y-4">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No workouts found for the selected period.</p>
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {workout.workoutPlan?.name || 'Workout'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workout.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {workout.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {workout.startTime.toLocaleDateString()} at {workout.startTime.toLocaleTimeString()}
                </p>
                {workout.endTime && (
                  <p className="text-sm text-gray-600">
                    Duration: {formatTime(Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60)))}
                  </p>
                )}
                {workout.rating && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600 mr-2">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= workout.rating! ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
