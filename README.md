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
- **React 19** - UI framework with modern features
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management
- **React Query** - Server state management

### Backend
- **Firebase Functions** - Serverless backend
- **Firestore** - NoSQL database
- **Firebase Auth** - Authentication
- **OpenAI GPT-4** - AI workout generation

### Architecture Highlights
- **Simplified Logging** - Lightweight logging system focused on essentials
- **Streamlined Components** - Clean component architecture without over-engineering
- **Optimized Performance** - Essential performance monitoring only
- **Mobile-First Design** - Responsive design optimized for mobile devices

## 🎯 Key Features

- **AI Workout Generation** - Personalized workouts using GPT-4
- **Interactive Workout Sessions** - Real-time timers and progress tracking
- **User Authentication** - Email/password and Google sign-in
- **Workout History** - Track your fitness journey
- **PWA Support** - Install as native app, offline functionality
- **Mobile Optimized** - Designed for mobile-first experience

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
