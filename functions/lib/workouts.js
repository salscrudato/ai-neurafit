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
exports.generateAdaptiveWorkout = exports.generateWorkout = void 0;
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
            .limit(10)
            .get();
        const workoutHistory = recentWorkouts.docs.map(doc => {
            var _a, _b;
            const data = doc.data();
            return {
                type: (_a = data.workoutPlan) === null || _a === void 0 ? void 0 : _a.type,
                completedAt: data.endTime,
                rating: data.rating,
                feedback: data.feedback,
                exercises: ((_b = data.completedExercises) === null || _b === void 0 ? void 0 : _b.map((ex) => ex.exerciseId)) || [],
                duration: data.endTime && data.startTime ?
                    Math.round((data.endTime.toDate().getTime() - data.startTime.toDate().getTime()) / (1000 * 60)) : null,
            };
        });
        // Get user's progress metrics
        const progressMetrics = await db.collection("progressMetrics")
            .where("userId", "==", userId)
            .orderBy("date", "desc")
            .limit(5)
            .get();
        const recentProgress = progressMetrics.docs.map(doc => doc.data());
        // Calculate user's progression level based on workout history
        const progressionLevel = calculateProgressionLevel(workoutHistory, data.fitnessLevel);
        // Get frequently used exercises to avoid repetition
        const frequentExercises = getFrequentExercises(workoutHistory);
        // Create enhanced AI prompt for workout generation
        const prompt = createAdvancedWorkoutPrompt(data, workoutHistory, recentProgress, progressionLevel, frequentExercises);
        // Generate workout using OpenAI with enhanced system prompt
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an elite personal trainer and exercise physiologist with 15+ years of experience. You specialize in creating highly personalized, progressive workout plans that adapt to individual needs, preferences, and progress.

Key principles:
- Safety first: Always prioritize proper form and injury prevention
- Progressive overload: Gradually increase difficulty to promote adaptation
- Specificity: Tailor exercises to user's goals and fitness level
- Variety: Prevent boredom and plateaus with diverse exercise selection
- Recovery: Include appropriate rest periods and recovery considerations
- Motivation: Create engaging, challenging but achievable workouts

