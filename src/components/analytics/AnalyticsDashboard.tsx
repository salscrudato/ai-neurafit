import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { Card, GradientCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { ProgressChart, WorkoutTypeChart } from './ProgressChart';
import { AnalyticsService, type WorkoutAnalytics, type Achievement } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';

interface AnalyticsDashboardProps {
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeframe = 'month'
}) => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, selectedTimeframe]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [analyticsData, achievementsData] = await Promise.all([
        AnalyticsService.getWorkoutAnalytics(user.id, selectedTimeframe),
        AnalyticsService.getUserAchievements(user.id)
      ]);

      setAnalytics(analyticsData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="text-center py-12">
        <ChartBarIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Data Available</h3>
        <p className="text-neutral-600">Complete some workouts to see your analytics!</p>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-success-600" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-error-600" />;
      default:
        return <MinusIcon className="w-5 h-5 text-neutral-600" />;
    }
  };

  // getTrendColor removed (was unused)

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const nextAchievement = achievements
    .filter(a => !a.unlockedAt)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Your Analytics</h2>
          <p className="text-neutral-600">Track your fitness journey and celebrate your progress</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedTimeframe === period ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTimeframe(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <TrophyIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Workouts</p>
              <p className="text-2xl font-bold text-neutral-900">{analytics.totalWorkouts}</p>
            </div>
          </div>
        </Card>

        <Card hover className="group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <ClockIcon className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Time</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.floor(analytics.totalDuration / 60)}h {analytics.totalDuration % 60}m
              </p>
            </div>
          </div>
        </Card>

        <Card hover className="group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <FireIcon className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Calories Burned</p>
              <p className="text-2xl font-bold text-neutral-900">{analytics.totalCaloriesBurned.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card hover className="group">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <CalendarDaysIcon className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Current Streak</p>
              <p className="text-2xl font-bold text-neutral-900">{analytics.currentStreak} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Trend */}
        <GradientCard className="text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Progress Trend</h3>
            {getTrendIcon(analytics.progressTrend)}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Workout Frequency</span>
              <span className="font-bold">{analytics.workoutFrequency}/week</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Average Duration</span>
              <span className="font-bold">{analytics.averageDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Favorite Type</span>
              <Badge variant="accent" size="sm">
                {analytics.favoriteWorkoutType}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Longest Streak</span>
              <span className="font-bold">{analytics.longestStreak} days</span>
            </div>
          </div>
        </GradientCard>

        {/* Recent Achievements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-neutral-900">Achievements</h3>
            <Badge variant="primary" size="sm">
              {unlockedAchievements.length} unlocked
            </Badge>
          </div>

          <div className="space-y-3">
            {unlockedAchievements.slice(0, 3).map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 bg-success-50 rounded-xl border border-success-200"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-success-900">{achievement.name}</h4>
                  <p className="text-sm text-success-700">{achievement.description}</p>
                </div>
              </motion.div>
            ))}

            {nextAchievement && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-2xl opacity-50">{nextAchievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">{nextAchievement.name}</h4>
                    <p className="text-sm text-neutral-600">{nextAchievement.description}</p>
                  </div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((nextAchievement.progress || 0) / (nextAchievement.maxProgress || 1)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {nextAchievement.progress} / {nextAchievement.maxProgress}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProgressChart
          data={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? analytics.weeklyProgress : analytics.monthlyProgress}
          type="area"
          metric="workouts"
          title={`${selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'Weekly' : 'Monthly'} Workout Count`}
          timeframe={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'weekly' : 'monthly'}
        />

        <ProgressChart
          data={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? analytics.weeklyProgress : analytics.monthlyProgress}
          type="line"
          metric="duration"
          title={`${selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'Weekly' : 'Monthly'} Duration`}
          timeframe={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'weekly' : 'monthly'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProgressChart
          data={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? analytics.weeklyProgress : analytics.monthlyProgress}
          type="bar"
          metric="calories"
          title={`${selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'Weekly' : 'Monthly'} Calories Burned`}
          timeframe={selectedTimeframe === 'week' || selectedTimeframe === 'month' ? 'weekly' : 'monthly'}
        />

        {/* Workout Type Distribution - placeholder data for now */}
        <WorkoutTypeChart
          data={[
            { type: 'Strength Training', count: Math.floor(analytics.totalWorkouts * 0.4), percentage: 40 },
            { type: 'Cardio', count: Math.floor(analytics.totalWorkouts * 0.3), percentage: 30 },
            { type: 'HIIT', count: Math.floor(analytics.totalWorkouts * 0.2), percentage: 20 },
            { type: 'Yoga', count: Math.floor(analytics.totalWorkouts * 0.1), percentage: 10 },
          ]}
        />
      </div>
    </div>
  );
};
