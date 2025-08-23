// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

import { Button } from '../components/ui/Button';
import { GradientCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageContainer } from '../components/ui/Container';
import { WorkoutGenerationModal } from '../components/workout/WorkoutGenerationModal';

import { useAuthStore } from '../store/authStore';
import { UserProfileService } from '../services/userProfileService';

/* --------------------------------- Page --------------------------------- */

export const DashboardPage: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const { user, profile, loading, setProfile, setLoading } = useAuthStore();

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard • NeuraFit';
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
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
    } else if (user && profile) {
      setLoading(false);
    }
  }, [user, profile, setProfile, setLoading]);

  /* --------------------------------- Load --------------------------------- */

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="mb-2 text-lg font-medium text-neutral-900">
              Loading your dashboard
            </h3>
            <p className="text-neutral-600">Getting your fitness data ready…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* --------------------------------- View --------------------------------- */

  return (
    <>
      {/* Development Emulator Warning */}
      {import.meta.env.DEV && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-amber-800 text-center">
              <span className="font-medium">Development Mode:</span> Running with Firebase emulators. Do not use with production credentials.
            </p>
          </div>
        </div>
      )}
      
      <PageContainer>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
          className="mb-12"
        >
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold leading-tight text-transparent bg-gradient-energy bg-clip-text lg:text-5xl mb-4">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Champion'}!
            </h1>
            <p className="text-xl font-light text-neutral-600">Ready to crush your fitness goals today?</p>
          </div>
        </motion.div>

        {/* Generate AI Workout - Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="max-w-2xl mx-auto">
            <GradientCard
              hover
              interactive
              onClick={() => setShowWorkoutModal(true)}
              className="group relative min-h-[280px] cursor-pointer overflow-hidden"
              ariaLabel="Open AI workout generator"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col justify-center text-center p-8 sm:p-12">
                <div className="mb-6 flex justify-center">
                  <motion.div
                    animate={reduceMotion ? {} : { scale: [1, 1.1, 1] }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm"
                  >
                    <SparklesIcon className="h-10 w-10 text-white" aria-hidden />
                  </motion.div>
                </div>
                <div className="mb-4 flex justify-center">
                  <Badge variant="glass" size="md" className="font-semibold">
                    AI Powered
                  </Badge>
                </div>
                <h2 className="mb-4 text-3xl font-display font-bold sm:text-4xl">Generate AI Workout</h2>
                <p className="mb-8 text-lg leading-relaxed text-white/90 max-w-md mx-auto">
                  Get a personalized workout tailored to your goals, preferences, and fitness level
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="glass" 
                    size="xl" 
                    icon={<SparklesIcon />} 
                    className="transition-transform duration-300 group-hover:scale-105 px-8 py-4 text-lg font-semibold"
                  >
                    Create Your Workout
                  </Button>
                </div>
              </div>
              
              {/* Subtle ambient shapes */}
              {!reduceMotion && (
                <div className="absolute inset-0 opacity-20" aria-hidden>
                  <motion.div
                    className="absolute right-8 top-8 h-32 w-32 rounded-full bg-white"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.28, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-white"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  />
                </div>
              )}
            </GradientCard>
          </div>
        </motion.div>
      </PageContainer>

      {/* Workout Generation Modal */}
      <WorkoutGenerationModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} userProfile={profile} />
    </>
  );
};
