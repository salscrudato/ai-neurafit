import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type {
  WorkoutGenerationRequest,
  WorkoutPlan,
  WorkoutSession,
  Exercise,
  AdaptiveWorkoutRequest,
  AdaptiveWorkoutResponse,
  WorkoutPerformance
} from '../types';

export interface GenerateWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
}

export interface GetExercisesRequest {
  equipment?: string[];
  targetMuscles?: string[];
  difficulty?: string;
  category?: string;
  limit?: number;
}

export interface GetExercisesResponse {
  exercises: (Exercise & { id: string })[];
}

export class WorkoutService {
  // Generate AI-powered workout
  static async generateWorkout(request: WorkoutGenerationRequest): Promise<WorkoutPlan & { id: string }> {
    try {
      const generateWorkoutFn = httpsCallable<WorkoutGenerationRequest, GenerateWorkoutResponse>(
        functions, 
        'generateWorkout'
      );
      
      const result = await generateWorkoutFn(request);
      
      if (!result.data.success) {
        throw new Error('Failed to generate workout');
      }
      
      return result.data.workoutPlan;
    } catch (error: any) {
      console.error('Error generating workout:', error);
      throw new Error(error.message || 'Failed to generate workout');
    }
  }

  // Get exercises by filters
  static async getExercises(request: GetExercisesRequest = {}): Promise<(Exercise & { id: string })[]> {
    try {
      const getExercisesFn = httpsCallable<GetExercisesRequest, GetExercisesResponse>(
        functions, 
        'getExercises'
      );
      
      const result = await getExercisesFn(request);
      return result.data.exercises;
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      throw new Error(error.message || 'Failed to fetch exercises');
    }
  }

  // Initialize exercise database (admin function)
  static async initializeExercises(): Promise<void> {
    try {
      const initializeExercisesFn = httpsCallable(functions, 'initializeExercises');
      await initializeExercisesFn();
    } catch (error: any) {
      console.error('Error initializing exercises:', error);
      throw new Error(error.message || 'Failed to initialize exercises');
    }
  }

  // Start a workout session
  static async startWorkoutSession(workoutPlanId: string): Promise<WorkoutSession> {
    // This would typically create a new workout session document
    // For now, we'll create a mock session
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      userId: '', // Will be set by the calling component
      workoutPlanId,
      workoutPlan: {} as WorkoutPlan, // Will be populated
      startTime: new Date(),
      completedExercises: [],
      status: 'in_progress',
    };
    
    return session;
  }

  // Complete a workout session
  static async completeWorkoutSession(
    sessionId: string, 
    completedExercises: any[], 
    rating?: number, 
    feedback?: string
  ): Promise<void> {
    // This would update the workout session in Firestore
    // Implementation would go here
    console.log('Completing workout session:', { sessionId, completedExercises, rating, feedback });
  }

  // Get workout history
  static async getWorkoutHistory(_userId: string, _limit: number = 10): Promise<WorkoutSession[]> {
    // This would fetch workout sessions from Firestore
    // For now, return empty array
    return [];
  }

  // Generate adaptive workout based on previous performance
  static async generateAdaptiveWorkout(request: AdaptiveWorkoutRequest): Promise<AdaptiveWorkoutResponse> {
    try {
      const generateAdaptiveWorkoutFn = httpsCallable<AdaptiveWorkoutRequest, AdaptiveWorkoutResponse>(
        functions,
        'generateAdaptiveWorkout'
      );

      const result = await generateAdaptiveWorkoutFn(request);

      if (!result.data.success) {
        throw new Error('Failed to generate adaptive workout');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error generating adaptive workout:', error);
      throw new Error(error.message || 'Failed to generate adaptive workout');
    }
  }

  // Submit workout performance feedback
  static async submitWorkoutPerformance(performance: WorkoutPerformance): Promise<void> {
    try {
      const submitPerformanceFn = httpsCallable<WorkoutPerformance, { success: boolean }>(
        functions,
        'submitWorkoutPerformance'
      );

      const result = await submitPerformanceFn(performance);

      if (!result.data.success) {
        throw new Error('Failed to submit workout performance');
      }
    } catch (error: any) {
      console.error('Error submitting workout performance:', error);
      throw new Error(error.message || 'Failed to submit workout performance');
    }
  }

  // Get personalized workout recommendations
  static async getWorkoutRecommendations(userId: string): Promise<WorkoutPlan[]> {
    try {
      const getRecommendationsFn = httpsCallable<{ userId: string }, { recommendations: WorkoutPlan[] }>(
        functions,
        'getWorkoutRecommendations'
      );

      const result = await getRecommendationsFn({ userId });
      return result.data.recommendations;
    } catch (error: any) {
      console.error('Error getting workout recommendations:', error);
      throw new Error(error.message || 'Failed to get workout recommendations');
    }
  }

  // Analyze workout trends and progress
  static async getWorkoutAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    try {
      const getAnalyticsFn = httpsCallable<{ userId: string; timeframe: string }, any>(
        functions,
        'getWorkoutAnalytics'
      );

      const result = await getAnalyticsFn({ userId, timeframe });
      return result.data;
    } catch (error: any) {
      console.error('Error getting workout analytics:', error);
      throw new Error(error.message || 'Failed to get workout analytics');
    }
  }
}
