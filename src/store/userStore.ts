import { create } from 'zustand';
import type { UserProfile } from '../types';

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  loading: false,
  error: null,
  onboardingCompleted: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  clearError: () => set({ error: null }),
}));
