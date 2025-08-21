#!/bin/bash

echo "🚀 Starting NeuraFit Development Environment..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building functions..."
cd functions && npm install && npm run build && cd ..

echo "🌐 Starting development servers..."
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Firebase Emulators will be available at: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both frontend and Firebase emulators
npm run dev &
FRONTEND_PID=$!

firebase emulators:start &
EMULATOR_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $FRONTEND_PID 2>/dev/null
    kill $EMULATOR_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
