// src/pages/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  PlusIcon,
  FireIcon,
  TrophyIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

import { Button, StartWorkoutButton } from '../components/ui/Button';
import {
  Card,
  GradientCard,
  InteractiveCard,
  WorkoutCard,
  AchievementCard,
  StatsCard,
} from '../components/ui/Card';
import {
  Badge,
  WorkoutTypeBadge,
  IntensityBadge,
  AchievementBadge,
  StreakBadge,
} from '../components/ui/Badge';
import { CircularProgress } from '../components/ui/Progress';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageContainer } from '../components/ui/Container';
import { WorkoutGenerationModal } from '../components/workout/WorkoutGenerationModal';

import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { UserProfileService } from '../services/userProfileService';

/* ----------------------------- Utils & Types ----------------------------- */

type Timeframe = 'week' | 'month' | 'year';
type MaybeDate = Date | string | number | { toDate?: () => Date } | null | undefined;

interface WorkoutRecord {
  id?: string;
  status?: 'completed' | 'in-progress' | 'abandoned';
  startTime?: MaybeDate;
  endTime?: MaybeDate;
  workoutPlan?: { name?: string };
  caloriesBurned?: number;
  rating?: number;
  // ...other fields ignored for dashboard
}

const toDate = (v: MaybeDate): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'object' && 'toDate' in v && typeof v.toDate === 'function') return v.toDate() ?? null;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
};

const minutesBetween = (a?: MaybeDate, b?: MaybeDate): number => {
  const d1 = toDate(a);
  const d2 = toDate(b);
  if (!d1 || !d2) return 0;
  const ms = d2.getTime() - d1.getTime();
  return ms > 0 ? Math.round(ms / 60000) : 0;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const calculateCurrentStreak = (workouts: WorkoutRecord[]): number => {
  const completed = workouts
    .filter((w) => w.status === 'completed' && toDate(w.startTime))
    .map((w) => toDate(w.startTime)!)
    .sort((a, b) => b.getTime() - a.getTime());

  if (!completed.length) return 0;

  let streak = 0;
  const today = startOfToday();

  for (let i = 0; i < completed.length; i++) {
    const d = new Date(completed[i]);
    d.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
      streak = daysDiff + 1;
    } else break;
  }
  return streak;
};

const timeframeToDays: Record<Timeframe, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const getRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
};

