const CACHE = 'engz-static-v4';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('push', (event) => {
  let data = {
    title: 'ENgz إنجز ⚡',
    body: 'لديك إشعار جديد في إنجز',
    type: 'order_created',
    url: '/driver',
  };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/driver/icon-192.png',
    badge: '/icons/driver/icon-192.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: `engz-${data.type || 'alert'}-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/driver',
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'open', title: 'عرض الطلب الآن 🚀' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(data.title, options);
        if ('setAppBadge' in self.navigator) {
          await self.navigator.setAppBadge(1);
        }
      } catch (err) {
        console.error('[ServiceWorker] Failed to show notification:', err);
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/driver';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus and navigate it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  const isStatic =
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname.startsWith('/icon-') ||
    url.pathname.startsWith('/icons/');
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
