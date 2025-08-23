#!/bin/bash

# AI NeuraFit - Frontend Code Extraction Script
# This script extracts all frontend code with file paths and descriptions

OUTPUT_FILE="frontend-code-complete.md"

echo "# AI NeuraFit - Complete Frontend Code" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "This document contains all frontend code for the AI NeuraFit application." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Project Structure" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "src/" >> "$OUTPUT_FILE"
echo "├── App.tsx                        # Main React app component with routing" >> "$OUTPUT_FILE"
echo "├── main.tsx                       # React app entry point" >> "$OUTPUT_FILE"
echo "├── index.css                      # Global styles and Tailwind CSS" >> "$OUTPUT_FILE"
echo "├── vite-env.d.ts                  # Vite type definitions" >> "$OUTPUT_FILE"
echo "├── components/                    # Reusable React components" >> "$OUTPUT_FILE"
echo "├── pages/                         # Page components" >> "$OUTPUT_FILE"
echo "├── services/                      # API service layers" >> "$OUTPUT_FILE"
echo "├── store/                         # State management (Zustand)" >> "$OUTPUT_FILE"
echo "├── lib/                           # Core libraries" >> "$OUTPUT_FILE"
echo "├── types/                         # TypeScript type definitions" >> "$OUTPUT_FILE"
echo "└── utils/                         # Utility functions" >> "$OUTPUT_FILE"
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to add file content with description
add_file_content() {
    local filepath="$1"
    local description="$2"
    
    if [ -f "$filepath" ]; then
        echo "## \`$filepath\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "**Description:** $description" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "\`\`\`typescript" >> "$OUTPUT_FILE"
        cat "$filepath" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "\`\`\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "---" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
}

# Root files
add_file_content "src/App.tsx" "Main React application component with routing, error boundaries, and lazy loading"
add_file_content "src/main.tsx" "React application entry point with StrictMode and root rendering"
add_file_content "src/index.css" "Global CSS styles, Tailwind configuration, and design system"
add_file_content "src/vite-env.d.ts" "Vite environment type definitions"

# Core libraries
add_file_content "src/lib/firebase.ts" "Firebase configuration and initialization"

# Type definitions
add_file_content "src/types/index.ts" "Shared TypeScript type definitions for the application"

# State management
add_file_content "src/store/authStore.ts" "Authentication state management using Zustand"
add_file_content "src/store/workoutStore.ts" "Workout state management using Zustand"

# Services
add_file_content "src/services/authService.ts" "Authentication service layer"
add_file_content "src/services/workoutService.ts" "Workout-related API service calls"
add_file_content "src/services/userProfileService.ts" "User profile API service calls"
add_file_content "src/services/exerciseService.ts" "Exercise database API service calls"

# Utilities
add_file_content "src/utils/animations.ts" "Animation utilities and configurations"
add_file_content "src/utils/logger.ts" "Logging utilities for debugging and monitoring"
add_file_content "src/utils/validation.ts" "Form validation utilities"
add_file_content "src/utils/constants.ts" "Application constants and configuration"

# Pages
add_file_content "src/pages/DashboardPage.tsx" "Main dashboard page with workout generation CTA"
add_file_content "src/pages/WorkoutPage.tsx" "Workout interface for active workouts"
add_file_content "src/pages/HistoryPage.tsx" "Workout history and analytics page"
add_file_content "src/pages/ProfilePage.tsx" "User profile management page"
add_file_content "src/pages/LandingPage.tsx" "Public landing page"
add_file_content "src/pages/LoginPage.tsx" "User login page"
add_file_content "src/pages/SignupPage.tsx" "User registration page"
add_file_content "src/pages/OnboardingPage.tsx" "User onboarding flow"
add_file_content "src/pages/ForgotPasswordPage.tsx" "Password reset page"

# Components - Auth
add_file_content "src/components/auth/AuthProvider.tsx" "Authentication context provider"
add_file_content "src/components/auth/ProtectedRoute.tsx" "Route protection component"

# Components - Layout
add_file_content "src/components/layout/Layout.tsx" "Main application layout wrapper"
add_file_content "src/components/layout/Navigation.tsx" "Navigation component"

# Components - UI (Core)
add_file_content "src/components/ui/Button.tsx" "Button component with variants"
add_file_content "src/components/ui/Card.tsx" "Card component with variants"
add_file_content "src/components/ui/Badge.tsx" "Badge component with variants"
add_file_content "src/components/ui/Progress.tsx" "Progress indicators and bars"
add_file_content "src/components/ui/LoadingSpinner.tsx" "Loading spinner component"
add_file_content "src/components/ui/Container.tsx" "Container and layout components"
add_file_content "src/components/ui/ErrorBoundary.tsx" "Error boundary component"
add_file_content "src/components/ui/SuspenseFallback.tsx" "Suspense fallback component"
add_file_content "src/components/ui/AccessibilityProvider.tsx" "Accessibility utilities"

# Components - Workout
add_file_content "src/components/workout/WorkoutGenerationModal.tsx" "AI workout generation modal"
add_file_content "src/components/workout/WorkoutSelector.tsx" "Workout selection interface"
add_file_content "src/components/workout/ActiveWorkout.tsx" "Active workout interface"
add_file_content "src/components/workout/WorkoutComplete.tsx" "Workout completion screen"

# Configuration files
add_file_content "package.json" "Frontend package configuration and scripts"
add_file_content "vite.config.ts" "Vite build tool configuration"
add_file_content "tailwind.config.js" "Tailwind CSS configuration"
add_file_content "tsconfig.json" "TypeScript configuration"
add_file_content "index.html" "HTML entry point"

echo "Frontend code extraction complete! Check $OUTPUT_FILE"
