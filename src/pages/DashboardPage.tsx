import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  PlayIcon,
  ClockIcon,

  PlusIcon,
  FireIcon,
  TrophyIcon,
  BoltIcon,



  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  StartWorkoutButton,

} from '../components/ui/Button';
import {
  Card,
  GradientCard,
  InteractiveCard,
  WorkoutCard,

  AchievementCard,
  StatsCard
} from '../components/ui/Card';
import {
  Badge,
  WorkoutTypeBadge,
  IntensityBadge,
  AchievementBadge,
  StreakBadge
} from '../components/ui/Badge';
import {
  CircularProgress
} from '../components/ui/Progress';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageContainer } from '../components/ui/Container';
import { WorkoutGenerationModal } from '../components/workout/WorkoutGenerationModal';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { UserProfileService } from '../services/userProfileService';

// Helper function to calculate current workout streak
const calculateCurrentStreak = (workouts: any[]) => {
  if (workouts.length === 0) return 0;

  const completedWorkouts = workouts
    .filter(w => w.status === 'completed')
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  if (completedWorkouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completedWorkouts.length; i++) {
    const workoutDate = new Date(completedWorkouts[i].startTime);
    workoutDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
      streak = daysDiff + 1;
    } else {
      break;
    }
  }

  return streak;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, setProfile } = useUserStore();
  const { workoutHistory } = useWorkoutStore();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userProfile = await UserProfileService.getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !profile) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [user, profile, setProfile]);

  const completedWorkouts = workoutHistory.filter(w => w.status === 'completed');
  const totalMinutes = Math.round(workoutHistory.reduce((acc, w) => {
    if (w.endTime && w.startTime) {
      return acc + (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60);
    }
    return acc;
  }, 0));

  const thisWeekWorkouts = workoutHistory.filter(w => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return w.startTime > weekAgo && w.status === 'completed';
  }).length;

  const currentStreak = calculateCurrentStreak(workoutHistory);

  // Enhanced fitness metrics
  const totalCalories = workoutHistory.reduce((acc, w: any) => acc + (w.caloriesBurned || 0), 0);
  const averageWorkoutTime = completedWorkouts.length > 0 ? Math.round(totalMinutes / completedWorkouts.length) : 0;
  const weeklyGoal = (profile as any)?.weeklyWorkoutGoal || 4;
  const weeklyProgress = (thisWeekWorkouts / weeklyGoal) * 100;

  const fitnessStats = [
    {
      name: 'Workouts Completed',
      value: completedWorkouts.length,
      icon: TrophyIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      trend: '+12%',
      trendUp: true,
      description: 'Total sessions'
    },
    {
      name: 'Active Time',
      value: `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      subtitle: `Avg: ${averageWorkoutTime}min`,
      icon: ClockIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      trend: '+8%',
      trendUp: true,
      description: 'Time invested'
    },
    {
      name: 'Streak',
      value: `${currentStreak}`,
      subtitle: currentStreak === 1 ? 'day' : 'days',
      icon: FireIcon,
      color: 'text-fitness-hiit-600',
      bgColor: 'bg-fitness-hiit-50',
      trend: currentStreak > 0 ? `+${currentStreak}` : '0',
      trendUp: currentStreak > 0,
      description: 'Current streak'
    },
    {
      name: 'Calories Burned',
      value: totalCalories.toLocaleString(),
      subtitle: 'kcal total',
      icon: BoltIcon,
      color: 'text-fitness-cardio-600',
      bgColor: 'bg-fitness-cardio-50',
      trend: '+15%',
      trendUp: true,
      description: 'Energy burned'
    }
  ];

  const quickWorkouts = [
    {
      name: '7-Min HIIT',
      duration: 7,
      type: 'hiit',
      intensity: 'high',
      calories: 80,
      description: 'Quick high-intensity blast'
    },
    {
      name: 'Morning Yoga',
      duration: 15,
      type: 'yoga',
      intensity: 'low',
      calories: 45,
      description: 'Gentle morning flow'
    },
    {
      name: 'Strength Circuit',
      duration: 20,
      type: 'strength',
      intensity: 'medium',
      calories: 120,
      description: 'Full-body strength'
    },
    {
      name: 'Cardio Blast',
      duration: 12,
      type: 'cardio',
      intensity: 'high',
      calories: 150,
      description: 'Heart-pumping cardio'
    }
  ];

  const recentAchievements = [
    { name: 'First Week Complete', type: 'bronze', date: '2 days ago' },
    { name: '100 Calories Burned', type: 'silver', date: '1 week ago' },
    { name: '5 Day Streak', type: 'gold', date: '3 days ago' }
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Loading your dashboard</h3>
            <p className="text-neutral-600">Getting your fitness data ready...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl lg:text-5xl font-display font-bold bg-gradient-energy bg-clip-text text-transparent leading-tight">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Champion'}!
                </h1>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  👋
                </motion.div>
              </div>
              <p className="text-neutral-600 text-xl font-light mb-4">
                Ready to crush your fitness goals today?
              </p>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap items-center gap-4">
                <StreakBadge days={currentStreak} animate />
                <Badge variant="success" size="md" icon={<TrophyIcon />}>
                  {completedWorkouts.length} workouts
                </Badge>
                <Badge variant="primary" size="md" icon={<ClockIcon />}>
                  {Math.round(totalMinutes / 60)}h active
                </Badge>
              </div>
            </div>

            {/* Weekly Progress Ring */}
            <div className="flex justify-center lg:justify-end">
              <div className="text-center">
                <CircularProgress
                  value={weeklyProgress}
                  size={120}
                  showValue
                  label="Weekly Goal"
                  animate
                />
                <p className="text-sm text-neutral-600 mt-2">
                  {thisWeekWorkouts} of {weeklyGoal} workouts
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card
            variant="workout"
            hover
            interactive
            onClick={() => setShowWorkoutModal(true)}
            className="relative overflow-hidden min-h-[200px] group cursor-pointer bg-gradient-energy"
            glow
          >
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Start Your Workout
                  </h2>
                  <p className="text-white/90 text-lg mb-6">
                    AI-powered workouts tailored just for you
                  </p>
                  <StartWorkoutButton size="lg" className="bg-white text-primary-600 hover:bg-neutral-100">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate Workout
                  </StartWorkoutButton>
                </div>
                <div className="hidden lg:block">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl"
                  >
                    💪
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Quick Workout Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Quick Workouts</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/workout')}
              icon={<ArrowRightIcon />}
              iconPosition="right"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickWorkouts.map((workout, index) => (
              <motion.div
                key={workout.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <WorkoutCard
                  workoutType={workout.type as any}
                  className="h-full"
                  onClick={() => {
                    // Handle quick workout start
                    console.log('Starting quick workout:', workout.name);
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <WorkoutTypeBadge type={workout.type as any} size="sm">
                        {workout.type.toUpperCase()}
                      </WorkoutTypeBadge>
                      <IntensityBadge intensity={workout.intensity as any}>Intensity</IntensityBadge>
                    </div>

                    <h3 className="font-bold text-neutral-900 mb-2">{workout.name}</h3>
                    <p className="text-sm text-neutral-600 mb-4">{workout.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-neutral-500">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {workout.duration}min
                      </div>
                      <div className="flex items-center text-neutral-500">
                        <FireIcon className="w-4 h-4 mr-1" />
                        ~{workout.calories} cal
                      </div>
                    </div>
                  </div>
                </WorkoutCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Workout Generation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GradientCard
              hover
              interactive
              onClick={() => setShowWorkoutModal(true)}
              className="relative overflow-hidden min-h-[200px] sm:min-h-[240px] group cursor-pointer"
            >
              {/* Animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between h-full">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <SparklesIcon className="w-6 h-6 mr-3 animate-pulse" />
                    <Badge variant="glass" size="sm" className="font-semibold">AI Powered</Badge>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold mb-3">Generate AI Workout</h3>
                  <p className="text-white/90 mb-6 text-lg leading-relaxed">
                    Get a personalized workout tailored to your goals and preferences
                  </p>
                  <Button
                    variant="glass"
                    size="lg"
                    icon={<SparklesIcon />}
                    className="group-hover:scale-105 transition-transform duration-300"
                    fullWidth={true}
                  >
                    Create Workout
                  </Button>
                </div>
                <div className="hidden lg:block">
                  <SparklesIcon className="w-24 h-24 text-white/20 group-hover:text-white/30 transition-colors duration-300 animate-float" />
                </div>
              </div>
            </GradientCard>

          <InteractiveCard className="border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-all duration-300 min-h-[200px] sm:min-h-[240px]">
            <div className="text-center py-6 sm:py-8 h-full flex flex-col justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">Quick Start</h3>
              <p className="text-neutral-600 mb-4 sm:mb-6 text-sm sm:text-base">Jump into a pre-made workout</p>
              <Link to="/app/workout" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  icon={<PlayIcon />}
                  fullWidth={true}
                  className="sm:w-auto"
                >
                  Browse Workouts
                </Button>
              </Link>
            </div>
          </InteractiveCard>
          </div>
        </motion.div>

        {/* Enhanced Fitness Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Your Progress</h2>
            <div className="flex space-x-2">
              {(['week', 'month', 'year'] as const).map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className="capitalize"
                >
                  {timeframe}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fitnessStats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <StatsCard className="group h-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      {stat.trendUp !== undefined && (
                        <Badge
                          variant={stat.trendUp ? 'success' : 'error'}
                          size="xs"
                          className="font-semibold"
                        >
                          {stat.trend}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                        {stat.subtitle && (
                          <p className="text-sm text-neutral-500">{stat.subtitle}</p>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{stat.description}</p>
                    </div>
                  </div>
                </StatsCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Recent Achievements</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/achievements')}
              icon={<ArrowRightIcon />}
              iconPosition="right"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <AchievementCard>
                  <div className="p-6 text-center">
                    <AchievementBadge
                      level={achievement.type as any}
                      size="lg"
                    >
                      <TrophyIcon className="w-6 h-6" />
                    </AchievementBadge>
                    <h3 className="font-bold text-neutral-900 mb-2">{achievement.name}</h3>
                    <p className="text-sm text-neutral-500">{achievement.date}</p>
                  </div>
                </AchievementCard>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card hover>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-neutral-900">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/history')}
                  icon={<ArrowRightIcon />}
                  iconPosition="right"
                >
                  View All
                </Button>
              </div>

              {workoutHistory.length > 0 ? (
                <div className="space-y-4">
                  {workoutHistory.slice(0, 3).map((workout, index) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-5 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/app/history/${workout.id}`)}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                          <PlayIcon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-900 mb-1">
                            {workout.workoutPlan?.name || 'Workout Session'}
                          </h4>
                          <div className="flex items-center space-x-3">
                            <p className="text-sm text-neutral-600">
                              {workout.startTime.toLocaleDateString()}
                            </p>
                            <Badge
                              variant={workout.status === 'completed' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {workout.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {workout.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < workout.rating! ? 'text-warning-400' : 'text-neutral-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ClockIcon className="w-10 h-10 text-neutral-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-neutral-900 mb-3">No workouts yet</h4>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    Start your fitness journey by generating your first AI-powered workout!
                  </p>
                  <StartWorkoutButton
                    onClick={() => setShowWorkoutModal(true)}
                    size="lg"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Generate Your First Workout
                  </StartWorkoutButton>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </PageContainer>

      {/* Workout Generation Modal */}
      <WorkoutGenerationModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        userProfile={profile}
      />
    </>
  );
};
