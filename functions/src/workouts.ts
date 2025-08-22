/**
 * Workouts API (AI-generated)
 * - Callable v2 with App Check
 * - Zod validation for inputs/outputs
 * - Uses canonical user profile from Firestore
 * - OpenAI JSON mode with strict schema validation
 * - Idempotency (optional)
 * - Simple per-user rate limiting
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import OpenAI from 'openai';
import { z } from 'zod';
import { createHash } from 'crypto';

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

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
    enforceAppCheck: true,
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
    enforceAppCheck: true,
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