// Service Worker utilities for development and production

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Only register in production
      if (import.meta.env.PROD) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // Import logger dynamically to avoid circular dependencies
        import('./loggers').then(({ pwa }) => {
          pwa.serviceWorkerRegistered(registration.scope);
        });
      } else {
        // In development, unregister any existing service workers
        await unregisterServiceWorkers();
      }
    } catch (error) {
      // Import logger dynamically to avoid circular dependencies
      import('./loggers').then(({ pwa }) => {
        pwa.serviceWorkerError(error as Error);
      });
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
    } catch (error) {
      // Import logger dynamically to avoid circular dependencies
      import('./loggers').then(({ pwa }) => {
        pwa.serviceWorkerError(error as Error);
      });
    }
  }
};
