/**
 * User Profile API (v2 callable)
 * - Validates & normalizes profile input (Zod)
 * - Enforces Auth + App Check
 * - Computes derived fields for AI planning: trainingLoadIndex, weeklyMinutes, intensityScore, profileDigest
 * - Idempotent create/update with transactional timestamps
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import { createHash } from 'crypto';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

/* -----------------------------------------------------------------------------
 * Schema & validation
 * ---------------------------------------------------------------------------*/
const PreferredTime = z.enum(['morning', 'afternoon', 'evening', 'variable']);
const Intensity = z.enum(['low', 'moderate', 'high']);
const FitnessLevel = z.enum(['beginner', 'intermediate', 'advanced']);

const stringArray = z
  .array(z.string().trim().min(1).max(64))
  .max(30)
  .default([]);

const UserProfileSchema = z
  .object({
    fitnessLevel: FitnessLevel,
    fitnessGoals: stringArray,          // e.g., "fat loss", "muscle gain"
    availableEquipment: stringArray,    // e.g., "dumbbells", "bands"
    timeCommitment: z.object({
      daysPerWeek: z.number().int().min(1).max(7),
      minutesPerSession: z.number().int().min(10).max(180),
      preferredTimes: z.array(PreferredTime).nonempty().max(4),
    }),
    preferences: z.object({
      workoutTypes: stringArray,        // e.g., "strength", "hiit", "mobility"
      intensity: Intensity,
      restDayPreference: z.number().int().min(0).max(6), // 0=Sun .. 6=Sat
      injuriesOrLimitations: stringArray.max(20),
    }),
  })
  .strict();

/** Partial schema for PATCH‑style updates. */
const UserProfileUpdateSchema = UserProfileSchema.deepPartial().strict();

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/
function requireAuth<T>(req: CallableRequest<T>): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  return uid;
}

function dedupeLower(values: string[]): string[] {
  return Array.from(
    new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)),
  );
}

function normalizeInput(input: z.infer<typeof UserProfileSchema>): z.infer<typeof UserProfileSchema> {
  return {
    ...input,
    fitnessGoals: dedupeLower(input.fitnessGoals),
    availableEquipment: dedupeLower(input.availableEquipment),
    timeCommitment: {
      ...input.timeCommitment,
      daysPerWeek: Math.min(7, Math.max(1, input.timeCommitment.daysPerWeek)),
      minutesPerSession: Math.min(180, Math.max(10, input.timeCommitment.minutesPerSession)),
      preferredTimes: Array.from(new Set(input.timeCommitment.preferredTimes)),
    },
    preferences: {
      ...input.preferences,
      workoutTypes: dedupeLower(input.preferences.workoutTypes),
      injuriesOrLimitations: dedupeLower(input.preferences.injuriesOrLimitations),
      restDayPreference: Math.min(6, Math.max(0, input.preferences.restDayPreference)),
    },
  };
}

function intensityToScore(i: z.infer<typeof Intensity>): number {
  return i === 'high' ? 3 : i === 'moderate' ? 2 : 1;
}

/** Derived fields to power AI planning & caching. */
function computeDerived(profile: z.infer<typeof UserProfileSchema>) {
  const weeklyMinutes =
    profile.timeCommitment.daysPerWeek * profile.timeCommitment.minutesPerSession;

  const intensityScore = intensityToScore(profile.preferences.intensity);

  // Simple, interpretable workload proxy
  const trainingLoadIndex = weeklyMinutes * intensityScore;

  // Stable digest to key AI plan caches (order‑independent arrays)
  const digestSource = JSON.stringify({
    ...profile,
    fitnessGoals: [...profile.fitnessGoals].sort(),
    availableEquipment: [...profile.availableEquipment].sort(),
    preferences: {
      ...profile.preferences,
      workoutTypes: [...profile.preferences.workoutTypes].sort(),
      injuriesOrLimitations: [...profile.preferences.injuriesOrLimitations].sort(),
    },
    timeCommitment: {
      ...profile.timeCommitment,
      preferredTimes: [...profile.timeCommitment.preferredTimes].sort(),
    },
  });
  const profileDigest = createHash('sha256').update(digestSource).digest('hex');

  // Coarse completeness heuristic (for onboarding nudges)
  const fieldsConsidered = 1 // level
    + 1 // goals
    + 1 // equipment
    + 3 // timeCommitment fields
    + 4; // preferences fields
  let filled = 0;
  if (profile.fitnessLevel) filled += 1;
  if (profile.fitnessGoals.length) filled += 1;
  if (profile.availableEquipment.length) filled += 1;
  if (profile.timeCommitment.daysPerWeek) filled += 1;
  if (profile.timeCommitment.minutesPerSession) filled += 1;
  if (profile.timeCommitment.preferredTimes.length) filled += 1;
  if (profile.preferences.workoutTypes.length) filled += 1;
  if (profile.preferences.intensity) filled += 1;
  if (Number.isInteger(profile.preferences.restDayPreference)) filled += 1;
  if (profile.preferences.injuriesOrLimitations.length >= 0) filled += 1;
  const profileCompleteness = Math.round((filled / fieldsConsidered) * 100);

  return {
    weeklyMinutes,
    intensityScore,
    trainingLoadIndex,
    profileDigest,
    profileCompleteness, // 0..100
    version: 1,
  };
}

