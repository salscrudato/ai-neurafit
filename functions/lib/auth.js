"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserDelete = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Trigger when a new user is created
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Create user document in Firestore
        const userData = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("users").doc(user.uid).set(userData);
        functions.logger.info(`User document created for ${user.uid}`);
    }
    catch (error) {
        functions.logger.error("Error creating user document:", error);
    }
});
// Trigger when a user is deleted
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
    try {
        // Delete user document and related data
        const batch = db.batch();
        // Delete user document
        batch.delete(db.collection("users").doc(user.uid));
        // Delete user profile
        batch.delete(db.collection("userProfiles").doc(user.uid));
        // Delete user's workout plans
        const workoutPlans = await db.collection("workoutPlans")
            .where("userId", "==", user.uid)
            .get();
        workoutPlans.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // Delete user's workout sessions
        const workoutSessions = await db.collection("workoutSessions")
            .where("userId", "==", user.uid)
            .get();
        workoutSessions.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        // Delete user's progress metrics
        const progressMetrics = await db.collection("progressMetrics")
            .where("userId", "==", user.uid)
            .get();
        progressMetrics.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        functions.logger.info(`User data deleted for ${user.uid}`);
    }
    catch (error) {
        functions.logger.error("Error deleting user data:", error);
    }
});
//# sourceMappingURL=auth.js.map