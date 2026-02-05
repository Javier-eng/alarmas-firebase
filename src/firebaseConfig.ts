import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim();

// Validar que los campos requeridos no estén vacíos
if (!apiKey || !projectId) {
  throw new Error(
    `Faltan variables de entorno de Firebase requeridas. Define VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID en .env o en Vercel (Environment Variables).\n` +
    `Valores actuales: apiKey=${apiKey ? '✓' : '✗'}, projectId=${projectId ? '✓' : '✗'}\n` +
    `Ver .env.example para más información.`
  );
}

// Construir configuración de Firebase con valores validados
const firebaseConfig: {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
} = {
  apiKey,
  projectId, // Requerido - siempre debe estar presente
};

// Agregar campos opcionales solo si están presentes
if (authDomain) firebaseConfig.authDomain = authDomain;
if (storageBucket) firebaseConfig.storageBucket = storageBucket;
if (messagingSenderId) firebaseConfig.messagingSenderId = messagingSenderId;
if (appId) firebaseConfig.appId = appId;
if (measurementId) firebaseConfig.measurementId = measurementId;

const app = initializeApp(firebaseConfig);

// Verificar que la inicialización fue exitosa
if (!app.options.projectId) {
  throw new Error(
    `Firebase no se inicializó correctamente. projectId es requerido.\n` +
    `Configuración recibida: ${JSON.stringify(firebaseConfig, null, 2)}`
  );
}

// Auth (incl. Google) está habilitado al usar getAuth; en Firebase Console activa "Inicio de sesión con Google"
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore: sin caché persistente para asegurar sincronización entre dispositivos.
// La caché local puede causar que los datos no se sincronicen entre dispositivos.
// Usamos getFirestore() que siempre prioriza el servidor como fuente de verdad.
export const db = getFirestore(app);

let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined' && projectId && messagingSenderId && appId) {
  // Solo inicializar Messaging si tenemos todas las configuraciones necesarias
  try {
    // Verificar que el app esté correctamente inicializado con projectId
    if (app.options.projectId) {
      messaging = getMessaging(app);
    } else {
      console.warn('Firebase Messaging no disponible: projectId no está configurado correctamente');
    }
  } catch (e) {
    const error = e as Error;
    // Solo mostrar warning si no es un error de configuración crítica
    if (!error.message.includes('projectId') && !error.message.includes('Missing App configuration')) {
      console.warn('Firebase Messaging no disponible (ej. localhost o configuración incompleta):', error.message);
    } else {
      console.error('Error crítico al inicializar Firebase Messaging:', error.message);
      console.error('Asegúrate de que todas las variables VITE_FIREBASE_* estén configuradas correctamente');
    }
  }
}
export { messaging };

export default app;
