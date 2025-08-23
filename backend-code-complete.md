# AI NeuraFit - Complete Backend Code

This document contains all backend code for the AI NeuraFit application.

## Project Structure

```
functions/
├── package.json                   # Backend dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── src/                           # Backend source code
│   ├── index.ts                   # Functions entry point and exports
│   ├── shared.ts                  # Shared Firebase Admin setup
│   ├── auth.ts                    # Authentication lifecycle triggers
│   ├── workouts.ts                # AI workout generation functions
│   ├── exercises.ts               # Exercise database functions
│   └── userProfile.ts             # User profile management functions
└── lib/                           # Compiled JavaScript (auto-generated)
```

## Firebase Configuration

```
firebase.json                      # Firebase project configuration
firestore.rules                    # Firestore security rules
firestore.indexes.json             # Firestore database indexes
```

## `functions/src/index.ts`

**Description:** Main entry point for Firebase Functions with global configuration

```typescript
/**
 * Firebase Functions — Bootstrap & Exports
 * - Safe, idempotent Admin init
 * - Global runtime options (v2)
 * - Firestore defaults (ignoreUndefinedProperties)
 * - Minimal health check endpoint
 */

import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import { db, admin } from './shared';

// Helpful environment flags
const IS_EMULATOR = !!process.env.FUNCTIONS_EMULATOR || !!process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'unknown';

// ------------------------
// Global runtime options (v2)
// Adjust as needed per project/profile
// ------------------------
setGlobalOptions({
  region: 'us-central1',            // Single region for simplicity
  memory: '512MiB',                 // Common sweet spot; bump for heavy tasks
  cpu: 1,                           // Keep cold start/light cost
  timeoutSeconds: 60,               // Default safety net; override per function if needed
  maxInstances: 100,                // Prevent runaway scale for cost control
  minInstances: 0,                  // Scale-to-zero by default
});

// ------------------------
// Health check (for uptime/liveness probes)
// GET only; CORS enabled for simplicity
// ------------------------
export const health = onRequest(
  { cors: true },
  (req, res) => {
    if (req.method !== 'GET') {
      res.set('Allow', 'GET').status(405).send('Method Not Allowed');
      return;
    }
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      status: 'ok',
      projectId: PROJECT_ID,
      emulator: IS_EMULATOR,
      time: new Date().toISOString(),
    });
  },
);

// ------------------------
// Re-exports (feature modules)
// Keep these lean; functions defined in these files
// will inherit the global options above unless overridden.
// ------------------------
export * from './auth';
export * from './workouts';
export * from './exercises';
export * from './userProfile';
```

---

## `functions/src/shared.ts`

**Description:** Shared Firebase Admin initialization and configuration

```typescript
/**
 * Shared Firebase Admin initialization
 * - Single source of truth for Firebase Admin setup
 * - Prevents circular dependencies
 * - Ensures consistent configuration across all modules
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export shared instances
export const db = admin.firestore();
export const storage = admin.storage();

// Configure Firestore settings once
db.settings({ ignoreUndefinedProperties: true });

// Export admin for modules that need it
export { admin };

```

---

## `functions/src/auth.ts`

**Description:** Authentication lifecycle triggers for user creation and deletion

```typescript
/**
 * Auth lifecycle triggers (1st‑gen)
 * - Bootstrap user documents on create
 * - Cleanup Firestore & Storage on delete (chunked, safe)
 *
 * NOTE: As of now, Firebase Functions v2 does NOT support these auth triggers.
 * Keep these as v1 triggers; v1 & v2 can coexist in the same codebase. 
 * Ref: https://firebase.google.com/docs/functions/auth-events
 */

import * as functions from 'firebase-functions';
import { db, admin } from './shared';

/* ------------------------------ Utilities ------------------------------ */

/** Delete all docs matching a simple equality query in batches (<=500 ops). */
async function deleteByQuery(
  collection: string,
  field: string,
  value: string,
  { batchSize = 300 }: { batchSize?: number } = {},
): Promise<number> {
  let total = 0;

  // Loop until no matching docs remain; no cursor required since we delete as we go.
  // This limits memory use and avoids exceeding batch constraints.
  // Re-queries incur read costs but are predictable and robust.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await db
      .collection(collection)
      .where(field, '==', value)
      .limit(batchSize)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();

    total += snap.size;

    // Yield back to the event loop to keep the container responsive.
    await new Promise((r) => setImmediate(r));
  }

  return total;
}

/** Best-effort delete of Storage files under a given prefix (capped). */
async function deleteStoragePrefix(prefix: string, cap = 1000): Promise<number> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix }); // beware: list may be large
  const slice = files.slice(0, cap);

  await Promise.all(
    slice.map((f) =>
      f.delete().catch((err) =>
        functions.logger.warn('Storage delete failed', { file: f.name, err }),
      ),
    ),
  );

  return slice.length;
}

/* ---------------------------- Auth: onCreate ---------------------------- */

export const onAuthUserCreate = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .auth.user()
  .onCreate(async (user) => {
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Public/user doc (kept lean; avoid storing sensitive data)
    const userDoc = {
      id: user.uid,
      email: user.email ?? null,
      emailVerified: user.emailVerified ?? false,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      disabled: user.disabled ?? false,
      signInProvider: user.providerData?.[0]?.providerId ?? 'unknown',
      role: 'user' as const,
      createdAt: now,
      updatedAt: now,
    };

    // Profile doc seeded with sensible defaults (kept separate from auth)
    const profileDoc = {
      id: user.uid,
      metrics: {
        heightCm: null as number | null,
        weightKg: null as number | null,
        restingHr: null as number | null,
      },
      preferences: {
        units: 'metric' as 'metric' | 'imperial',
        workoutGoal: null as string | null,
        notifications: { email: true, push: true },
      },
      onboarding: { status: 'pending' as 'pending' | 'complete', stepsCompleted: [] as string[] },
      createdAt: now,
      updatedAt: now,
    };

    try {
      const batch = db.batch();
      batch.set(db.collection('users').doc(user.uid), userDoc, { merge: true });
      batch.set(db.collection('userProfiles').doc(user.uid), profileDoc, { merge: true });
      await batch.commit();

      functions.logger.info('User bootstrap complete', {
        uid: user.uid,
        provider: userDoc.signInProvider,
      });
    } catch (err) {
      // Do not throw; avoid retry storms (client flows can self-heal)
      functions.logger.error('Error bootstrapping user', { uid: user.uid, err });
    }
  });

/* ---------------------------- Auth: onDelete ---------------------------- */

export const onAuthUserDelete = functions
  .region('us-central1')
  .runWith({ memory: '512MB', timeoutSeconds: 300 }) // headroom for large accounts
  .auth.user()
  .onDelete(async (user) => {
    const uid = user.uid;
    const counts: Record<string, number> = {};

    try {
      // Delete anchor docs first (idempotent).
      const batch = db.batch();
      batch.delete(db.collection('users').doc(uid));
      batch.delete(db.collection('userProfiles').doc(uid));
      await batch.commit();

      // Delete related collections by userId.
      // If these collections are large, consider offloading to a task queue.
      for (const col of ['workoutPlans', 'workoutSessions', 'progressMetrics']) {
        counts[col] = await deleteByQuery(col, 'userId', uid, { batchSize: 300 });
      }

      // Optional: clean up Storage under a conventional prefix.
      counts.storageFiles = await deleteStoragePrefix(`users/${uid}/`);

      functions.logger.info('User data deleted', { uid, counts });
    } catch (err) {
      // Intentionally swallow to prevent repeat partial deletes on retry
      functions.logger.error('Error deleting user data', { uid, err });
    }
  });

/**
 * Caveat: Bulk deletes with Admin SDK (deleteUsers([...])) do NOT emit onDelete events.
 * If you perform bulk deletions, delete users one-by-one or use the official
 * "Delete User Data" extension / an admin-only cleanup job to ensure parity. 
 * Ref in docs. 
 */
```

