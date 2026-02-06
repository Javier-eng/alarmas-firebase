# Configuración Completa de Firebase Cloud Messaging (FCM)

## ✅ Implementación Completada

### 1. Background Listener en Service Worker

**Archivo:** `public/firebase-messaging-sw.js`

- ✅ **`onBackgroundMessage`**: Maneja notificaciones cuando la pestaña está cerrada o en background
- ✅ **`notificationclick`**: Maneja clics en notificaciones para abrir la app y navegar a la sección correcta
- ✅ Soporte para Android e iOS con opciones específicas (vibrate, sound, badge)
- ✅ Navegación inteligente: si es una solicitud de unión, abre directamente la sección de solicitudes pendientes

### 2. Guardado Automático del FCM Token

**Archivo:** `src/services/notificationService.ts`

- ✅ **`requestNotificationPermission()`**: Se llama cada vez que el usuario entra/inicia sesión
- ✅ Guarda el token en `users/{userId}.fcmToken` en Firestore
- ✅ También guarda `fcmTokenUpdatedAt` con timestamp de cuándo se actualizó
- ✅ Verifica que el Service Worker esté activo antes de solicitar el token
- ✅ Maneja errores y reintentos automáticamente

**Archivo:** `src/contexts/AuthContext.tsx`

- ✅ Llama a `requestNotificationPermission()` automáticamente después del login
- ✅ Actualiza el estado del perfil con el token obtenido

### 3. Notificación Push al Administrador

**Archivo:** `functions/index.js` (Cloud Function)

- ✅ **Trigger:** Se ejecuta automáticamente cuando se crea un documento en `groups/{groupId}/pending/{userId}`
- ✅ **Proceso:**
  1. Lee el grupo para obtener el `owner` (administrador)
  2. Lee `users/{ownerId}` para obtener el `fcmToken`
  3. Envía notificación push usando Firebase Admin SDK
  4. Si el token es inválido, lo limpia del perfil

**Mensaje enviado:**
- **Título:** "Nueva solicitud de unión"
- **Cuerpo:** "[Nombre] quiere unirse a [Grupo]. Abre la app para aprobar o rechazar."
- **Datos adicionales:** `type: "join_request"`, `groupId`, `userId`, `displayName`

### 4. Navegación desde Notificaciones

**Archivo:** `src/App.tsx`

- ✅ Escucha mensajes del Service Worker
- ✅ Escucha eventos personalizados de FCM
- ✅ Cuando llega una notificación de tipo `join_request`, navega automáticamente al grupo y muestra las solicitudes pendientes

## Flujo Completo

### Cuando un usuario solicita unirse a un grupo:

1. **Usuario B** solicita unirse al grupo (crea doc en `groups/{groupId}/pending/{userId}`)
2. **Cloud Function** se dispara automáticamente (`notifyAdminOnJoinRequest`)
3. **Cloud Function** lee el grupo → obtiene `owner`
4. **Cloud Function** lee `users/{ownerId}` → obtiene `fcmToken`
5. **Cloud Function** envía notificación push usando `messaging.send()`
6. **Usuario A (admin)** recibe la notificación en su móvil (incluso con la app cerrada)
7. **Usuario A** hace clic en la notificación
8. **Service Worker** abre la app y navega a la sección de solicitudes pendientes
9. **Usuario A** puede aprobar o rechazar desde el móvil

## Verificación

### 1. Verificar que el token se guarda:

En la consola del navegador, después de iniciar sesión, deberías ver:
```
✅ Token FCM obtenido y guardado en Firestore (users/{uid}/fcmToken)
📱 Este token permite recibir notificaciones push incluso con la pestaña cerrada.
```

### 2. Verificar en Firestore:

Ve a Firebase Console → Firestore → `users/{userId}` y verifica que exista:
- `fcmToken`: string con el token FCM
- `fcmTokenUpdatedAt`: número con timestamp

### 3. Verificar Service Worker:

En Chrome DevTools → Application → Service Workers:
- Deberías ver `firebase-messaging-sw.js` registrado y activo
- Estado: "activated and is running"

### 4. Probar notificación de unión:

1. Usuario A crea un grupo y acepta notificaciones
2. Usuario B solicita unirse al grupo
3. Usuario A debería recibir una notificación push (incluso con la app cerrada)
4. Al hacer clic, la app se abre y muestra las solicitudes pendientes

## Despliegue de Cloud Function

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Importante:** El proyecto debe estar en plan **Blaze** (pago) para usar Cloud Functions.

## Troubleshooting

### El token no se guarda:
- Verifica que el usuario haya aceptado permisos de notificación
- Verifica que el Service Worker esté registrado
- Revisa la consola del navegador para errores

### Las notificaciones no llegan:
- Verifica que la Cloud Function esté desplegada
- Verifica que el `fcmToken` esté guardado en Firestore
- Verifica los logs de Cloud Functions: `firebase functions:log`
- En Android, verifica que las notificaciones estén habilitadas en configuración del navegador

### La navegación no funciona:
- Verifica que el Service Worker esté escuchando mensajes
- Revisa la consola del navegador para errores de navegación
