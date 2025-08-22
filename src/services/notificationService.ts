// Simple notification service for basic browser notifications
import { logger } from '../utils/logger';

interface SimpleNotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

export class NotificationService {
  // Request notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Check if notifications are supported and permitted
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  static hasPermission(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  // Show simple browser notification
  static async showNotification(options: SimpleNotificationOptions): Promise<void> {
    if (!this.hasPermission()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/neurafit-icon.svg',
      });
    } catch (error) {
      logger.error('Failed to show notification', error as Error);
    }
  }

  // Show workout completion notification
  static async showWorkoutCompletionNotification(workoutName: string, duration: number): Promise<void> {
    await this.showNotification({
      title: '🎉 Workout Complete!',
      body: `Great job! You completed "${workoutName}" in ${Math.round(duration)} minutes.`,
    });
  }

}