---

## `functions/src/workouts.ts`

**Description:** AI-powered workout generation using OpenAI GPT

```typescript
/**
 * Workouts API (AI-generated)
 * - Callable v2 with App Check
 * - Zod validation for inputs/outputs
 * - Uses canonical user profile from Firestore
 * - OpenAI JSON mode with strict schema validation
 * - Idempotency (optional)
 * - Simple per-user rate limiting
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import OpenAI from 'openai';
import { z } from 'zod';
import { createHash } from 'crypto';
import { db, admin } from './shared';

/* -----------------------------------------------------------------------------
 * OpenAI client (lazy)
 * ---------------------------------------------------------------------------*/
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new HttpsError(
      'failed-precondition',
      'Server misconfiguration: OPENAI_API_KEY is not set.',
    );
  }
  return new OpenAI({ apiKey: key });
}

/* -----------------------------------------------------------------------------
 * Schemas
 * ---------------------------------------------------------------------------*/
const Difficulty = z.enum(['beginner', 'intermediate', 'advanced']);
const Intensity = z.enum(['low', 'moderate', 'high']);

const Str = z.string().trim();
const StrId = Str.min(1).max(128);
const StrTiny = Str.min(1).max(64);
const StrShort = Str.min(1).max(160);
const StrLong = Str.min(1).max(2000);
const StrList = z.array(StrTiny).max(30);

const ExerciseSchema = z.object({
  name: StrTiny,
  description: StrLong,
  instructions: z.array(StrShort).min(1).max(12),
  targetMuscles: z.array(StrTiny).min(1).max(10),
  equipment: z.array(StrTiny).min(0).max(10),
  difficulty: Difficulty,
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(50).optional().nullable(),
  duration: z.number().int().min(5).max(3600).optional().nullable(), // seconds
  restTime: z.number().int().min(0).max(600),
  tips: z.array(StrShort).min(0).max(10),
  progressionNotes: StrLong.optional(),
  alternatives: z.array(StrTiny).max(8).optional(),
  formCues: z.array(StrShort).max(10).optional(),
});

const WorkoutPlanSchema = z.object({
  name: StrTiny,
  description: StrLong,
  type: StrTiny,
  difficulty: Difficulty,
  estimatedDuration: z.number().int().min(10).max(180), // minutes
  exercises: z.array(ExerciseSchema).min(1).max(40),
  equipment: z.array(StrTiny).max(20),
  targetMuscles: z.array(StrTiny).max(20),
  aiGenerated: z.boolean().optional(), // injected server-side
  personalizedFor: z.any().optional(), // injected (object)
  warmUp: z.array(ExerciseSchema).max(10).optional(),
  coolDown: z.array(ExerciseSchema).max(10).optional(),
  progressionTips: z.array(StrShort).max(10).optional(),
  motivationalQuote: StrShort.optional(),
  calorieEstimate: z.number().int().min(50).max(1500).optional(),
});

const PreferredTime = z.enum(['morning', 'afternoon', 'evening', 'variable']);

const ProfileShape = z.object({
  fitnessLevel: Difficulty,
  fitnessGoals: StrList.default([]),
  availableEquipment: StrList.default([]),
  timeCommitment: z.object({
    daysPerWeek: z.number().int().min(1).max(7),
    minutesPerSession: z.number().int().min(10).max(180),
    preferredTimes: z.array(PreferredTime).nonempty().max(4),
  }),
  preferences: z.object({
    workoutTypes: StrList.default([]),
    intensity: Intensity,
    restDayPreference: z.number().int().min(0).max(6),
    injuriesOrLimitations: StrList.default([]),
  }),
  // Optional system enrichments from userProfile.ts
  system: z
    .object({
      weeklyMinutes: z.number().int().min(10).max(1260),
      intensityScore: z.number().int().min(1).max(3),
      trainingLoadIndex: z.number().int().min(10).max(10000),
      profileDigest: z.string().length(64),
    })
    .partial()
    .optional(),
});

const WorkoutGenerationRequestSchema = z
  .object({
    workoutType: StrTiny,
    progressionLevel: z.number().int().min(1).max(10).optional(),
    focusAreas: z.array(StrTiny).max(8).optional(),
    previousWorkouts: z.array(StrId).max(20).optional(),
    // Optional profile overrides (rare; we prefer canonical Firestore profile)
    fitnessLevel: Difficulty.optional(),
    fitnessGoals: StrList.optional(),
    availableEquipment: StrList.optional(),
    timeCommitment: ProfileShape.shape.timeCommitment.optional(),
    preferences: ProfileShape.shape.preferences.optional(),
    idempotencyKey: z.string().trim().min(8).max(64).optional(),
  })
  .strict();

const AdaptiveRequestSchema = z
  .object({
    previousWorkoutId: StrId,
    performanceRating: z.number().min(1).max(5),
    completionRate: z.number().min(0).max(1),
    difficultyFeedback: z.enum(['too_easy', 'just_right', 'too_hard']),
    timeActual: z.number().int().min(5).max(600),
  })
  .strict();

/* -----------------------------------------------------------------------------
 * Utilities
 * ---------------------------------------------------------------------------*/
function requireAuth<T>(ctx: { auth?: { uid?: string } }): string {
  const uid = ctx.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  return uid;
}

async function readCanonicalProfile(uid: string): Promise<z.infer<typeof ProfileShape>> {
  const snap = await db.collection('userProfiles').doc(uid).get();
  if (!snap.exists) {
    throw new HttpsError('failed-precondition', 'Profile not found. Complete onboarding.');
  }
  // Be tolerant: validate with Zod; throw if shape is incompatible
  return ProfileShape.parse(snap.data());
}

function sanitizeList(list?: string[]) {
  return Array.from(new Set((list || []).map((s) => s.trim()).filter(Boolean)));
}

function pickAllowedEquipment(
  planEquipment: string[],
  allowedEquipment: string[],
): string[] {
  const allowed = new Set(allowedEquipment.map((e) => e.toLowerCase()));
  const safe = planEquipment.filter((e) => allowed.has(e.toLowerCase()) || e.toLowerCase() === 'bodyweight');
  // Always include plan-level union; client UI can decorate per-exercise
  return Array.from(new Set(safe.length ? safe : ['bodyweight']));
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function extractJson(text: string): string {
  // Handles responses wrapped in fences or prose
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(trimmed);
  if (fence && fence[1]) return fence[1];
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return trimmed.slice(first, last + 1);
  throw new Error('No JSON object found in model output.');
}

/** Simple per-user throttling: at most 1 call / 15s and 10 calls / hr for a function key. */
async function enforceRateLimit(uid: string, key: string) {
  const ref = db.collection('_rateLimits').doc(`${uid}:${key}`);
  await db.runTransaction(async (tx) => {
    const now = admin.firestore.Timestamp.now();
    const hourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 3600_000);
    const fifteenAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 15_000);

    const snap = await tx.get(ref);
    const data = snap.exists
      ? (snap.data() as { lastCallAt?: admin.firestore.Timestamp; windowStart?: admin.firestore.Timestamp; count?: number })
      : {};

    // Short-circuit: 1 call / 15s
    if (data.lastCallAt && data.lastCallAt.toMillis() > fifteenAgo.toMillis()) {
      throw new HttpsError('resource-exhausted', 'Please wait a few seconds before trying again.');
    }

    // Hourly window
    let windowStart = data.windowStart ?? now;
    let count = data.count ?? 0;
    if (windowStart.toMillis() < hourAgo.toMillis()) {
      windowStart = now;
      count = 0;
    }
    if (count >= 10) {
      throw new HttpsError('resource-exhausted', 'Hourly generation limit reached. Try later.');
    }

    tx.set(
      ref,
      { lastCallAt: now, windowStart, count: count + 1, key },
      { merge: true },
    );
  });
}

/* -----------------------------------------------------------------------------
 * Model calls
 * ---------------------------------------------------------------------------*/
async function callModelJSON(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  const openai = getOpenAI();
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 2400,
      response_format: { type: 'json_object' as const }, // JSON mode
    });
    const content = completion.choices?.[0]?.message?.content;
    const usage = completion.usage ?? undefined;
    if (!content) throw new Error('Empty model response.');
    return { content, usage };
  } catch (err: any) {
    // Fallback: retry without response_format if model doesn't support it
    const msg = `${err?.message || err}`;
    const unsupported = /response_format/i.test(msg);
    if (unsupported) {
      const completion = await getOpenAI().chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          ...messages,
          {
            role: 'system',
            content:
              'Return ONLY a valid JSON object. Do not include markdown fences or any commentary.',
          },
        ],
        temperature: 0.6,
        max_tokens: 2400,
      });
      const content = completion.choices?.[0]?.message?.content;
      const usage = completion.usage ?? undefined;
      if (!content) throw new Error('Empty model response (fallback).');
      return { content, usage };
    }
    throw err;
  }
}

/* -----------------------------------------------------------------------------
 * Prompt builders
 * ---------------------------------------------------------------------------*/
function buildSystemPrompt(): string {
  return [
    'You are an elite personal trainer and exercise physiologist.',
    'Create highly personalized, progressive workouts that are safe, effective, and motivating.',
    'Requirements:',
    '- Safety first (clear form cues, account for limitations)',
    '- Progressive overload (note how to progress/regress)',
    '- Specificity to goals and equipment only',
    '- Variety without randomness, and respect session time',
    '- Recovery balance and smart rest',
    'Output: STRICT JSON conforming to the provided schema. No comments or markdown.',
  ].join('\n');
}

function buildUserPromptForPlan(input: {
  profile: z.infer<typeof ProfileShape>;
  workoutType: string;
  progressionLevel: number;
  focusAreas: string[];
  historySample: any[];
  progressSample: any[];
  frequentExercises: string[];
}): string {
  const { profile, workoutType, progressionLevel, focusAreas } = input;

  return `