function toResponse(doc: FirebaseFirestore.DocumentSnapshot) {
  if (!doc.exists) return null;
  const data = doc.data()!;
  const createdAt = (data.createdAt as FirebaseFirestore.Timestamp | undefined)?.toDate();
  const updatedAt = (data.updatedAt as FirebaseFirestore.Timestamp | undefined)?.toDate();
  return {
    ...data,
    createdAt: createdAt?.toISOString() ?? null,
    updatedAt: updatedAt?.toISOString() ?? null,
  };
}

/* -----------------------------------------------------------------------------
 * Callable: create (or replace) profile
 * ---------------------------------------------------------------------------*/
export const createUserProfile = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true, // require App Check from client
  },
  async (req) => {
    const uid = requireAuth(req);

    // Validate & normalize
    const parsed = UserProfileSchema.parse(req.data ?? {});
    const normalized = normalizeInput(parsed);
    const system = computeDerived(normalized);
    const now = admin.firestore.FieldValue.serverTimestamp();

    try {
      await db.runTransaction(async (tx) => {
        const ref = db.collection('userProfiles').doc(uid);
        const snap = await tx.get(ref);

        const base = {
          userId: uid,
          ...normalized,
          system,
          updatedAt: now,
        };

        if (snap.exists) {
          // Replace (merge semantics: true to preserve server-only fields)
          tx.set(ref, { ...base }, { merge: true });
        } else {
          tx.set(ref, { ...base, createdAt: now }, { merge: true });
        }
      });

      logger.info('User profile created/updated', {
        uid,
        trainingLoadIndex: system.trainingLoadIndex,
        weeklyMinutes: system.weeklyMinutes,
      });

      return { success: true, message: 'Profile created successfully' };
    } catch (err) {
      logger.error('createUserProfile failed', { uid, err });
      throw new HttpsError('internal', 'Failed to create user profile');
    }
  },
);

/* -----------------------------------------------------------------------------
 * Callable: get profile (self)
 * ---------------------------------------------------------------------------*/
export const getUserProfile = onCall(
  {
    region: 'us-central1',
    memory: '128MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
  },
  async (req) => {
    const uid = requireAuth(req);

    try {
      const snap = await db.collection('userProfiles').doc(uid).get();
      const profile = toResponse(snap); // includes ISO timestamps; null if missing

      return { profile };
    } catch (err) {
      logger.error('getUserProfile failed', { uid, err });
      throw new HttpsError('internal', 'Failed to fetch user profile');
    }
  },
);

/* -----------------------------------------------------------------------------
 * Callable: update (partial, PATCH‑style)
 * ---------------------------------------------------------------------------*/
export const updateUserProfile = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true,
  },
  async (req) => {
    const uid = requireAuth(req);

    // Validate partial payload
    const partial = UserProfileUpdateSchema.parse(req.data ?? {});

    try {
      // Read current for merge + recompute derived fields
      const ref = db.collection('userProfiles').doc(uid);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          throw new HttpsError('not-found', 'Profile not found for this user.');
        }

        const current = snap.data() || {};
        // Rebuild a full object to run through normalizer + derived calculator
        const materialized: z.infer<typeof UserProfileSchema> = {
          fitnessLevel: partial.fitnessLevel ?? current.fitnessLevel,
          fitnessGoals: partial.fitnessGoals ?? current.fitnessGoals ?? [],
          availableEquipment: partial.availableEquipment ?? current.availableEquipment ?? [],
          timeCommitment: {
            daysPerWeek:
              partial.timeCommitment?.daysPerWeek ??
              current.timeCommitment?.daysPerWeek ??
              3,
            minutesPerSession:
              partial.timeCommitment?.minutesPerSession ??
              current.timeCommitment?.minutesPerSession ??
              45,
            preferredTimes:
              partial.timeCommitment?.preferredTimes ??
              current.timeCommitment?.preferredTimes ??
              ['variable'],
          },
          preferences: {
            workoutTypes:
              partial.preferences?.workoutTypes ??
              current.preferences?.workoutTypes ??
              [],
            intensity:
              partial.preferences?.intensity ??
              current.preferences?.intensity ??
              'moderate',
            restDayPreference:
              partial.preferences?.restDayPreference ??
              current.preferences?.restDayPreference ??
              0,
            injuriesOrLimitations:
              partial.preferences?.injuriesOrLimitations ??
              current.preferences?.injuriesOrLimitations ??
              [],
          },
        };

        const normalized = normalizeInput(materialized);
        const system = computeDerived(normalized);
        const update = {
          ...normalized,
          system,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        tx.set(ref, update, { merge: true });
      });

      logger.info('User profile updated', { uid });
      return { success: true, message: 'Profile updated successfully' };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      logger.error('updateUserProfile failed', { uid, err });
      throw new HttpsError('internal', 'Failed to update user profile');
    }
  },
);