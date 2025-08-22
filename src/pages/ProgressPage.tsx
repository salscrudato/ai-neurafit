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
  ScaleIcon,
  CameraIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Card, GradientCard, StatsCard } from '../components/ui/Card';
import { Badge, StreakBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CircularProgress, Progress } from '../components/ui/Progress';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressChart } from '../components/analytics/ProgressChart';
import { ProgressMetrics } from '../components/analytics/ProgressMetrics';
import { AchievementsShowcase } from '../components/analytics/AchievementsShowcase';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { AnalyticsService } from '../services/analyticsService';
import type { WorkoutSession, ProgressMetrics as ProgressMetricsType } from '../types';

interface ProgressStats {
  totalWorkouts: number;
  totalDuration: number;
  averageDuration: number;
  currentStreak: number;
  longestStreak: number;
  totalCalories: number;
  weeklyGoalProgress: number;
  monthlyGoalProgress: number;
}

export const ProgressPage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { workoutHistory, loading: workoutLoading } = useWorkoutStore();
  
  const [loading, setLoading] = useState(true);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetricsType[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showBodyMetrics, setShowBodyMetrics] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user, workoutHistory]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Calculate progress stats from workout history
      const completedWorkouts = workoutHistory.filter(w => w.status === 'completed');
      
      const totalDuration = completedWorkouts.reduce((acc, workout) => {
        if (workout.endTime) {
          return acc + (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
        }
        return acc;
      }, 0);

      const totalCalories = completedWorkouts.reduce((acc, workout) => {
        return acc + (workout.workoutPlan?.calorieEstimate || 0);
      }, 0);

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(completedWorkouts);
      
      // Calculate weekly/monthly progress
      const weeklyGoal = profile?.timeCommitment?.daysPerWeek || 3;
      const thisWeekWorkouts = getThisWeekWorkouts(completedWorkouts);
      const thisMonthWorkouts = getThisMonthWorkouts(completedWorkouts);
      
      setProgressStats({
        totalWorkouts: completedWorkouts.length,
        totalDuration: Math.round(totalDuration),
        averageDuration: completedWorkouts.length > 0 ? Math.round(totalDuration / completedWorkouts.length) : 0,
        currentStreak,
        longestStreak,
        totalCalories,
        weeklyGoalProgress: (thisWeekWorkouts / weeklyGoal) * 100,
        monthlyGoalProgress: (thisMonthWorkouts / (weeklyGoal * 4)) * 100,
      });

      // Load body metrics if available
      if (user) {
        const metrics = await AnalyticsService.getProgressMetrics(user.uid);
        setProgressMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (workouts: WorkoutSession[]) => {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const sortedWorkouts = workouts
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate current streak
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].startTime);
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        currentStreak++;
      } else if (daysDiff === i + 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedWorkouts.length; i++) {
      tempStreak++;
      
      if (i === sortedWorkouts.length - 1 || 
          Math.floor((new Date(sortedWorkouts[i].startTime).getTime() - 
                     new Date(sortedWorkouts[i + 1].startTime).getTime()) / (1000 * 60 * 60 * 24)) > 2) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    return { currentStreak, longestStreak };
  };

  const getThisWeekWorkouts = (workouts: WorkoutSession[]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return workouts.filter(workout => 
      new Date(workout.startTime) >= startOfWeek
    ).length;
  };

  const getThisMonthWorkouts = (workouts: WorkoutSession[]) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return workouts.filter(workout => 
      new Date(workout.startTime) >= startOfMonth
    ).length;
  };

  const generateChartData = () => {
    const completedWorkouts = workoutHistory.filter(w => w.status === 'completed');
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthWorkouts = completedWorkouts.filter(workout => {
        const workoutDate = new Date(workout.startTime);
        return workoutDate.getMonth() === date.getMonth() && 
               workoutDate.getFullYear() === date.getFullYear();
      });

      const duration = monthWorkouts.reduce((acc, workout) => {
        if (workout.endTime) {
          return acc + (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
        }
        return acc;
      }, 0);

      const calories = monthWorkouts.reduce((acc, workout) => {
        return acc + (workout.workoutPlan?.calorieEstimate || 0);
      }, 0);

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        workouts: monthWorkouts.length,
        duration: Math.round(duration),
        calories: Math.round(calories)
      });
    }

    return data;
  };

  if (loading || workoutLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const chartData = generateChartData();

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Your Progress Journey
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Track your fitness achievements, monitor your growth, and celebrate every milestone
        </p>
      </motion.div>

      {/* Quick Stats Overview */}
      {progressStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Total Workouts"
            value={progressStats.totalWorkouts.toString()}
            icon={<TrophyIcon />}
            trend={progressStats.totalWorkouts > 0 ? 'up' : 'neutral'}
            color="primary"
          />
          
          <StatsCard
            title="Active Time"
            value={`${Math.floor(progressStats.totalDuration / 60)}h ${progressStats.totalDuration % 60}m`}
            icon={<ClockIcon />}
            trend={progressStats.totalDuration > 0 ? 'up' : 'neutral'}
            color="accent"
          />
          
          <StatsCard
            title="Current Streak"
            value={`${progressStats.currentStreak} days`}
            icon={<FireIcon />}
            trend={progressStats.currentStreak > 0 ? 'up' : 'neutral'}
            color="warning"
          />
          
          <StatsCard
            title="Calories Burned"
            value={progressStats.totalCalories.toLocaleString()}
            icon={<ChartBarIcon />}
            trend={progressStats.totalCalories > 0 ? 'up' : 'neutral'}
            color="success"
          />
        </motion.div>
      )}

      {/* Weekly & Monthly Goals */}
      {progressStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <GradientCard className="text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Weekly Goal</h3>
                <p className="text-white/80">Stay consistent with your routine</p>
              </div>
              <CalendarDaysIcon className="w-8 h-8 text-white/80" />
            </div>
            
            <div className="flex items-center justify-center">
              <CircularProgress
                value={Math.min(progressStats.weeklyGoalProgress, 100)}
                size={120}
                variant="gradient"
                showValue
                animate
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-white/90">
                {Math.round(progressStats.weeklyGoalProgress)}% complete
              </p>
            </div>
          </GradientCard>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Monthly Progress</h3>
                <p className="text-neutral-600">Building lasting habits</p>
              </div>
              <ArrowTrendingUpIcon className="w-8 h-8 text-success-500" />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-neutral-600 mb-2">
                  <span>Workout Goal</span>
                  <span>{Math.round(progressStats.monthlyGoalProgress)}%</span>
                </div>
                <Progress
                  value={Math.min(progressStats.monthlyGoalProgress, 100)}
                  variant="success"
                  size="lg"
                  animate
                />
              </div>
              
              {progressStats.longestStreak > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <span className="text-sm text-neutral-600">Best Streak</span>
                  <StreakBadge days={progressStats.longestStreak} />
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Progress Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-neutral-900">Workout Trends</h3>
            <div className="flex space-x-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <ProgressChart
            data={chartData}
            type="area"
            metric="workouts"
            title="Workouts Over Time"
            timeframe="monthly"
          />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-neutral-900">Duration & Calories</h3>
            <ChartBarIcon className="w-6 h-6 text-primary-500" />
          </div>

          <ProgressChart
            data={chartData}
            type="bar"
            metric="calories"
            title="Calories Burned"
            timeframe="monthly"
          />
        </Card>
      </motion.div>

      {/* Detailed Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ProgressMetrics workouts={workoutHistory} />
      </motion.div>

      {/* Body Metrics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Body Metrics</h3>
              <p className="text-neutral-600">Track your physical progress over time</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                icon={<CameraIcon />}
                onClick={() => {/* TODO: Implement photo upload */}}
              >
                Add Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<PlusIcon />}
                onClick={() => setShowBodyMetrics(true)}
              >
                Log Metrics
              </Button>
              {progressMetrics.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<EyeIcon />}
                  onClick={() => setShowBodyMetrics(!showBodyMetrics)}
                >
                  {showBodyMetrics ? 'Hide' : 'View'} History
                </Button>
              )}
            </div>
          </div>

          {progressMetrics.length === 0 ? (
            <div className="text-center py-12">
              <ScaleIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-neutral-900 mb-2">No body metrics yet</h4>
              <p className="text-neutral-600 mb-6">
                Start tracking your weight, measurements, and progress photos to see your transformation
              </p>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setShowBodyMetrics(true)}
              >
                Add First Measurement
              </Button>
            </div>
          ) : showBodyMetrics ? (
            <div className="space-y-6">
              {/* Weight Chart */}
              <div>
                <h4 className="text-lg font-medium text-neutral-900 mb-4">Weight Progress</h4>
                <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
                  <p className="text-neutral-500">Weight chart will be displayed here</p>
                </div>
              </div>

              {/* Measurements Grid */}
              <div>
                <h4 className="text-lg font-medium text-neutral-900 mb-4">Latest Measurements</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {progressMetrics[0]?.measurements && Object.entries(progressMetrics[0].measurements).map(([key, value]) => (
                    <div key={key} className="bg-neutral-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-neutral-600 capitalize">{key}</p>
                      <p className="text-2xl font-bold text-neutral-900">{value}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ScaleIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="font-medium text-neutral-900">Weight Tracking</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  {progressMetrics.length > 0 ? `${progressMetrics.length} entries` : 'No entries yet'}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PencilIcon className="w-8 h-8 text-accent-600" />
                </div>
                <h4 className="font-medium text-neutral-900">Measurements</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Track body measurements
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CameraIcon className="w-8 h-8 text-secondary-600" />
                </div>
                <h4 className="font-medium text-neutral-900">Progress Photos</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Visual progress tracking
                </p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Achievements</h3>
              <p className="text-neutral-600">Celebrate your fitness milestones</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<TrophyIcon />}
              onClick={() => setShowAchievements(!showAchievements)}
            >
              {showAchievements ? 'Hide' : 'View All'}
            </Button>
          </div>

          {showAchievements ? (
            <AchievementsShowcase />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quick achievement preview */}
              <div className="bg-gradient-primary rounded-lg p-4 text-white text-center">
                <TrophyIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-semibold">First Workout</h4>
                <p className="text-sm text-white/80">Completed your first session</p>
              </div>

              <div className="bg-gradient-accent rounded-lg p-4 text-white text-center">
                <FireIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-semibold">Week Warrior</h4>
                <p className="text-sm text-white/80">7-day workout streak</p>
              </div>

              <div className="bg-gradient-secondary rounded-lg p-4 text-white text-center">
                <ClockIcon className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-semibold">Time Master</h4>
                <p className="text-sm text-white/80">10 hours of training</p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