Generate a single-session workout tailored to this user:

PROFILE
- Fitness level: ${profile.fitnessLevel}
- Goals: ${profile.fitnessGoals.join(', ') || '—'}
- Equipment ONLY: ${profile.availableEquipment.join(', ') || 'bodyweight'}
- Time: ${profile.timeCommitment.minutesPerSession} min, ${profile.timeCommitment.daysPerWeek} days/week, preferred: ${profile.timeCommitment.preferredTimes.join(', ')}
- Preferences: types=${profile.preferences.workoutTypes.join(', ') || '—'}, intensity=${profile.preferences.intensity}, rest-day=${profile.preferences.restDayPreference}, limitations=${profile.preferences.injuriesOrLimitations.join(', ') || 'none'}
- System: weeklyMinutes=${profile.system?.weeklyMinutes ?? 'n/a'}, trainingLoadIndex=${profile.system?.trainingLoadIndex ?? 'n/a'}

SESSION
- Type: ${workoutType}
- Focus areas: ${focusAreas.join(', ') || 'general fitness'}
- Target progression level (1..10): ${progressionLevel}

DATA POINTS
- History sample: ${JSON.stringify(input.historySample)}
- Recent progress sample: ${JSON.stringify(input.progressSample)}
- Frequently used exercises to avoid repeating: ${input.frequentExercises.join(', ') || 'none'}

