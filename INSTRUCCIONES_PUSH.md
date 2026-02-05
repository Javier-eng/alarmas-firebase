# Instrucciones para hacer Push a GitHub

## ✅ Completado:
- ✅ `git add .` - Todos los archivos agregados
- ✅ `git commit -m "Configuración completa de Firebase"` - Commit realizado
- ✅ `git remote add origin` - Remoto configurado

## 📋 Para completar el push:

### Paso 1: Obtener Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. Haz clic en **"Generate new token"** → **"Generate new token (classic)"**
3. Configura:
   - **Note**: "MyDays Test" (o el nombre que prefieras)
   - **Expiration**: Elige una fecha (ej: 90 días)
   - **Select scopes**: Marca ✅ **`repo`** (esto da acceso completo a repositorios)
4. Haz clic en **"Generate token"**
5. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)
   - Ejemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 2: Ejecutar Push

Abre tu terminal (PowerShell o CMD) y ejecuta:

```bash
cd c:\Users\User\my-days-test
git push -u origin master
```

### Paso 3: Autenticación

Cuando Git te pida credenciales:

1. **Username**: Tu nombre de usuario de GitHub (ej: `Javier-eng`)
2. **Password**: Pega el **Personal Access Token** que copiaste (NO tu contraseña de GitHub)

### Paso 4: Verificar

Después del push exitoso, ve a:
https://github.com/Javier-eng/alarmas-firebase

Deberías ver todos tus archivos allí.

## 🔒 Alternativa: Configurar credenciales guardadas

Si quieres que Git recuerde tus credenciales:

```bash
git config --global credential.helper wincred
```

Luego ejecuta el push normalmente y las credenciales se guardarán.

## ❓ Troubleshooting

### Error: "fatal: unable to access"
- Verifica que el token tenga el scope `repo`
- Asegúrate de usar el token como contraseña, no tu contraseña real

### Error: "remote: Invalid username or password"
- Verifica que estés usando el token correcto
- Asegúrate de copiar el token completo (empieza con `ghp_`)

### Error: "Permission denied"
- Verifica que tengas acceso de escritura al repositorio
- Verifica que el token tenga permisos `repo`
