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
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

const PreferredTime = z.enum(['morning', 'afternoon', 'evening', 'variable', 'early_morning']);

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
    const nowMs = Date.now();
    const now = Timestamp.fromMillis(nowMs);
    const hourAgo = Timestamp.fromMillis(nowMs - 3600_000);
    const fifteenAgo = Timestamp.fromMillis(nowMs - 15_000);

    const snap = await tx.get(ref);
    const data = snap.exists
      ? (snap.data() as { lastCallAt?: Timestamp; windowStart?: Timestamp; count?: number })
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

  // Optimized parameters for GPT-4o Mini JSON compliance
  const baseParams = {
    model: OPENAI_MODEL,
    temperature: 0.1, // Lower temperature for more consistent JSON structure
    max_tokens: 3000, // Increased for complex workouts
    top_p: 0.9, // Focused sampling for better structure compliance
    frequency_penalty: 0.1, // Slight penalty to avoid repetition
    presence_penalty: 0.1, // Encourage diverse exercise selection
  };

  try {
    // Primary attempt with JSON mode (GPT-4o Mini supports this)
    const completion = await openai.chat.completions.create({
      ...baseParams,
      messages,
      response_format: { type: 'json_object' as const },
    });

    const content = completion.choices?.[0]?.message?.content;
    const usage = completion.usage ?? undefined;

    if (!content) throw new Error('Empty model response.');
    return { content, usage };

  } catch (err: any) {
    const msg = `${err?.message || err}`;
    logger.warn('JSON mode failed, attempting fallback', { error: msg });

    // Fallback with enhanced JSON instruction
    const enhancedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      ...messages,
      {
        role: 'system' as const,
        content: [
          'CRITICAL: Your response must be ONLY a valid JSON object.',
          'Do NOT include markdown code blocks (```json).',
          'Do NOT include any explanatory text before or after the JSON.',
          'Do NOT wrap the JSON in any container objects.',
          'Start your response with { and end with }.',
          'Validate your JSON structure before responding.',
        ].join(' ')
      },
    ];

    const completion = await openai.chat.completions.create({
      ...baseParams,
      messages: enhancedMessages,
    });

    const content = completion.choices?.[0]?.message?.content;
    const usage = completion.usage ?? undefined;

    if (!content) throw new Error('Empty model response (fallback).');
    return { content, usage };
  }
}

/* -----------------------------------------------------------------------------
 * AI Response Transformation
 * ---------------------------------------------------------------------------*/
function transformAIResponse(data: any): any {
  if (!data || typeof data !== 'object') return data;

  // Transform exercises to match our schema
  if (data.exercises && Array.isArray(data.exercises)) {
    data.exercises = data.exercises.map((exercise: any) => {
      const transformed = { ...exercise };

      // Convert string instructions to array
      if (typeof transformed.instructions === 'string') {
        transformed.instructions = [transformed.instructions];
      }

      // Add missing required fields with defaults
      if (!transformed.description) {
        transformed.description = `${transformed.name} exercise for building strength and muscle.`;
      }

      if (!transformed.difficulty) {
        transformed.difficulty = data.difficulty || 'beginner';
      }

      if (!transformed.tips || !Array.isArray(transformed.tips)) {
        transformed.tips = [
          'Focus on proper form',
          'Control the movement',
          'Breathe consistently'
        ];
      }

      return transformed;
    });
  }

  return data;
}

/* -----------------------------------------------------------------------------
 * Prompt builders
 * ---------------------------------------------------------------------------*/
