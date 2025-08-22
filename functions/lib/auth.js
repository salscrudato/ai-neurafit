"use strict";
/**
 * Auth lifecycle triggers (1st‑gen)
 * - Bootstrap user documents on create
 * - Cleanup Firestore & Storage on delete (chunked, safe)
 *
 * NOTE: As of now, Firebase Functions v2 does NOT support these auth triggers.
 * Keep these as v1 triggers; v1 & v2 can coexist in the same codebase.
 * Ref: https://firebase.google.com/docs/functions/auth-events
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAuthUserDelete = exports.onAuthUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const shared_1 = require("./shared");
/* ------------------------------ Utilities ------------------------------ */
/** Delete all docs matching a simple equality query in batches (<=500 ops). */
async function deleteByQuery(collection, field, value, { batchSize = 300 } = {}) {
    let total = 0;
    // Loop until no matching docs remain; no cursor required since we delete as we go.
    // This limits memory use and avoids exceeding batch constraints.
    // Re-queries incur read costs but are predictable and robust.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const snap = await shared_1.db
            .collection(collection)
            .where(field, '==', value)
            .limit(batchSize)
            .get();
        if (snap.empty)
            break;
        const batch = shared_1.db.batch();
        for (const doc of snap.docs)
            batch.delete(doc.ref);
        await batch.commit();
        total += snap.size;
        // Yield back to the event loop to keep the container responsive.
        await new Promise((r) => setImmediate(r));
    }
    return total;
}
/** Best-effort delete of Storage files under a given prefix (capped). */
async function deleteStoragePrefix(prefix, cap = 1000) {
    const bucket = shared_1.admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix }); // beware: list may be large
    const slice = files.slice(0, cap);
    await Promise.all(slice.map((f) => f.delete().catch((err) => functions.logger.warn('Storage delete failed', { file: f.name, err }))));
    return slice.length;
}
/* ---------------------------- Auth: onCreate ---------------------------- */
exports.onAuthUserCreate = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 60 })
    .auth.user()
    .onCreate(async (user) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const now = shared_1.admin.firestore.FieldValue.serverTimestamp();
    // Public/user doc (kept lean; avoid storing sensitive data)
    const userDoc = {
        id: user.uid,
        email: (_a = user.email) !== null && _a !== void 0 ? _a : null,
        emailVerified: (_b = user.emailVerified) !== null && _b !== void 0 ? _b : false,
        displayName: (_c = user.displayName) !== null && _c !== void 0 ? _c : null,
        photoURL: (_d = user.photoURL) !== null && _d !== void 0 ? _d : null,
        disabled: (_e = user.disabled) !== null && _e !== void 0 ? _e : false,
        signInProvider: (_h = (_g = (_f = user.providerData) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.providerId) !== null && _h !== void 0 ? _h : 'unknown',
        role: 'user',
        createdAt: now,
        updatedAt: now,
    };
    // Profile doc seeded with sensible defaults (kept separate from auth)
    const profileDoc = {
        id: user.uid,
        metrics: {
            heightCm: null,
            weightKg: null,
            restingHr: null,
        },
        preferences: {
            units: 'metric',
            workoutGoal: null,
            notifications: { email: true, push: true },
        },
        onboarding: { status: 'pending', stepsCompleted: [] },
        createdAt: now,
        updatedAt: now,
    };
    try {
        const batch = shared_1.db.batch();
        batch.set(shared_1.db.collection('users').doc(user.uid), userDoc, { merge: true });
        batch.set(shared_1.db.collection('userProfiles').doc(user.uid), profileDoc, { merge: true });
        await batch.commit();
        functions.logger.info('User bootstrap complete', {
            uid: user.uid,
            provider: userDoc.signInProvider,
        });
    }
    catch (err) {
        // Do not throw; avoid retry storms (client flows can self-heal)
        functions.logger.error('Error bootstrapping user', { uid: user.uid, err });
    }
});
/* ---------------------------- Auth: onDelete ---------------------------- */
exports.onAuthUserDelete = functions
    .region('us-central1')
    .runWith({ memory: '512MB', timeoutSeconds: 300 }) // headroom for large accounts
    .auth.user()
    .onDelete(async (user) => {
    const uid = user.uid;
    const counts = {};
    try {
        // Delete anchor docs first (idempotent).
        const batch = shared_1.db.batch();
        batch.delete(shared_1.db.collection('users').doc(uid));
        batch.delete(shared_1.db.collection('userProfiles').doc(uid));
        await batch.commit();
        // Delete related collections by userId.
        // If these collections are large, consider offloading to a task queue.
        for (const col of ['workoutPlans', 'workoutSessions', 'progressMetrics']) {
            counts[col] = await deleteByQuery(col, 'userId', uid, { batchSize: 300 });
        }
        // Optional: clean up Storage under a conventional prefix.
        counts.storageFiles = await deleteStoragePrefix(`users/${uid}/`);
        functions.logger.info('User data deleted', { uid, counts });
    }
    catch (err) {
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
//# sourceMappingURL=auth.js.map