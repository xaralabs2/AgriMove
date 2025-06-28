// AgriMove Service Worker for PWA functionality
const CACHE_NAME = 'agrimove-v1.0.0';
const STATIC_CACHE_NAME = 'agrimove-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'agrimove-dynamic-v1.0.0';

// Essential files for offline functionality
const STATIC_FILES = [
  '/',
  '/auth',
  '/orders',
  '/profile',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API endpoints to cache for offline access
const API_CACHE_PATTERNS = [
  '/api/user',
  '/api/produce',
  '/api/farms',
  '/api/orders'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('AgriMove Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('AgriMove Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('AgriMove Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('agrimove-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('AgriMove Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with cache-first strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for specific endpoints
    return createOfflineFallback(request);
  }
}

// Cache-first strategy for navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache the response
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Return cached index for offline navigation
    return caches.match('/');
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache static assets
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch:', request.url);
    throw error;
  }
}

// Create offline fallback responses
function createOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/user') {
    return new Response(JSON.stringify({ 
      offline: true, 
      message: 'Offline mode - limited functionality' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  if (url.pathname === '/api/produce') {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  return new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOfflineOrders());
  }
  
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationUpdates());
  }
});

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    // Get pending orders from IndexedDB or localStorage
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          await removePendingOrder(order.id);
          console.log('Synced offline order:', order.id);
        }
      } catch (error) {
        console.error('Failed to sync order:', order.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync location updates for drivers
async function syncLocationUpdates() {
  try {
    const pendingLocations = await getPendingLocationUpdates();
    
    for (const location of pendingLocations) {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(location)
        });
        
        if (response.ok) {
          await removePendingLocation(location.id);
        }
      } catch (error) {
        console.error('Failed to sync location:', error);
      }
    }
  } catch (error) {
    console.error('Location sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have new updates in AgriMove',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'agrimove-notification',
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icon-72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = data;
  }
  
  event.waitUntil(
    self.registration.showNotification('AgriMove', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for offline storage (placeholder implementations)
async function getPendingOrders() {
  // Implementation would use IndexedDB to store offline orders
  return [];
}

async function removePendingOrder(orderId) {
  // Implementation would remove order from IndexedDB
  console.log('Removing pending order:', orderId);
}

async function getPendingLocationUpdates() {
  // Implementation would use IndexedDB to store location updates
  return [];
}

async function removePendingLocation(locationId) {
  // Implementation would remove location from IndexedDB
  console.log('Removing pending location:', locationId);
}