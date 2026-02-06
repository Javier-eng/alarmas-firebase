/* eslint-disable no-restricted-globals */
// Service Worker para Firebase Cloud Messaging (notificaciones push).
// Este archivo maneja notificaciones incluso cuando la pestaña está cerrada.
// Las variables de entorno se inyectan en build time por vite-plugin-inject-env.js

importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Esta configuración se reemplaza automáticamente en build time con las variables de entorno
firebase.initializeApp({"apiKey":"","authDomain":"","projectId":"","storageBucket":"","messagingSenderId":"","appId":"","measurementId":""});

const messaging = firebase.messaging();

/**
 * Background Message Handler
 * Se ejecuta cuando llega un mensaje push mientras la app está en background o cerrada.
 * Esto permite recibir notificaciones incluso con la pestaña cerrada.
 */
messaging.onBackgroundMessage(function (payload) {
  console.log('[Service Worker] Mensaje recibido en background:', payload);
  
  const title = payload.notification?.title ?? payload.data?.title ?? 'MyDays';
  const body = payload.notification?.body ?? payload.data?.body ?? '';
  const data = payload.data || {};
  
  // Determinar el tipo de notificación para personalizar la acción
  const notificationType = data.type || 'alarm';
  const groupId = data.groupId || '';
  const userId = data.userId || '';
  
  const options = {
    body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.alarmId || notificationType || 'notification',
    requireInteraction: false,
    // Opciones adicionales para Android
    vibrate: [200, 100, 200],
    data: {
      ...data,
      // Añadir URL para abrir la app en la sección correcta
      click_action: notificationType === 'join_request' ? `/?groupId=${groupId}&pending=true` : '/',
    },
    // Opciones para iOS
    sound: 'default',
  };
  
  // Mostrar la notificación
  return self.registration.showNotification(title, options);
});

/**
 * Manejar clics en notificaciones
 * Cuando el usuario hace clic en una notificación, abre la app y navega a la sección relevante.
 */
self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notificación clickeada:', event.notification.data);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.click_action || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url || client.url.startsWith(self.location.origin)) {
          return client.focus().then(() => {
            // Si es una solicitud de unión, navegar a esa sección
            if (data.type === 'join_request' && data.groupId) {
              client.postMessage({
                type: 'navigate',
                groupId: data.groupId,
                action: 'show_pending',
              });
            }
          });
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow(url);
    })
  );
});

/**
 * Manejar cuando se recibe un mensaje mientras la app está en foreground
 * (Esto se maneja en el código principal con onMessage, pero lo dejamos aquí por si acaso)
 */
self.addEventListener('message', function (event) {
  console.log('[Service Worker] Mensaje recibido:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
