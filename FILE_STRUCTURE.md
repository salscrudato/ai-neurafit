# AI NeuraFit - Complete File Structure

This is the complete file structure for the AI NeuraFit application, a React/Vite frontend with Firebase Functions backend.

## Root Directory

```
ai-neurafit/
├── README.md                          # Project documentation and setup guide
├── DEVELOPMENT.md                     # Detailed development workflow guide
├── FILE_STRUCTURE.md                  # This file - complete project structure
├── package.json                       # Frontend dependencies and scripts
├── package-lock.json                  # Frontend dependency lock file
├── vite.config.ts                     # Vite build tool configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── postcss.config.js                  # PostCSS configuration
├── tsconfig.json                      # TypeScript configuration (root)
├── tsconfig.app.json                  # TypeScript configuration (app)
├── tsconfig.node.json                 # TypeScript configuration (node)
├── eslint.config.js                   # ESLint configuration
├── firebase.json                      # Firebase project configuration
├── firestore.rules                    # Firestore security rules
├── firestore.indexes.json             # Firestore database indexes
├── .firebaserc                        # Firebase project aliases
├── index.html                         # HTML entry point
├── public/                            # Static assets
│   └── neurafit-icon.svg              # Application icon
├── dist/                              # Built frontend (auto-generated)
└── node_modules/                      # Frontend dependencies (auto-generated)
```

## Frontend Source (`src/`)

```
src/
├── App.tsx                            # Main React app with routing and providers
├── main.tsx                           # React app entry point with StrictMode
├── index.css                          # Global styles, Tailwind, and design system
├── vite-env.d.ts                      # Vite environment type definitions
├── components/                        # Reusable React components
│   ├── auth/                          # Authentication components
│   │   ├── AuthProvider.tsx           # Authentication context provider
│   │   └── ProtectedRoute.tsx         # Route protection wrapper
│   ├── layout/                        # Layout and navigation components
│   │   ├── Layout.tsx                 # Main app layout wrapper
│   │   └── Navigation.tsx             # Navigation bar component
│   ├── ui/                            # Core UI components
│   │   ├── AccessibilityProvider.tsx  # Accessibility utilities and providers
│   │   ├── Badge.tsx                  # Badge component with variants
│   │   ├── Button.tsx                 # Button component with variants
│   │   ├── Card.tsx                   # Card component with variants
│   │   ├── Container.tsx              # Container and layout components
│   │   ├── ErrorBoundary.tsx          # Error boundary for error handling
│   │   ├── LoadingSpinner.tsx         # Loading spinner component
│   │   ├── Progress.tsx               # Progress bars and indicators
│   │   └── SuspenseFallback.tsx       # Suspense loading fallback
│   └── workout/                       # Workout-specific components
│       ├── ActiveWorkout.tsx          # Active workout interface
│       ├── WorkoutComplete.tsx        # Workout completion screen
│       ├── WorkoutGenerationModal.tsx # AI workout generation modal
│       └── WorkoutSelector.tsx        # Workout selection interface
├── pages/                             # Page components (route handlers)
│   ├── DashboardPage.tsx              # Main dashboard with workout CTA
│   ├── WorkoutPage.tsx                # Workout execution interface
│   ├── HistoryPage.tsx                # Workout history and analytics
│   ├── ProfilePage.tsx                # User profile management
│   ├── LandingPage.tsx                # Public landing page
│   ├── LoginPage.tsx                  # User authentication (login)
│   ├── SignupPage.tsx                 # User registration
│   ├── OnboardingPage.tsx             # New user onboarding flow
│   └── ForgotPasswordPage.tsx         # Password reset interface
├── services/                          # API service layers
│   ├── authService.ts                 # Authentication API calls
│   ├── exerciseService.ts             # Exercise database API calls
│   ├── userProfileService.ts          # User profile API calls
│   └── workoutService.ts              # Workout generation API calls
├── store/                             # State management (Zustand)
│   ├── authStore.ts                   # Authentication state
│   └── workoutStore.ts                # Workout and session state
├── lib/                               # Core libraries and configurations
│   └── firebase.ts                    # Firebase SDK configuration
├── types/                             # TypeScript type definitions
│   └── index.ts                       # Shared application types
└── utils/                             # Utility functions
    ├── animations.ts                  # Framer Motion animation configs
    ├── constants.ts                   # Application constants
    ├── logger.ts                      # Logging utilities
    └── validation.ts                  # Form validation utilities
```

## Backend (`functions/`)

```
functions/
├── package.json                       # Backend dependencies and scripts
├── package-lock.json                  # Backend dependency lock file
├── tsconfig.json                      # TypeScript configuration for functions
├── src/                               # Backend source code
│   ├── index.ts                       # Functions entry point and global config
│   ├── shared.ts                      # Shared Firebase Admin initialization
│   ├── auth.ts                        # Authentication lifecycle triggers
│   ├── workouts.ts                    # AI workout generation (OpenAI integration)
│   ├── exercises.ts                   # Exercise database management
│   └── userProfile.ts                 # User profile CRUD operations
├── lib/                               # Compiled JavaScript (auto-generated)
└── node_modules/                      # Backend dependencies (auto-generated)
```

## Key Technologies

### Frontend Stack
- **React 18** - UI framework with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Firebase SDK** - Authentication and Firestore client

### Backend Stack
- **Firebase Functions** - Serverless cloud functions
- **TypeScript** - Type-safe server code
- **Firebase Admin SDK** - Server-side Firebase operations
- **OpenAI API** - AI workout generation
- **Zod** - Runtime type validation
- **Firestore** - NoSQL document database
- **Firebase Auth** - User authentication

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Firebase Emulators** - Local development environment
- **Vite HMR** - Hot module replacement

## Development

This is a clean, optimized codebase structure focused on:
- **Modern React/Vite frontend** with TypeScript
- **Firebase Functions backend** with TypeScript
- **Clean separation** of concerns
- **Optimized dependencies** with no unused packages
- **Streamlined scripts** for efficient development
