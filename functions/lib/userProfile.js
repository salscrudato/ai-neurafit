"use strict";
/**
 * User Profile API (v2 callable)
 * - Validates & normalizes profile input (Zod)
 * - Enforces Auth + App Check
 * - Computes derived fields for AI planning: trainingLoadIndex, weeklyMinutes, intensityScore, profileDigest
 * - Idempotent create/update with transactional timestamps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.getUserProfile = exports.createUserProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const shared_1 = require("./shared");
/* -----------------------------------------------------------------------------
 * Schema & validation
 * ---------------------------------------------------------------------------*/
const PreferredTime = zod_1.z.enum(['morning', 'afternoon', 'evening', 'variable']);
const Intensity = zod_1.z.enum(['low', 'moderate', 'high']);
const FitnessLevel = zod_1.z.enum(['beginner', 'intermediate', 'advanced']);
const stringArray = zod_1.z
    .array(zod_1.z.string().trim().min(1).max(64))
    .max(30)
    .default([]);
const UserProfileSchema = zod_1.z
    .object({
    fitnessLevel: FitnessLevel,
    fitnessGoals: stringArray, // e.g., "fat loss", "muscle gain"
    availableEquipment: stringArray, // e.g., "dumbbells", "bands"
    timeCommitment: zod_1.z.object({
        daysPerWeek: zod_1.z.number().int().min(1).max(7),
        minutesPerSession: zod_1.z.number().int().min(10).max(180),
        preferredTimes: zod_1.z.array(PreferredTime).min(1).max(4),
    }),
    preferences: zod_1.z.object({
        workoutTypes: stringArray, // e.g., "strength", "hiit", "mobility"
        intensity: Intensity,
        restDayPreference: zod_1.z.number().int().min(0).max(6), // 0=Sun .. 6=Sat
        injuriesOrLimitations: stringArray,
    }),
})
    .strict();
