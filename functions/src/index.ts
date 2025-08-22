/**
 * Firebase Functions — Bootstrap & Exports
 * - Safe, idempotent Admin init
 * - Global runtime options (v2)
 * - Firestore defaults (ignoreUndefinedProperties)
 * - Minimal health check endpoint
 */

import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

// ------------------------
// Admin initialization
// ------------------------
if (admin.apps.length === 0) {
  // Uses default credentials in prod or emulator env vars locally
  admin.initializeApp();
}

// Shared handles for other modules
export const db = admin.firestore();
export const storage = admin.storage();

// Safer Firestore defaults (prevents accidental writes of undefined fields)
db.settings({ ignoreUndefinedProperties: true });

// Helpful environment flags
const IS_EMULATOR = !!process.env.FUNCTIONS_EMULATOR || !!process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'unknown';

// ------------------------
// Global runtime options (v2)
// Adjust as needed per project/profile
// ------------------------
setGlobalOptions({
  region: ['us-central1'],          // Add more regions if you deploy multi-region
  memory: '512MiB',                 // Common sweet spot; bump for heavy tasks
  cpu: 1,                           // Keep cold start/light cost
  timeoutSeconds: 60,               // Default safety net; override per function if needed
  maxInstances: 100,                // Prevent runaway scale for cost control
  minInstances: 0,                  // Scale-to-zero by default
});

// ------------------------
// Health check (for uptime/liveness probes)
// GET only; CORS enabled for simplicity
// ------------------------
export const health = onRequest(
  { cors: true },
  (req, res) => {
    if (req.method !== 'GET') {
      res.set('Allow', 'GET').status(405).send('Method Not Allowed');
      return;
    }
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      status: 'ok',
      projectId: PROJECT_ID,
      emulator: IS_EMULATOR,
      time: new Date().toISOString(),
    });
  },
);

// ------------------------
// Re-exports (feature modules)
// Keep these lean; functions defined in these files
// will inherit the global options above unless overridden.
// ------------------------
export * from './auth';
export * from './workouts';
export * from './exercises';
export * from './userProfile';