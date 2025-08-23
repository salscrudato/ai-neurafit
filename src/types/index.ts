/**
 * NeuraFit — Shared Domain Types
 * --------------------------------------------------------------------------
 * This file defines the domain model used across pages, services, and store.
 * It is designed to be:
 *  - Backward‑compatible with existing code (same field names/shapes).
 *  - Easy to consume in UI (exported literal arrays for pickers).
 *  - Clear on units (seconds/minutes) and semantics via JSDoc.
 */

/* =============================================================================
 * Utility Aliases (non-breaking, optional)
 * ============================================================================= */

/** Describes an ISO 8601 date-time string (e.g., "2025-01-31T12:00:00.000Z"). */
export type ISODateString = string;
/** Seconds (e.g., restTime, interval durations). Plain number with docs. */
export type Seconds = number;
/** Minutes (e.g., estimatedDuration, session length). Plain number with docs. */
export type Minutes = number;
/** Simple branded ID helpers (optional; still compatible with plain string). */
export type Id<T extends string> = string & { readonly __idBrand?: T };
export type UserId = Id<'User'>;
export type WorkoutPlanId = Id<'WorkoutPlan'>;
export type WorkoutSessionId = Id<'WorkoutSession'>;
export type ExerciseId = Id<'Exercise'>;

/* =============================================================================
 * Literals & Unions
 * ============================================================================= */

export const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];

export const FITNESS_GOALS = [
  'lose_weight',
  'build_muscle',
  'improve_cardio',
  'improve_flexibility',
  'general_fitness',
  'sport_specific',
] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const EQUIPMENT_TYPES = [
  'bodyweight',
  'dumbbells',
  'barbell',
  'kettlebells',
  'resistance_bands',
  'pull_up_bar',
  'yoga_mat',
  'cardio_machine',
  'gym_access',
] as const;
export type Equipment = (typeof EQUIPMENT_TYPES)[number];

