import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { UserProfile } from '../types';

export interface CreateUserProfileRequest {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  fitnessGoals: string[];
  availableEquipment: string[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: string[];
  };
  preferences: {
    workoutTypes: string[];
    intensity: "low" | "moderate" | "high";
    restDayPreference: number;
    injuriesOrLimitations: string[];
  };
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
}

export interface GetUserProfileResponse {
  profile: UserProfile | null;
}

export class UserProfileService {
  // Create or update user profile
  static async createUserProfile(profileData: CreateUserProfileRequest): Promise<void> {
    try {
      const createUserProfileFn = httpsCallable<CreateUserProfileRequest, UserProfileResponse>(
        functions, 
        'createUserProfile'
      );
      
      const result = await createUserProfileFn(profileData);
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to create user profile');
      }
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      throw new Error(error.message || 'Failed to create user profile');
    }
  }

  // Get user profile
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const getUserProfileFn = httpsCallable<void, GetUserProfileResponse>(
        functions, 
        'getUserProfile'
      );
      
      const result = await getUserProfileFn();
      return result.data.profile;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<CreateUserProfileRequest>): Promise<void> {
    try {
      const updateUserProfileFn = httpsCallable<Partial<CreateUserProfileRequest>, UserProfileResponse>(
        functions, 
        'updateUserProfile'
      );
      
      const result = await updateUserProfileFn(updates);
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to update user profile');
      }
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(error.message || 'Failed to update user profile');
    }
  }
}
