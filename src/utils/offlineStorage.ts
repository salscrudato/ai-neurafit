import type { WorkoutPlan, WorkoutSession, Exercise } from '../types';

// IndexedDB database name and version
const DB_NAME = 'NeuraFitDB';
const DB_VERSION = 1;

// Object store names
const STORES = {
  WORKOUTS: 'workouts',
  SESSIONS: 'sessions',
  EXERCISES: 'exercises',
  PENDING_SYNC: 'pendingSync',
  USER_DATA: 'userData'
};

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
          const workoutStore = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
          workoutStore.createIndex('userId', 'userId', { unique: false });
          workoutStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId', { unique: false });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
          sessionStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
          const exerciseStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
          exerciseStore.createIndex('difficulty', 'difficulty', { unique: false });
          exerciseStore.createIndex('equipment', 'equipment', { unique: false, multiEntry: true });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
        }
      };
    });
  }

  // Workout Plans
  async saveWorkout(workout: WorkoutPlan): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WORKOUTS], 'readwrite');
      const store = transaction.objectStore(STORES.WORKOUTS);
      const request = store.put(workout);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save workout'));
    });
  }

  async getWorkout(id: string): Promise<WorkoutPlan | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WORKOUTS], 'readonly');
      const store = transaction.objectStore(STORES.WORKOUTS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get workout'));
    });
  }

  async getUserWorkouts(userId: string): Promise<WorkoutPlan[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.WORKOUTS], 'readonly');
      const store = transaction.objectStore(STORES.WORKOUTS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get user workouts'));
    });
  }

  // Workout Sessions
  async saveSession(session: WorkoutSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SESSIONS], 'readwrite');
      const store = transaction.objectStore(STORES.SESSIONS);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save session'));
    });
  }

  async getUserSessions(userId: string): Promise<WorkoutSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SESSIONS], 'readonly');
      const store = transaction.objectStore(STORES.SESSIONS);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const sessions = request.result || [];
        // Sort by start time, most recent first
        sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        resolve(sessions);
      };
      request.onerror = () => reject(new Error('Failed to get user sessions'));
    });
  }

  // Exercises
  async saveExercises(exercises: Exercise[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.EXERCISES], 'readwrite');
      const store = transaction.objectStore(STORES.EXERCISES);

      let completed = 0;
      const total = exercises.length;

      if (total === 0) {
        resolve();
        return;
      }

      exercises.forEach((exercise) => {
        const request = store.put(exercise);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(new Error('Failed to save exercises'));
      });
    });
  }

  async getExercises(): Promise<Exercise[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.EXERCISES], 'readonly');
      const store = transaction.objectStore(STORES.EXERCISES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get exercises'));
    });
  }

  // Pending Sync Data
  async addPendingSync(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.add({
        data,
        timestamp: Date.now(),
        type: data.type || 'unknown'
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add pending sync data'));
    });
  }

  async getPendingSync(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_SYNC], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get pending sync data'));
    });
  }

  async clearPendingSync(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.PENDING_SYNC], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SYNC);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear pending sync data'));
    });
  }

  // User Data
  async saveUserData(key: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.USER_DATA], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DATA);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save user data'));
    });
  }

  async getUserData(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.USER_DATA], 'readonly');
      const store = transaction.objectStore(STORES.USER_DATA);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(new Error('Failed to get user data'));
    });
  }

  // Check if online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Sync data when back online
  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline()) {
      return;
    }

    try {
      const pendingData = await this.getPendingSync();
      
      for (const item of pendingData) {
        // Sync each item with the server
        // Implementation would depend on your API structure
        console.log('Syncing:', item);
      }

      // Clear pending data after successful sync
      await this.clearPendingSync();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on app start
export const initOfflineStorage = async (): Promise<void> => {
  try {
    await offlineStorage.init();
  } catch (error) {
    // Import logger dynamically to avoid circular dependencies
    import('./loggers').then(({ sync }) => {
      sync.syncError(error as Error);
    });
  }
};
