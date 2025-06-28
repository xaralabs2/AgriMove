// Progressive Web App utilities for AgriMove

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  showUpdateAvailableNotification();
                } else {
                  // First time installation
                  console.log('AgriMove is now available offline');
                }
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}

function showUpdateAvailableNotification() {
  // Create a simple notification for app updates
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('AgriMove Update Available', {
      body: 'A new version of AgriMove is available. Refresh to update.',
      icon: '/icon-192.svg',
      tag: 'app-update'
    });
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}

export async function subscribeToPushNotifications(userId: number) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
      });
      
      // Send subscription to server
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription
        })
      });
      
      console.log('Push notification subscription successful');
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getVapidPublicKey(): string {
  // In production, this should come from environment variables
  return 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLUDIOnIBgf9EdkuypzZZF5s_NTDSYbfU_gLFzJ9K7sxQx9h8LD_b4';
}

export function checkStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
}

export function addToHomeScreenSupported(): boolean {
  return 'beforeinstallprompt' in window || 
         /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Offline storage utilities
export class OfflineStorage {
  private dbName = 'agrimove-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for offline data
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('status', 'status', { unique: false });
          orderStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('locations')) {
          const locationStore = db.createObjectStore('locations', { keyPath: 'id' });
          locationStore.createIndex('userId', 'userId', { unique: false });
          locationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('produce')) {
          db.createObjectStore('produce', { keyPath: 'id' });
        }
      };
    });
  }

  async storeOfflineOrder(order: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    await store.add({
      ...order,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending-sync'
    });
  }

  async getOfflineOrders(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineOrder(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    
    await store.delete(id);
  }

  async storeLocationUpdate(location: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    
    await store.add({
      ...location,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
  }

  async cacheProduce(produce: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['produce'], 'readwrite');
    const store = transaction.objectStore('produce');
    
    // Clear existing data
    await store.clear();
    
    // Store new data
    for (const item of produce) {
      await store.add(item);
    }
  }

  async getCachedProduce(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['produce'], 'readonly');
    const store = transaction.objectStore('produce');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();