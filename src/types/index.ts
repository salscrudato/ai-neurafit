// User Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Fitness Types
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type FitnessGoal = 
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_cardio'
  | 'increase_strength'
  | 'improve_flexibility'
  | 'general_fitness'
  | 'sport_specific';

export type Equipment = 
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebells'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'yoga_mat'
  | 'cardio_machine'
  | 'gym_access';

export interface TimeCommitment {
  daysPerWeek: number;
  minutesPerSession: number;
  preferredTimes: string[];
}

export interface UserPreferences {
  workoutTypes: WorkoutType[];
  intensity: 'low' | 'moderate' | 'high';
  restDayPreference: number;
  injuriesOrLimitations: string[];
}

// Workout Types
export type WorkoutType = 
  | 'strength_training'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'stretching'
  | 'functional'
  | 'circuit';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  equipment: Equipment[];
  difficulty: FitnessLevel;
  duration?: number; // in seconds
  reps?: number;
  sets?: number;
  restTime?: number; // in seconds
  videoUrl?: string;
  imageUrl?: string;
  tips: string[];
  progressionNotes?: string; // How to make this exercise harder/easier
  alternatives?: string[]; // Alternative exercises if equipment unavailable
  formCues?: string[]; // Key form points to focus on
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: WorkoutType;
  difficulty: FitnessLevel;
  estimatedDuration: number; // in minutes
  exercises: WorkoutExercise[];
  equipment: Equipment[];
  targetMuscles: string[];
  createdAt: Date;
  aiGenerated: boolean;
  personalizedFor: string; // user preferences snapshot
  warmUp?: WorkoutExercise[]; // Dedicated warm-up exercises
  coolDown?: WorkoutExercise[]; // Dedicated cool-down exercises
  progressionTips?: string[]; // How to progress this workout over time
  motivationalQuote?: string; // Inspirational message for the workout
  calorieEstimate?: number; // Estimated calories burned
  adaptedFrom?: string; // ID of workout this was adapted from
  adaptationReason?: string; // Why this workout was adapted
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps?: number;
  duration?: number; // in seconds
  restTime: number; // in seconds
  weight?: number;
  notes?: string;
  order: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutPlanId: string;
  workoutPlan: WorkoutPlan;
  startTime: Date;
  endTime?: Date;
  completedExercises: CompletedExercise[];
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  notes?: string;
  rating?: number; // 1-5 stars
  feedback?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  notes?: string;
  skipped: boolean;
  completedAt: Date;
}

export interface CompletedSet {
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
  restTime?: number; // in seconds
  completed: boolean;
}

// Progress Tracking
export interface ProgressMetrics {
  userId: string;
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: BodyMeasurements;
  photos?: string[];
  notes?: string;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  neck?: number;
}

// AI Generation
export interface WorkoutGenerationRequest {
  userId: string;
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  workoutType: WorkoutType;
  previousWorkouts?: string[]; // workout IDs for context
  preferences: UserPreferences;
  progressionLevel?: number; // 1-10 scale for workout progression
  focusAreas?: string[]; // Specific muscle groups or skills to focus on
}

export interface AIWorkoutResponse {
  workoutPlan: Omit<WorkoutPlan, 'id' | 'userId' | 'createdAt'>;
  reasoning: string;
  adaptations: string[];
  progressionSuggestions: string[];
}

// Adaptive Workout Generation
export interface AdaptiveWorkoutRequest {
  previousWorkoutId: string;
  performanceRating: number; // 1-5 scale
  completionRate: number; // 0-1 scale
  difficultyFeedback: 'too_easy' | 'just_right' | 'too_hard';
  timeActual: number; // actual time taken in minutes
  specificFeedback?: string; // Optional detailed feedback
}

export interface AdaptiveWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
  adaptations: {
    newProgressionLevel: number;
    intensityAdjustment: number;
    focusAreas: string[];
    reason: string;
  };
}

// Workout Performance Tracking
export interface WorkoutPerformance {
  workoutId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  completedExercises: number;
  totalExercises: number;
  averageRestTime: number;
  perceivedExertion: number; // 1-10 RPE scale
  enjoymentRating: number; // 1-5 scale
  difficultyRating: number; // 1-5 scale
  notes?: string;
}
