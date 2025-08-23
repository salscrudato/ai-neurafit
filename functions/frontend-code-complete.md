# AI NeuraFit - Complete Frontend Code

This document contains all frontend code for the AI NeuraFit application.

## Project Structure

```
src/
├── App.tsx                        # Main React app component with routing
├── main.tsx                       # React app entry point
├── index.css                      # Global styles and Tailwind CSS
├── vite-env.d.ts                  # Vite type definitions
├── components/                    # Reusable React components
├── pages/                         # Page components
├── services/                      # API service layers
├── store/                         # State management (Zustand)
├── lib/                           # Core libraries
├── types/                         # TypeScript type definitions
└── utils/                         # Utility functions
```

## `package.json`

**Description:** Frontend package configuration and scripts

```typescript
{
  "name": "functions",
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run build && firebase emulators:start",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.1.0",
    "firebase-functions": "^5.0.0",
    "openai": "^4.28.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.9.0",
    "eslint-plugin-import": "^2.25.4",
    "typescript": "^5.0.0"
  },
  "private": true
}

```

---

## `tsconfig.json`

**Description:** TypeScript configuration

```typescript
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": false,
    "outDir": "lib",
    "sourceMap": true,
    "strict": false,
    "target": "es2017",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}

```

---

