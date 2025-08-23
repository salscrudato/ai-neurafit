# Development Guide

This guide explains how to set up and run the AI NeuraFit application for local development.

## Quick Start

### Option 1: Separate Commands (Recommended)

**Terminal 1 - Backend (Firebase Emulators):**
```bash
cd functions
npm start
```

**Terminal 2 - Frontend (React/Vite):**
```bash
npm run dev
```

### Option 2: Single Command
```bash
npm start
```
This runs both frontend and backend together using concurrently.

## Development Workflow

1. **Start Backend First**: Always start the Firebase emulators before the frontend
   ```bash
   cd functions
   npm start
   ```

2. **Start Frontend**: In a new terminal, start the Vite dev server
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - **Frontend**: http://localhost:5173 (or next available port)
   - **Emulator UI**: http://localhost:4002

## Services & Ports

When you run `npm start` from the functions folder, the following services start:

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Frontend** | 5173 | http://localhost:5173 | React/Vite dev server |
| **Auth Emulator** | 9099 | http://127.0.0.1:9099 | Firebase Authentication |
| **Functions Emulator** | 5001 | http://127.0.0.1:5001 | Cloud Functions |
| **Firestore Emulator** | 8081 | http://127.0.0.1:8081 | Firestore Database |
| **Emulator UI** | 4002 | http://127.0.0.1:4002 | Firebase Emulator Dashboard |
| **Hosting Emulator** | 5002 | http://127.0.0.1:5002 | Firebase Hosting |

## Available Functions

The backend includes these Cloud Functions:

- `health` - Health check endpoint
- `generateWorkout` - AI workout generation
- `generateAdaptiveWorkout` - Adaptive workout generation
- `getExercises` - Retrieve exercise database
- `resolveExerciseNames` - Exercise name resolution
- `initializeExercises` - Initialize exercise database
- `createUserProfile` - Create user profile
- `getUserProfile` - Get user profile
- `updateUserProfile` - Update user profile
- `onAuthUserCreate` - Auth trigger for user creation
- `onAuthUserDelete` - Auth trigger for user deletion

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Emulator Data**: Data persists between emulator restarts
3. **Environment Variables**: Backend loads from `functions/.env`
4. **TypeScript**: Functions are written in TypeScript and auto-compile
5. **Logs**: Function logs appear in the terminal and Emulator UI

## Troubleshooting

### Port Conflicts
If you see port conflicts, the services will automatically try the next available port.

### Emulator Issues
If emulators fail to start:
```bash
# Kill any existing processes
pkill -f firebase
# Restart
cd functions && npm start
```

### Frontend Issues
If Vite fails to start:
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

## Production vs Development

- **Development**: Uses Firebase emulators (local)
- **Production**: Uses live Firebase services
- The app automatically detects the environment and connects accordingly
