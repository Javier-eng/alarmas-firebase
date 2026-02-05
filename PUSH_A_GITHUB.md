# Instrucciones para hacer Push a GitHub

## ✅ Ya completado:
- ✅ `git add .` - Todos los archivos agregados
- ✅ `git commit -m "Configuración completa de Firebase"` - Commit realizado

## 📋 Pasos siguientes:

### 1. Si ya tienes un repositorio en GitHub:

Ejecuta estos comandos (reemplaza `TU_URL_REAL` con tu URL real):

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

**Nota**: Si tu rama se llama `master` en lugar de `main`, usa:
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin master
```

### 2. Si NO tienes repositorio en GitHub aún:

1. Ve a https://github.com/new
2. Crea un nuevo repositorio:
   - Nombre: el que quieras (ej: `my-days-test`)
   - Descripción: opcional
   - **NO marques** "Initialize this repository with a README"
   - Haz clic en "Create repository"
3. Copia la URL que aparece (ej: `https://github.com/tu-usuario/mi-repositorio.git`)
4. Ejecuta los comandos del paso 1 con tu URL real

### 3. Autenticación:

Si GitHub te pide autenticación:
- **Opción A**: Usa un Personal Access Token en lugar de tu contraseña
  - Ve a: https://github.com/settings/tokens
  - Genera un nuevo token con permisos `repo`
  - Úsalo como contraseña cuando Git lo pida

- **Opción B**: Configura SSH (más seguro a largo plazo)
  ```bash
  ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
  # Luego agrega la clave pública a GitHub: Settings → SSH and GPG keys
  ```

## 🔍 Verificar estado:

```bash
git status
git remote -v
git log --oneline
```