Return your response as a valid JSON object matching the WorkoutPlan interface. Include detailed exercise instructions, form cues, and progression notes.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 3000,
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
// Helper function to calculate user's progression level
function calculateProgressionLevel(workoutHistory, fitnessLevel) {
    if (workoutHistory.length === 0) {
        return fitnessLevel === 'beginner' ? 1 : fitnessLevel === 'intermediate' ? 4 : 7;
    }
    const completedWorkouts = workoutHistory.filter(w => w.rating && w.rating >= 3).length;
    const avgRating = workoutHistory.reduce((sum, w) => sum + (w.rating || 0), 0) / workoutHistory.length;
    let baseLevel = fitnessLevel === 'beginner' ? 1 : fitnessLevel === 'intermediate' ? 4 : 7;
    // Adjust based on workout frequency and satisfaction
    if (completedWorkouts >= 5 && avgRating >= 4)
        baseLevel += 1;
    if (completedWorkouts >= 10 && avgRating >= 4.5)
        baseLevel += 1;
    return Math.min(10, Math.max(1, baseLevel));
}
// Helper function to identify frequently used exercises
function getFrequentExercises(workoutHistory) {
    const exerciseCount = {};
    workoutHistory.forEach(workout => {
        var _a;
        (_a = workout.exercises) === null || _a === void 0 ? void 0 : _a.forEach((exerciseId) => {
            exerciseCount[exerciseId] = (exerciseCount[exerciseId] || 0) + 1;
        });
    });
    return Object.entries(exerciseCount)
        .filter(([_, count]) => count >= 3)
        .map(([exerciseId, _]) => exerciseId);
}
function createAdvancedWorkoutPrompt(request, workoutHistory, progressMetrics, progressionLevel, frequentExercises) {
    var _a;
    const historyContext = workoutHistory.length > 0
        ? `Recent workout history (last 10 sessions): ${JSON.stringify(workoutHistory.slice(0, 5))}`
        : "No previous workout history available.";
    const progressContext = progressMetrics.length > 0
        ? `Recent progress metrics: ${JSON.stringify(progressMetrics.slice(0, 3))}`
        : "No progress metrics available.";
    const frequentExerciseContext = frequentExercises.length > 0
        ? `Frequently used exercises to vary from: ${frequentExercises.join(", ")}`
        : "No exercise repetition patterns to avoid.";
    const timeOfDay = request.timeCommitment.preferredTimes.length > 0
        ? request.timeCommitment.preferredTimes[0]
        : "any time";
    return `
Generate a highly personalized, progressive workout plan with the following comprehensive profile:

🏋️ USER PROFILE:
- Fitness Level: ${request.fitnessLevel} (Progression Level: ${progressionLevel}/10)
- Primary Goals: ${request.fitnessGoals.join(", ")}
- Available Equipment: ${request.availableEquipment.join(", ")}
- Session Duration: ${request.timeCommitment.minutesPerSession} minutes
- Workout Type: ${request.workoutType}
- Intensity Preference: ${request.preferences.intensity}
- Training Frequency: ${request.timeCommitment.daysPerWeek} days/week
- Preferred Time: ${timeOfDay}
- Injuries/Limitations: ${request.preferences.injuriesOrLimitations.join(", ") || "None"}
- Focus Areas: ${((_a = request.focusAreas) === null || _a === void 0 ? void 0 : _a.join(", ")) || "General fitness"}

📊 PERSONALIZATION DATA:
${historyContext}

${progressContext}

${frequentExerciseContext}

🎯 WORKOUT REQUIREMENTS:
1. **Progressive Challenge**: Design for progression level ${progressionLevel}/10
2. **Equipment Constraints**: Use ONLY the specified equipment
3. **Time Optimization**: Fit perfectly within ${request.timeCommitment.minutesPerSession} minutes
4. **Safety First**: Account for all injuries and limitations
5. **Variety**: Avoid overused exercises, introduce new movements
6. **Goal Alignment**: Directly support the user's fitness goals
7. **Recovery Balance**: Include appropriate rest periods
8. **Motivation**: Create an engaging, achievable challenge

📋 REQUIRED JSON STRUCTURE:
{
  "name": "Motivational workout name",
  "description": "Engaging description highlighting benefits",
  "type": "${request.workoutType}",
  "difficulty": "${request.fitnessLevel}",
  "estimatedDuration": ${request.timeCommitment.minutesPerSession},
  "calorieEstimate": 250,
  "motivationalQuote": "Inspiring fitness quote",
  "warmUp": [
    {
      "name": "Warm-up exercise",
      "description": "Purpose and benefits",
      "instructions": ["Clear step-by-step instructions"],
      "targetMuscles": ["muscles being prepared"],
      "equipment": ["required equipment"],
      "difficulty": "${request.fitnessLevel}",
      "sets": 1,
      "duration": 30,
      "restTime": 0,
      "tips": ["Form and safety tips"],
      "formCues": ["Key movement cues"]
    }
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "description": "Exercise purpose and benefits",
      "instructions": ["Detailed step-by-step instructions"],
      "targetMuscles": ["primary", "secondary"],
      "equipment": ["required equipment"],
      "difficulty": "${request.fitnessLevel}",
      "sets": 3,
      "reps": 12,
      "duration": null,
      "restTime": 60,
      "tips": ["Safety and form tips"],
      "formCues": ["Critical form points"],
      "progressionNotes": "How to make harder/easier",
      "alternatives": ["Alternative exercises if needed"]
    }
  ],
  "coolDown": [
    {
      "name": "Cool-down exercise",
      "description": "Recovery purpose",
      "instructions": ["Relaxation instructions"],
      "targetMuscles": ["muscles being stretched"],
      "equipment": ["required equipment"],
      "difficulty": "beginner",
      "sets": 1,
      "duration": 30,
      "restTime": 0,
      "tips": ["Relaxation tips"],
      "formCues": ["Breathing and posture cues"]
    }
  ],
  "equipment": ["all equipment used"],
  "targetMuscles": ["all muscles targeted"],
  "progressionTips": ["How to progress this workout over time"]
}

🔥 MAKE IT AMAZING: Create a workout that's challenging but achievable, varied but focused, and perfectly tailored to this user's journey!
`;
}
// Generate adaptive workout based on previous performance
exports.generateAdaptiveWorkout = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }
    const userId = context.auth.uid;
    try {
        // Get the previous workout
        const previousWorkout = await db.collection("workoutPlans").doc(data.previousWorkoutId).get();
        if (!previousWorkout.exists) {
            throw new Error("Previous workout not found");
        }
        const workoutData = previousWorkout.data();
        // Get user profile for baseline
        const userProfile = await db.collection("userProfiles").doc(userId).get();
        if (!userProfile.exists) {
            throw new Error("User profile not found");
        }
        const profile = userProfile.data();
        // Calculate adaptation parameters
        const adaptations = calculateWorkoutAdaptations(data, workoutData, profile);
        // Generate adapted workout
        const adaptedRequest = Object.assign(Object.assign({}, profile), { workoutType: workoutData.type, progressionLevel: adaptations.newProgressionLevel, focusAreas: adaptations.focusAreas });
        // Create adaptive prompt
        const prompt = createAdaptiveWorkoutPrompt(adaptedRequest, data, workoutData, adaptations);
        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an adaptive fitness AI that creates progressive workouts based on user performance and feedback. Focus on optimal progression and personalization."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 3000,
        });
        const aiResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!aiResponse) {
            throw new Error("No response from AI");
        }
        const adaptedWorkout = JSON.parse(aiResponse);
        adaptedWorkout.aiGenerated = true;
        adaptedWorkout.adaptedFrom = data.previousWorkoutId;
        adaptedWorkout.adaptationReason = adaptations.reason;
        // Save adapted workout
        const workoutRef = await db.collection("workoutPlans").add(Object.assign(Object.assign({}, adaptedWorkout), { userId, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        return {
            success: true,
            workoutPlan: Object.assign({ id: workoutRef.id }, adaptedWorkout),
            adaptations: adaptations,
        };
    }
    catch (error) {
        functions.logger.error("Error generating adaptive workout:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate adaptive workout");
    }
});
// Helper function to calculate workout adaptations
function calculateWorkoutAdaptations(feedback, previousWorkout, userProfile) {
    let progressionAdjustment = 0;
    let intensityAdjustment = 0;
    let focusAreas = [];
    let reason = "";
    // Adjust based on performance rating
    if (feedback.performanceRating >= 4 && feedback.completionRate >= 0.9) {
        progressionAdjustment = 1;
        reason += "Excellent performance, increasing difficulty. ";
    }
    else if (feedback.performanceRating <= 2 || feedback.completionRate < 0.7) {
        progressionAdjustment = -1;
        reason += "Challenging workout, reducing difficulty. ";
    }
    // Adjust based on difficulty feedback
    if (feedback.difficultyFeedback === "too_easy") {
        progressionAdjustment += 1;
        intensityAdjustment = 0.2;
        reason += "User found workout too easy, increasing challenge. ";
    }
    else if (feedback.difficultyFeedback === "too_hard") {
        progressionAdjustment -= 1;
        intensityAdjustment = -0.2;
        reason += "User found workout too hard, reducing intensity. ";
    }
    // Adjust based on time variance
    const timeVariance = feedback.timeActual / previousWorkout.estimatedDuration;
    if (timeVariance > 1.3) {
        reason += "Workout took longer than expected, optimizing efficiency. ";
    }
    else if (timeVariance < 0.8) {
        reason += "Workout completed quickly, adding complexity. ";
        progressionAdjustment += 0.5;
    }
    const currentLevel = userProfile.progressionLevel || 5;
    const newProgressionLevel = Math.max(1, Math.min(10, currentLevel + progressionAdjustment));
    return {
        newProgressionLevel,
        intensityAdjustment,
        focusAreas,
        reason: reason.trim(),
    };
}
// Create adaptive workout prompt
function createAdaptiveWorkoutPrompt(request, feedback, previousWorkout, adaptations) {
    return `
Create an adaptive workout based on user performance feedback:

PREVIOUS WORKOUT ANALYSIS:
- Workout: ${previousWorkout.name}
- User Rating: ${feedback.performanceRating}/5
- Completion Rate: ${Math.round(feedback.completionRate * 100)}%
- Difficulty Feedback: ${feedback.difficultyFeedback}
- Time Variance: ${Math.round((feedback.timeActual / previousWorkout.estimatedDuration) * 100)}%

ADAPTATION STRATEGY:
- Progression Level: ${request.progressionLevel}/10
- Intensity Adjustment: ${adaptations.intensityAdjustment > 0 ? '+' : ''}${adaptations.intensityAdjustment}
- Reason: ${adaptations.reason}

Generate an improved workout that addresses the feedback while maintaining user engagement and progressive overload.
Use the same JSON structure as before, but optimize based on the performance data.
`;
}
//# sourceMappingURL=workouts.js.map