export const WORKOUT_TYPES = [
  'push_day',
  'pull_day',
  'legs',
  'upper_body',
  'full_body',
  'cardio',
  'hiit',
  'strength_training',
  'core_abs',
  'custom',
  // Legacy types for backward compatibility
  'yoga',
  'pilates',
  'stretching',
  'functional',
  'circuit',
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

/** Common 3‑step intensity that matches onboarding & generator UI. */
export type Intensity = 'low' | 'moderate' | 'high';

/** Canonical status values for workout sessions. */
export type WorkoutStatus = 'in_progress' | 'completed' | 'paused' | 'cancelled';

/** Optional hint for time‑of‑day selections (UI may still use raw strings). */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/* =============================================================================
 * Users & Profiles
 * ============================================================================= */

/** Authenticated user (client projection of Firebase user). */
export interface User {
  id: string /* or UserId */;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scheduling/availability for plan generation.
 * @example { daysPerWeek: 4, minutesPerSession: 45, preferredTimes: ['morning', 'evening'] }
 */
export interface TimeCommitment {
  daysPerWeek: number;           // 1..7
  minutesPerSession: Minutes;    // typical 10..180
  preferredTimes: string[];      // free-form or use TimeOfDay[]
}

/** User preferences that influence generation/adaptation. */
export interface UserPreferences {
  workoutTypes: WorkoutType[];
  intensity: Intensity;
  /** 0=Sunday .. 6=Saturday (or use any convention your UI enforces) */
  restDayPreference: number;
  /** Free‑form list. Keep short, like "left knee", "lower back". */
  injuriesOrLimitations: string[];
}

/** User profile stored in Firestore and used for AI generation. */
export interface UserProfile {
  userId: string /* or UserId */;
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/* =============================================================================
 * Exercises & Workouts
 * ============================================================================= */

/**
 * Exercise catalogue entry.
 * - `duration`/`reps`/`sets` are default suggestions; a plan can override per workout.
 */
export interface Exercise {
  id: string /* or ExerciseId */;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];           // keep string[] for compatibility; derive unions later if needed
  equipment: Equipment[];
  difficulty: FitnessLevel;

  /** Defaults (may be overridden in a plan) */
  duration?: Seconds;                // e.g., 45 sec
  reps?: number;
  sets?: number;
  restTime?: Seconds;

  videoUrl?: string;
  imageUrl?: string;

  tips: string[];
  progressionNotes?: string;         // How to scale up/down
  alternatives?: string[];           // Names/IDs of alternates if equipment is missing
  formCues?: string[];               // Key coaching cues
}

/**
 * A single prescribed exercise inside a workout.
 * Backward compatible: you can still use `reps?` and/or `duration?` directly.
 * `scheme` is optional but helpful to signal intent in UIs.
 */
export interface WorkoutExercise {
  exerciseId: string /* or ExerciseId */;
  exercise: Exercise;

  /** Number of working sets for this exercise (not including warmup sets). */
  sets: number;

  /** Choose one or both, depending on the protocol (kept optional for compatibility). */
  reps?: number;         // repetition‑based scheme
  duration?: Seconds;    // time‑based scheme (e.g., EMOM, AMRAP, intervals)

  /** Planned intra‑set rest. */
  restTime: Seconds;

  /** Optional load (kg/lb); leave undefined for BW or variable progression. */
  weight?: number;

  notes?: string;
  /** Stable ordering within the workout. 0‑based or 1‑based (UI decides). */
  order: number;

  /**
   * Optional discriminator: when set, helps UIs pick correct controls.
   * - "reps": rep‑count focus
   * - "time": time‑under‑tension or interval focus
   * - "hybrid": both reps and time supplied
   */
  scheme?: 'reps' | 'time' | 'hybrid';
}

/** Full workout definition produced by AI or authored manually. */
export interface WorkoutPlan {
  id: string /* or WorkoutPlanId */;
  userId: string /* or UserId */;

  name: string;
  description: string;
  type: WorkoutType;
  difficulty: FitnessLevel;

  /** Estimated total time to complete (minutes). */
  estimatedDuration: Minutes;

  /** Main block of the workout in execution order. */
  exercises: WorkoutExercise[];

  /** Equipment needed to complete this workout. */
  equipment: Equipment[];

  /** Broad tags for filtering/search (kept string[] for compatibility). */
  targetMuscles: string[];

  createdAt: Date;

  /** Meta */
  aiGenerated: boolean;
  /** Snapshot summary of the user context used for personalization (free‑form). */
  personalizedFor: string;

  /** Optional structured warm‑up/cool‑down blocks. */
  warmUp?: WorkoutExercise[];
  coolDown?: WorkoutExercise[];

  /** Coaching & adherence helpers */
  progressionTips?: string[];
  motivationalQuote?: string;
  calorieEstimate?: number;

  /** Provenance for adaptive flows */
  adaptedFrom?: string;       // workout ID this was adapted from
  adaptationReason?: string;  // explanation for user
}

/* =============================================================================
 * Sessions & Tracking
 * ============================================================================= */

/** A set completed within an exercise during a session. */
export interface CompletedSet {
  reps?: number;
  weight?: number;
  duration?: Seconds;
  restTime?: Seconds;
  completed: boolean;
}

/** Per‑exercise completion info for a session. */
export interface CompletedExercise {
  exerciseId: string /* or ExerciseId */;
  sets: CompletedSet[];
  notes?: string;
  skipped: boolean;
  completedAt: Date;
}

/** A concrete instance of a user performing a workout plan. */
export interface WorkoutSession {
  id: string /* or WorkoutSessionId */;
  userId: string /* or UserId */;
  workoutPlanId: string /* or WorkoutPlanId */;
  workoutPlan: WorkoutPlan;

  startTime: Date;
  endTime?: Date;

  completedExercises: CompletedExercise[];
  status: WorkoutStatus;

  /** Optional post‑session reflection */
  notes?: string;
  rating?: number;     // 1–5
  feedback?: string;   // free‑form
}

/** Body metrics (unit system decided by UI; document in labels). */
export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  neck?: number;
}

/** Lightweight progress log for trends & analytics. */
export interface ProgressMetrics {
  userId: string /* or UserId */;
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: BodyMeasurements;
  photos?: string[];  // URLs or storage paths
  notes?: string;
}

/* =============================================================================
 * AI Generation & Adaptation
 * ============================================================================= */

/** Request payload to generate a workout for a specific user context. */
export interface WorkoutGenerationRequest {
  userId?: string /* or UserId */; // Optional - backend gets from auth context

  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;

  workoutType: WorkoutType;

  /** Optional context of previous workouts (IDs) for continuity. */
  previousWorkouts?: string[];

  /** Active preferences for this generation (combines baseline + overrides). */
  preferences: UserPreferences;

  /** 1–10 coarser control for progression; higher → harder. */
  progressionLevel?: number;

  /** Optional focus tags (e.g., 'upper', 'core', 'mobility'). */
  focusAreas?: string[];
}

/** Raw AI response used by the app to construct a plan record. */
export interface AIWorkoutResponse {
  /** The generated plan (without server‑side identity fields). */
  workoutPlan: Omit<WorkoutPlan, 'id' | 'userId' | 'createdAt'>;

  /** Human‑readable rationale (great for tooltips or “Why this?” modals). */
  reasoning: string;

  /** What was adapted vs baseline template. */
  adaptations: string[];

  /** Suggestions to progress this workout over time. */
  progressionSuggestions: string[];
}

/** Inputs captured after a session to adapt the next one. */
export interface AdaptiveWorkoutRequest {
  previousWorkoutId: string;
  /** Session feedback metrics */
  performanceRating: number;     // 1–5
  completionRate: number;        // 0..1
  difficultyFeedback: 'too_easy' | 'just_right' | 'too_hard';
  timeActual: Minutes;           // actual minutes
  specificFeedback?: string;
}

/** Adaptive generation response. */
export interface AdaptiveWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
  adaptations: {
    /** New internal progression level chosen by the engine. */
    newProgressionLevel: number;
    /** Scalar intensity adjustment (e.g., 0.9, 1.1). */
    intensityAdjustment: number;
    /** Focus set for the next workout. */
    focusAreas: string[];
    /** Human‑readable reason to surface in UI. */
    reason: string;
  };
}

/* =============================================================================
 * Analytics
 * ============================================================================= */

/** Minimal performance analytics snapshot per workout (for trends). */
export interface WorkoutPerformance {
  workoutId: string /* or WorkoutPlanId */;
  userId: string /* or UserId */;
  startTime: Date;
  endTime: Date;

  completedExercises: number;
  totalExercises: number;
  averageRestTime: Seconds;

  /** Self‑reported metrics */
  perceivedExertion: number;   // RPE 1–10
  enjoymentRating: number;     // 1–5
  difficultyRating: number;    // 1–5

  notes?: string;
}

/* =============================================================================
 * Optional DTO helpers (useful for services)
 * ============================================================================= */

/**
 * Input shape for creating/updating a profile via cloud functions.
 * Mirrors `UserProfile` but omits server-managed fields.
 * Use in `UserProfileService` to avoid re-declaring string literal unions.
 */
export interface UserProfileInput {
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
}