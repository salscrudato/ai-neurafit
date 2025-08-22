// Service Worker utilities for development and production
import { logger } from './logger';

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Only register in production
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        logger.info('Service worker registered', { scope: registration.scope });
      } else {
        // In development, unregister any existing service workers
        await unregisterServiceWorkers();
      }
    } catch (error) {
      logger.error('Service worker registration failed', error as Error);
    }
  }
};

export const unregisterServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      logger.debug('Service workers unregistered');
    } catch (error) {
      logger.error('Service worker unregistration failed', error as Error);
    }
  }
};
