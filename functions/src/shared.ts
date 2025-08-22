/**
 * Shared Firebase Admin initialization
 * - Single source of truth for Firebase Admin setup
 * - Prevents circular dependencies
 * - Ensures consistent configuration across all modules
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export shared instances
export const db = admin.firestore();
export const storage = admin.storage();

// Configure Firestore settings once
db.settings({ ignoreUndefinedProperties: true });

// Export admin for modules that need it
export { admin };
