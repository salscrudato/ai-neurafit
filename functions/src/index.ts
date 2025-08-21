import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from "./auth";
export * from "./workouts";
export * from "./exercises";
export * from "./userProfile";
