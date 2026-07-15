const CACHE_NAME = 'finance-flow-cache-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache local GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate: return cached instantly, update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache both basic and opaque responses from same origin
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline navigation fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle notification click to focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification banner

  // Get the target URL from the notification data, fallback to application origin
  const urlToOpen = (event.notification.data && event.notification.data.url) || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window/tab open for the app
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // Bring the existing window into focus
          return client.focus().then((focusedClient) => {
            // Navigate to the target page if it differs from current URL
            if (focusedClient.url !== urlToOpen) {
              return focusedClient.navigate(urlToOpen);
            }
            return focusedClient;
          });
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
