import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type {
  UserProfile,
  FitnessLevel,
  FitnessGoal,
  Equipment,
  TimeCommitment,
  UserPreferences,
} from '../types';
import { logger } from '../utils/logger';

/** ---- Shared helpers ------------------------------------------------------ */

const CALLABLE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms = CALLABLE_TIMEOUT_MS, label = 'request'): Promise<T> {
  let id: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    id = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(id));
}

function mapFunctionsError(error: any): Error {
  const code = error?.code as string | undefined; // e.g. "functions/invalid-argument"
  const msg = error?.message as string | undefined;

  const nice =
    code === 'functions/invalid-argument' ? 'Invalid data sent to server.'
    : code === 'functions/permission-denied' ? 'You do not have permission to perform this action.'
    : code === 'functions/not-found' ? 'Resource not found.'
    : code === 'functions/deadline-exceeded' ? 'The server took too long to respond.'
    : code === 'functions/resource-exhausted' ? 'Server rate limit exceeded. Please retry shortly.'
    : code === 'functions/unavailable' ? 'Service temporarily unavailable. Check your connection and retry.'
    : msg || 'An unexpected error occurred.';

  return new Error(nice);
}

async function callFn<TReq, TRsp>(name: string, payload: TReq): Promise<TRsp> {
  logger.api.request(name, 'callable');
  const fn = httpsCallable<TReq, TRsp>(functions, name);
  const started = performance.now();

  try {
    const res = await withTimeout(fn(payload), CALLABLE_TIMEOUT_MS, name);
    logger.api.response(name, 200, performance.now() - started);
    return res.data;
  } catch (err: any) {
    logger.api.error(name, err);
    throw mapFunctionsError(err);
  }
}

/** ---- Request/response contracts ----------------------------------------- */

export interface CreateUserProfileRequest {
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
}

export interface GetUserProfileResponse {
  profile: UserProfile | null;
}

/** ---- Service ------------------------------------------------------------- */

export class UserProfileService {
  /**
   * Create (or overwrite) the signed-in user's profile.
   * The server derives the UID from auth context; no need to pass it.
   */
  static async createUserProfile(profileData: CreateUserProfileRequest): Promise<void> {
    const data = await callFn<CreateUserProfileRequest, UserProfileResponse>(
      'createUserProfile',
      profileData
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to create user profile');
    }
  }

  /**
   * Get the signed-in user's profile.
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    // Prefer sending an empty object to avoid TS friction on "no-arg" callables
    const data = await callFn<Record<string, never>, GetUserProfileResponse>('getUserProfile', {});
    return data.profile ?? null;
  }

  /**
   * Partially update the signed-in user's profile.
   */
  static async updateUserProfile(updates: Partial<CreateUserProfileRequest>): Promise<void> {
    const data = await callFn<Partial<CreateUserProfileRequest>, UserProfileResponse>(
      'updateUserProfile',
      updates
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to update user profile');
    }
  }
}