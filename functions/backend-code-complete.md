# AI NeuraFit - Complete Backend Code

This document contains all backend code for the AI NeuraFit application.

## Project Structure

```
functions/
├── package.json                   # Backend dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── src/                           # Backend source code
│   ├── index.ts                   # Functions entry point and exports
│   ├── shared.ts                  # Shared Firebase Admin setup
│   ├── auth.ts                    # Authentication lifecycle triggers
│   ├── workouts.ts                # AI workout generation functions
│   ├── exercises.ts               # Exercise database functions
│   └── userProfile.ts             # User profile management functions
└── lib/                           # Compiled JavaScript (auto-generated)
```

## Firebase Configuration

```
firebase.json                      # Firebase project configuration
firestore.rules                    # Firestore security rules
firestore.indexes.json             # Firestore database indexes
```

