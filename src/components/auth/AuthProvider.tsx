import React, { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { AuthService } from '../../services/authService';
import type { User } from '../../types';
import { logger } from '../../utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

async function fetchOnboardingCompleted(uid: string): Promise<boolean> {
  try {
    const ref = doc(db, 'userProfiles', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const data = snap.data() as any;
    // Prefer explicit flag; fallback to heuristic if missing
    if (data?.onboarding?.status) {
      return data.onboarding.status === 'complete';
    }
    // Heuristic: presence of required profile fields
    const hasCore =
      typeof data?.fitnessLevel === 'string' &&
      Array.isArray(data?.timeCommitment?.preferredTimes) &&
      typeof data?.timeCommitment?.daysPerWeek === 'number' &&
      typeof data?.timeCommitment?.minutesPerSession === 'number';
    return !!hasCore;
  } catch (err) {
    logger.auth.warn('Failed to read onboarding status', { err });
    return false;
  }
}

function toUser(firebaseUser: any): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    createdAt: new Date(firebaseUser.metadata.creationTime!),
    updatedAt: new Date(firebaseUser.metadata.lastSignInTime!),
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading, setOnboardingCompleted } = useAuthStore();
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const visibilityRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isInitialized.current) return;
    let isMounted = true;

    const attachVisibilityRefresh = () => {
      const handler = async () => {
        if (document.visibilityState === 'visible' && auth.currentUser) {
          try {
            // Refresh token to keep app check/custom claims fresh
            await auth.currentUser.getIdToken(true);
          } catch (e) {
            logger.auth.warn('Token refresh on visibility failed', e as Error);
          }
        }
      };
      document.addEventListener('visibilitychange', handler);
      visibilityRef.current = () => document.removeEventListener('visibilitychange', handler);
    };

    const initFromUser = async (firebaseUser: any | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        const user = toUser(firebaseUser);
        setUser(user);

        // Parallelize onboarding fetch; do not block auth state
        const completed = await fetchOnboardingCompleted(firebaseUser.uid);
        if (!isMounted) return;
        setOnboardingCompleted(completed);
      } else {
        setUser(null);
        setOnboardingCompleted(false);
      }

      if (!isInitialized.current) {
        setLoading(false);
        isInitialized.current = true;
      }
    };

    const initializeAuth = async () => {
      try {
        // 1) Handle OAuth redirect result first (Google, etc.)
        const redirectUser = await AuthService.handleRedirectResult().catch((e: any) => {
          logger.auth.error('handleRedirectResult failed', e as Error);
          return null;
        });

        if (!isMounted) return;

        if (redirectUser) {
          logger.auth.login(redirectUser.id);
          setUser(redirectUser);
          const completed = await fetchOnboardingCompleted(redirectUser.id);
          if (!isMounted) return;
          setOnboardingCompleted(completed);
          setLoading(false);
          isInitialized.current = true;
        }

        // 2) Subscribe to auth state changes (covers initial state & future)
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          // Important: this callback may fire twice in StrictMode dev
          void initFromUser(firebaseUser);
        });
        unsubscribeRef.current = unsubscribe;

        // 3) Visibility token refresh
        attachVisibilityRefresh();

        // 4) If there is a currentUser immediately (already signed in), initialize now
        if (auth.currentUser && !isInitialized.current) {
          await initFromUser(auth.currentUser);
        }

        // If neither redirect nor currentUser set loading yet, ensure we drop it
        if (!isInitialized.current) {
          setLoading(false);
          isInitialized.current = true;
        }
      } catch (error) {
        logger.auth.error('Auth initialization failed', error as Error);
        if (!isInitialized.current) {
          setLoading(false);
          isInitialized.current = true;
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      visibilityRef.current?.();
      visibilityRef.current = null;
    };
  }, [setLoading, setOnboardingCompleted, setUser]);

  return <>{children}</>;
};