import { 
  collection, 

  addDoc, 

  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,

  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProgressMetric {
  id?: string;
  userId: string;
  date: Date;
  type: 'workout' | 'measurement' | 'achievement' | 'streak';
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalDuration: number; // minutes
  averageDuration: number;
  totalCaloriesBurned: number;
  averageCaloriesPerWorkout: number;
  workoutFrequency: number; // workouts per week
  currentStreak: number;
  longestStreak: number;
  favoriteWorkoutType: string;
  progressTrend: 'improving' | 'stable' | 'declining';
  weeklyProgress: Array<{
    week: string;
    workouts: number;
    duration: number;
    calories: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    workouts: number;
    duration: number;
    calories: number;
  }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'streak' | 'milestone' | 'special';
  requirement: {
    type: string;
    value: number;
    timeframe?: string;
  };
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export class AnalyticsService {
  // Record a progress metric
  static async recordProgress(metric: Omit<ProgressMetric, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'progressMetrics'), {
        ...metric,
        date: Timestamp.fromDate(metric.date),
        createdAt: Timestamp.fromDate(new Date()),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  }

  // Get user's progress metrics
  static async getProgressMetrics(
    userId: string, 
    type?: string, 
    startDate?: Date, 
    endDate?: Date,
    limitCount: number = 100
  ): Promise<ProgressMetric[]> {
    try {
      let q = query(
        collection(db, 'progressMetrics'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      if (startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as ProgressMetric[];
    } catch (error) {
      console.error('Error getting progress metrics:', error);
      throw error;
    }
  }

  // Calculate comprehensive workout analytics
  static async getWorkoutAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<WorkoutAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get workout sessions
      const workoutQuery = query(
        collection(db, 'workoutSessions'),
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('startTime', 'desc')
      );

      const workoutSnapshot = await getDocs(workoutQuery);
      const workouts = workoutSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate(),
      }));

      // Calculate basic metrics
      const totalWorkouts = workouts.length;
      const completedWorkouts = (workouts as any[]).filter(w => (w as any).status === 'completed');
      
      const totalDuration = completedWorkouts.reduce((sum, workout) => {
        if (workout.endTime && workout.startTime) {
          return sum + (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
        }
        return sum;
      }, 0);

      const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
      
      const totalCaloriesBurned = (completedWorkouts as any[]).reduce((sum, workout: any) => {
        return sum + (workout.caloriesBurned || 0);
      }, 0);

      const averageCaloriesPerWorkout = totalWorkouts > 0 ? totalCaloriesBurned / totalWorkouts : 0;

      // Calculate workout frequency (workouts per week)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const workoutFrequency = (totalWorkouts / daysDiff) * 7;

      // Calculate streaks
      const { currentStreak, longestStreak } = this.calculateStreaks(completedWorkouts);

      // Find favorite workout type
      const workoutTypeCounts: Record<string, number> = {};
      completedWorkouts.forEach(workout => {
        const type = (workout as any).workoutPlan?.type || 'unknown';
        workoutTypeCounts[type] = (workoutTypeCounts[type] || 0) + 1;
      });
      
      const favoriteWorkoutType = Object.entries(workoutTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      // Calculate progress trend
      const progressTrend = this.calculateProgressTrend(completedWorkouts);

      // Generate weekly/monthly progress
      const weeklyProgress = this.generateWeeklyProgress(completedWorkouts);
      const monthlyProgress = this.generateMonthlyProgress(completedWorkouts);

      return {
        totalWorkouts,
        totalDuration: Math.round(totalDuration),
        averageDuration: Math.round(averageDuration),
        totalCaloriesBurned: Math.round(totalCaloriesBurned),
        averageCaloriesPerWorkout: Math.round(averageCaloriesPerWorkout),
        workoutFrequency: Math.round(workoutFrequency * 10) / 10,
        currentStreak,
        longestStreak,
        favoriteWorkoutType,
        progressTrend,
        weeklyProgress,
        monthlyProgress,
      };
    } catch (error) {
      console.error('Error getting workout analytics:', error);
      throw error;
    }
  }

  // Calculate current and longest streaks
  private static calculateStreaks(workouts: any[]): { currentStreak: number; longestStreak: number } {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort workouts by date
    const sortedWorkouts = workouts
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].startTime);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak || (currentStreak === 0 && daysDiff <= 1)) {
        currentStreak = daysDiff + 1;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let lastWorkoutDate: Date | null = null;
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.startTime);
      workoutDate.setHours(0, 0, 0, 0);

      if (!lastWorkoutDate) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((lastWorkoutDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastWorkoutDate = workoutDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  // Calculate progress trend
  private static calculateProgressTrend(workouts: any[]): 'improving' | 'stable' | 'declining' {
    if (workouts.length < 4) return 'stable';

    const recentWorkouts = workouts.slice(0, Math.floor(workouts.length / 2));
    const olderWorkouts = workouts.slice(Math.floor(workouts.length / 2));

    const recentAvgDuration = recentWorkouts.reduce((sum, w) => {
      if (w.endTime && w.startTime) {
        return sum + (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60);
      }
      return sum;
    }, 0) / recentWorkouts.length;

    const olderAvgDuration = olderWorkouts.reduce((sum, w) => {
      if (w.endTime && w.startTime) {
        return sum + (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60);
      }
      return sum;
    }, 0) / olderWorkouts.length;

    const improvement = ((recentAvgDuration - olderAvgDuration) / olderAvgDuration) * 100;

    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }

  // Generate weekly progress data
  private static generateWeeklyProgress(workouts: any[]) {
    const weeks: Record<string, { workouts: number; duration: number; calories: number }> = {};
    
    workouts.forEach(workout => {
      const weekStart = new Date(workout.startTime);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { workouts: 0, duration: 0, calories: 0 };
      }
      
      weeks[weekKey].workouts++;
      if (workout.endTime && workout.startTime) {
        weeks[weekKey].duration += (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
      }
      weeks[weekKey].calories += workout.caloriesBurned || 0;
    });

    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  // Generate monthly progress data
  private static generateMonthlyProgress(workouts: any[]) {
    const months: Record<string, { workouts: number; duration: number; calories: number }> = {};
    
    workouts.forEach(workout => {
      const monthKey = workout.startTime.toISOString().substring(0, 7); // YYYY-MM
      
      if (!months[monthKey]) {
        months[monthKey] = { workouts: 0, duration: 0, calories: 0 };
      }
      
      months[monthKey].workouts++;
      if (workout.endTime && workout.startTime) {
        months[monthKey].duration += (workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60);
      }
      months[monthKey].calories += workout.caloriesBurned || 0;
    });

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Achievement system
  static async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    try {
      const analytics = await this.getWorkoutAnalytics(userId, 'year');
      const unlockedAchievements: Achievement[] = [];

      // Get user's current achievements
      const achievementsQuery = query(
        collection(db, 'userAchievements'),
        where('userId', '==', userId)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);
      const currentAchievements = new Set(
        achievementsSnapshot.docs.map(doc => doc.data().achievementId)
      );

      // Define all available achievements
      const allAchievements = this.getAvailableAchievements();

      // Check each achievement
      for (const achievement of allAchievements) {
        if (!currentAchievements.has(achievement.id)) {
          const isUnlocked = this.checkAchievementRequirement(achievement, analytics);
          if (isUnlocked) {
            // Unlock achievement
            await addDoc(collection(db, 'userAchievements'), {
              userId,
              achievementId: achievement.id,
              unlockedAt: Timestamp.fromDate(new Date()),
            });

            achievement.unlockedAt = new Date();
            unlockedAchievements.push(achievement);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  // Get all available achievements
  private static getAvailableAchievements(): Achievement[] {
    return [
      {
        id: 'first-workout',
        name: 'Getting Started',
        description: 'Complete your first workout',
        icon: '🎯',
        category: 'milestone',
        requirement: { type: 'totalWorkouts', value: 1 }
      },
      {
        id: 'workout-warrior',
        name: 'Workout Warrior',
        description: 'Complete 10 workouts',
        icon: '⚔️',
        category: 'milestone',
        requirement: { type: 'totalWorkouts', value: 10 }
      },
      {
        id: 'fitness-fanatic',
        name: 'Fitness Fanatic',
        description: 'Complete 50 workouts',
        icon: '🏆',
        category: 'milestone',
        requirement: { type: 'totalWorkouts', value: 50 }
      },
      {
        id: 'streak-starter',
        name: 'Streak Starter',
        description: 'Maintain a 7-day workout streak',
        icon: '🔥',
        category: 'streak',
        requirement: { type: 'currentStreak', value: 7 }
      },
      {
        id: 'consistency-king',
        name: 'Consistency King',
        description: 'Maintain a 30-day workout streak',
        icon: '👑',
        category: 'streak',
        requirement: { type: 'currentStreak', value: 30 }
      },
      {
        id: 'calorie-crusher',
        name: 'Calorie Crusher',
        description: 'Burn 1000 calories in total',
        icon: '🔥',
        category: 'milestone',
        requirement: { type: 'totalCaloriesBurned', value: 1000 }
      },
      {
        id: 'time-master',
        name: 'Time Master',
        description: 'Complete 10 hours of workouts',
        icon: '⏰',
        category: 'milestone',
        requirement: { type: 'totalDuration', value: 600 } // 10 hours in minutes
      },
      {
        id: 'weekend-warrior',
        name: 'Weekend Warrior',
        description: 'Complete workouts on 10 weekends',
        icon: '🏃‍♂️',
        category: 'special',
        requirement: { type: 'weekendWorkouts', value: 10 }
      }
    ];
  }

  // Check if achievement requirement is met
  private static checkAchievementRequirement(achievement: Achievement, analytics: WorkoutAnalytics): boolean {
    const { type, value } = achievement.requirement;

    switch (type) {
      case 'totalWorkouts':
        return analytics.totalWorkouts >= value;
      case 'currentStreak':
        return analytics.currentStreak >= value;
      case 'totalCaloriesBurned':
        return analytics.totalCaloriesBurned >= value;
      case 'totalDuration':
        return analytics.totalDuration >= value;
      default:
        return false;
    }
  }

  // Get user's achievements
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const achievementsQuery = query(
        collection(db, 'userAchievements'),
        where('userId', '==', userId)
      );
      const achievementsSnapshot = await getDocs(achievementsQuery);

      const unlockedAchievementIds = new Set(
        achievementsSnapshot.docs.map(doc => doc.data().achievementId)
      );

      const allAchievements = this.getAvailableAchievements();
      const analytics = await this.getWorkoutAnalytics(userId, 'year');

      return allAchievements.map(achievement => {
        const isUnlocked = unlockedAchievementIds.has(achievement.id);
        const progress = this.calculateAchievementProgress(achievement, analytics);

        return {
          ...achievement,
          unlockedAt: isUnlocked ? new Date() : undefined,
          progress: progress.current,
          maxProgress: progress.max,
        };
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  // Calculate achievement progress
  private static calculateAchievementProgress(achievement: Achievement, analytics: WorkoutAnalytics): { current: number; max: number } {
    const { type, value } = achievement.requirement;

    switch (type) {
      case 'totalWorkouts':
        return { current: Math.min(analytics.totalWorkouts, value), max: value };
      case 'currentStreak':
        return { current: Math.min(analytics.currentStreak, value), max: value };
      case 'totalCaloriesBurned':
        return { current: Math.min(analytics.totalCaloriesBurned, value), max: value };
      case 'totalDuration':
        return { current: Math.min(analytics.totalDuration, value), max: value };
      default:
        return { current: 0, max: value };
    }
  }
}
