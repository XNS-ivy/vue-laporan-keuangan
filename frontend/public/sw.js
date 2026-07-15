const CACHE_NAME = 'finance-flow-cache-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest-dark.webmanifest',
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

// IndexedDB setup & helper for Service Worker background access
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('finance-flow-db', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getDbSetting(key) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }).catch((err) => {
    console.warn('SW: Failed to read from IndexedDB:', err);
    return null;
  });
}

function writeDbSetting(key, value) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }).catch((err) => {
    console.warn('SW: Failed to write to IndexedDB:', err);
  });
}

// Background Reminder verification
function checkAndTriggerBackgroundReminder() {
  if (self.registration.showNotification === undefined) return Promise.resolve();

  return Promise.all([
    getDbSetting('finance_reminder_interval'),
    getDbSetting('finance_last_reminded_date')
  ]).then(([interval, lastReminded]) => {
    if (!interval || interval === 'off') return;

    const today = new Date().toISOString().slice(0, 10);
    if (lastReminded === today) return;

    if (!lastReminded) {
      return writeDbSetting('finance_last_reminded_date', today).then(() => {
        return self.registration.showNotification('Selamat Datang di Pengingat MyFinanceFlow 🔔', {
          body: 'Pengingat pencatatan laporan keuangan Anda telah aktif. Yuk catat pengeluaran/pemasukan Anda sekarang!',
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          data: { url: self.location.origin }
        });
      });
    }

    const timeDiff = new Date(today).getTime() - new Date(lastReminded).getTime();
    const diffInDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    let shouldRemind = false;

    if (interval === 'daily' && diffInDays >= 1) {
      shouldRemind = true;
    } else if (interval === 'weekly' && diffInDays >= 7) {
      shouldRemind = true;
    } else if (interval === 'monthly' && diffInDays >= 30) {
      shouldRemind = true;
    }

    if (shouldRemind) {
      return writeDbSetting('finance_last_reminded_date', today).then(() => {
        return self.registration.showNotification('Waktunya Catat Keuangan Anda! 📊', {
          body: 'Sudah waktunya mencatat mutasi pengeluaran dan pemasukan Anda. Jaga pengeluaran tetap terkontrol!',
          tag: 'finance-reminder',
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          data: { url: self.location.origin }
        });
      });
    }
  });
}

// Listen to Periodic Sync for offline background reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(checkAndTriggerBackgroundReminder());
  }
});