SCHEMA
${WorkoutPlanSchema.toString()}

CONSTRAINTS
- Use only the allowed equipment.
- Fit within the allotted minutes including warm-up and cool-down.
- Provide exercise-level instructions, restTime (sec), and realistic sets/reps or duration.
- Include helpful progression tips and a motivational quote.
`.trim();
}

function buildUserPromptForAdaptive(input: {
  previousWorkout: any;
  performanceRating: number;
  completionRate: number;
  difficultyFeedback: 'too_easy' | 'just_right' | 'too_hard';
  timeActual: number;
  progressionLevel: number;
}) {
  const { previousWorkout } = input;
  return `
Create an ADAPTIVE workout improving on the prior session.

PRIOR SESSION
- Name: ${previousWorkout?.name}
- Type: ${previousWorkout?.type}
- Estimated duration: ${previousWorkout?.estimatedDuration} min

FEEDBACK
- Performance rating: ${input.performanceRating}/5
- Completion rate: ${Math.round(input.completionRate * 100)}%
- Difficulty feedback: ${input.difficultyFeedback}
- Time taken: ${input.timeActual} min

ADAPTATION TARGET
- New progression level: ${input.progressionLevel} (1..10)

Rules:
- Preserve theme/type but adjust intensity, volume, and complexity according to feedback.
- Keep equipment constraints identical to previous.
- Maintain or improve movement quality; emphasize form cues and safety.
- Output STRICT JSON for the same schema used previously.
`.trim();
}

/* -----------------------------------------------------------------------------
 * Domain helpers
 * ---------------------------------------------------------------------------*/
function calculateProgressionLevel(history: any[], fitnessLevel: z.infer<typeof Difficulty>): number {
  if (!history.length) return fitnessLevel === 'beginner' ? 1 : fitnessLevel === 'intermediate' ? 4 : 7;
  const completed = history.filter((w) => (w.rating ?? 0) >= 3).length;
  const avg = history.reduce((s, w) => s + (w.rating ?? 0), 0) / history.length;
  let base = fitnessLevel === 'beginner' ? 1 : fitnessLevel === 'intermediate' ? 4 : 7;
  if (completed >= 5 && avg >= 4) base += 1;
  if (completed >= 10 && avg >= 4.5) base += 1;
  return Math.max(1, Math.min(10, base));
}

function getFrequentExercises(history: any[]): string[] {
  const counts: Record<string, number> = {};
  for (const w of history) {
    for (const id of w.exercises ?? []) counts[id] = (counts[id] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, c]) => c >= 3)
    .map(([id]) => id);
}

/* -----------------------------------------------------------------------------
 * Callable: generateWorkout
 * ---------------------------------------------------------------------------*/
export const generateWorkout = onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 180,
    enforceAppCheck: false, // Disabled for development - enable in production
  },
  async (req) => {
    const uid = requireAuth(req);

    // Basic abuse control
    await enforceRateLimit(uid, 'generateWorkout');

    // Validate request
    const input = WorkoutGenerationRequestSchema.parse(req.data ?? {});
    const profile = await readCanonicalProfile(uid).catch(async (e) => {
      // Fallback to client-provided profile (rare; first-run)
      if (!input.fitnessLevel || !input.timeCommitment || !input.preferences) throw e;
      return ProfileShape.parse({
        fitnessLevel: input.fitnessLevel,
        fitnessGoals: sanitizeList(input.fitnessGoals),
        availableEquipment: sanitizeList(input.availableEquipment),
        timeCommitment: input.timeCommitment,
        preferences: input.preferences,
      });
    });

    // Personalization data from recent sessions & metrics
    const sessionsSnap = await db
      .collection('workoutSessions')
      .where('userId', '==', uid)
      .orderBy('startTime', 'desc')
      .limit(10)
      .get();

    const history = sessionsSnap.docs.map((d) => {
      const x = d.data();
      const duration =
        x.endTime && x.startTime
          ? Math.round((x.endTime.toDate().getTime() - x.startTime.toDate().getTime()) / 60000)
          : null;
      return {
        type: x.workoutPlan?.type,
        completedAt: x.endTime,
        rating: x.rating,
        feedback: x.feedback,
        exercises: (x.completedExercises ?? []).map((e: any) => e.exerciseId),
        duration,
      };
    });

    const metricsSnap = await db
      .collection('progressMetrics')
      .where('userId', '==', uid)
      .orderBy('date', 'desc')
      .limit(5)
      .get();
    const progressSample = metricsSnap.docs.map((d) => d.data());

    // Derive progression level & repetition avoidance set
    const level =
      input.progressionLevel ?? calculateProgressionLevel(history, profile.fitnessLevel);
    const frequent = getFrequentExercises(history);

    // Build messages for JSON output
    const userMsg = buildUserPromptForPlan({
      profile,
      workoutType: input.workoutType,
      progressionLevel: level,
      focusAreas: sanitizeList(input.focusAreas),
      historySample: history.slice(0, 5),
      progressSample: progressSample.slice(0, 3),
      frequentExercises: frequent,
    });

    const { content, usage } = await callModelJSON([
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userMsg },
    ]);

    // Parse & validate JSON
    const json = extractJson(content);
    const parsed = WorkoutPlanSchema.safeParse(JSON.parse(json));
    if (!parsed.success) {
      logger.error('Model JSON failed validation', { issues: parsed.error.issues });
      throw new HttpsError('internal', 'Model returned invalid plan JSON.');
    }
    let plan = parsed.data;

    // Enforce equipment constraint at plan level
    plan.equipment = pickAllowedEquipment(
      plan.equipment ?? [],
      profile.availableEquipment,
    );

    // Server-side enrichments
    const personalizedFor = {
      fitnessLevel: profile.fitnessLevel,
      goals: profile.fitnessGoals,
      equipment: profile.availableEquipment,
      intensityPref: profile.preferences.intensity,
    };
    plan.aiGenerated = true;
    plan.personalizedFor = personalizedFor;

    // Idempotency / dedupe key
    const dedupeKey =
      input.idempotencyKey ??
      digest({
        uid,
        type: plan.type,
        minutes: profile.timeCommitment.minutesPerSession,
        level,
        equip: plan.equipment,
        digest: profile.system?.profileDigest ?? null,
      });

    // Persist
    const doc = {
      ...plan,
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'ai',
      model: OPENAI_MODEL,
      usage: usage ? { ...usage } : undefined,
      profileDigest: profile.system?.profileDigest ?? null,
      dedupeKey,
      status: 'ready',
    };

    // Create a new doc but allow clients to search by dedupeKey to reuse results
    const ref = await db.collection('workoutPlans').add(doc);

    logger.info('Workout generated', { uid, planId: ref.id, model: OPENAI_MODEL });

    return {
      success: true,
      workoutPlan: { id: ref.id, ...plan },
      dedupeKey,
    };
  },
);

/* -----------------------------------------------------------------------------
 * Callable: generateAdaptiveWorkout
 * ---------------------------------------------------------------------------*/
export const generateAdaptiveWorkout = onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 180,
    enforceAppCheck: false, // Disabled for development - enable in production
  },
  async (req) => {
    const uid = requireAuth(req);
    await enforceRateLimit(uid, 'generateAdaptiveWorkout');

    const input = AdaptiveRequestSchema.parse(req.data ?? {});

    // Fetch previous workout and ensure it belongs to user
    const prevSnap = await db.collection('workoutPlans').doc(input.previousWorkoutId).get();
    if (!prevSnap.exists) throw new HttpsError('not-found', 'Previous workout not found.');
    const prev = prevSnap.data()!;
    if (prev.userId !== uid) throw new HttpsError('permission-denied', 'Not your workout.');

    // Read canonical profile for constraints and signals
    const profile = await readCanonicalProfile(uid);

    // Compute new progression level (base on prior + feedback)
    const currentLevel =
      (profile.system?.trainingLoadIndex ?? 0) > 0
        ? Math.min(10, Math.max(1, Math.round((profile.system!.trainingLoadIndex / 900) + 1)))
        : 5;

    let adjustment = 0;
    if (input.performanceRating >= 4 && input.completionRate >= 0.9) adjustment += 1;
    if (input.performanceRating <= 2 || input.completionRate < 0.7) adjustment -= 1;
    if (input.difficultyFeedback === 'too_easy') adjustment += 1;
    if (input.difficultyFeedback === 'too_hard') adjustment -= 1;
    if (input.timeActual > (prev.estimatedDuration ?? 45) * 1.3) adjustment -= 0;
    if (input.timeActual < (prev.estimatedDuration ?? 45) * 0.8) adjustment += 0.5;

    const nextLevel = Math.max(1, Math.min(10, Math.round(currentLevel + adjustment)));

    const { content, usage } = await callModelJSON([
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: buildUserPromptForAdaptive({
          previousWorkout: prev,
          performanceRating: input.performanceRating,
          completionRate: input.completionRate,
          difficultyFeedback: input.difficultyFeedback,
          timeActual: input.timeActual,
          progressionLevel: nextLevel,
        }),
      },
    ]);

    const json = extractJson(content);
    const parsed = WorkoutPlanSchema.safeParse(JSON.parse(json));
    if (!parsed.success) {
      logger.error('Adaptive model JSON failed validation', { issues: parsed.error.issues });
      throw new HttpsError('internal', 'Model returned invalid plan JSON.');
    }
    let plan = parsed.data;

    // Enforce previous equipment
    const allowedEquip = Array.isArray(prev.equipment) ? prev.equipment : profile.availableEquipment;
    plan.equipment = pickAllowedEquipment(plan.equipment ?? [], allowedEquip);

    plan.aiGenerated = true;
    plan.personalizedFor = {
      adaptedFrom: input.previousWorkoutId,
      reason: input.difficultyFeedback,
      fitnessLevel: profile.fitnessLevel,
    };

    const dedupeKey = digest({
      uid,
      adaptedFrom: input.previousWorkoutId,
      level: nextLevel,
      equip: plan.equipment,
    });

    const ref = await db.collection('workoutPlans').add({
      ...plan,
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'ai-adaptive',
      model: OPENAI_MODEL,
      usage: usage ? { ...usage } : undefined,
      profileDigest: profile.system?.profileDigest ?? null,
      dedupeKey,
      status: 'ready',
      adaptedFrom: input.previousWorkoutId,
    });

    logger.info('Adaptive workout generated', { uid, planId: ref.id, model: OPENAI_MODEL });

    return {
      success: true,
      workoutPlan: { id: ref.id, ...plan },
      adaptations: {
        newProgressionLevel: nextLevel,
        reason: input.difficultyFeedback,
      },
      dedupeKey,
    };
  },
);
```

