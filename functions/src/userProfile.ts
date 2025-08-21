import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface UserProfileData {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  fitnessGoals: string[];
  availableEquipment: string[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: string[];
  };
  preferences: {
    workoutTypes: string[];
    intensity: "low" | "moderate" | "high";
    restDayPreference: number;
    injuriesOrLimitations: string[];
  };
}

// Create or update user profile
export const createUserProfile = functions.https.onCall(async (data: UserProfileData, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = context.auth.uid;

  try {
    const profileData = {
      userId,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("userProfiles").doc(userId).set(profileData);

    functions.logger.info(`User profile created/updated for ${userId}`);
    
    return { success: true, message: "Profile created successfully" };
  } catch (error) {
    functions.logger.error("Error creating user profile:", error);
    throw new functions.https.HttpsError("internal", "Failed to create user profile");
  }
});

// Get user profile
export const getUserProfile = functions.https.onCall(async (data, context) => {
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
      profile: {
        ...profileData,
        createdAt: profileData?.createdAt?.toDate(),
        updatedAt: profileData?.updatedAt?.toDate(),
      }
    };
  } catch (error) {
    functions.logger.error("Error fetching user profile:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch user profile");
  }
});

// Update user profile
export const updateUserProfile = functions.https.onCall(async (data: Partial<UserProfileData>, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = context.auth.uid;

  try {
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("userProfiles").doc(userId).update(updateData);

    functions.logger.info(`User profile updated for ${userId}`);
    
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    functions.logger.error("Error updating user profile:", error);
    throw new functions.https.HttpsError("internal", "Failed to update user profile");
  }
});
