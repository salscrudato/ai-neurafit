import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getRecommendedAuthMethod, isPopupBlocked } from '../utils/authUtils';
import type { User, UserProfile } from '../types';

import { logger } from '../utils/logger';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp({ email, password, displayName }: SignUpData): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update the user's display name
      await updateProfile(firebaseUser, { displayName });

      // Don't create user document here - let the Firebase Function handle it
      // This avoids race conditions and conflicts
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(firebaseUser.metadata.creationTime!),
        updatedAt: new Date(firebaseUser.metadata.lastSignInTime!),
      };

      return user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signIn({ email, password }: SignInData): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      logger.auth.login(firebaseUser.uid);
      return this.mapFirebaseUser(firebaseUser);
    } catch (error: any) {
      logger.auth.error('Sign in failed', error as Error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const recommendedMethod = getRecommendedAuthMethod();

      // Use recommended method or try popup first, fallback to redirect if blocked
      let userCredential;

      if (recommendedMethod === 'redirect') {
        await signInWithRedirect(auth, provider);
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Redirecting to Google sign-in...'));
          }, 100);
        });
      }

      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        if (isPopupBlocked(popupError)) {
          // Fallback to redirect
          await signInWithRedirect(auth, provider);
          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Redirecting to Google sign-in...'));
            }, 100);
          });
        }
        throw popupError;
      }

      const firebaseUser = userCredential.user;
      logger.auth.login(firebaseUser.uid);

      // Let the Firebase Function handle user document creation
      // Just return the mapped user data
      return this.mapFirebaseUser(firebaseUser);
    } catch (error: any) {
      logger.auth.error('Google sign in failed', error as Error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);

      if (!result) {
        return null;
      }

      const firebaseUser = result.user;
      logger.auth.login(firebaseUser.uid);

      // Let the Firebase Function handle user document creation
      // Just return the mapped user data
      return this.mapFirebaseUser(firebaseUser);
    } catch (error: any) {
      logger.auth.error('Error processing redirect result', error as Error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      logger.auth.error('Failed to send password reset email', error as Error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  private static mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(firebaseUser.metadata.creationTime!),
      updatedAt: new Date(firebaseUser.metadata.lastSignInTime!),
    };
  }

  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Please allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      default:
        return 'An error occurred during authentication.';
    }
  }
}
