const CACHE_NAME = 'endocalc-v2';

// Define assets to cache
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/css/styles.css',
    '/js/main.js',
    // Calculator files
    '/js/calculators/bmi.js',
    '/js/calculators/egfr-mdrd.js',
    '/js/calculators/pounds-kg.js',
    '/js/calculators/metabolic-syndrome.js',
    '/js/calculators/bmr.js',
    '/js/calculators/steroid.js',
    '/js/calculators/ideal-weight.js',
    '/js/calculators/corrected-sodium.js',
    '/js/calculators/hba1c.js',
    '/js/calculators/pump-ratio.js',
    '/js/calculators/nafld.js',
    '/js/calculators/calcium-albumin.js',
    '/js/calculators/fhh.js',
    '/js/calculators/chloride-phosphorus.js',
    '/js/calculators/siadh.js',
    '/js/calculators/osmality.js',
    '/js/calculators/free-water.js',
    '/js/calculators/thyroxine.js',
    // Icons
    '/android/android-launchericon-512-512.png',
    '/android/android-launchericon-192-192.png',
    '/android/android-launchericon-144-144.png',
    '/android/android-launchericon-96-96.png',
    '/android/android-launchericon-72-72.png',
    '/android/android-launchericon-48-48.png'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages immediately
            self.clients.claim()
        ])
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Handle navigation requests (like accessing index.html)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html')
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            // If index.html isn't in cache, try offline.html
                            return caches.match('/offline.html');
                        });
                })
        );
        return;
    }

    // For all other requests
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Clone the request because it can only be used once
                const fetchRequest = event.request.clone();

                // Make network request
                return fetch(fetchRequest)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone response as it can only be used once
                        const responseToCache = response.clone();

                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If fetch fails, return offline.html for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                        // Return nothing for other requests
                        return null;
                    });
            })
    );
});
