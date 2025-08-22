import React, { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { AuthService } from '../../services/authService';
import type { User } from '../../types';
import { logger } from '../../utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if already initialized (handles StrictMode double mounting)
    if (isInitialized.current) {
      return;
    }

    let isMounted = true;

    const initializeAuth = async () => {
      // Check if user is already signed in
      const currentUser = auth.currentUser;
      if (currentUser) {

        const user: User = {
          id: currentUser.uid,
          email: currentUser.email!,
          displayName: currentUser.displayName || undefined,
          photoURL: currentUser.photoURL || undefined,
          createdAt: new Date(currentUser.metadata.creationTime!),
          updatedAt: new Date(currentUser.metadata.lastSignInTime!),
        };

        setUser(user);
        setLoading(false);
        isInitialized.current = true;

        // Still set up listener for future changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;

          if (firebaseUser) {
            const updatedUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date(firebaseUser.metadata.creationTime!),
              updatedAt: new Date(firebaseUser.metadata.lastSignInTime!),
            };
            setUser(updatedUser);
          } else {
            setUser(null);
          }
        });

        unsubscribeRef.current = unsubscribe;
        return unsubscribe;
      }

      try {
        // Handle any redirect result
        const redirectUser = await AuthService.handleRedirectResult();

        if (redirectUser && isMounted) {
          logger.auth.login(redirectUser.id);
          setUser(redirectUser);
          setLoading(false);
          isInitialized.current = true;
          return;
        }
      } catch (error) {
        logger.auth.error('Error handling redirect result', error as Error);
      }

      // Set up the auth state listener
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) {
          return;
        }

        if (firebaseUser) {

          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(firebaseUser.metadata.creationTime!),
            updatedAt: new Date(firebaseUser.metadata.lastSignInTime!),
          };
          setUser(user);
        } else {
          setUser(null);
        }

        // Only set loading to false after we've processed the auth state
        if (!isInitialized.current) {
          setLoading(false);
          isInitialized.current = true;
        }
      });

      unsubscribeRef.current = unsubscribe;
      return unsubscribe;
    };

    initializeAuth().catch((error) => {
      logger.auth.error('Auth initialization failed', error as Error);
    });

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  return <>{children}</>;
};
