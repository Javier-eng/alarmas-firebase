# Guía: Configurar Variables de Entorno en Vercel

## Paso 1: Obtener las credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **⚙️ Configuración del proyecto** (ícono de engranaje)
4. Desplázate hacia abajo hasta **Tus aplicaciones**
5. Si ya tienes una app web, haz clic en ella. Si no, crea una nueva app web (ícono `</>`)
6. En la sección **SDK setup and configuration**, encontrarás un objeto de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

## Paso 2: Configurar Variables en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables **una por una**:

### Variables Requeridas:

| Nombre de Variable | Valor | Ejemplo |
|-------------------|------|---------|
| `VITE_FIREBASE_API_KEY` | `apiKey` del objeto de configuración | `AIzaSy...` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` del objeto de configuración | `mi-proyecto-123` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` del objeto de configuración | `mi-proyecto.firebaseapp.com` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` del objeto de configuración | `mi-proyecto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` del objeto de configuración | `123456789` |
| `VITE_FIREBASE_APP_ID` | `appId` del objeto de configuración | `1:123456789:web:abcdef` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` del objeto de configuración (opcional) | `G-XXXXXXXXXX` |

### Pasos detallados para agregar cada variable:

1. Haz clic en **Add New**
2. En **Key**, escribe el nombre de la variable (ej: `VITE_FIREBASE_API_KEY`)
3. En **Value**, pega el valor correspondiente
4. Selecciona los **Environments** donde aplicará:
   - ✅ **Production** (obligatorio)
   - ✅ **Preview** (recomendado)
   - ✅ **Development** (opcional, solo si pruebas en Vercel)
5. Haz clic en **Save**
6. Repite para cada variable

## Paso 3: Verificar que las variables estén configuradas

Después de agregar todas las variables, deberías ver una lista como esta:

```
VITE_FIREBASE_API_KEY          [Production, Preview]
VITE_FIREBASE_PROJECT_ID       [Production, Preview]
VITE_FIREBASE_AUTH_DOMAIN      [Production, Preview]
VITE_FIREBASE_STORAGE_BUCKET   [Production, Preview]
VITE_FIREBASE_MESSAGING_SENDER_ID [Production, Preview]
VITE_FIREBASE_APP_ID           [Production, Preview]
VITE_FIREBASE_MEASUREMENT_ID   [Production, Preview]
```

## Paso 4: Redesplegar la aplicación

**IMPORTANTE**: Después de agregar las variables de entorno, debes redesplegar:

1. Ve a la pestaña **Deployments**
2. Haz clic en los **3 puntos** (⋯) del deployment más reciente
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo commit y push a tu repositorio

## Paso 5: Verificar que funciona

Después del redeploy:
1. Abre tu aplicación en producción
2. Abre la consola del navegador (F12)
3. No deberías ver errores sobre "Missing App configuration value: projectId"
4. Deberías poder iniciar sesión con Google

## Troubleshooting

### Error: "Missing App configuration value: projectId"
- Verifica que todas las variables estén escritas exactamente como se muestra (con `VITE_` al inicio)
- Verifica que hayas hecho redeploy después de agregar las variables
- Verifica que las variables estén habilitadas para **Production**

### Error: Variables no aparecen en Vercel
- Asegúrate de estar en la página correcta: **Settings** → **Environment Variables**
- Verifica que estés en el proyecto correcto
- Intenta refrescar la página

### Las variables están pero la app sigue sin funcionar
- Verifica que los valores sean correctos (copia y pega directamente de Firebase Console)
- Asegúrate de que no haya espacios extra al inicio o final de los valores
- Verifica que hayas seleccionado **Production** en los environments
- Haz un redeploy completo

## Nota sobre seguridad

✅ **Es seguro** exponer estas variables de entorno porque:
- Son variables públicas que Firebase está diseñado para exponer en el cliente
- El prefijo `VITE_` las hace accesibles en el navegador (es intencional)
- Firebase tiene reglas de seguridad en Firestore para proteger los datos

❌ **NO compartas**:
- Las claves privadas de Firebase Admin SDK
- Los tokens de servicio
- Cualquier credencial que no empiece con `VITE_`
