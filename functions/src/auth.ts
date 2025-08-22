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
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  // Idempotent; index.ts also initializes in most setups
  admin.initializeApp();
}

const db = admin.firestore();

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