function buildSystemPrompt(): string {
  return [
    '# ROLE: Elite AI Fitness Coach & Exercise Physiologist',
    'You are a world-class personal trainer with expertise in exercise science, biomechanics, and personalized program design.',
    '',
    '# TASK: Generate Personalized Workout Plan',
    'Create a scientifically-backed, personalized workout that maximizes results while ensuring safety and adherence.',
    '',
    '# CORE PRINCIPLES:',
    '1. SAFETY FIRST: Account for fitness level, limitations, proper form',
    '2. PROGRESSIVE OVERLOAD: Include clear progression/regression paths',
    '3. SPECIFICITY: Match goals, equipment, and time constraints exactly',
    '4. VARIETY: Balanced, engaging exercises without randomness',
    '5. RECOVERY: Appropriate rest periods and muscle group rotation',
    '',
    '# CRITICAL OUTPUT REQUIREMENTS:',
    '⚠️  MANDATORY: Return ONLY valid JSON matching the exact schema provided',
    '⚠️  NO markdown code blocks, NO comments, NO explanatory text',
    '⚠️  NO wrapper objects like {"session": {...}} or {"workout": {...}}',
    '⚠️  Return the workout plan object directly as pure JSON',
    '',
    '# QUALITY STANDARDS:',
    '- Exercise names must be clear and specific (e.g., "Barbell Back Squat" not "Squats")',
    '- Instructions must be concise but complete (20-40 words)',
    '- Target muscles must use anatomical terms (e.g., "quadriceps", "latissimus dorsi")',
    '- Equipment must match available items exactly',
    '- Duration must respect time constraints ±2 minutes',
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

# MANDATORY JSON SCHEMA - FOLLOW EXACTLY:

{
  "name": "string - Descriptive workout title (1-64 chars)",
  "description": "string - Brief overview (1-2000 chars)",
  "type": "string - Must match requested workout type exactly",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedDuration": "number - Total minutes (10-180)",
  "exercises": [
    {
      "name": "string - Specific exercise name (1-64 chars)",
      "description": "string - Exercise overview (1-2000 chars)",
      "instructions": ["string"] - Array of instruction steps (1-12 items, each 1-160 chars)",
      "targetMuscles": ["string"] - Array of muscle names (1-10 items, each 1-64 chars)",
      "equipment": ["string"] - Array of equipment needed (0-10 items, each 1-64 chars)",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "sets": "number - Number of sets (1-10)",
      "reps": "number | null - Reps per set (1-50, null if duration-based)",
      "duration": "number | null - Seconds per set (5-3600, null if rep-based)",
      "restTime": "number - Rest between sets in seconds (0-600)",
      "tips": ["string"] - Array of exercise tips (0-10 items, each 1-160 chars)"
    }
  ],
  "equipment": ["string"] - All equipment used in workout (max 20 items)",
  "targetMuscles": ["string"] - All muscles targeted (max 20 items)",
  "progressionTips": ["string"] - Long-term progression advice (max 10 items, optional)",
  "motivationalQuote": "string - Inspiring fitness quote (1-160 chars, optional)"
}

# EXAMPLE OUTPUT (REFERENCE ONLY):
{
  "name": "Push Day Power Session",
  "description": "Upper body pushing workout focusing on chest, shoulders, and triceps with progressive overload.",
  "type": "push_day",
  "difficulty": "intermediate",
  "estimatedDuration": 45,
  "exercises": [
    {
      "name": "Dumbbell Bench Press",
      "description": "Compound pushing exercise targeting chest, shoulders, and triceps using dumbbells.",
      "instructions": [
        "Lie on bench with dumbbell in each hand at chest level",
        "Press weights up until arms are fully extended",
        "Lower with control back to starting position",
        "Keep core tight and feet planted throughout"
      ],
      "targetMuscles": ["pectoralis major", "anterior deltoid", "triceps brachii"],
      "equipment": ["dumbbells", "bench"],
      "difficulty": "intermediate",
      "sets": 4,
      "reps": 8,
      "duration": null,
      "restTime": 120,
      "tips": [
        "Keep shoulder blades retracted",
        "Use full range of motion"
      ]
    }
  ],
  "equipment": ["barbell", "bench"],
  "targetMuscles": ["pectoralis major", "anterior deltoid", "triceps brachii"],
  "progressionTips": ["Focus on progressive overload", "Track all lifts in a log"],
  "motivationalQuote": "Strength grows in the moments when you think you can't go on but you keep going anyway."
}

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

    // Advanced JSON parsing with multiple fallback strategies
    logger.info('Raw OpenAI response', {
      content: content.substring(0, 300),
      length: content.length,
      model: OPENAI_MODEL
    });

    let workoutData: any;
    try {
      // Strategy 1: Extract JSON from response
      const json = extractJson(content);
      logger.info('Extracted JSON', { json: json.substring(0, 300) });
      workoutData = JSON.parse(json);

      // Strategy 2: Handle common wrapper patterns
      if (workoutData.session && typeof workoutData.session === 'object') {
        logger.info('Unwrapping "session" wrapper');
        workoutData = workoutData.session;
      } else if (workoutData.workout && typeof workoutData.workout === 'object') {
        logger.info('Unwrapping "workout" wrapper');
        workoutData = workoutData.workout;
      } else if (workoutData.plan && typeof workoutData.plan === 'object') {
        logger.info('Unwrapping "plan" wrapper');
        workoutData = workoutData.plan;
      }

    } catch (parseError) {
      logger.error('JSON parsing failed', {
        error: parseError,
        rawContent: content.substring(0, 500)
      });
      throw new HttpsError('internal', 'Failed to parse AI response as JSON.');
    }

    // Strategy 3: Transform AI response to match our schema
    workoutData = transformAIResponse(workoutData);

    // Strategy 4: Validate against schema with detailed error reporting
    const parsed = WorkoutPlanSchema.safeParse(workoutData);
    if (!parsed.success) {
      const missingFields = parsed.error.issues
        .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map(issue => issue.path.join('.'));

      logger.error('Schema validation failed after transformation', {
        issues: parsed.error.issues.slice(0, 5), // Limit to first 5 issues
        receivedKeys: Object.keys(workoutData || {}),
        missingFields,
        sampleData: JSON.stringify(workoutData).substring(0, 500)
      });

      throw new HttpsError('internal',
        `AI response validation failed. Missing fields: ${missingFields.join(', ')}`
      );
    }

    let plan = parsed.data;

    // Final validation: Ensure all required fields are properly populated
    if (!plan.name || plan.name.length < 5) {
      throw new HttpsError('internal', 'Generated workout name is too short or missing.');
    }
    if (!plan.exercises || plan.exercises.length === 0) {
      throw new HttpsError('internal', 'Generated workout has no exercises.');
    }
    if (plan.exercises.some(ex => !ex.name || !ex.instructions)) {
      throw new HttpsError('internal', 'Generated workout has incomplete exercise data.');
    }

    logger.info('Workout validation passed', {
      name: plan.name,
      exerciseCount: plan.exercises.length,
      duration: plan.estimatedDuration,
      difficulty: plan.difficulty
    });

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
      createdAt: FieldValue.serverTimestamp(),
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
      createdAt: FieldValue.serverTimestamp(),
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

/* -----------------------------------------------------------------------------
 * Callable: completeWorkoutSession
 * ---------------------------------------------------------------------------*/
const CompleteWorkoutSessionSchema = z.object({
  sessionId: z.string().min(1).max(128),
  completedExercises: z.array(z.object({
    exerciseId: z.string().min(1).max(128),
    sets: z.array(z.object({
      reps: z.number().int().min(0).max(1000).optional(),
      weight: z.number().min(0).max(10000).optional(),
      duration: z.number().int().min(0).max(7200).optional(),
      restTime: z.number().int().min(0).max(3600).optional(),
      completed: z.boolean(),
    })).max(50),
    skipped: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  })).max(100),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional(),
}).strict();

export const completeWorkoutSession = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: false, // Disabled for development - enable in production
    cors: true, // Enable CORS
  },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.');

    const input = CompleteWorkoutSessionSchema.parse(req.data ?? {});
    logger.info('Completing workout session', {
      uid,
      sessionId: input.sessionId,
      exerciseCount: input.completedExercises.length,
      rating: input.rating
    });

    try {
      // Save the completed workout session to Firestore
      const sessionDoc = {
        userId: uid,
        sessionId: input.sessionId,
        completedExercises: input.completedExercises,
        rating: input.rating,
        feedback: input.feedback,
        completedAt: FieldValue.serverTimestamp(),
      };

      await db.collection('workoutSessions').add(sessionDoc);
      logger.info('Workout session saved', { sessionId: input.sessionId, uid });

      return { success: true };
    } catch (err: any) {
      logger.error('completeWorkoutSession failed', { error: err.message, uid, sessionId: input.sessionId });
      throw new HttpsError('internal', 'Failed to save workout session.');
    }
  }
);