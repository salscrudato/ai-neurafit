import { create } from 'zustand';
import type { WorkoutPlan, WorkoutSession } from '../types';

interface WorkoutState {
  currentWorkout: WorkoutPlan | null;
  activeSession: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  loading: boolean;
  error: string | null;
  setCurrentWorkout: (workout: WorkoutPlan | null) => void;
  setActiveSession: (session: WorkoutSession | null) => void;
  setWorkoutHistory: (history: WorkoutSession[]) => void;
  addToHistory: (session: WorkoutSession) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWorkout: null,
  activeSession: null,
  workoutHistory: [],
  loading: false,
  error: null,
  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),
  setActiveSession: (session) => set({ activeSession: session }),
  setWorkoutHistory: (history) => set({ workoutHistory: history }),
  addToHistory: (session) => {
    const { workoutHistory } = get();
    set({ workoutHistory: [session, ...workoutHistory] });
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
