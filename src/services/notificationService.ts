import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebaseConfig';

const VAPID_KEY = 'BGNwj8r6XTdVV8CsOIihsftBYh-uxNbMNJUz1fPV2OmdssdGXiNM8Wi4QSxU4_X1Juf31JV50nuNwkcJpO2Ft8E';

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase Messaging no está disponible. Verifica que todas las variables VITE_FIREBASE_* estén configuradas.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await updateDoc(doc(db, 'users', userId), { fcmToken: token });
        return token;
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const isSwRegistration = /service worker|serviceworker|messaging\/failed/i.test(msg);
    const isConfigError = /Missing App configuration|projectId|installations/i.test(msg);
    
    if (isConfigError) {
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
