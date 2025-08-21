import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  FireIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import type { WorkoutSession } from '../../types';

interface ProgressMetricsProps {
  workouts: WorkoutSession[];
}

export const ProgressMetrics: React.FC<ProgressMetricsProps> = ({ workouts }) => {
  const completedWorkouts = workouts.filter(w => w.status === 'completed');
  
  // Calculate metrics
  const calculateMetrics = () => {
    if (completedWorkouts.length === 0) {
      return {
        averageDuration: 0,
        totalWorkouts: 0,
        longestStreak: 0,
        currentStreak: 0,
        weeklyAverage: 0,
        improvementTrend: 0
      };
    }

    // Average duration
    const totalMinutes = completedWorkouts.reduce((acc, workout) => {
      if (workout.endTime) {
        return acc + (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0);
    const averageDuration = Math.round(totalMinutes / completedWorkouts.length);

    // Calculate streaks
    const sortedWorkouts = [...completedWorkouts].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 1;
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const prevDate = new Date(sortedWorkouts[i - 1].startTime);
      const currDate = new Date(sortedWorkouts[i].startTime);
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 2) { // Allow 1 day gap
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak (from today backwards)
    const today = new Date();
    const recentWorkouts = sortedWorkouts.reverse();
    currentStreak = 0;
    
    for (const workout of recentWorkouts) {
      const workoutDate = new Date(workout.startTime);
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) { // Within last week
        currentStreak++;
      } else {
        break;
      }
    }

    // Weekly average (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentWorkouts4Weeks = completedWorkouts.filter(w => 
      new Date(w.startTime) >= fourWeeksAgo
    );
    const weeklyAverage = Math.round(recentWorkouts4Weeks.length / 4 * 10) / 10;

    // Improvement trend (compare last 2 weeks vs previous 2 weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const lastTwoWeeks = completedWorkouts.filter(w => 
      new Date(w.startTime) >= twoWeeksAgo
    ).length;
    
    const previousTwoWeeks = completedWorkouts.filter(w => {
      const date = new Date(w.startTime);
      return date >= fourWeeksAgo && date < twoWeeksAgo;
    }).length;
    
    const improvementTrend = previousTwoWeeks > 0 
      ? Math.round(((lastTwoWeeks - previousTwoWeeks) / previousTwoWeeks) * 100)
      : lastTwoWeeks > 0 ? 100 : 0;

    return {
      averageDuration,
      totalWorkouts: completedWorkouts.length,
      longestStreak,
      currentStreak,
      weeklyAverage,
      improvementTrend
    };
  };

  const metrics = calculateMetrics();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const metricCards = [
    {
      title: 'Avg Duration',
      value: formatDuration(metrics.averageDuration),
      icon: ClockIcon,
      color: 'blue',
      description: 'Per workout'
    },
    {
      title: 'Current Streak',
      value: `${metrics.currentStreak}`,
      icon: FireIcon,
      color: 'orange',
      description: 'This week'
    },
    {
      title: 'Best Streak',
      value: `${metrics.longestStreak}`,
      icon: ArrowTrendingUpIcon,
      color: 'green',
      description: 'All time'
    },
    {
      title: 'Weekly Avg',
      value: `${metrics.weeklyAverage}`,
      icon: CalendarIcon,
      color: 'purple',
      description: 'Last 4 weeks'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress Metrics</h3>
        {metrics.improvementTrend !== 0 && (
          <div className={`flex items-center text-sm px-2 py-1 rounded-full ${
            metrics.improvementTrend > 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <ArrowTrendingUpIcon className={`w-4 h-4 mr-1 ${
              metrics.improvementTrend < 0 ? 'transform rotate-180' : ''
            }`} />
            {Math.abs(metrics.improvementTrend)}%
          </div>
        )}
      </div>

      {metrics.totalWorkouts === 0 ? (
        <div className="text-center py-8">
          <ArrowTrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No data yet</h4>
          <p className="text-gray-600">Complete some workouts to see your progress metrics!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {metricCards.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <metric.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {metric.title}
              </div>
              <div className="text-xs text-gray-500">
                {metric.description}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress Summary */}
      {metrics.totalWorkouts > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              You've completed <span className="font-semibold text-gray-900">{metrics.totalWorkouts}</span> workouts
              {metrics.improvementTrend > 0 && (
                <span className="text-green-600"> and you're improving by {metrics.improvementTrend}%!</span>
              )}
              {metrics.improvementTrend < 0 && (
                <span className="text-orange-600"> - keep pushing to improve!</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
