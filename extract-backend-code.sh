#!/bin/bash

# AI NeuraFit - Backend Code Extraction Script
# This script extracts all backend code with file paths and descriptions

OUTPUT_FILE="backend-code-complete.md"

echo "# AI NeuraFit - Complete Backend Code" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "This document contains all backend code for the AI NeuraFit application." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Project Structure" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "functions/" >> "$OUTPUT_FILE"
echo "├── package.json                   # Backend dependencies and scripts" >> "$OUTPUT_FILE"
echo "├── tsconfig.json                  # TypeScript configuration" >> "$OUTPUT_FILE"
echo "├── src/                           # Backend source code" >> "$OUTPUT_FILE"
echo "│   ├── index.ts                   # Functions entry point and exports" >> "$OUTPUT_FILE"
echo "│   ├── shared.ts                  # Shared Firebase Admin setup" >> "$OUTPUT_FILE"
echo "│   ├── auth.ts                    # Authentication lifecycle triggers" >> "$OUTPUT_FILE"
echo "│   ├── workouts.ts                # AI workout generation functions" >> "$OUTPUT_FILE"
echo "│   ├── exercises.ts               # Exercise database functions" >> "$OUTPUT_FILE"
echo "│   └── userProfile.ts             # User profile management functions" >> "$OUTPUT_FILE"
echo "└── lib/                           # Compiled JavaScript (auto-generated)" >> "$OUTPUT_FILE"
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Firebase Configuration" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "\`\`\`" >> "$OUTPUT_FILE"
echo "firebase.json                      # Firebase project configuration" >> "$OUTPUT_FILE"
echo "firestore.rules                    # Firestore security rules" >> "$OUTPUT_FILE"
echo "firestore.indexes.json             # Firestore database indexes" >> "$OUTPUT_FILE"
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
        
        # Determine file type for syntax highlighting
        if [[ "$filepath" == *.ts ]]; then
            echo "\`\`\`typescript" >> "$OUTPUT_FILE"
        elif [[ "$filepath" == *.js ]]; then
            echo "\`\`\`javascript" >> "$OUTPUT_FILE"
        elif [[ "$filepath" == *.json ]]; then
            echo "\`\`\`json" >> "$OUTPUT_FILE"
        else
            echo "\`\`\`" >> "$OUTPUT_FILE"
        fi
        
        cat "$filepath" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "\`\`\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "---" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
}

# Backend source files
add_file_content "functions/src/index.ts" "Main entry point for Firebase Functions with global configuration"
add_file_content "functions/src/shared.ts" "Shared Firebase Admin initialization and configuration"
add_file_content "functions/src/auth.ts" "Authentication lifecycle triggers for user creation and deletion"
add_file_content "functions/src/workouts.ts" "AI-powered workout generation using OpenAI GPT"
add_file_content "functions/src/exercises.ts" "Exercise database management and search functionality"
add_file_content "functions/src/userProfile.ts" "User profile creation, retrieval, and updates"

# Configuration files
add_file_content "functions/package.json" "Backend package configuration with dependencies and scripts"
add_file_content "functions/tsconfig.json" "TypeScript configuration for Firebase Functions"

# Firebase configuration
add_file_content "firebase.json" "Firebase project configuration including emulators and hosting"
add_file_content "firestore.rules" "Firestore security rules for data access control"
add_file_content "firestore.indexes.json" "Firestore database indexes for query optimization"

echo "Backend code extraction complete! Check $OUTPUT_FILE"
