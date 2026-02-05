import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

const VAPID_KEY = 'BGNwj8r6XTdVV8CsOIihsftBYh-uxNbMNJUz1fPV2OmdssdGXiNM8Wi4QSxU4_X1Juf31JV50nuNwkcJpO2Ft8E';

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

  // Esperar un momento para asegurar que la autenticación esté completa
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Verificar permisos de notificación
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Permisos de notificación denegados por el usuario.');
      return null;
    }

    // Verificar nuevamente que el usuario sigue autenticado
    const userStillAuthenticated = auth.currentUser;
    if (!userStillAuthenticated || userStillAuthenticated.uid !== userId) {
      console.warn('Usuario ya no está autenticado. Cancelando solicitud de token FCM.');
      return null;
    }

    // Solicitar el token FCM
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      // Guardar el token en Firestore
      try {
        await updateDoc(doc(db, 'users', userId), { fcmToken: token });
        console.info('Token FCM obtenido y guardado correctamente.');
        return token;
      } catch (firestoreError) {
        console.error('Error al guardar token FCM en Firestore:', firestoreError);
        // Aún retornamos el token aunque falle el guardado
        return token;
      }
    } else {
      console.warn('No se pudo obtener el token FCM. Verifica la configuración del Service Worker.');
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
      console.warn('Notificaciones push no disponibles (falta firebase-messaging-sw.js o no es entorno válido).');
    } else {
      console.error('Error al obtener el token FCM:', error);
    }
  }
  return null;
};

export const onForegroundMessage = (): void => {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    if (payload.notification) {
      new Notification(payload.notification.title ?? '¡Alarma MyDays!', {
        body: payload.notification.body,
        icon: '/vite.svg'
      });
    }
  });
};
