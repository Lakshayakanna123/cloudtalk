// Firebase Messaging Service Worker
// This file must be served at the root: /firebase-messaging-sw.js
// It is NOT bundled by Vite — it runs in a separate browser service worker context.
//
// IMPORTANT: Replace the Firebase config values below with your actual project values.
// Do NOT hardcode real keys in this file in a public repository.
// Consider generating this file at build time using environment variables.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

// Firebase configuration — must match your .env values
// Replace with your actual project config (this is safe to include client-side).
// Do NOT include Admin SDK credentials here.
const firebaseConfig = {
  apiKey: self.__FIREBASE_CONFIG_API_KEY__ || '',
  authDomain: self.__FIREBASE_CONFIG_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_CONFIG_PROJECT_ID__ || '',
  storageBucket: self.__FIREBASE_CONFIG_STORAGE_BUCKET__ || '',
  messagingSenderId: self.__FIREBASE_CONFIG_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_CONFIG_APP_ID__ || '',
};

// Only initialize if config is available
if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    const { notification, data } = payload;
    const notificationTitle = notification?.title ?? 'New message';
    const notificationOptions = {
      body: notification?.body ?? 'You have a new message',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data?.conversationId ?? 'cloudtalk-message',
      data: {
        conversationId: data?.conversationId,
        url: `/chat`,
      },
      actions: [
        { action: 'open', title: 'Open chat' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url ?? '/chat';
    event.waitUntil(
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  });
} else {
  console.warn('[CloudTalk SW] Firebase config not set — background messaging disabled.');
}