---

## `functions/src/exercises.ts`

**Description:** Exercise database management and search functionality

```typescript
/**
 * Exercise Catalog API
 * - Callable v2 endpoints with App Check
 * - Zod validation for inputs
 * - Filtered queries + pagination (cursor)
 * - Optional text search via nameKeywords (tokenized)
 * - Admin-only seeding/upsert with slug + normalization
 * - Name resolver to canonicalize AI / user-entered exercise names
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import { db, admin } from './shared';

/* -----------------------------------------------------------------------------
 * Schemas & helpers
 * ---------------------------------------------------------------------------*/
const Difficulty = z.enum(['beginner', 'intermediate', 'advanced']);

const Str = z.string().trim();
const StrTiny = Str.min(1).max(64);
const StrShort = Str.min(1).max(160);
const StrLong = Str.min(1).max(2000);
const StrList = z.array(StrTiny).max(30);

const ExerciseDocSchema = z.object({
  name: StrTiny,
  description: StrLong,
  instructions: z.array(StrShort).min(1).max(12),
  targetMuscles: z.array(StrTiny).min(1).max(10),
  equipment: z.array(StrTiny).max(10).default([]),
  difficulty: Difficulty,
  duration: z.number().int().min(5).max(1800).optional(), // seconds
  reps: z.number().int().min(1).max(100).optional(),
  sets: z.number().int().min(1).max(10).optional(),
  restTime: z.number().int().min(0).max(600).optional(),
  videoUrl: z.string().url().max(300).optional(),
  imageUrl: z.string().url().max(300).optional(),
  tips: z.array(StrShort).max(10).default([]),
  category: StrTiny, // e.g., strength, cardio, core, mobility
  // search/normalization fields:
  slug: StrTiny.optional(),
  nameNormalized: StrTiny.optional(),
  nameKeywords: z.array(StrTiny).max(30).optional(),
  synonyms: z.array(StrTiny).max(10).optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

type ExerciseDoc = z.infer<typeof ExerciseDocSchema>;

const GetExercisesSchema = z
  .object({
    equipment: StrList.optional(),
    targetMuscles: StrList.optional(),
    difficulty: Difficulty.optional(),
    category: StrTiny.optional(),
    search: Str.min(2).max(60).optional(),
    excludeIds: z.array(Str.min(1).max(128)).max(50).optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
    pageToken: z.string().optional(), // opaque cursor
    random: z.boolean().optional(),   // sample client-side after fetch
  })
  .strict();

const ResolveNamesSchema = z
  .object({
    names: z.array(Str.min(2).max(80)).min(1).max(50),
    maxSuggestions: z.number().int().min(1).max(5).optional().default(3),
  })
  .strict();

/** Simple slugifier */
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Normalize words and build keyword tokens for search */
function toKeywords(s: string): string[] {
  const base = s
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const stop = new Set(['the', 'and', 'of', 'with', 'to', 'on', 'for', 'a', 'an']);
  const tokens = base.filter((t) => !stop.has(t));

  // Common synonym expansions (keep small; prefer a catalog table for scale)
  const expansions: Record<string, string[]> = {
    pushup: ['push-ups', 'pushup', 'press-up', 'push ups'],
    squat: ['squat', 'air squat'],
    plank: ['front plank', 'prone plank'],
    glute: ['glutes', 'gluteus'],
    hamstring: ['hamstrings'],
    ab: ['abs', 'core'],
    dumbbell: ['db', 'dumbbells'],
    band: ['resistance band', 'loop band', 'mini band'],
    bodyweight: ['no equipment', 'body weight'],
  };

  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    for (const e of expansions[t] ?? []) expanded.add(e.replace(/\s+/g, '-'));
  }

  // Return de-duped set; also include joined bigrams to aid array-contains-any
  const grams = new Set<string>(expanded);
  for (let i = 0; i < tokens.length - 1; i++) {
    grams.add(`${tokens[i]}-${tokens[i + 1]}`);
  }

  return Array.from(grams).slice(0, 30);
}

/** Decode page token -> { createdAtMillis, id } */
function decodePageToken(token: string): { t: number; id: string } | null {
  try {
    const obj = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (typeof obj?.t === 'number' && typeof obj?.id === 'string') return obj;
    return null;
  } catch {
    return null;
  }
}

/** Encode page token */
function encodePageToken(createdAt: admin.firestore.Timestamp, id: string): string {
  return Buffer.from(
    JSON.stringify({ t: createdAt.toMillis(), id }),
    'utf8',
  ).toString('base64');
}

/** Admin check via custom claims or env allowlist */
function assertAdmin(ctx: { auth?: { token?: any } }) {
  const isAdmin = ctx.auth?.token?.admin === true;
  if (isAdmin) return;
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = (ctx.auth?.token?.email || '').toLowerCase();
  if (email && allow.includes(email)) return;
  throw new HttpsError('permission-denied', 'Admin privileges required.');
}

/* -----------------------------------------------------------------------------
 * getExercises — filtered list with pagination
 * ---------------------------------------------------------------------------*/
export const getExercises = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: false, // Disabled for development - enable in production
  },
  async (req) => {
    // Auth not strictly required to browse the catalog; add if desired.
    // requireAuth(req);

    const input = GetExercisesSchema.parse(req.data ?? {});
    let query: FirebaseFirestore.Query = db.collection('exercises');

    // Filters
    if (input.equipment && input.equipment.length) {
      const eq = input.equipment.slice(0, 10); // array-contains-any cap
      query = query.where('equipment', 'array-contains-any', eq);
    }

    if (input.targetMuscles && input.targetMuscles.length) {
      const tm = input.targetMuscles.slice(0, 10);
      query = query.where('targetMuscles', 'array-contains-any', tm);
    }

    if (input.difficulty) {
      query = query.where('difficulty', '==', input.difficulty);
    }

    if (input.category) {
      query = query.where('category', '==', input.category);
    }

    // Text search via nameKeywords (requires the field on docs)
    if (input.search) {
      const tokens = toKeywords(input.search).slice(0, 10);
      if (tokens.length) {
        query = query.where('nameKeywords', 'array-contains-any', tokens);
      }
    }

    // Ordering & pagination (stable)
    query = query.orderBy('createdAt', 'desc').orderBy(admin.firestore.FieldPath.documentId());

    if (input.pageToken) {
      const decoded = decodePageToken(input.pageToken);
      if (!decoded) throw new HttpsError('invalid-argument', 'Invalid page token.');
      const cursorTs = admin.firestore.Timestamp.fromMillis(decoded.t);
      query = query.startAfter(cursorTs, decoded.id);
    }

    query = query.limit(input.limit);

    try {
      const snap = await query.get();
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) }));

      const last = snap.docs[snap.docs.length - 1];
      const nextPageToken =
        last && (last.get('createdAt') as admin.firestore.Timestamp)
          ? encodePageToken(last.get('createdAt'), last.id)
          : undefined;

      // Optional client-side sampling
      const exercises = input.random && docs.length > 5
        ? docs.sort(() => 0.5 - Math.random()).slice(0, input.limit)
        : docs;

      // Exclude explicit ids if provided
      const filtered =
        input.excludeIds && input.excludeIds.length
          ? exercises.filter((e) => !input.excludeIds!.includes(e.id))
          : exercises;

      return { exercises: filtered, nextPageToken };
    } catch (err) {
      logger.error('getExercises failed', { err });
      throw new HttpsError('internal', 'Failed to fetch exercises');
    }
  },
);

/* -----------------------------------------------------------------------------
 * resolveExerciseNames — map free-text to canonical catalog entries
 * ---------------------------------------------------------------------------*/
export const resolveExerciseNames = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
    enforceAppCheck: false, // Disabled for development - enable in production
  },
  async (req) => {
    const input = ResolveNamesSchema.parse(req.data ?? {});
    try {
      const results: Record<
        string,
        { matches: Array<{ id: string; name: string; slug?: string; score: number }> }
      > = {};

      for (const raw of input.names) {
        const tokens = toKeywords(raw).slice(0, 5);
        if (!tokens.length) {
          results[raw] = { matches: [] };
          continue;
        }
        const snap = await db
          .collection('exercises')
          .where('nameKeywords', 'array-contains-any', tokens)
          .limit(10)
          .get();

        // Simple scoring: token overlap + startsWith boost
        const ranked = snap.docs
          .map((d) => {
            const data = d.data() as any;
            const keywords: string[] = data.nameKeywords ?? [];
            const overlap = tokens.filter((t) => keywords.includes(t)).length;
            const starts = String(data.nameNormalized || data.name || '')
              .toLowerCase()
              .startsWith(raw.toLowerCase().split(/\s+/)[0]);
            const score = overlap + (starts ? 2 : 0);
            return { id: d.id, name: data.name, slug: data.slug, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, input.maxSuggestions);

        results[raw] = { matches: ranked };
      }

      return { results };
    } catch (err) {
      logger.error('resolveExerciseNames failed', { err });
      throw new HttpsError('internal', 'Failed to resolve exercise names');
    }
  },
);

/* -----------------------------------------------------------------------------
 * initializeExercises — admin-only seed/upsert
 * ---------------------------------------------------------------------------*/
export const initializeExercises = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 120,
    enforceAppCheck: false, // Disabled for development - enable in production
  },
  async (req) => {
    if (!req.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    assertAdmin(req);

    // Minimal, curated seed set; expand as needed
    const seed: ExerciseDoc[] = [
      {
        name: 'Push-ups',
        description:
          'Classic upper-body push pattern targeting chest, shoulders, and triceps.',
        instructions: [
          'Start in a high plank with hands slightly wider than shoulders.',
          'Brace your core; keep a straight line from head to heels.',
          'Lower until your chest is just above the floor.',
          'Press back to the start without flaring elbows excessively.',
        ],
        targetMuscles: ['chest', 'shoulders', 'triceps', 'core'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        sets: 3,
        reps: 10,
        restTime: 60,
        tips: ['Keep core engaged', "Don’t let hips sag", 'Elevate hands to regress'],
        category: 'strength',
        synonyms: ['press-up', 'push up', 'pushups'],
      },
      {
        name: 'Squats',
        description:
          'Fundamental lower-body movement engaging quads, glutes, and hamstrings.',
        instructions: [
          'Stand feet shoulder-width; brace core.',
          'Sit hips back and down, knees tracking over toes.',
          'Keep chest tall; depth as mobility allows.',
          'Drive through mid‑foot to stand.',
        ],
        targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        sets: 3,
        reps: 15,
        restTime: 60,
        tips: ['Weight through heels/mid‑foot', 'Knees track over toes', 'Neutral spine'],
        category: 'strength',
        synonyms: ['air squat'],
      },
      {
        name: 'Plank',
        description:
          'Isometric core stabilization drill that also challenges shoulders.',
        instructions: [
          'From push‑up, lower to forearms under shoulders.',
          'Brace core and glutes; maintain straight line.',
          'Hold without breath‑holding.',
        ],
        targetMuscles: ['core', 'shoulders', 'back'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        duration: 30,
        sets: 3,
        restTime: 60,
        tips: ['Avoid hip sag/pike', 'Breathe steadily'],
        category: 'core',
        synonyms: ['front plank', 'prone plank'],
      },
      {
        name: 'Burpees',
        description: 'Full‑body conditioning combining squat, plank, and jump.',
        instructions: [
          'Squat down; hands to floor.',
          'Jump or step feet back to plank.',
          'Optional push‑up.',
          'Return feet to hands; jump vertically with arms overhead.',
        ],
        targetMuscles: ['full body', 'cardiovascular'],
        equipment: ['bodyweight'],
        difficulty: 'intermediate',
        sets: 3,
        reps: 8,
        restTime: 90,
        tips: ['Land softly', 'Step to modify', 'Prioritize form over speed'],
        category: 'cardio',
        synonyms: [],
      },
      {
        name: 'Mountain Climbers',
        description:
          'Dynamic core and cardio movement performed from a plank position.',
        instructions: [
          'Start in a high plank.',
          'Drive one knee toward chest; switch rapidly.',
          'Maintain level hips and neutral spine.',
        ],
        targetMuscles: ['core', 'shoulders', 'legs', 'cardiovascular'],
        equipment: ['bodyweight'],
        difficulty: 'intermediate',
        duration: 30,
        sets: 3,
        restTime: 60,
        tips: ['Keep hips level', 'Build speed gradually'],
        category: 'cardio',
        synonyms: [],
      },
    ];

    try {
      const batch = db.batch();
      const now = admin.firestore.FieldValue.serverTimestamp();

      for (const ex of seed) {
        // Normalize:
        const nameNormalized = ex.name.toLowerCase();
        const slug = slugify(ex.name);
        const nameKeywords = Array.from(
          new Set([
            ...toKeywords(ex.name),
            ...(ex.synonyms ?? []).flatMap(toKeywords),
            ...ex.targetMuscles.flatMap(toKeywords),
          ]),
        ).slice(0, 30);

        const doc: ExerciseDoc = {
          ...ex,
          slug,
          nameNormalized,
          nameKeywords,
          createdAt: now,
          updatedAt: now,
        };

        // Upsert by slug to keep catalog idempotent
        const ref = db.collection('exercises').doc(slug);
        batch.set(ref, doc, { merge: true });
      }

      await batch.commit();
      logger.info('Exercises initialized/upserted', { count: seed.length });

      return {
        success: true,
        message: `Initialized ${seed.length} exercises`,
      };
    } catch (err) {
      logger.error('initializeExercises failed', { err });
      throw new HttpsError('internal', 'Failed to initialize exercises');
    }
  },
);
```

