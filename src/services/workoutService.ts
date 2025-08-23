import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { logger } from '../utils/logger';
import type {
  WorkoutGenerationRequest,
  WorkoutPlan,
  WorkoutSession,
  Exercise,
  AdaptiveWorkoutRequest,
  AdaptiveWorkoutResponse,
  CompletedExercise,
  FitnessLevel,
  WorkoutType,
  Equipment,
} from '../types';

/** ---- Shared helpers ------------------------------------------------------ */

const CALLABLE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms = CALLABLE_TIMEOUT_MS, label = 'request'): Promise<T> {
  let id: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    id = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(id));
}

function mapFunctionsError(error: any): Error {
  const code = error?.code as string | undefined;
  const msg = error?.message as string | undefined;

  const nice =
    code === 'functions/invalid-argument' ? 'Invalid data sent to server.'
    : code === 'functions/permission-denied' ? 'You do not have permission to perform this action.'
    : code === 'functions/not-found' ? 'Resource not found.'
    : code === 'functions/deadline-exceeded' ? 'The server took too long to respond.'
    : code === 'functions/resource-exhausted' ? 'Server rate limit exceeded. Please retry shortly.'
    : code === 'functions/unavailable' ? 'Service temporarily unavailable. Check your connection and retry.'
    : msg || 'An unexpected error occurred.';

  return new Error(nice);
}

async function callFn<TReq, TRsp>(name: string, payload: TReq): Promise<TRsp> {
  logger.api.request(name, 'callable');
  const fn = httpsCallable<TReq, TRsp>(functions, name);
  const started = performance.now();

  try {
    const res = await withTimeout(fn(payload), CALLABLE_TIMEOUT_MS, name);
    logger.api.response(name, 200, performance.now() - started);
    return res.data;
  } catch (err: any) {
    logger.api.error(name, err);
    throw mapFunctionsError(err);
  }
}

/** ---- Contracts from Functions ------------------------------------------- */

export interface GenerateWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
}

export interface GetExercisesRequest {
  equipment?: Equipment[];
  targetMuscles?: string[];
  difficulty?: FitnessLevel;
  /** Optional category/kind of exercise (maps to your WorkoutType) */
  category?: WorkoutType;
  limit?: number;
  /** Optional free-text query */
  search?: string;
}

export interface GetExercisesResponse {
  exercises: (Exercise & { id: string })[];
}

export interface CompleteWorkoutSessionRequest {
  sessionId: string;
  completedExercises: CompletedExercise[];
  rating?: number;
  feedback?: string;
}

export interface CompleteWorkoutSessionResponse {
  success: boolean;
}

export interface GetWorkoutHistoryRequest {
  userId: string;
  limit?: number;
}

export interface GetWorkoutHistoryResponse {
  sessions: WorkoutSession[];
}

/** ---- Service ------------------------------------------------------------- */

export class WorkoutService {
  /** Generate an AI-powered workout */
  static async generateWorkout(
    request: WorkoutGenerationRequest,
  ): Promise<WorkoutPlan & { id: string }> {
    const data = await callFn<WorkoutGenerationRequest, GenerateWorkoutResponse>(
      'generateWorkout',
      request
    );

    if (!data?.success || !data.workoutPlan) {
      throw new Error('Failed to generate workout');
    }
    logger.workout.generated(request.userId, data.workoutPlan.id);
    return data.workoutPlan;
  }

  /** Get exercises by filters */
  static async getExercises(request: GetExercisesRequest = {}): Promise<(Exercise & { id: string })[]> {
    const data = await callFn<GetExercisesRequest, GetExercisesResponse>('getExercises', request);
    return data.exercises ?? [];
  }

  /** Initialize exercise database (admin) */
  static async initializeExercises(): Promise<void> {
    // Send {} to satisfy callable signature even if no args are used.
    await callFn<Record<string, never>, unknown>('initializeExercises', {});
  }

  /** Start a workout session (local-only construction; persistence handled elsewhere) */
  static async startWorkoutSession(workoutPlanId: string): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      userId: '', // set by caller (e.g., component with auth context)
      workoutPlanId,
      workoutPlan: {} as WorkoutPlan, // populate upstream
      startTime: new Date(),
      completedExercises: [],
      status: 'in_progress',
    };
    return session;
  }

  /** Complete a workout session (persists via function if available) */
  static async completeWorkoutSession(
    sessionId: string,
    completedExercises: CompletedExercise[],
    rating?: number,
    feedback?: string,
  ): Promise<void> {
    try {
      await callFn<CompleteWorkoutSessionRequest, CompleteWorkoutSessionResponse>(
        'completeWorkoutSession',
        { sessionId, completedExercises, rating, feedback }
      );
      logger.workout.completed('current_user', sessionId);
    } catch (err) {
      // If a cloud function isn't deployed yet, keep UX flowing and surface a friendly message upstream.
      logger.workout.error('completeWorkoutSession failed', err as Error);
      throw err instanceof Error ? err : new Error('Failed to save workout session');
    }
  }

  /** Get workout history (server-backed); falls back to [] on error */
  static async getWorkoutHistory(userId: string, limit = 10): Promise<WorkoutSession[]> {
    try {
      const data = await callFn<GetWorkoutHistoryRequest, GetWorkoutHistoryResponse>(
        'getWorkoutHistory',
        { userId, limit }
      );
      return data.sessions ?? [];
    } catch (err) {
      // Keep the existing page functional if the function isn’t available yet
      logger.workout.error('getWorkoutHistory failed', err as Error);
      return [];
    }
  }

  /** Generate adaptive workout based on previous performance */
  static async generateAdaptiveWorkout(
    request: AdaptiveWorkoutRequest
  ): Promise<AdaptiveWorkoutResponse> {
    const data = await callFn<AdaptiveWorkoutRequest, AdaptiveWorkoutResponse>(
      'generateAdaptiveWorkout',
      request
    );

    if (!data?.success) {
      throw new Error('Failed to generate adaptive workout');
    }
    return data;
  }

  /** Analyze workout trends and progress */
  static async getWorkoutAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    const data = await callFn<{ userId: string; timeframe: string }, any>(
      'getWorkoutAnalytics',
      { userId, timeframe }
    );
    return data;
  }
}