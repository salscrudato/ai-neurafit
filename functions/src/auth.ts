import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Trigger when a new user is created
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
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
  } catch (error) {
    functions.logger.error("Error creating user document:", error);
  }
});

// Trigger when a user is deleted
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
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
  } catch (error) {
    functions.logger.error("Error deleting user data:", error);
  }
});