/** Partial schema for PATCH‑style updates. */
const UserProfileUpdateSchema = UserProfileSchema.partial().strict();
/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/
function requireAuth(req) {
    var _a;
    const uid = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated.');
    return uid;
}
function dedupeLower(values) {
    return Array.from(new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)));
}
function normalizeInput(input) {
    return Object.assign(Object.assign({}, input), { fitnessGoals: dedupeLower(input.fitnessGoals), availableEquipment: dedupeLower(input.availableEquipment), timeCommitment: Object.assign(Object.assign({}, input.timeCommitment), { daysPerWeek: Math.min(7, Math.max(1, input.timeCommitment.daysPerWeek)), minutesPerSession: Math.min(180, Math.max(10, input.timeCommitment.minutesPerSession)), preferredTimes: Array.from(new Set(input.timeCommitment.preferredTimes)) }), preferences: Object.assign(Object.assign({}, input.preferences), { workoutTypes: dedupeLower(input.preferences.workoutTypes), injuriesOrLimitations: dedupeLower(input.preferences.injuriesOrLimitations), restDayPreference: Math.min(6, Math.max(0, input.preferences.restDayPreference)) }) });
}
function intensityToScore(i) {
    return i === 'high' ? 3 : i === 'moderate' ? 2 : 1;
}
/** Derived fields to power AI planning & caching. */
function computeDerived(profile) {
    const weeklyMinutes = profile.timeCommitment.daysPerWeek * profile.timeCommitment.minutesPerSession;
    const intensityScore = intensityToScore(profile.preferences.intensity);
    // Simple, interpretable workload proxy
    const trainingLoadIndex = weeklyMinutes * intensityScore;
    // Stable digest to key AI plan caches (order‑independent arrays)
    const digestSource = JSON.stringify(Object.assign(Object.assign({}, profile), { fitnessGoals: [...profile.fitnessGoals].sort(), availableEquipment: [...profile.availableEquipment].sort(), preferences: Object.assign(Object.assign({}, profile.preferences), { workoutTypes: [...profile.preferences.workoutTypes].sort(), injuriesOrLimitations: [...profile.preferences.injuriesOrLimitations].sort() }), timeCommitment: Object.assign(Object.assign({}, profile.timeCommitment), { preferredTimes: [...profile.timeCommitment.preferredTimes].sort() }) }));
    const profileDigest = (0, crypto_1.createHash)('sha256').update(digestSource).digest('hex');
    // Coarse completeness heuristic (for onboarding nudges)
    const fieldsConsidered = 1 // level
        + 1 // goals
        + 1 // equipment
        + 3 // timeCommitment fields
        + 4; // preferences fields
    let filled = 0;
    if (profile.fitnessLevel)
        filled += 1;
    if (profile.fitnessGoals.length)
        filled += 1;
    if (profile.availableEquipment.length)
        filled += 1;
    if (profile.timeCommitment.daysPerWeek)
        filled += 1;
    if (profile.timeCommitment.minutesPerSession)
        filled += 1;
    if (profile.timeCommitment.preferredTimes.length)
        filled += 1;
    if (profile.preferences.workoutTypes.length)
        filled += 1;
    if (profile.preferences.intensity)
        filled += 1;
    if (Number.isInteger(profile.preferences.restDayPreference))
        filled += 1;
    if (profile.preferences.injuriesOrLimitations.length >= 0)
        filled += 1;
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
function toResponse(doc) {
    var _a, _b, _c, _d;
    if (!doc.exists)
        return null;
    const data = doc.data();
    const createdAt = (_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
    const updatedAt = (_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate();
    return Object.assign(Object.assign({}, data), { createdAt: (_c = createdAt === null || createdAt === void 0 ? void 0 : createdAt.toISOString()) !== null && _c !== void 0 ? _c : null, updatedAt: (_d = updatedAt === null || updatedAt === void 0 ? void 0 : updatedAt.toISOString()) !== null && _d !== void 0 ? _d : null });
}
/* -----------------------------------------------------------------------------
 * Callable: create (or replace) profile
 * ---------------------------------------------------------------------------*/
exports.createUserProfile = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true, // require App Check from client
}, async (req) => {
    var _a;
    const uid = requireAuth(req);
    // Validate & normalize
    const parsed = UserProfileSchema.parse((_a = req.data) !== null && _a !== void 0 ? _a : {});
    const normalized = normalizeInput(parsed);
    const system = computeDerived(normalized);
    const now = shared_1.admin.firestore.FieldValue.serverTimestamp();
    try {
        await shared_1.db.runTransaction(async (tx) => {
            const ref = shared_1.db.collection('userProfiles').doc(uid);
            const snap = await tx.get(ref);
            const base = Object.assign(Object.assign({ userId: uid }, normalized), { system, updatedAt: now });
            if (snap.exists) {
                // Replace (merge semantics: true to preserve server-only fields)
                tx.set(ref, Object.assign({}, base), { merge: true });
            }
            else {
                tx.set(ref, Object.assign(Object.assign({}, base), { createdAt: now }), { merge: true });
            }
        });
        firebase_functions_1.logger.info('User profile created/updated', {
            uid,
            trainingLoadIndex: system.trainingLoadIndex,
            weeklyMinutes: system.weeklyMinutes,
        });
        return { success: true, message: 'Profile created successfully' };
    }
    catch (err) {
        firebase_functions_1.logger.error('createUserProfile failed', { uid, err });
        throw new https_1.HttpsError('internal', 'Failed to create user profile');
    }
});
/* -----------------------------------------------------------------------------
 * Callable: get profile (self)
 * ---------------------------------------------------------------------------*/
exports.getUserProfile = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '128MiB',
    timeoutSeconds: 30,
    enforceAppCheck: true,
}, async (req) => {
    const uid = requireAuth(req);
    try {
        const snap = await shared_1.db.collection('userProfiles').doc(uid).get();
        const profile = toResponse(snap); // includes ISO timestamps; null if missing
        return { profile };
    }
    catch (err) {
        firebase_functions_1.logger.error('getUserProfile failed', { uid, err });
        throw new https_1.HttpsError('internal', 'Failed to fetch user profile');
    }
});
/* -----------------------------------------------------------------------------
 * Callable: update (partial, PATCH‑style)
 * ---------------------------------------------------------------------------*/
