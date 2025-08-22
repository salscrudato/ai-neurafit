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
    enforceAppCheck: true,
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
    enforceAppCheck: true,
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
    enforceAppCheck: true,
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