import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

interface Exercise {
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  duration?: number;
  reps?: number;
  sets?: number;
  restTime?: number;
  videoUrl?: string;
  imageUrl?: string;
  tips: string[];
  category: string;
}

// Get exercises by filters
export const getExercises = functions.https.onCall(async (data: {
  equipment?: string[];
  targetMuscles?: string[];
  difficulty?: string;
  category?: string;
  limit?: number;
}, context) => {
  try {
    let query: admin.firestore.Query = db.collection("exercises");

    // Apply filters
    if (data.equipment && data.equipment.length > 0) {
      query = query.where("equipment", "array-contains-any", data.equipment);
    }

    if (data.targetMuscles && data.targetMuscles.length > 0) {
      query = query.where("targetMuscles", "array-contains-any", data.targetMuscles);
    }

    if (data.difficulty) {
      query = query.where("difficulty", "==", data.difficulty);
    }

    if (data.category) {
      query = query.where("category", "==", data.category);
    }

    // Apply limit
    if (data.limit) {
      query = query.limit(data.limit);
    }

    const snapshot = await query.get();
    const exercises = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { exercises };
  } catch (error) {
    functions.logger.error("Error fetching exercises:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch exercises");
  }
});

// Initialize exercise database (admin function)
export const initializeExercises = functions.https.onCall(async (data, context) => {
  // This should only be called by admins - add proper authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const exercises: Exercise[] = [
      // Bodyweight exercises
      {
        name: "Push-ups",
        description: "Classic upper body exercise targeting chest, shoulders, and triceps",
        instructions: [
          "Start in a plank position with hands slightly wider than shoulders",
          "Lower your body until chest nearly touches the floor",
          "Push back up to starting position",
          "Keep your body in a straight line throughout"
        ],
        targetMuscles: ["chest", "shoulders", "triceps", "core"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        sets: 3,
        reps: 10,
        restTime: 60,
        tips: [
          "Keep your core engaged",
          "Don't let your hips sag",
          "Modify on knees if needed"
        ],
        category: "strength"
      },
      {
        name: "Squats",
        description: "Fundamental lower body exercise for legs and glutes",
        instructions: [
          "Stand with feet shoulder-width apart",
          "Lower your body as if sitting back into a chair",
          "Keep your chest up and knees behind toes",
          "Return to standing position"
        ],
        targetMuscles: ["quadriceps", "glutes", "hamstrings", "calves"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        sets: 3,
        reps: 15,
        restTime: 60,
        tips: [
          "Keep your weight on your heels",
          "Don't let knees cave inward",
          "Go as low as comfortable"
        ],
        category: "strength"
      },
      {
        name: "Plank",
        description: "Core strengthening exercise that also works shoulders and back",
        instructions: [
          "Start in a push-up position",
          "Lower onto your forearms",
          "Keep your body in a straight line",
          "Hold the position"
        ],
        targetMuscles: ["core", "shoulders", "back"],
        equipment: ["bodyweight"],
        difficulty: "beginner",
        duration: 30,
        sets: 3,
        restTime: 60,
        tips: [
          "Don't let your hips sag or pike up",
          "Breathe normally",
          "Start with shorter holds if needed"
        ],
        category: "core"
      },
      {
        name: "Burpees",
        description: "Full-body cardio exercise combining squat, plank, and jump",
        instructions: [
          "Start standing, then squat down",
          "Place hands on floor and jump feet back to plank",
          "Do a push-up (optional)",
          "Jump feet back to squat position",
          "Jump up with arms overhead"
        ],
        targetMuscles: ["full body", "cardiovascular"],
        equipment: ["bodyweight"],
        difficulty: "intermediate",
        sets: 3,
        reps: 8,
        restTime: 90,
        tips: [
          "Land softly on jumps",
          "Modify by stepping instead of jumping",
          "Focus on form over speed"
        ],
        category: "cardio"
      },
      {
        name: "Mountain Climbers",
        description: "Dynamic cardio exercise that targets core and improves agility",
        instructions: [
          "Start in a plank position",
          "Bring one knee toward your chest",
          "Quickly switch legs",
          "Continue alternating at a fast pace"
        ],
        targetMuscles: ["core", "shoulders", "legs", "cardiovascular"],
        equipment: ["bodyweight"],
        difficulty: "intermediate",
        duration: 30,
        sets: 3,
        restTime: 60,
        tips: [
          "Keep hips level",
          "Maintain plank position",
          "Start slow and build speed"
        ],
        category: "cardio"
      }
    ];

    // Add exercises to Firestore
    const batch = db.batch();
    exercises.forEach((exercise) => {
      const docRef = db.collection("exercises").doc();
      batch.set(docRef, {
        ...exercise,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    functions.logger.info(`Initialized ${exercises.length} exercises`);
    
    return { 
      success: true, 
      message: `Successfully initialized ${exercises.length} exercises` 
    };
  } catch (error) {
    functions.logger.error("Error initializing exercises:", error);
    throw new functions.https.HttpsError("internal", "Failed to initialize exercises");
  }
});