exports.updateUserProfile = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
    enforceAppCheck: true,
}, async (req) => {
    var _a;
    const uid = requireAuth(req);
    // Validate partial payload
    const partial = UserProfileUpdateSchema.parse((_a = req.data) !== null && _a !== void 0 ? _a : {});
    try {
        // Read current for merge + recompute derived fields
        const ref = shared_1.db.collection('userProfiles').doc(uid);
        await shared_1.db.runTransaction(async (tx) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
            const snap = await tx.get(ref);
            if (!snap.exists) {
                throw new https_1.HttpsError('not-found', 'Profile not found for this user.');
            }
            const current = snap.data() || {};
            // Rebuild a full object to run through normalizer + derived calculator
            const materialized = {
                fitnessLevel: (_a = partial.fitnessLevel) !== null && _a !== void 0 ? _a : current.fitnessLevel,
                fitnessGoals: (_c = (_b = partial.fitnessGoals) !== null && _b !== void 0 ? _b : current.fitnessGoals) !== null && _c !== void 0 ? _c : [],
                availableEquipment: (_e = (_d = partial.availableEquipment) !== null && _d !== void 0 ? _d : current.availableEquipment) !== null && _e !== void 0 ? _e : [],
                timeCommitment: {
                    daysPerWeek: (_j = (_g = (_f = partial.timeCommitment) === null || _f === void 0 ? void 0 : _f.daysPerWeek) !== null && _g !== void 0 ? _g : (_h = current.timeCommitment) === null || _h === void 0 ? void 0 : _h.daysPerWeek) !== null && _j !== void 0 ? _j : 3,
                    minutesPerSession: (_o = (_l = (_k = partial.timeCommitment) === null || _k === void 0 ? void 0 : _k.minutesPerSession) !== null && _l !== void 0 ? _l : (_m = current.timeCommitment) === null || _m === void 0 ? void 0 : _m.minutesPerSession) !== null && _o !== void 0 ? _o : 45,
                    preferredTimes: (_s = (_q = (_p = partial.timeCommitment) === null || _p === void 0 ? void 0 : _p.preferredTimes) !== null && _q !== void 0 ? _q : (_r = current.timeCommitment) === null || _r === void 0 ? void 0 : _r.preferredTimes) !== null && _s !== void 0 ? _s : ['variable'],
                },
                preferences: {
                    workoutTypes: (_w = (_u = (_t = partial.preferences) === null || _t === void 0 ? void 0 : _t.workoutTypes) !== null && _u !== void 0 ? _u : (_v = current.preferences) === null || _v === void 0 ? void 0 : _v.workoutTypes) !== null && _w !== void 0 ? _w : [],
                    intensity: (_0 = (_y = (_x = partial.preferences) === null || _x === void 0 ? void 0 : _x.intensity) !== null && _y !== void 0 ? _y : (_z = current.preferences) === null || _z === void 0 ? void 0 : _z.intensity) !== null && _0 !== void 0 ? _0 : 'moderate',
                    restDayPreference: (_4 = (_2 = (_1 = partial.preferences) === null || _1 === void 0 ? void 0 : _1.restDayPreference) !== null && _2 !== void 0 ? _2 : (_3 = current.preferences) === null || _3 === void 0 ? void 0 : _3.restDayPreference) !== null && _4 !== void 0 ? _4 : 0,
                    injuriesOrLimitations: (_8 = (_6 = (_5 = partial.preferences) === null || _5 === void 0 ? void 0 : _5.injuriesOrLimitations) !== null && _6 !== void 0 ? _6 : (_7 = current.preferences) === null || _7 === void 0 ? void 0 : _7.injuriesOrLimitations) !== null && _8 !== void 0 ? _8 : [],
                },
            };
            const normalized = normalizeInput(materialized);
            const system = computeDerived(normalized);
            const update = Object.assign(Object.assign({}, normalized), { system, updatedAt: shared_1.admin.firestore.FieldValue.serverTimestamp() });
            tx.set(ref, update, { merge: true });
        });
        firebase_functions_1.logger.info('User profile updated', { uid });
        return { success: true, message: 'Profile updated successfully' };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        firebase_functions_1.logger.error('updateUserProfile failed', { uid, err });
        throw new https_1.HttpsError('internal', 'Failed to update user profile');
    }
});
//# sourceMappingURL=userProfile.js.map