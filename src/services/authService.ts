import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logger } from '../utils/logger';
import type { User } from '../types';

export class AuthError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export class AuthService {
  // Convert Firebase user to our User type
  private static mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Convert Firebase errors to our AuthError type
  private static toAuthError(err: any): AuthError {
    const code = err?.code || 'auth/unknown';
    let message = 'An authentication error occurred.';

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked. Please allow popups and try again.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      default:
        message = err?.message || message;
    }

    return new AuthError(code, message);
  }

  // Email sign up
  static async signUp(data: SignUpData): Promise<User> {
    console.log('🔵 AuthService.signUp: Starting email sign-up', { email: data.email });
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update display name
      await updateProfile(cred.user, { displayName: data.displayName });
      
      // Refresh the user to get updated profile
      await cred.user.reload();
      const updatedUser = auth.currentUser!;
      
      console.log('✅ AuthService.signUp: Email sign-up successful', { uid: updatedUser.uid });
      logger.auth.login(updatedUser.uid);
      
      return this.mapFirebaseUser(updatedUser);
    } catch (err: any) {
      console.error('❌ AuthService.signUp: Email sign-up failed', err);
      logger.auth.error('Email sign up failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Email sign in
  static async signIn(email: string, password: string): Promise<User> {
    console.log('🔵 AuthService.signIn: Starting email sign-in', { email });
    
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ AuthService.signIn: Email sign-in successful', { uid: cred.user.uid });
      logger.auth.login(cred.user.uid);
      
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signIn: Email sign-in failed', err);
      logger.auth.error('Email sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Google sign in - simplified popup only
  static async signInWithGoogle(): Promise<User> {
    console.log('🔵 AuthService.signInWithGoogle: Starting Google sign-in');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log('🪟 AuthService.signInWithGoogle: Opening Google popup');
      const cred = await signInWithPopup(auth, provider);
      
      console.log('✅ AuthService.signInWithGoogle: Google sign-in successful', {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName
      });
      
      logger.auth.login(cred.user.uid);
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signInWithGoogle: Google sign-in failed', err);
      logger.auth.error('Google sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Apple sign in - simplified popup only
  static async signInWithApple(): Promise<User> {
    console.log('🍎 AuthService.signInWithApple: Starting Apple sign-in');
    
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    try {
      console.log('🪟 AuthService.signInWithApple: Opening Apple popup');
      const cred = await signInWithPopup(auth, provider);
      
      console.log('✅ AuthService.signInWithApple: Apple sign-in successful', {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName
      });
      
      logger.auth.login(cred.user.uid);
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signInWithApple: Apple sign-in failed', err);
      logger.auth.error('Apple sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    console.log('🚪 AuthService.signOut: Signing out');
    
    try {
      await fbSignOut(auth);
      console.log('✅ AuthService.signOut: Sign out successful');
    } catch (err: any) {
      console.error('❌ AuthService.signOut: Sign out failed', err);
      logger.auth.error('Sign out failed', err as Error);
      throw new AuthError('auth/signout-failed', 'Failed to sign out. Please try again.');
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    console.log('🔄 AuthService.resetPassword: Sending reset email', { email });
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ AuthService.resetPassword: Reset email sent');
    } catch (err: any) {
      console.error('❌ AuthService.resetPassword: Failed to send reset email', err);
      logger.auth.error('Failed to send password reset email', err as Error);
      throw this.toAuthError(err);
    }
  }
}
