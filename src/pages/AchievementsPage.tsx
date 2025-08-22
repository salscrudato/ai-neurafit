import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  LockClosedIcon,
  SparklesIcon,
  StarIcon,
  FireIcon,
  ClockIcon,
  BoltIcon,
  HeartIcon,
  CheckCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Card, GradientCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AchievementsShowcase } from '../components/analytics/AchievementsShowcase';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { AnalyticsService, type Achievement } from '../services/analyticsService';

interface AchievementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const achievementCategories: AchievementCategory[] = [
  {
    id: 'workout',
    name: 'Workout Milestones',
    icon: TrophyIcon,
    color: 'primary',
    description: 'Complete workouts and reach training goals'
  },
  {
    id: 'streak',
    name: 'Consistency',
    icon: FireIcon,
    color: 'warning',
    description: 'Build and maintain workout streaks'
  },
  {
    id: 'milestone',
    name: 'Major Milestones',
    icon: StarIcon,
    color: 'secondary',
    description: 'Reach significant fitness achievements'
  },
  {
    id: 'special',
    name: 'Special Events',
    icon: SparklesIcon,
    color: 'accent',
    description: 'Unique and seasonal achievements'
  }
];

export const AchievementsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { workoutHistory } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Load achievements from service
      const userAchievements = await AnalyticsService.getUserAchievements(user!.uid);
      setAchievements(userAchievements);
      
    } catch (error) {
      console.error('Error loading achievements:', error);
      // Fallback to mock achievements if service fails
      setAchievements(getMockAchievements());
    } finally {
      setLoading(false);
    }
  };

  const getMockAchievements = (): Achievement[] => {
    const completedWorkouts = workoutHistory.filter(w => w.status === 'completed').length;
    
    return [
      {
        id: 'first-workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        icon: '🎯',
        category: 'workout',
        requirement: { type: 'workouts_completed', value: 1 },
        unlockedAt: completedWorkouts >= 1 ? new Date() : undefined,
        progress: Math.min(completedWorkouts, 1),
        maxProgress: 1
      },
      {
        id: 'workout-warrior',
        name: 'Workout Warrior',
        description: 'Complete 10 workouts',
        icon: '💪',
        category: 'workout',
        requirement: { type: 'workouts_completed', value: 10 },
        unlockedAt: completedWorkouts >= 10 ? new Date() : undefined,
        progress: Math.min(completedWorkouts, 10),
        maxProgress: 10
      },
      {
        id: 'century-club',
        name: 'Century Club',
        description: 'Complete 100 workouts',
        icon: '🏆',
        category: 'milestone',
        requirement: { type: 'workouts_completed', value: 100 },
        unlockedAt: completedWorkouts >= 100 ? new Date() : undefined,
        progress: Math.min(completedWorkouts, 100),
        maxProgress: 100
      },
      {
        id: 'week-streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day workout streak',
        icon: '🔥',
        category: 'streak',
        requirement: { type: 'streak_days', value: 7 },
        unlockedAt: undefined, // Would need streak calculation
        progress: 0,
        maxProgress: 7
      },
      {
        id: 'month-streak',
        name: 'Monthly Master',
        description: 'Maintain a 30-day workout streak',
        icon: '⚡',
        category: 'streak',
        requirement: { type: 'streak_days', value: 30 },
        unlockedAt: undefined,
        progress: 0,
        maxProgress: 30
      },
      {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Complete 5 morning workouts',
        icon: '🌅',
        category: 'special',
        requirement: { type: 'morning_workouts', value: 5 },
        unlockedAt: undefined,
        progress: 0,
        maxProgress: 5
      }
    ];
  };

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const filterMatch = filter === 'all' || 
      (filter === 'unlocked' && achievement.unlockedAt) ||
      (filter === 'locked' && !achievement.unlockedAt);
    
    return categoryMatch && filterMatch;
  });

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalPoints = achievements.filter(a => a.unlockedAt).length * 10; // 10 points per achievement

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          Your Achievements
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Celebrate your fitness milestones and unlock new challenges as you progress on your journey
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <GradientCard className="text-white text-center" padding="lg">
          <TrophyIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-2">{unlockedCount}</h3>
          <p className="text-white/90">Achievements Unlocked</p>
          <p className="text-sm text-white/70 mt-1">
            {unlockedCount} of {achievements.length} total
          </p>
        </GradientCard>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-6 h-6 text-warning-600" />
          </div>
          <h3 className="text-3xl font-bold text-neutral-900 mb-2">{totalPoints}</h3>
          <p className="text-neutral-600">Achievement Points</p>
          <p className="text-sm text-neutral-500 mt-1">
            Earn 10 points per achievement
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="text-3xl font-bold text-neutral-900 mb-2">
            {Math.round((unlockedCount / achievements.length) * 100)}%
          </h3>
          <p className="text-neutral-600">Completion Rate</p>
          <p className="text-sm text-neutral-500 mt-1">
            Keep going to unlock more!
          </p>
        </Card>
      </motion.div>

      {/* Categories and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          {achievementCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'ghost'}
                size="sm"
                icon={<Icon />}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-4 h-4 text-neutral-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unlocked' | 'locked')}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Achievements</option>
            <option value="unlocked">Unlocked Only</option>
            <option value="locked">Locked Only</option>
          </select>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`relative overflow-hidden transition-all duration-200 ${
                  achievement.unlockedAt 
                    ? 'border-success-200 bg-success-50 hover:bg-success-100' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                hover
              >
                {/* Achievement Icon */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                    achievement.unlockedAt 
                      ? 'bg-success-500 text-white' 
                      : 'bg-neutral-200 text-neutral-400'
                  }`}>
                    {achievement.unlockedAt ? achievement.icon : <LockClosedIcon className="w-8 h-8" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        achievement.unlockedAt ? 'text-neutral-900' : 'text-neutral-500'
                      }`}>
                        {achievement.name}
                      </h3>
                      {achievement.unlockedAt && (
                        <Badge variant="success" size="sm">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      achievement.unlockedAt ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {achievement.maxProgress && achievement.maxProgress > 1 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          achievement.unlockedAt ? 'bg-success-500' : 'bg-primary-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min((achievement.progress! / achievement.maxProgress) * 100, 100)}%` 
                        }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Unlock Date */}
                {achievement.unlockedAt && (
                  <div className="text-xs text-success-600 font-medium">
                    Unlocked {achievement.unlockedAt.toLocaleDateString()}
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    variant={achievement.unlockedAt ? 'success' : 'neutral'} 
                    size="xs"
                  >
                    {achievementCategories.find(c => c.id === achievement.category)?.name || achievement.category}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <TrophyIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            No achievements found
          </h3>
          <p className="text-neutral-600 mb-6">
            Try adjusting your filters or start working out to unlock achievements!
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedCategory('all');
              setFilter('all');
            }}
          >
            Show All Achievements
          </Button>
        </motion.div>
      )}
    </div>
  );
};
