import { create } from 'zustand';
import type { User, UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  onboardingCompleted: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
