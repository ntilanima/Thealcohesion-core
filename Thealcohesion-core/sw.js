const CACHE_NAME = 'sovereign-core-v1.2.9';
const ASSETS = [
  './',
  './index.html',
  './js/os.js',
  './js/registry.js',
  './boot.js',
  './css/theme.css',
  './css/layout.css',
  './images/logo.png'
];

// Install Event: Saving the OS to local hardware
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Sovereign Kernel: Provisioning local storage...');
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch Event: Serving the OS from local hardware (No Internet Needed)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});