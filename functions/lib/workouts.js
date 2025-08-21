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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkout = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const db = admin.firestore();
// Initialize OpenAI lazily
const getOpenAI = () => {
    return new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
};
// Generate AI-powered workout
exports.generateWorkout = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const userId = context.auth.uid;
    try {
        // Get user's workout history for personalization
        const recentWorkouts = await db.collection("workoutSessions")
            .where("userId", "==", userId)
            .orderBy("startTime", "desc")
            .limit(5)
            .get();
        const workoutHistory = recentWorkouts.docs.map(doc => {
            var _a;
            const data = doc.data();
            return {
                type: (_a = data.workoutPlan) === null || _a === void 0 ? void 0 : _a.type,
                completedAt: data.endTime,
                rating: data.rating,
                feedback: data.feedback,
            };
        });
        // Create AI prompt for workout generation
        const prompt = createWorkoutPrompt(data, workoutHistory);
        // Generate workout using OpenAI
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert personal trainer and fitness coach. Generate personalized workout plans based on user preferences, fitness level, and available equipment. Always prioritize safety and proper form. Return your response as a valid JSON object matching the WorkoutPlan interface."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        const aiResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!aiResponse) {
            throw new Error("No response from AI");
        }
        // Parse AI response
        let workoutPlan;
        try {
            workoutPlan = JSON.parse(aiResponse);
        }
        catch (parseError) {
            functions.logger.error("Error parsing AI response:", parseError);
            throw new Error("Invalid AI response format");
        }
        // Add metadata
        workoutPlan.aiGenerated = true;
        workoutPlan.personalizedFor = JSON.stringify({
            fitnessLevel: data.fitnessLevel,
            goals: data.fitnessGoals,
            equipment: data.availableEquipment,
        });
        // Save workout plan to Firestore
        const workoutPlanRef = await db.collection("workoutPlans").add(Object.assign(Object.assign({}, workoutPlan), { userId, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        functions.logger.info(`Workout generated for user ${userId}: ${workoutPlanRef.id}`);
        return {
            success: true,
            workoutPlan: Object.assign({ id: workoutPlanRef.id }, workoutPlan),
        };
    }
    catch (error) {
        functions.logger.error("Error generating workout:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate workout");
    }
});
function createWorkoutPrompt(request, workoutHistory) {
    const historyContext = workoutHistory.length > 0
        ? `Recent workout history: ${JSON.stringify(workoutHistory)}`
        : "No previous workout history available.";
    return `
Generate a personalized workout plan with the following requirements:

User Profile:
- Fitness Level: ${request.fitnessLevel}
- Fitness Goals: ${request.fitnessGoals.join(", ")}
- Available Equipment: ${request.availableEquipment.join(", ")}
- Time Available: ${request.timeCommitment.minutesPerSession} minutes
- Workout Type: ${request.workoutType}
- Intensity Preference: ${request.preferences.intensity}
- Injuries/Limitations: ${request.preferences.injuriesOrLimitations.join(", ") || "None"}

${historyContext}

Please generate a workout plan that:
1. Matches the user's fitness level and goals
2. Uses only the available equipment
3. Fits within the time constraint
4. Considers any injuries or limitations
5. Provides variety from recent workouts
6. Includes proper warm-up and cool-down if time permits

Return a JSON object with this exact structure:
{
  "name": "Workout name",
  "description": "Brief description of the workout",
  "type": "${request.workoutType}",
  "difficulty": "${request.fitnessLevel}",
  "estimatedDuration": ${request.timeCommitment.minutesPerSession},
  "exercises": [
    {
      "name": "Exercise name",
      "description": "Brief description",
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "targetMuscles": ["muscle1", "muscle2"],
      "equipment": ["equipment1"],
      "difficulty": "${request.fitnessLevel}",
      "sets": 3,
      "reps": 12,
      "duration": null,
      "restTime": 60,
      "tips": ["Safety tip", "Form tip"]
    }
  ],
  "equipment": ["equipment1", "equipment2"],
  "targetMuscles": ["muscle1", "muscle2", "muscle3"]
}

Ensure all exercises are safe, appropriate for the fitness level, and use only the specified equipment.
`;
}
//# sourceMappingURL=workouts.js.map