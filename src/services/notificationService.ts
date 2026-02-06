import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

/** VAPID Key de Firebase Cloud Messaging (Firebase Console → Configuración del proyecto → Cloud Messaging → Web push certificates) */
const VAPID_KEY = 'BHA6YsnhfuchHZfBH8zadc8Fr0l9SPRakuSd886aMnd69n0fx40TNubK3mnGDT1UBVgjknEbKFsEnxikg_QVpPc';

// Función auxiliar para verificar que el Service Worker esté activo
const waitForServiceWorker = async (maxAttempts = 10): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active && registration.active.state === 'activated') {
        return true;
      }
    } catch (e) {
      // Continuar intentando
    }
    // Esperar 200ms antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return false;
};

/**
 * Solicita permisos de notificación y guarda el FCM Token en Firestore.
 * Esta función se llama cada vez que el usuario entra/inicia sesión para asegurar
 * que el token esté actualizado y guardado en users/{userId}.fcmToken
 * 
 * @param userId - UID del usuario autenticado
 * @returns Token FCM o null si no se pudo obtener
 */
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase Messaging no está disponible. Verifica que todas las variables VITE_FIREBASE_* estén configuradas.');
    return null;
  }

  // Verificar que el usuario esté autenticado antes de solicitar el token
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    console.warn('Usuario no autenticado. Esperando autenticación antes de solicitar token FCM.');
    return null;
  }

  // Verificar que el Service Worker esté activo (crítico para Android y notificaciones en background)
  const swReady = await waitForServiceWorker();
  if (!swReady) {
    console.warn('Service Worker no está listo. Reintentando en 2 segundos...');
    // Reintentar después de 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    const swReadyRetry = await waitForServiceWorker();
    if (!swReadyRetry) {
      console.error('Service Worker no está disponible después de múltiples intentos.');
      console.error('En Android, asegúrate de que la app esté en HTTPS o localhost.');
      return null;
    }
  }

  // Esperar un momento adicional para asegurar que la autenticación esté completa
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Verificar permisos de notificación
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones.');
      return null;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      console.info('Permisos de notificación denegados por el usuario.');
      console.info('En Android, ve a Configuración del navegador → Notificaciones para habilitarlas.');
      return null;
    }

    // Verificar nuevamente que el usuario sigue autenticado
    const userStillAuthenticated = auth.currentUser;
    if (!userStillAuthenticated || userStillAuthenticated.uid !== userId) {
      console.warn('Usuario ya no está autenticado. Cancelando solicitud de token FCM.');
      return null;
    }

    // Verificar nuevamente que el Service Worker sigue activo
    const swStillReady = await navigator.serviceWorker.ready.catch(() => null);
    if (!swStillReady) {
      console.warn('Service Worker se desactivó. No se puede obtener token FCM.');
      return null;
    }

    // Solicitar el token FCM (esto permite recibir notificaciones incluso con la pestaña cerrada)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      // Guardar/actualizar el token en Firestore cada vez que el usuario entra
      // Esto asegura que el token esté siempre actualizado para enviar notificaciones push
      try {
        await updateDoc(doc(db, 'users', userId), { 
          fcmToken: token,
          fcmTokenUpdatedAt: Date.now(), // Timestamp de cuándo se actualizó el token
        });
        console.info('✅ Token FCM obtenido y guardado en Firestore (users/' + userId + '/fcmToken)');
        console.info('📱 Este token permite recibir notificaciones push incluso con la pestaña cerrada.');
        return token;
      } catch (firestoreError) {
        console.error('Error al guardar token FCM en Firestore:', firestoreError);
        // Aún retornamos el token aunque falle el guardado
        return token;
      }
    } else {
      console.warn('No se pudo obtener el token FCM. Verifica la configuración del Service Worker.');
      console.warn('En Android, asegúrate de:');
      console.warn('1. La app está en HTTPS (o localhost en desarrollo)');
      console.warn('2. El Service Worker está registrado correctamente');
      console.warn('3. Los permisos de notificación están habilitados');
      return null;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const isSwRegistration = /service worker|serviceworker|messaging\/failed/i.test(msg);
    const isConfigError = /Missing App configuration|projectId|installations/i.test(msg);
    const isAuthError = /authentication|credential|oauth|401|unauthorized/i.test(msg);
    
    if (isAuthError) {
      console.warn('Error de autenticación al obtener token FCM. El usuario puede no estar completamente autenticado.');
      console.warn('Esto es normal si acabas de iniciar sesión. El token se solicitará automáticamente cuando estés completamente autenticado.');
    } else if (isConfigError) {
      console.error('Error de configuración de Firebase:', msg);
      console.error('Asegúrate de que todas las variables VITE_FIREBASE_* estén configuradas en .env o en Vercel');
    } else if (isSwRegistration) {
      console.error('❌ Error de Service Worker:', msg);
      console.error('En Android, verifica:');
      console.error('1. La URL es HTTPS (requerido para Service Workers)');
      console.error('2. El archivo firebase-messaging-sw.js está en /public/');
      console.error('3. El Service Worker está registrado (revisa la consola)');
      console.error('4. Los permisos del navegador permiten notificaciones');
    } else {
      console.error('Error al obtener el token FCM:', error);
    }
  }
  return null;
};

/**
 * Maneja mensajes FCM cuando la app está en foreground (pestaña abierta).
 * También envía mensajes al Service Worker para manejar navegación desde notificaciones.
 */
export const onForegroundMessage = (callback?: (payload: any) => void): void => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('[Foreground] Mensaje FCM recibido:', payload);
    
    // Si hay callback personalizado, llamarlo primero
    if (callback) {
      callback(payload);
    }
    
    // Mostrar notificación si hay contenido de notificación
    if (payload.notification) {
      const notification = new Notification(
        payload.notification.title ?? 'MyDays',
        {
          body: payload.notification.body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: payload.data?.type || 'notification',
          data: payload.data || {},
        }
      );
      
      // Manejar clic en la notificación cuando la app está en foreground
      notification.onclick = () => {
        window.focus();
        // Si es una solicitud de unión, enviar mensaje a la app para navegar
        if (payload.data?.type === 'join_request' && payload.data?.groupId) {
          // Enviar mensaje al Service Worker para que la app pueda manejar la navegación
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.active?.postMessage({
                type: 'navigate',
                groupId: payload.data.groupId,
                action: 'show_pending',
              });
            });
          }
          // También disparar evento personalizado para que App.tsx lo capture
          window.dispatchEvent(new CustomEvent('fcm-navigate', {
            detail: {
              type: 'join_request',
              groupId: payload.data.groupId,
            },
          }));
        }
        notification.close();
      };
    }
  });
};
