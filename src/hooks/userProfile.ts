// src/hooks/userProfile.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import type { UserProfile } from '../types';
import {
  UserProfileService,
  type CreateUserProfileRequest,
} from '../services/userProfileService';

/** Loading status for the profile lifecycle */
type Status = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseUserProfileResult {
  /** The current profile (or null if not created yet) */
  profile: UserProfile | null;
  /** Loading lifecycle status */
  status: Status;
  /** Last error message, if any */
  error: string | null;
  /** True once we've attempted at least one load */
  isLoaded: boolean;
  /** Manually refetch the profile from the backend */
  refresh: () => Promise<void>;
  /**
   * Optimistically patch the profile in the store (UI-only) without calling the server.
   * Useful for “editing” screens before you persist.
   */
  setLocalProfile: (next: UserProfile | null) => void;
  /** Update and persist a partial profile on the server, then refresh cache */
  updateProfile: (updates: Partial<CreateUserProfileRequest>) => Promise<void>;
}

/**
 * useUserProfile
 * - Autoloads the profile when a user is present and the store has no profile
 * - Provides refresh & update helpers
 * - Guards against overlapping requests
 */
export function useUserProfile(options: { autoload?: boolean } = { autoload: true }): UseUserProfileResult {
  const { autoload } = options;
  const { user, profile, setProfile } = useAuthStore();

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const inflightRef = useRef<Promise<void> | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSet = <K extends 'status' | 'error' | 'profile'>(
    key: K,
    value: K extends 'status' ? Status : K extends 'error' ? string | null : UserProfile | null,
  ) => {
    if (!isMountedRef.current) return;
    if (key === 'status') setStatus(value as Status);
    else if (key === 'error') setError(value as string | null);
    else setProfile(value as UserProfile | null);
  };

  const refresh = useCallback(async () => {
    if (!user) {
      // No signed-in user → clear local state
      safeSet('profile', null);
      safeSet('status', 'loaded');
      safeSet('error', null);
      lastLoadedUserIdRef.current = null;
      return;
    }
    // Prevent duplicate concurrent loads
    if (inflightRef.current) return inflightRef.current;

    setStatus('loading');
    setError(null);

    const p = (async () => {
      try {
        const data = await UserProfileService.getUserProfile();
        // data may be null (not onboarded or profile not created yet)
        safeSet('profile', data);
        safeSet('status', 'loaded');
        lastLoadedUserIdRef.current = user.id;
      } catch (err: any) {
        const msg = err?.message || 'Failed to load user profile';
        safeSet('error', msg);
        safeSet('status', 'error');
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = p;
    await p;
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<CreateUserProfileRequest>) => {
      setStatus('loading');
      setError(null);
      try {
        await UserProfileService.updateUserProfile(updates);
        // After successful update, refresh to get the authoritative copy
        await refresh();
      } catch (err: any) {
        const msg = err?.message || 'Failed to update profile';
        safeSet('error', msg);
        safeSet('status', 'error');
        throw err;
      }
    },
    [refresh],
  );

  const setLocalProfile = useCallback(
    (next: UserProfile | null) => {
      setProfile(next);
    },
    [setProfile],
  );

  // Auto-load behavior
  useEffect(() => {
    if (!autoload) return;
    if (!user) return;

    // If we changed users, force a refresh
    const userChanged = lastLoadedUserIdRef.current !== user.id;
    const needsLoad = userChanged || profile == null;

    if (needsLoad) {
      void refresh();
    }
  }, [autoload, user, profile, refresh]);

  const isLoaded = useMemo(() => status === 'loaded' || status === 'error', [status]);

  return {
    profile,
    status,
    error,
    isLoaded,
    refresh,
    setLocalProfile,
    updateProfile,
  };
}

/**
 * Fire-and-forget helper to warm the profile cache when you expect navigations.
 * Safe to call from event handlers; no need to await it.
 */
export function prefetchUserProfile() {
  // A tiny wrapper so callers don't need to import the service directly.
  void UserProfileService.getUserProfile().catch(() => {
    /* ignore (prefetch) */
  });
}