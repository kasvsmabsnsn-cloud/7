const CACHE_NAME = 'muslim-model-v1';
const ASSETS_TO_CACHE = [
  './',
  './welcome.html',
  './index.html',
  './database.html',
  './fatwa.html',
  './offline.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js'
];


// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, {mode: 'no-cors'}))).catch(err => {
        console.warn('Some cache assets failed to load during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker & Clean old caches
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

// Fetch Strategy: Network First with Cache Fallback for HTML, Cache First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Firebase or API requests online-only, fallback to offline if necessary
  if (url.origin.includes('firebaseio.com') || url.origin.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If request is for an HTML page, return offline.html
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./offline.html');
          }
        });
      })
  );
});
