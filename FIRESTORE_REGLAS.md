# Reglas de Firestore para MyDays Test

Si al **Crear grupo** la app se queda colgada o ves en la consola del navegador un error tipo **"Permission denied"** o **"Missing or insufficient permissions"**, hay que configurar las reglas de Firestore.

## Pasos

1. Entra en [Firebase Console](https://console.firebase.google.com) y abre tu proyecto.
2. En el menú izquierdo: **Firestore Database** → pestaña **Reglas**.
3. **Borra** todo lo que haya y **pega** exactamente las reglas del archivo **`firestore.rules`** de este proyecto (en la raíz del repo).
4. Pulsa **Publicar**.

## Reglas que debes pegar

Copia todo el contenido del archivo `firestore.rules`. Debe verse así (resumen):

- **users**: cada usuario solo puede leer/escribir su propio documento (`userId == request.auth.uid`).
- **groups**: se puede crear un grupo si eres el `owner`; leer/actualizar si eres `owner` o estás en `members`.
- **groups/{groupId}/alarms**: leer/escribir alarmas solo si eres miembro de ese grupo (owner o en `members`).

Después de publicar las reglas, vuelve a la app y prueba de nuevo **Crear Nuevo Grupo**. Cuando el grupo se cree, verás la pantalla con **Alarmas del Grupo**, el formulario **Crear Nueva Alarma** (con selector de fecha, hora y etiqueta) y la lista de alarmas programadas.
