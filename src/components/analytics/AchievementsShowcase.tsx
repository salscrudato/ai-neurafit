import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  LockClosedIcon,
  SparklesIcon,

  StarIcon
} from '@heroicons/react/24/outline';
import { Card, GradientCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AnalyticsService, type Achievement } from '../../services/analyticsService';
import { useAuthStore } from '../../store/authStore';

interface AchievementsShowcaseProps {
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export const AchievementsShowcase: React.FC<AchievementsShowcaseProps> = ({
  onAchievementUnlocked
}) => {
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const achievementsData = await AnalyticsService.getUserAchievements(user.id);
      setAchievements(achievementsData);
      
      // Check for newly unlocked achievements
      const newlyUnlocked = await AnalyticsService.checkAndUnlockAchievements(user.id);
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(achievement => {
          onAchievementUnlocked?.(achievement);
        });
        // Reload to get updated data
        const updatedAchievements = await AnalyticsService.getUserAchievements(user.id);
        setAchievements(updatedAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unlocked' && achievement.unlockedAt) ||
      (filter === 'locked' && !achievement.unlockedAt);
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      achievement.category === selectedCategory;
    
    return matchesFilter && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const progressPercentage = (unlockedCount / achievements.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Achievements</h2>
          <p className="text-neutral-600">Celebrate your fitness milestones and unlock new goals</p>
        </div>
        
        <GradientCard className="text-white text-center" padding="md">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{unlockedCount}/{achievements.length}</p>
              <p className="text-white/90 text-sm">Unlocked</p>
            </div>
          </div>
        </GradientCard>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-neutral-900">Overall Progress</h3>
          <Badge variant="primary" size="sm">{Math.round(progressPercentage)}%</Badge>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm text-neutral-600 mt-2">
          Keep going! You're {achievements.length - unlockedCount} achievements away from completing your collection.
        </p>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      ? 'bg-success-200 text-success-800' 
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {achievement.unlockedAt ? achievement.icon : <LockClosedIcon className="w-8 h-8" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-bold ${
                        achievement.unlockedAt ? 'text-success-900' : 'text-neutral-700'
                      }`}>
                        {achievement.name}
                      </h3>
                      {achievement.unlockedAt && (
                        <SparklesIcon className="w-4 h-4 text-success-600" />
                      )}
                    </div>
                    <p className={`text-sm ${
                      achievement.unlockedAt ? 'text-success-700' : 'text-neutral-600'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant={achievement.unlockedAt ? 'success' : 'secondary'} 
                    size="sm"
                  >
                    {achievement.category.replace('_', ' ')}
                  </Badge>
                  
                  {achievement.unlockedAt && (
                    <div className="flex items-center space-x-1 text-success-600">
                      <StarIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Unlocked</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar for Locked Achievements */}
                {!achievement.unlockedAt && achievement.progress !== undefined && achievement.maxProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Progress</span>
                      <span className="font-medium text-neutral-900">
                        {achievement.progress} / {achievement.maxProgress}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%` 
                        }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Unlocked Date */}
                {achievement.unlockedAt && (
                  <div className="mt-3 pt-3 border-t border-success-200">
                    <p className="text-xs text-success-600">
                      Unlocked on {achievement.unlockedAt.toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Glow effect for unlocked achievements */}
                {achievement.unlockedAt && (
                  <div className="absolute inset-0 bg-gradient-to-r from-success-400/10 to-success-600/10 pointer-events-none" />
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAchievements.length === 0 && (
        <Card className="text-center py-12">
          <TrophyIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">No achievements found</h3>
          <p className="text-neutral-600">
            {filter === 'unlocked' 
              ? "You haven't unlocked any achievements yet. Keep working out to earn your first trophy!"
              : filter === 'locked'
              ? "All achievements unlocked! You're a fitness champion!"
              : "No achievements match your current filters."
            }
          </p>
        </Card>
      )}
    </div>
  );
};
