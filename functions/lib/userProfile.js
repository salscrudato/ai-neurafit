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
exports.updateUserProfile = exports.getUserProfile = exports.createUserProfile = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Create or update user profile
exports.createUserProfile = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const userId = context.auth.uid;
    try {
        const profileData = Object.assign(Object.assign({ userId }, data), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        await db.collection("userProfiles").doc(userId).set(profileData);
        functions.logger.info(`User profile created/updated for ${userId}`);
        return { success: true, message: "Profile created successfully" };
    }
    catch (error) {
        functions.logger.error("Error creating user profile:", error);
        throw new functions.https.HttpsError("internal", "Failed to create user profile");
    }
});
// Get user profile
exports.getUserProfile = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const userId = context.auth.uid;
    try {
        const profileDoc = await db.collection("userProfiles").doc(userId).get();
        if (!profileDoc.exists) {
            return { profile: null };
        }
        const profileData = profileDoc.data();
        return {
            profile: Object.assign(Object.assign({}, profileData), { createdAt: (_a = profileData === null || profileData === void 0 ? void 0 : profileData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = profileData === null || profileData === void 0 ? void 0 : profileData.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() })
        };
    }
    catch (error) {
        functions.logger.error("Error fetching user profile:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch user profile");
    }
});
// Update user profile
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const userId = context.auth.uid;
    try {
        const updateData = Object.assign(Object.assign({}, data), { updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        await db.collection("userProfiles").doc(userId).update(updateData);
        functions.logger.info(`User profile updated for ${userId}`);
        return { success: true, message: "Profile updated successfully" };
    }
    catch (error) {
        functions.logger.error("Error updating user profile:", error);
        throw new functions.https.HttpsError("internal", "Failed to update user profile");
    }
});
//# sourceMappingURL=userProfile.js.map