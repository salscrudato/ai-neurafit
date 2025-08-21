// Service Worker utilities for development and production

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Only register in production
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);
      } else {
        // In development, unregister any existing service workers
        await unregisterServiceWorkers();
        console.log('Development mode: Service workers disabled');
      }
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  }
};

export const unregisterServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('SW unregistered: ', registration);
      }
    } catch (error) {
      console.log('SW unregistration failed: ', error);
    }
  }
};
