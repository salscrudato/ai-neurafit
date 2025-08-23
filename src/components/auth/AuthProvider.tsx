import React, { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';
import { logger } from '../../utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Convert Firebase user to our User type
const toUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Fetch onboarding completion status
const fetchOnboardingCompleted = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'userProfiles', userId));
    if (!userDoc.exists()) {
      console.log('📄 AuthProvider: User profile not found, onboarding needed');
      return false;
    }
    
    const data = userDoc.data();
    const completed = data?.onboardingStatus === 'completed';
    console.log('📊 AuthProvider: Onboarding status', { userId, completed, status: data?.onboardingStatus });
    return completed;
  } catch (error) {
    console.error('❌ AuthProvider: Error fetching onboarding status', error);
    logger.auth.error('Failed to fetch onboarding status', error as Error);
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading, setOnboardingCompleted } = useAuthStore();
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('🚀 AuthProvider: Initializing auth');

      // Set up auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔔 AuthProvider: Auth state changed', {
          hasUser: !!firebaseUser,
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
        });

        if (!isMounted) {
          console.log('❌ AuthProvider: Component unmounted, skipping auth state change');
          return;
        }

        if (firebaseUser) {
          console.log('👤 AuthProvider: Processing authenticated user');
          
          try {
            // Convert to our User type
            const user = toUser(firebaseUser);
            setUser(user);
            console.log('✅ AuthProvider: User set in store', { uid: user.id, email: user.email });

            // Fetch onboarding status
            const completed = await fetchOnboardingCompleted(firebaseUser.uid);
            if (!isMounted) return;
            
            setOnboardingCompleted(completed);
            console.log('📊 AuthProvider: Onboarding status set', { completed });
            
            logger.auth.login(firebaseUser.uid);
          } catch (error) {
            console.error('❌ AuthProvider: Error processing user', error);
            logger.auth.error('Error processing authenticated user', error as Error);
          }
        } else {
          console.log('🚪 AuthProvider: No user, clearing auth state');
          setUser(null);
          setOnboardingCompleted(false);
        }

        // Mark as initialized and clear loading
        if (!isInitialized.current) {
          console.log('🏁 AuthProvider: Auth initialized');
          setLoading(false);
          isInitialized.current = true;
        }
      });

      unsubscribeRef.current = unsubscribe;
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('🧹 AuthProvider: Cleaning up');
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setUser, setLoading, setOnboardingCompleted]);

  return <>{children}</>;
};