const computeTrend = (current: number, previous: number): { label: string; up: boolean } | null => {
  if (previous <= 0 && current <= 0) return null;
  if (previous <= 0 && current > 0) return { label: 'NEW', up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { label: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 };
};

const formatDay = (d: MaybeDate) => {
  const dt = toDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/* --------------------------------- Page --------------------------------- */

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { user } = useAuthStore();
  const { profile, setProfile } = useUserStore();
  const { workoutHistory } = useWorkoutStore();

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('week');

  useEffect(() => {
    document.title = 'Dashboard • NeuraFit';
  }, []);

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

    if (user && !profile) loadUserProfile();
    else setLoading(false);
  }, [user, profile, setProfile]);

  /* ------------------------------ Derived data ------------------------------ */

  const {
    completedWorkouts,
    totalMinutes,
    totalCalories,
    currentStreak,
    thisWeekWorkouts,
    weeklyGoal,
    weeklyProgress,
  } = useMemo(() => {
    const all = (workoutHistory as WorkoutRecord[]) ?? [];
    const completed = all.filter((w) => w.status === 'completed');

    const minutes = all.reduce((acc, w) => acc + minutesBetween(w.startTime, w.endTime), 0);
    const calories = all.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

    const streak = calculateCurrentStreak(all);

    const { start } = getRange(7);
    const wk = all.filter((w) => w.status === 'completed' && toDate(w.startTime)! > start).length;

    const goal = (profile as any)?.weeklyWorkoutGoal || 4;
    const prog = clamp((wk / goal) * 100);

    return {
      completedWorkouts: completed,
      totalMinutes: minutes,
      totalCalories: calories,
      currentStreak: streak,
      thisWeekWorkouts: wk,
      weeklyGoal: goal,
      weeklyProgress: prog,
    };
  }, [workoutHistory, profile]);

  const {
    tfWorkouts,
    tfMinutes,
    tfCalories,
    tfAvgMinutes,
    trendWorkouts,
    trendMinutes,
    trendCalories,
  } = useMemo(() => {
    const all = (workoutHistory as WorkoutRecord[]) ?? [];
    const days = timeframeToDays[selectedTimeframe];

    const { start: curStart, end: curEnd } = getRange(days);
    const { start: prevStart, end: prevEnd } = (() => {
      const end = new Date(curStart);
      const start = new Date(curStart);
      start.setDate(start.getDate() - days);
      return { start, end };
    })();

    const inRange = (w: WorkoutRecord, s: Date, e: Date) => {
      const d = toDate(w.startTime);
      return !!d && d > s && d <= e;
    };

    const curCompleted = all.filter((w) => w.status === 'completed' && inRange(w, curStart, curEnd));
    const prevCompleted = all.filter((w) => w.status === 'completed' && inRange(w, prevStart, prevEnd));

    const curMinutes = curCompleted.reduce((acc, w) => acc + minutesBetween(w.startTime, w.endTime), 0);
    const prevMinutes = prevCompleted.reduce((acc, w) => acc + minutesBetween(w.startTime, w.endTime), 0);

    const curCalories = curCompleted.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
    const prevCalories = prevCompleted.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

    const avg = curCompleted.length ? Math.round(curMinutes / curCompleted.length) : 0;

    return {
      tfWorkouts: curCompleted.length,
      tfMinutes: curMinutes,
      tfCalories: curCalories,
      tfAvgMinutes: avg,
      trendWorkouts: computeTrend(curCompleted.length, prevCompleted.length),
      trendMinutes: computeTrend(curMinutes, prevMinutes),
      trendCalories: computeTrend(curCalories, prevCalories),
    };
  }, [workoutHistory, selectedTimeframe]);

  const fitnessStats = useMemo(
    () => [
      {
        name: 'Workouts',
        value: tfWorkouts,
        icon: TrophyIcon,
        color: 'text-success-600',
        bgColor: 'bg-success-50',
        trend: trendWorkouts?.label,
        trendUp: trendWorkouts?.up,
        description:
          selectedTimeframe === 'week' ? 'This week' : selectedTimeframe === 'month' ? 'This month' : 'This year',
      },
      {
        name: 'Active Time',
        value: `${Math.floor(tfMinutes / 60)}h ${tfMinutes % 60}m`,
        subtitle: `Avg: ${tfAvgMinutes}m`,
        icon: ClockIcon,
        color: 'text-primary-600',
        bgColor: 'bg-primary-50',
        trend: trendMinutes?.label,
        trendUp: trendMinutes?.up,
        description: 'Time invested',
      },
      {
        name: 'Streak',
        value: `${currentStreak}`,
        subtitle: currentStreak === 1 ? 'day' : 'days',
        icon: FireIcon,
        color: 'text-fitness-hiit-600',
        bgColor: 'bg-fitness-hiit-50',
        // Streak trend is qualitative; show only if positive
        trend: currentStreak > 0 ? `+${currentStreak}` : undefined,
        trendUp: currentStreak > 0 ? true : undefined,
        description: 'Current streak',
      },
      {
        name: 'Calories',
        value: tfCalories.toLocaleString(),
        subtitle: 'kcal',
        icon: BoltIcon,
        color: 'text-fitness-cardio-600',
        bgColor: 'bg-fitness-cardio-50',
        trend: trendCalories?.label,
        trendUp: trendCalories?.up,
        description: 'Energy burned',
      },
    ],
    [tfWorkouts, tfMinutes, tfAvgMinutes, currentStreak, tfCalories, selectedTimeframe, trendWorkouts, trendMinutes, trendCalories]
  );

  const quickWorkouts = [
    { name: '7‑Min HIIT', duration: 7, type: 'hiit', intensity: 'high', calories: 80, description: 'Quick high‑intensity blast' },
    { name: 'Morning Yoga', duration: 15, type: 'yoga', intensity: 'low', calories: 45, description: 'Gentle morning flow' },
    { name: 'Strength Circuit', duration: 20, type: 'strength', intensity: 'medium', calories: 120, description: 'Full‑body strength' },
    { name: 'Cardio Blast', duration: 12, type: 'cardio', intensity: 'high', calories: 150, description: 'Heart‑pumping cardio' },
  ];

  const recentAchievements = [
    { name: 'First Week Complete', type: 'bronze', date: '2 days ago' },
    { name: '100 Calories Burned', type: 'silver', date: '1 week ago' },
    { name: '5 Day Streak', type: 'gold', date: '3 days ago' },
  ];

  /* --------------------------------- Load --------------------------------- */

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="mb-2 text-lg font-medium text-neutral-900">Loading your dashboard</h3>
            <p className="text-neutral-600">Getting your fitness data ready…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* --------------------------------- View --------------------------------- */

  return (
    <>
      <PageContainer>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex-1">
              <div className="mb-4 flex items-center space-x-4">
                <h1 className="text-4xl font-display font-bold leading-tight text-transparent bg-gradient-energy bg-clip-text lg:text-5xl">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'Champion'}!
                </h1>
                <motion.div
                  animate={reduceMotion ? {} : { rotate: [0, 10, -10, 0] }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  aria-hidden
                >
                  👋
                </motion.div>
              </div>

              <p className="mb-4 text-xl font-light text-neutral-600">Ready to crush your fitness goals today?</p>

              <div className="flex flex-wrap items-center gap-4">
                <StreakBadge days={currentStreak} animate />
                <Badge variant="success" size="md" icon={<TrophyIcon />}>
                  {completedWorkouts.length} workouts
                </Badge>
                <Badge variant="primary" size="md" icon={<ClockIcon />}>
                  {Math.floor(totalMinutes / 60)}h active
                </Badge>
              </div>
            </div>

            {/* Weekly Goal */}
            <div className="flex justify-center lg:justify-end">
              <div className="text-center">
                <CircularProgress value={weeklyProgress} size={120} showValue label="Weekly Goal" animate />
                <p className="mt-2 text-sm text-neutral-600">
                  {thisWeekWorkouts} of {weeklyGoal} workouts
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card
            variant="workout"
            hover
            interactive
            onClick={() => setShowWorkoutModal(true)}
            className="group relative min-h-[200px] cursor-pointer overflow-hidden bg-gradient-energy"
            glow
            ariaLabel="Generate AI workout"
          >
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-3xl font-bold text-white">Start Your Workout</h2>
                  <p className="mb-6 text-lg text-white/90">AI‑powered workouts tailored just for you</p>
                  <StartWorkoutButton size="lg" className="bg-white text-primary-600 hover:bg-neutral-100">
                    <SparklesIcon className="mr-2 h-5 w-5" aria-hidden />
                    Generate Workout
                  </StartWorkoutButton>
                </div>
                <div className="hidden lg:block">
                  <motion.div
                    animate={
                      reduceMotion
                        ? {}
                        : { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                    }
                    transition={reduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-6xl"
                    aria-hidden
                  >
                    💪
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Subtle ambient shapes */}
            {!reduceMotion && (
              <div className="absolute inset-0 opacity-20" aria-hidden>
                <motion.div
                  className="absolute right-4 top-4 h-32 w-32 rounded-full bg-white"
                  animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.28, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 h-24 w-24 rounded-full bg-white"
                  animate={{ scale: [1, 1.18, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Workouts */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center justify-between">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickWorkouts.map((workout, index) => (
              <motion.div
                key={workout.name}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.1 * index }}
              >
                <WorkoutCard
                  workoutType={workout.type as any}
                  className="h-full"
                  onClick={() => {
                    // TODO: wire to quick-start flow (e.g., preset generation config)
                    navigate('/app/workout');
                  }}
                  ariaLabel={`Start ${workout.name}`}
                >
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <WorkoutTypeBadge type={workout.type as any} size="sm">
                        {workout.type.toUpperCase()}
                      </WorkoutTypeBadge>
                      <IntensityBadge intensity={workout.intensity as any}>Intensity</IntensityBadge>
                    </div>

                    <h3 className="mb-2 font-bold text-neutral-900">{workout.name}</h3>
                    <p className="mb-4 text-sm text-neutral-600">{workout.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-neutral-500">
                        <ClockIcon className="mr-1 h-4 w-4" aria-hidden />
                        {workout.duration}min
                      </div>
                      <div className="flex items-center text-neutral-500">
                        <FireIcon className="mr-1 h-4 w-4" aria-hidden />
                        ~{workout.calories} cal
                      </div>
                    </div>
                  </div>
                </WorkoutCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Generation + Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GradientCard
              hover
              interactive
              onClick={() => setShowWorkoutModal(true)}
              className="group relative min-h-[200px] cursor-pointer overflow-hidden sm:min-h-[240px]"
              ariaLabel="Open AI workout generator"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 p-6 sm:p-8">
                  <div className="mb-4 flex items-center">
                    <SparklesIcon className="mr-3 h-6 w-6 animate-pulse" aria-hidden />
                    <Badge variant="glass" size="sm" className="font-semibold">
                      AI Powered
                    </Badge>
                  </div>
                  <h3 className="mb-3 text-2xl font-display font-bold sm:text-3xl">Generate AI Workout</h3>
                  <p className="mb-6 text-lg leading-relaxed text-white/90">
                    Get a personalized workout tailored to your goals and preferences
                  </p>
                  <Button variant="glass" size="lg" icon={<SparklesIcon />} className="transition-transform duration-300 group-hover:scale-105" fullWidth>
                    Create Workout
                  </Button>
                </div>
                <div className="hidden pr-8 lg:block">
                  <SparklesIcon className="h-24 w-24 text-white/20 transition-colors duration-300 animate-float group-hover:text-white/30" aria-hidden />
                </div>
              </div>
            </GradientCard>

            <InteractiveCard className="min-h-[200px] border-2 border-dashed border-neutral-300 transition-all duration-300 hover:border-primary-400 sm:min-h-[240px]">
              <div className="flex h-full flex-col justify-center py-6 text-center sm:py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 sm:h-16 sm:w-16">
                  <PlusIcon className="h-7 w-7 text-primary-600 sm:h-8 sm:w-8" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900 sm:text-xl">Quick Start</h3>
                <p className="mb-4 text-sm text-neutral-600 sm:mb-6 sm:text-base">Jump into a pre‑made workout</p>
                <Link to="/app/workout" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" icon={<PlayIcon />} fullWidth className="sm:w-auto">
                    Browse Workouts
                  </Button>
                </Link>
              </div>
            </InteractiveCard>
          </div>
        </motion.div>

        {/* Timeframe Stats */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Your Progress</h2>
            <div className="flex space-x-2">
              {(['week', 'month', 'year'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={selectedTimeframe === tf ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf)}
                  className="capitalize"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fitnessStats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.1 * index }}
              >
                <StatsCard className="group h-full" ariaLabel={`${stat.name} ${stat.value}`}>
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${stat.bgColor} transition-transform duration-200 group-hover:scale-110`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden />
                      </div>
                      {stat.trend && stat.trendUp !== undefined && (
                        <Badge variant={stat.trendUp ? 'success' : 'error'} size="xs" className="font-semibold">
                          {stat.trend}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-600">{stat.name}</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                        {stat.subtitle && <p className="text-sm text-neutral-500">{stat.subtitle}</p>}
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
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center justify-between">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recentAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.name}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.1 * index }}
              >
                <AchievementCard>
                  <div className="p-6 text-center">
                    <AchievementBadge level={achievement.type as any} size="lg">
                      <TrophyIcon className="h-6 w-6" aria-hidden />
                    </AchievementBadge>
                    <h3 className="mb-2 font-bold text-neutral-900">{achievement.name}</h3>
                    <p className="text-sm text-neutral-500">{achievement.date}</p>
                  </div>
                </AchievementCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.6 }}
        >
          <Card hover>
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
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
                  {(workoutHistory as WorkoutRecord[])
                    .slice(0, 3)
                    .map((workout, index) => (
                      <motion.div
                        key={workout.id ?? index}
                        initial={{ opacity: 0, x: reduceMotion ? 0 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, delay: index * 0.1 }}
                        className="group flex cursor-pointer items-center justify-between rounded-2xl bg-neutral-50 p-5 transition-all duration-200 hover:bg-neutral-100"
                        onClick={() => workout.id && navigate(`/app/history/${workout.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            workout.id && navigate(`/app/history/${workout.id}`);
                          }
                        }}
                        aria-label={`Open workout ${workout.workoutPlan?.name || 'Workout Session'} from ${formatDay(
                          workout.startTime
                        )}`}
                      >
                        <div className="flex flex-1 items-center">
                          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 transition-transform duration-200 group-hover:scale-110">
                            <PlayIcon className="h-6 w-6 text-primary-600" aria-hidden />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-1 font-semibold text-neutral-900">
                              {workout.workoutPlan?.name || 'Workout Session'}
                            </h4>
                            <div className="flex items-center space-x-3">
                              <p className="text-sm text-neutral-600">{formatDay(workout.startTime)}</p>
                              <Badge variant={workout.status === 'completed' ? 'success' : 'warning'} size="sm">
                                {workout.status ?? 'unknown'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {typeof workout.rating === 'number' && (
                          <div className="flex items-center space-x-1" aria-label={`Rating ${workout.rating} of 5`}>
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${i < (workout.rating || 0) ? 'text-warning-400' : 'text-neutral-300'}`}
                                aria-hidden
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
                <div className="py-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-100">
                    <ClockIcon className="h-10 w-10 text-neutral-400" aria-hidden />
                  </div>
                  <h4 className="mb-3 text-xl font-semibold text-neutral-900">No workouts yet</h4>
                  <p className="mx-auto mb-6 max-w-md text-neutral-600">
                    Start your fitness journey by generating your first AI‑powered workout!
                  </p>
                  <StartWorkoutButton onClick={() => setShowWorkoutModal(true)} size="lg">
                    <SparklesIcon className="mr-2 h-5 w-5" aria-hidden />
                    Generate Your First Workout
                  </StartWorkoutButton>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </PageContainer>

      {/* Workout Generation Modal */}
      <WorkoutGenerationModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} userProfile={profile} />
    </>
  );
};