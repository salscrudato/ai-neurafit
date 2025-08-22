"use strict";
/**
 * Firebase Functions — Bootstrap & Exports
 * - Safe, idempotent Admin init
 * - Global runtime options (v2)
 * - Firestore defaults (ignoreUndefinedProperties)
 * - Minimal health check endpoint
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
// Helpful environment flags
const IS_EMULATOR = !!process.env.FUNCTIONS_EMULATOR || !!process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'unknown';
// ------------------------
// Global runtime options (v2)
// Adjust as needed per project/profile
// ------------------------
(0, v2_1.setGlobalOptions)({
    region: 'us-central1', // Single region for simplicity
    memory: '512MiB', // Common sweet spot; bump for heavy tasks
    cpu: 1, // Keep cold start/light cost
    timeoutSeconds: 60, // Default safety net; override per function if needed
    maxInstances: 100, // Prevent runaway scale for cost control
    minInstances: 0, // Scale-to-zero by default
});
// ------------------------
// Health check (for uptime/liveness probes)
// GET only; CORS enabled for simplicity
// ------------------------
exports.health = (0, https_1.onRequest)({ cors: true }, (req, res) => {
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
});
// ------------------------
// Re-exports (feature modules)
// Keep these lean; functions defined in these files
// will inherit the global options above unless overridden.
// ------------------------
__exportStar(require("./auth"), exports);
__exportStar(require("./workouts"), exports);
__exportStar(require("./exercises"), exports);
__exportStar(require("./userProfile"), exports);
//# sourceMappingURL=index.js.map