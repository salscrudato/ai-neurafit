import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getRecommendedAuthMethod, isPopupBlocked } from '../utils/authUtils';
import type { User, UserProfile } from '../types';
import { logger } from '../utils/logger';

/** Public sentinel text kept for backward compatibility with existing UI checks */
export const GOOGLE_REDIRECTING_MESSAGE = 'Redirecting to Google sign-in...';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}
export interface SignInData {
  email: string;
  password: string;
}

/** Uniform error type with Firebase-like code */
export class AuthError extends Error {
  code?: string;
  constructor(code: string | undefined, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class AuthService {
  /* ------------------------------------------------------------------------ *
   * Public API
   * ------------------------------------------------------------------------ */

  static async signUp({ email, password, displayName }: SignUpData): Promise<User> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      // Cloud Function onAuthCreate will provision Firestore user; we only return mapped user.
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      logger.auth.error('Sign up failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  static async signIn({ email, password }: SignInData): Promise<User> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      logger.auth.login(cred.user.uid);

      // Optionally refresh token on sign-in to keep claims fresh
      await cred.user.getIdToken(true);
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      logger.auth.error('Sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  static async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    // Encourage explicit account selection to reduce wrong-account friction
    provider.setCustomParameters({ prompt: 'select_account' });

    const method = getRecommendedAuthMethod();

    try {
      if (method === 'redirect') {
        await signInWithRedirect(auth, provider);
        // Inform caller that flow continues after redirect
        throw new AuthError('auth/redirecting', GOOGLE_REDIRECTING_MESSAGE);
      }

      // Try popup first
      let cred: UserCredential | undefined;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        // Fallback to redirect if popups are blocked
        if (isPopupBlocked(popupErr)) {
          await signInWithRedirect(auth, provider);
          throw new AuthError('auth/redirecting', GOOGLE_REDIRECTING_MESSAGE);
        }
        // Non-blocking popup error -> normalize and surface
        throw popupErr;
      }

      const user = cred!.user;
      logger.auth.login(user.uid);
      await user.getIdToken(true);
      return this.mapFirebaseUser(user);
    } catch (err: any) {
      // If we already threw redirect sentinel, pass it through
      if (err instanceof AuthError && err.code === 'auth/redirecting') throw err;

      logger.auth.error('Google sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  static async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (!result) return null;

      const user = result.user;
      logger.auth.login(user.uid);
      await user.getIdToken(true);
      return this.mapFirebaseUser(user);
    } catch (err: any) {
      // Common case when email exists with another provider
      if (err?.code === 'auth/account-exists-with-different-credential') {
        throw new AuthError(
          err.code,
          'This email is linked to another sign-in method. Please sign in with that provider and link Google in Profile > Security.',
        );
      }
      logger.auth.error('Error processing redirect result', err as Error);
      throw this.toAuthError(err);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (err: any) {
      logger.auth.error('Sign out failed', err as Error);
      throw new AuthError('auth/signout-failed', 'Failed to sign out. Please try again.');
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      logger.auth.error('Failed to send password reset email', err as Error);
      throw this.toAuthError(err);
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'userProfiles', userId));
      if (!snap.exists()) return null;

      const data = snap.data() as any;
      const toDate = (t: any) => (t?.toDate ? t.toDate() : undefined);

      return {
        ...data,
        createdAt: toDate(data?.createdAt),
        updatedAt: toDate(data?.updatedAt),
      } as UserProfile;
    } catch (err: any) {
      logger.auth.error('Error fetching user profile', err as Error);
      return null;
    }
  }

  /* ------------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------------ */

  private static mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      updatedAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    };
  }

  /** Convert Firebase error into uniform AuthError with friendly message */
  private static toAuthError(err: any): AuthError {
    const code = err?.code || 'auth/unknown';
    const message = this.getErrorMessage(code) || err?.message || 'Authentication failed.';
    return new AuthError(code, message);
  }

  /** Friendly messages mapped from Firebase codes */
  private static getErrorMessage(code: string): string {
    switch (code) {
      // Email/password
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email or password is incorrect.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      // Sign-up
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      // Popup/redirect
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      // Redirect handling
      case 'auth/account-exists-with-different-credential':
        return 'This email is linked to another sign-in method.';
      // Custom sentinel
      case 'auth/redirecting':
        return GOOGLE_REDIRECTING_MESSAGE;
      default:
        return 'An error occurred during authentication.';
    }
  }
}