---

## `functions/src/userProfile.ts`

**Description:** User profile creation, retrieval, and updates

```typescript
/**
 * User Profile API (v2 callable)
 * - Validates & normalizes profile input (Zod)
 * - Enforces Auth + App Check
 * - Computes derived fields for AI planning: trainingLoadIndex, weeklyMinutes, intensityScore, profileDigest
 * - Idempotent create/update with transactional timestamps
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import { createHash } from 'crypto';
import { db, admin } from './shared';
import { FieldValue } from 'firebase-admin/firestore';

/* -----------------------------------------------------------------------------
 * Schema & validation
 * ---------------------------------------------------------------------------*/
const PreferredTime = z.enum(['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night', 'variable']);
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
      preferredTimes: z.array(PreferredTime).min(1).max(4),
    }),
    preferences: z.object({
      workoutTypes: stringArray,        // e.g., "strength", "hiit", "mobility"
      intensity: Intensity,
      restDayPreference: z.number().int().min(0).max(6), // 0=Sun .. 6=Sat
      injuriesOrLimitations: stringArray,
    }),
  })
  .strict();

/** Partial schema for PATCH‑style updates. */
const UserProfileUpdateSchema = UserProfileSchema.partial().strict();

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
    enforceAppCheck: false, // Disabled for development - enable in production
    cors: true, // Enable CORS for development
  },
  async (req) => {
    const uid = requireAuth(req);

    // Validate & normalize
    const parsed = UserProfileSchema.parse(req.data ?? {});
    const normalized = normalizeInput(parsed);
    const system = computeDerived(normalized);
    const now = FieldValue.serverTimestamp();

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
    enforceAppCheck: false, // Disabled for development - enable in production
    cors: true, // Enable CORS for development
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
    enforceAppCheck: false, // Disabled for development - enable in production
    cors: true, // Enable CORS for development
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
          updatedAt: FieldValue.serverTimestamp(),
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
```

