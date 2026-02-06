# Cloud Functions – Notificación al administrador

## Qué hace

Cuando un usuario **solicita unirse a un grupo** (se crea un documento en `groups/{groupId}/pending/{userId}`), la función **notifyAdminOnJoinRequest** envía una **notificación push** al **administrador del grupo** usando su FCM token guardado en `users/{ownerId}.fcmToken`.

Así el admin puede ver la notificación en el móvil y abrir la app para aprobar o rechazar.

## Requisitos

- Proyecto de Firebase con Blaze (pago) para usar Cloud Functions
- Firebase CLI instalado y proyecto vinculado

## Despliegue

1. Instalar Firebase CLI (si no lo tienes):
   ```bash
   npm install -g firebase-tools
   ```

2. Iniciar sesión y seleccionar el proyecto:
   ```bash
   firebase login
   firebase use tu-project-id
   ```

3. En la raíz del repo, inicializar Firebase (si aún no hay `firebase.json`):
   ```bash
   firebase init functions
   ```
   - Elegir “Use an existing project” y tu proyecto
   - Lenguaje: JavaScript
   - ESLint: opcional
   - Instalar dependencias: Sí

4. Entrar en `functions`, instalar dependencias y desplegar:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

5. La URL de la función aparecerá en la consola. La función se ejecuta automáticamente cuando se crea un doc en `groups/{groupId}/pending/{userId}`.

## Región

La función está en `europe-west1`. Para cambiarla, edita `region` en `functions/index.js`.

## Cómo probar

1. Usuario A crea un grupo y acepta notificaciones (tiene FCM token en su perfil).
2. Usuario B solicita unirse con el ID del grupo.
3. Usuario A debe recibir una notificación push: “Nueva solicitud de unión – [nombre] quiere unirse a [grupo]”.
4. Al abrir la app, el admin ve la solicitud en “Solicitudes de acceso” y puede aprobar o rechazar.

## Notas

- Si el admin no tiene `fcmToken` en su perfil (no aceptó notificaciones o está en un navegador sin soporte), no se envía push pero la solicitud sigue en la app.
- Si el token FCM es inválido (por ejemplo, desinstalación de la app), la función borra `fcmToken` del perfil para evitar reintentos inútiles.
