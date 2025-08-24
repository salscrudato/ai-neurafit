# 🏋️‍♂️ NeuraFit - AI Fitness Trainer

Your AI-powered personal fitness trainer. Get personalized workouts that adapt to your progress.

## 🌐 Live Demo

**Production App**: https://ai-neurafit.web.app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### Development Setup (Recommended)

```bash
# Terminal 1 - Backend (Firebase Emulators)
cd functions
npm start

# Terminal 2 - Frontend (React/Vite)
npm run dev
```

### Frontend Only Development
```bash
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5174 (or next available port)
- **Firebase Emulators UI**: http://localhost:4002
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8081
- **Authentication**: http://localhost:9099

## 🛠️ Available Scripts

```bash
# Development
npm run dev             # Start frontend only (Vite dev server)
npm run dev:backend     # Start backend only (from root)

# Manual Backend (recommended for development)
cd functions && npm start  # Start all Firebase emulators

# Building
npm run build          # Build for production
npm run preview        # Preview production build

# Deployment
npm run deploy         # Build and deploy to Firebase
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