---

## `functions/package.json`

**Description:** Backend package configuration with dependencies and scripts

```json
{
  "name": "functions",
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run build && firebase emulators:start",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.1.0",
    "firebase-functions": "^5.0.0",
    "openai": "^4.28.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.9.0",
    "eslint-plugin-import": "^2.25.4",
    "typescript": "^5.0.0"
  },
  "private": true
}

```

---

## `functions/tsconfig.json`

**Description:** TypeScript configuration for Firebase Functions

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": false,
    "outDir": "lib",
    "sourceMap": true,
    "strict": false,
    "target": "es2017",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}

```

---

## `firebase.json`

**Description:** Firebase project configuration including emulators and hosting

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin-allow-popups"
          },
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "unsafe-none"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8081
    },
    "hosting": {
      "port": 5002
    },
    "ui": {
      "enabled": true,
      "port": 4002
    },
    "hub": {
      "port": 4402
    },
    "logging": {
      "port": 4502
    }
  }
}

```

---

## `firestore.rules`

**Description:** Firestore security rules for data access control

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own profile
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own workout plans
    match /workoutPlans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can read and write their own workout sessions
    match /workoutSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can read and write their own progress metrics
    match /progressMetrics/{metricId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Everyone can read exercises (they're public)
    match /exercises/{exerciseId} {
      allow read: if true;
      allow write: if false; // Only admins can write exercises (handled by functions)
    }
  }
}

```

---

## `firestore.indexes.json`

**Description:** Firestore database indexes for query optimization

```json
{
  "indexes": [
    {
      "collectionGroup": "workoutPlans",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "workoutSessions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startTime",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}

```

---

