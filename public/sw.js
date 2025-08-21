const CACHE_NAME = 'neurafit-v1';
const STATIC_CACHE = 'neurafit-static-v1';
const DYNAMIC_CACHE = 'neurafit-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add other critical assets here
];

// Assets to cache on first request
const DYNAMIC_ASSETS = [
  '/app',
  '/app/workout',
  '/app/history',
  '/app/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page for navigation requests
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle other requests (assets, etc.)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          });
      })
      .catch(() => {
        // Return offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for workout data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout!',
    icon: '/neurafit-icon.svg',
    badge: '/neurafit-icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/neurafit-icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/neurafit-icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NeuraFit', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/app/workout')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/app')
    );
  }
});

// Helper function to sync workout data
async function syncWorkoutData() {
  try {
    // Get pending workout data from IndexedDB
    const pendingData = await getPendingWorkoutData();
    
    if (pendingData.length > 0) {
      // Sync with server
      for (const data of pendingData) {
        await fetch('/api/sync-workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }
      
      // Clear pending data after successful sync
      await clearPendingWorkoutData();
      console.log('Service Worker: Workout data synced successfully');
    }
  } catch (error) {
    console.error('Service Worker: Error syncing workout data', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingWorkoutData() {
  // Implementation would use IndexedDB to get pending data
  return [];
}

async function clearPendingWorkoutData() {
  // Implementation would clear IndexedDB pending data
  return Promise.resolve();
}
