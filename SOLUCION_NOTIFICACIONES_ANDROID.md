# Solución: Notificaciones Push en Android

## Problemas Comunes y Soluciones

### 1. ✅ Service Worker no está activo

**Síntoma**: Las notificaciones funcionan en PC pero no en Android.

**Causa**: En Android, el Service Worker debe estar completamente activo antes de solicitar el token FCM.

**Solución implementada**:
- El código ahora espera a que el Service Worker esté activo antes de solicitar el token
- Se hacen múltiples intentos con esperas entre ellos
- Se verifica el estado del Service Worker antes de cada operación

### 2. ✅ HTTPS Requerido

**Síntoma**: Las notificaciones no funcionan en producción móvil.

**Causa**: Los Service Workers requieren HTTPS (excepto localhost).

**Solución**:
- ✅ Verifica que tu app en Vercel esté en HTTPS
- ✅ En desarrollo local, usa `localhost` (no IP local)

### 3. ✅ Permisos del Navegador

**Síntoma**: El usuario no recibe notificaciones aunque todo esté configurado.

**Causa**: Android tiene controles de permisos más estrictos.

**Solución**:
1. Ve a Configuración del navegador en Android
2. Busca "Notificaciones" o "Sitios web"
3. Encuentra tu dominio (ej: `tu-app.vercel.app`)
4. Asegúrate de que las notificaciones estén habilitadas

### 4. ✅ Service Worker no se registra

**Síntoma**: Error al registrar el Service Worker en Android.

**Causa**: El Service Worker puede tardar más en registrarse en móviles.

**Solución implementada**:
- El código ahora registra el Service Worker inmediatamente (no espera a `load`)
- También registra cuando la página carga (fallback)
- Espera a que el SW esté activo antes de continuar

### 5. ✅ VAPID Key Incorrecto

**Síntoma**: Error 401 al obtener el token FCM.

**Causa**: El VAPID key no coincide con el configurado en Firebase Console.

**Solución**:
1. Ve a Firebase Console → Configuración del proyecto → Cloud Messaging
2. En "Web configuration", copia el VAPID key
3. Actualiza `VAPID_KEY` en `src/services/notificationService.ts`

### 6. ✅ Firebase Messaging no habilitado

**Síntoma**: Error al inicializar Firebase Messaging.

**Causa**: Cloud Messaging no está habilitado en el proyecto.

**Solución**:
1. Ve a Firebase Console → Configuración del proyecto
2. Asegúrate de que Cloud Messaging esté habilitado
3. Si no está, habilítalo en la sección correspondiente

## Verificación Paso a Paso

### En el Navegador (Chrome DevTools):

1. **Abre la consola del navegador** (F12 o menú → Más herramientas → Consola)
2. **Verifica el Service Worker**:
   - Ve a Application → Service Workers
   - Deberías ver `firebase-messaging-sw.js` registrado y activo
   - Estado: "activated and is running"

3. **Verifica los permisos**:
   - Ve a Application → Notifications
   - Deberías ver tu dominio con permisos "granted"

4. **Verifica el token FCM**:
   - En la consola, busca: "✅ Token FCM obtenido y guardado correctamente"
   - Si no aparece, revisa los errores en la consola

### En Android:

1. **Abre Chrome en Android**
2. **Ve a tu app** (ej: `https://tu-app.vercel.app`)
3. **Abre el menú** (3 puntos) → Configuración → Configuración del sitio
4. **Verifica Notificaciones**: Debe estar en "Permitir"
5. **Si no está permitido**: Tócalo y cambia a "Permitir"

## Debugging

### Logs Útiles en la Consola:

- ✅ `Service Worker registrado correctamente` - SW funcionando
- ✅ `Token FCM obtenido y guardado correctamente` - Token obtenido
- ⚠️ `Service Worker no está listo` - SW no activo aún
- ❌ `Error de Service Worker` - Problema con el SW
- ❌ `Permisos de notificación denegados` - Usuario bloqueó notificaciones

### Comandos de Debug:

En la consola del navegador, ejecuta:

```javascript
// Verificar Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers registrados:', regs);
  regs.forEach(reg => {
    console.log('SW:', reg.scope, 'Estado:', reg.active?.state);
  });
});

// Verificar permisos
console.log('Permisos de notificación:', Notification.permission);

// Verificar Firebase Messaging
import { messaging } from './firebaseConfig';
import { getToken } from 'firebase/messaging';
getToken(messaging, { vapidKey: 'TU_VAPID_KEY' }).then(token => {
  console.log('Token FCM:', token);
});
```

## Checklist de Verificación

- [ ] La app está en HTTPS (o localhost en desarrollo)
- [ ] El Service Worker está registrado y activo
- [ ] Los permisos de notificación están "granted"
- [ ] El VAPID key es correcto
- [ ] Cloud Messaging está habilitado en Firebase
- [ ] Las variables VITE_FIREBASE_* están configuradas
- [ ] El archivo `firebase-messaging-sw.js` está en `/public/`
- [ ] El usuario está autenticado cuando se solicita el token

## Si Nada Funciona

1. **Limpia la caché del navegador** en Android
2. **Desregistra el Service Worker**:
   - Application → Service Workers → Unregister
3. **Recarga la página** (Ctrl+Shift+R o Cmd+Shift+R)
4. **Vuelve a intentar** iniciar sesión

## Notas Importantes

- ⚠️ **Android Chrome** puede tener restricciones adicionales de batería que afectan las notificaciones
- ⚠️ **Modo de ahorro de energía** puede desactivar las notificaciones
- ⚠️ **Modo de datos limitados** puede afectar el registro del Service Worker
- ✅ Las notificaciones funcionan mejor cuando la app está en segundo plano o cerrada
