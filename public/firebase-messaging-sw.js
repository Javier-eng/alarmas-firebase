/* eslint-disable no-restricted-globals */
// Service worker para Firebase Cloud Messaging (notificaciones push).
// Las variables de entorno se inyectan en build time por vite-plugin-inject-env.js

importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Esta configuración se reemplaza automáticamente en build time con las variables de entorno
firebase.initializeApp({"apiKey":"","authDomain":"","projectId":"","storageBucket":"","messagingSenderId":"","appId":"","measurementId":""});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title ?? payload.data?.title ?? 'MyDays';
  const body = payload.notification?.body ?? payload.data?.body ?? '';
  const options = {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: payload.data?.alarmId || 'alarm',
    requireInteraction: false,
  };
  self.registration.showNotification(title, options);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
