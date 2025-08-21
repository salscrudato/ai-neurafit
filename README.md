# 🏋️‍♂️ NeuraFit - AI Fitness Trainer

Your AI-powered personal fitness trainer. Get personalized workouts that adapt to your progress.

## 🌐 Live Demo

**Production App**: https://ai-neurafit.web.app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase CLI (`npm install -g firebase-tools`)

### Development Setup

#### Option 1: Full Development Environment (Recommended)
```bash
# Start both frontend and backend
npm run dev:full
```

#### Option 2: Manual Setup
```bash
# Terminal 1 - Frontend
npm install
npm run dev

# Terminal 2 - Backend (in new terminal)
firebase emulators:start
```

#### Option 3: Frontend Only
```bash
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Firebase Emulators**: http://localhost:4000
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start frontend only
npm run dev:full         # Start frontend + backend
npm run emulators        # Start Firebase emulators only
npm run functions:dev    # Start functions only

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Deployment
npm run deploy          # Build and deploy to Firebase
```

## 🔧 Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

### Backend
- **Firebase Functions** - Serverless backend
- **Firestore** - NoSQL database
- **Firebase Auth** - Authentication
- **OpenAI GPT-4** - AI workout generation

## 🎯 Key Features

- **AI Workout Generation** - Personalized workouts using GPT-4
- **Interactive Workout Sessions** - Real-time timers and progress tracking
- **User Authentication** - Email/password and Google sign-in
- **Progress Analytics** - Comprehensive workout history and metrics
- **PWA Support** - Install as native app, offline functionality

## �� Troubleshooting

### Fixed Issues ✅
1. **CSS Import Error** - Fixed: `@import` statements moved to top of CSS file
2. **Missing Icons Error** - Fixed: Created custom SVG icon and updated manifest

### Common Issues
- **Firebase Connection**: Verify CLI login with `firebase login`
- **Environment Variables**: Check all required env vars are set
- **Functions Issues**: Deploy with `firebase deploy --only functions`

---

**Built with ❤️ using modern web technologies and AI**
