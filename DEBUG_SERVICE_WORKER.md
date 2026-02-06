# Debugging Service Worker en Móvil

## Problema
El banner del Service Worker sale **rojo en móvil** pero **verde en PC**, lo que indica que el registro está fallando en dispositivos móviles.

## Cambios Implementados

### 1. ✅ Path Absoluto Forzado
- El código ahora usa explícitamente `/firebase-messaging-sw.js` (path absoluto desde la raíz)
- Scope configurado como `'/'` explícitamente

### 2. ✅ Captura de Error Detallada
- El código ahora captura **todos los detalles del error**
- Muestra un **alert()** en móvil con:
  - Tipo de error detectado
  - Mensaje completo
  - Path intentado
  - Scope usado
  - Stack trace (si está disponible)

### 3. ✅ Verificación de MIME Type
- Headers en `vercel.json` aseguran `Content-Type: application/javascript; charset=utf-8`
- Headers adicionales para todos los archivos `.js`
- `Service-Worker-Allowed: /` para permitir scope en toda la web

### 4. ✅ Verificación Previa del Archivo
- Intenta hacer `HEAD` request al archivo antes de registrarlo
- Detecta si el archivo no es accesible

## Cómo Ver el Error en Móvil

Cuando abras la app en móvil y el banner salga rojo:

1. **Aparecerá un alert() automáticamente** después de 1.5 segundos con el error completo
2. El alert mostrará:
   - **Tipo de error**: Error de registro / Archivo no encontrado / Error de MIME type / etc.
   - **Mensaje técnico completo**
   - **Path intentado**: `/firebase-messaging-sw.js`
   - **Scope**: `/`
   - **Detalles técnicos**: Stack trace y más información

## Errores Comunes y Soluciones

### Error: "Archivo no encontrado" o HTTP 404
**Causa**: El archivo no se copió a `dist/` durante el build
**Solución**: 
- Verifica que `public/firebase-messaging-sw.js` existe
- Vite debería copiarlo automáticamente, pero verifica en `dist/firebase-messaging-sw.js` después del build

### Error: "Error de MIME type"
**Causa**: El servidor está sirviendo el archivo con MIME type incorrecto
**Solución**: 
- Los headers en `vercel.json` deberían solucionarlo
- Verifica en Network tab del navegador que el Content-Type sea `application/javascript`

### Error: "Error de permisos/scope"
**Causa**: El Service Worker no tiene permisos para el scope `/`
**Solución**: 
- El header `Service-Worker-Allowed: /` debería solucionarlo
- Verifica que el archivo esté en la raíz de `public/`

### Error: "Error de seguridad (requiere HTTPS)"
**Causa**: Service Workers requieren HTTPS (excepto localhost)
**Solución**: 
- En producción, asegúrate de que la app esté en HTTPS
- En desarrollo local, usa `localhost` (no IP local)

### Error: "Timeout esperando activación"
**Causa**: El Service Worker tarda demasiado en activarse
**Solución**: 
- Puede ser normal en conexiones lentas
- Verifica que no haya errores en el código del Service Worker

## Verificación Manual

1. Abre la app en móvil
2. Espera el alert con el error
3. Copia el mensaje completo del alert
4. Revisa también la consola del navegador (si es accesible) para más detalles

## Próximos Pasos

Una vez que veas el error exacto en el alert del móvil, podremos:
1. Identificar la causa específica
2. Aplicar la solución correspondiente
3. Verificar que el Service Worker se registre correctamente
