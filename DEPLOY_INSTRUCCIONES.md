# Instrucciones para Deploy en Vercel

## Problema
Vercel no está detectando los cambios automáticamente desde GitHub.

## Solución: Deploy Directo con Vercel CLI

### Paso 1: Abre una terminal en la carpeta del proyecto
```bash
cd c:\Users\User\my-days-test
```

### Paso 2: Ejecuta el script de deploy
```bash
.\deploy.bat
```

O ejecuta directamente:
```bash
vercel --prod
```

### ¿Qué hace esto?
- Despliega **directamente** desde tu máquina local a Vercel
- **NO requiere** hacer push a GitHub
- Usa los cambios locales que ya están guardados
- Vercel tomará los archivos locales y los desplegará

## Alternativa: Push Manual a GitHub

Si prefieres que Vercel detecte los cambios automáticamente desde GitHub:

### 1. Configura credenciales de GitHub
Necesitas un **Personal Access Token** de GitHub:

1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token (classic)"
3. Dale un nombre (ej: "my-days-deploy")
4. Selecciona el scope `repo`
5. Genera el token y cópialo

### 2. Configura Git para usar el token
Cuando hagas `git push`, usa el token como contraseña:
- Usuario: `Javier-eng`
- Contraseña: `<tu-personal-access-token>`

### 3. Haz push
```bash
git push origin master
```

## Verificación

Después del deploy, verifica que los cambios estén en producción:
1. Abre tu app en Vercel
2. Revisa que el archivo `vercel.json` tenga los nuevos headers
3. Revisa que `src/main.tsx` tenga el código mejorado de captura de errores

## Nota Importante

El commit vacío ya está creado localmente (`8a08380`). Si haces deploy directo con `vercel --prod`, ese commit no se necesita porque Vercel tomará los archivos directamente de tu máquina.
