// Enhanced offline service for PWA capabilities
import { offlineStorage } from '../utils/offlineStorage';

interface OfflineWorkoutSession {
  id: string;
  workoutPlan: any;
  startTime: Date;
  exercises: Array<{
    exerciseId: string;
    sets: Array<{
      reps?: number;
      duration?: number;
      weight?: number;
      completed: boolean;
      timestamp: Date;
    }>;
  }>;
  status: 'in_progress' | 'completed' | 'paused';
  offline: boolean;
}

interface SyncQueueItem {
  id: string;
  type: 'workout_session' | 'progress_update' | 'user_preference';
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

export class OfflineService {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  // Setup online/offline event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is back online');
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.isOnline = false;
    });

    // Listen for beforeunload to save any pending data
    window.addEventListener('beforeunload', () => {
      this.saveSyncQueue();
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, 30000); // Every 30 seconds
  }

  // Start offline workout session
  async startOfflineWorkout(workoutPlan: any): Promise<string> {
    const sessionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: OfflineWorkoutSession = {
      id: sessionId,
      workoutPlan,
      startTime: new Date(),
      exercises: workoutPlan.exercises.map((exercise: any) => ({
        exerciseId: exercise.id,
        sets: Array.from({ length: exercise.sets }, () => ({
          completed: false,
          timestamp: new Date(),
        })),
      })),
      status: 'in_progress',
      offline: true,
    };

    // Save to offline storage
    await offlineStorage.saveSession(session as any);
    
    return sessionId;
  }

  // Update workout progress offline
  async updateOfflineWorkoutProgress(
    sessionId: string,
    exerciseIndex: number,
    setIndex: number,
    setData: {
      reps?: number;
      duration?: number;
      weight?: number;
      completed: boolean;
    }
  ): Promise<void> {
    try {
      // Get current session from offline storage
      const sessions = await offlineStorage.getUserSessions('current_user'); // In real app, use actual user ID
      const session = sessions.find(s => s.id === sessionId) as any;
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Update the specific set
      if (session.exercises[exerciseIndex] && session.exercises[exerciseIndex].sets[setIndex]) {
        session.exercises[exerciseIndex].sets[setIndex] = {
          ...session.exercises[exerciseIndex].sets[setIndex],
          ...setData,
          timestamp: new Date(),
        };

        // Save updated session
        await offlineStorage.saveSession(session);

        // Add to sync queue for when we're back online
        this.addToSyncQueue({
          type: 'workout_session',
          data: {
            sessionId,
            exerciseIndex,
            setIndex,
            setData,
            action: 'update_progress',
          },
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('Failed to update offline workout progress:', error);
      throw error;
    }
  }

  // Complete offline workout
  async completeOfflineWorkout(sessionId: string, summary: {
    duration: number;
    caloriesBurned: number;
    rating?: number;
    notes?: string;
  }): Promise<void> {
    try {
      const sessions = await offlineStorage.getUserSessions('current_user');
      const session = sessions.find(s => s.id === sessionId) as any;
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Update session status
      session.status = 'completed';
      session.endTime = new Date();
      session.summary = summary;

      await offlineStorage.saveSession(session);

      // Add to high-priority sync queue
      this.addToSyncQueue({
        type: 'workout_session',
        data: {
          sessionId,
          summary,
          action: 'complete_workout',
          session,
        },
        priority: 'high',
      });

      console.log('Offline workout completed and queued for sync');
    } catch (error) {
      console.error('Failed to complete offline workout:', error);
      throw error;
    }
  }

  // Add item to sync queue
  private addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
      ...item,
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Processing sync queue with ${this.syncQueue.length} items`);

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.syncQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item);
        // Remove from queue on successful sync
        this.syncQueue = this.syncQueue.filter(queueItem => queueItem.id !== item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Increment retry count
        const queueItem = this.syncQueue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retryCount++;
          
          // Remove from queue if max retries reached
          if (queueItem.retryCount >= 3) {
            console.warn(`Max retries reached for item ${item.id}, removing from queue`);
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          }
        }
      }
    }

    this.saveSyncQueue();
    this.syncInProgress = false;
    
    console.log(`Sync completed. ${this.syncQueue.length} items remaining in queue`);
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    console.log(`Syncing ${item.type} item:`, item.data);

    switch (item.type) {
      case 'workout_session':
        await this.syncWorkoutSession(item.data);
        break;
      case 'progress_update':
        await this.syncProgressUpdate(item.data);
        break;
      case 'user_preference':
        await this.syncUserPreference(item.data);
        break;
      default:
        console.warn(`Unknown sync item type: ${item.type}`);
    }
  }

  // Sync workout session data
  private async syncWorkoutSession(data: any): Promise<void> {
    // In a real app, this would make API calls to your backend
    console.log('Syncing workout session:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Here you would typically:
    // 1. Send the workout session data to your backend
    // 2. Update any local caches
    // 3. Trigger any necessary UI updates
  }

  // Sync progress update
  private async syncProgressUpdate(data: any): Promise<void> {
    console.log('Syncing progress update:', data);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Sync user preference
  private async syncUserPreference(data: any): Promise<void> {
    console.log('Syncing user preference:', data);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Save sync queue to localStorage
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load sync queue from localStorage
  private loadSyncQueue(): void {
    try {
      const saved = localStorage.getItem('syncQueue');
      if (saved) {
        this.syncQueue = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Get offline status
  isOffline(): boolean {
    return !this.isOnline;
  }

  // Get sync queue status
  getSyncStatus(): {
    queueLength: number;
    isOnline: boolean;
    syncInProgress: boolean;
    lastSyncAttempt?: Date;
  } {
    return {
      queueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  // Force sync (useful for manual sync buttons)
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Clear sync queue (useful for debugging or reset)
  clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
