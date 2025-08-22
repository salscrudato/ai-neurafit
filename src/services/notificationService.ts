// Push notification service for workout reminders and achievements

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export class NotificationService {
  private static vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;

  // Request notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Check if notifications are supported and permitted
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  static hasPermission(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  // Subscribe to push notifications
  static async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.hasPermission()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey || ''),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  static async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Show local notification
  static async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.hasPermission()) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const notificationOptions: NotificationOptions = {
        icon: '/neurafit-icon.svg',
        badge: '/neurafit-icon.svg',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options,
      };

      await registration.showNotification(options.title, notificationOptions);
    } catch (error) {
      // Import logger dynamically to avoid circular dependencies
      import('../utils/loggers').then(({ errorBoundary }) => {
        errorBoundary.errorCaught(error as Error, { context: 'NotificationService' });
      });
    }
  }

  // Schedule workout reminder
  static async scheduleWorkoutReminder(time: Date, message?: string): Promise<void> {
    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) {
      return;
    }

    setTimeout(() => {
      this.showNotification({
        title: 'NeuraFit Workout Reminder',
        body: message || "Time for your workout! Let's get moving! 💪",
        tag: 'workout-reminder',
        data: { type: 'workout-reminder', scheduledTime: time.toISOString() },
        actions: [
          {
            action: 'start-workout',
            title: 'Start Workout',
          },
          {
            action: 'snooze',
            title: 'Remind me in 10 min',
          },
        ],
        requireInteraction: true,
      });
    }, delay);
  }

  // Show achievement notification
  static async showAchievementNotification(achievementName: string, description: string): Promise<void> {
    await this.showNotification({
      title: '🏆 Achievement Unlocked!',
      body: `${achievementName}: ${description}`,
      tag: 'achievement',
      data: { type: 'achievement', name: achievementName },
      actions: [
        {
          action: 'view-achievements',
          title: 'View All Achievements',
        },
      ],
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
    });
  }

  // Show workout completion notification
  static async showWorkoutCompletionNotification(workoutName: string, duration: number, calories: number): Promise<void> {
    await this.showNotification({
      title: '🎉 Workout Complete!',
      body: `Great job! You completed "${workoutName}" in ${Math.round(duration)} minutes and burned ${calories} calories.`,
      tag: 'workout-complete',
      data: { type: 'workout-complete', workoutName, duration, calories },
      actions: [
        {
          action: 'view-progress',
          title: 'View Progress',
        },
        {
          action: 'share-achievement',
          title: 'Share',
        },
      ],
    });
  }

  // Show streak milestone notification
  static async showStreakNotification(streakDays: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100];
    
    if (milestones.includes(streakDays)) {
      await this.showNotification({
        title: '🔥 Streak Milestone!',
        body: `Amazing! You've maintained a ${streakDays}-day workout streak. Keep it up!`,
        tag: 'streak-milestone',
        data: { type: 'streak', days: streakDays },
        actions: [
          {
            action: 'view-progress',
            title: 'View Progress',
          },
        ],
        requireInteraction: true,
      });
    }
  }

  // Send subscription to server
  private static async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In a real app, you'd send this to your backend
      // Store in localStorage for now
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    } catch (error) {
      // Import logger dynamically to avoid circular dependencies
      import('../utils/loggers').then(({ api }) => {
        api.error('POST', '/push-subscription', error as Error);
      });
    }
  }

  // Remove subscription from server
  private static async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      console.log('Removing subscription from server:', subscription);
      localStorage.removeItem('pushSubscription');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Convert VAPID key
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get notification settings
  static getSettings(): {
    enabled: boolean;
    workoutReminders: boolean;
    achievements: boolean;
    streaks: boolean;
  } {
    const settings = localStorage.getItem('notificationSettings');
    return settings ? JSON.parse(settings) : {
      enabled: false,
      workoutReminders: true,
      achievements: true,
      streaks: true,
    };
  }

  // Update notification settings
  static updateSettings(settings: {
    enabled?: boolean;
    workoutReminders?: boolean;
    achievements?: boolean;
    streaks?: boolean;
  }): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  }

  // Setup default workout reminders
  static async setupWorkoutReminders(preferredTimes: string[]): Promise<void> {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.workoutReminders) {
      return;
    }

    // Clear existing reminders
    // In a real app, you'd manage this on the server

    // Schedule daily reminders
    preferredTimes.forEach(timeString => {
      const [hours, minutes] = timeString.split(':').map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (reminderTime <= new Date()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      this.scheduleWorkoutReminder(reminderTime, "Don't forget your daily workout! Your body will thank you. 💪");
    });
  }
}
