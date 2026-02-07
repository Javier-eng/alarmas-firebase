# Diagnóstico del flujo de despliegue (Git → GitHub → Vercel)

## 1. Verificación de Git local

| Comprobación | Resultado |
|--------------|-----------|
| ¿Es un repositorio git válido? | **Sí** – `git status` responde correctamente |
| Rama actual | `master` |
| Estado del árbol | `nothing to commit, working tree clean` |
| Mensaje de sincronización | `Your branch is up to date with 'origin/master'` |

**Conclusión:** El directorio es un repositorio Git válido y el estado local está limpio.

---

## 2. Repositorio remoto

```
origin  https://github.com/Javier-eng/alarmas-firebase.git (fetch)
origin  https://github.com/Javier-eng/alarmas-firebase.git (push)
```

**Importante:** El remoto está configurado por **HTTPS**, no por SSH.  
Por tanto, **las llaves SSH no se usan** para este repo. Si cambiaste solo las llaves SSH, el fallo no viene de ahí: el problema suele ser la autenticación **HTTPS** (credenciales de Windows o token).

---

## 3. Estado de sincronización

- **Rama local:** `master` → commit `b0ce739` ("Solucionando alarmas en móviles").
- **Seguimiento:** `[origin/master]` – la rama local sigue a `origin/master`.

Si no puedes hacer `git push`, los commits que crees en local **no llegarán a GitHub** y Vercel no verá cambios. El mensaje "up to date" solo indica que tu `master` y tu referencia local de `origin/master` coinciden; si nunca has hecho `git fetch` o `git push` con la nueva configuración, puede que en GitHub falten commits.

---

## 4. Verificación de Vercel

- Existe la carpeta **`.vercel`** (proyecto vinculado).
- Contenido de **`.vercel/project.json`**:
  - `projectId`: `prj_CtBtlfWcjnq8kgaHn5IACFyyviPi`
  - `orgId`: `team_MaXC1uGY2hzFQTDa4BKTaXXt`
  - `projectName`: `my-days-test`
- **`.vercel`** está en `.gitignore` (correcto; no se sube a GitHub).

**Conclusión:** No hay conflicto aparente en la configuración de Vercel; el problema está en que los cambios no llegan a GitHub (push falla).

---

## 5. Diagnóstico del error

El fallo no es de **rama** ni de **configuración de Vercel**. Es de **conexión/autenticación con GitHub**:

1. **Uso de HTTPS:** Al usar `https://github.com/...`, Git no usa tus llaves SSH. Usa el Gestor de credenciales de Windows o un token.
2. **Error típico al hacer push:**  
   `fatal: unable to access '...': schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`  
   → Indica que no hay credenciales válidas para HTTPS (o están caducadas/borradas al cambiar de llaves o de equipo).
3. **Efecto:** No puedes hacer `git push`, los commits se quedan solo en local y Vercel no recibe nada porque no hay pushes nuevos en GitHub.

---

## 6. Solución recomendada: reconectar con GitHub

Tienes dos opciones: seguir con **HTTPS** (con token) o pasar a **SSH**. Para que Vercel vuelva a detectar deploys automáticos, solo necesitas que el push a GitHub funcione.

### Opción A – Seguir con HTTPS (recomendado si quieres algo rápido)

1. **Crear un Personal Access Token (PAT) en GitHub**
   - Ir a: https://github.com/settings/tokens  
   - "Generate new token (classic)"  
   - Nombre: por ejemplo `my-days-vercel`  
   - Scope: marcar **repo**  
   - Generar y **copiar el token** (solo se muestra una vez).

2. **Hacer push (Git pedirá usuario y contraseña)**
   ```bash
   cd c:\Users\User\my-days-test
   git push origin master
   ```
   - Usuario: `Javier-eng`  
   - Contraseña: **pegar el PAT** (no la contraseña de GitHub).

3. (Opcional) Para que no pida contraseña cada vez:
   ```bash
   git config --global credential.helper store
   ```
   La próxima vez que pongas usuario + PAT, se guardarán.

4. **Comprobar que los cambios llegaron**
   - En https://github.com/Javier-eng/alarmas-firebase ver que `master` tiene los últimos commits.
   - En el dashboard de Vercel, debería aparecer un nuevo deploy automático.

---

### Opción B – Usar SSH (para usar tus nuevas llaves)

Solo tiene sentido si ya tienes la llave SSH pública añadida en GitHub (Settings → SSH and GPG keys).

1. **Comprobar que SSH funciona con GitHub**
   ```bash
   ssh -T git@github.com
   ```
   Deberías ver algo como: `Hi Javier-eng! You've successfully authenticated...`

2. **Cambiar el remoto de HTTPS a SSH**
   ```bash
   cd c:\Users\User\my-days-test
   git remote set-url origin git@github.com:Javier-eng/alarmas-firebase.git
   git remote -v
   ```
   Debe mostrar `origin  git@github.com:Javier-eng/alarmas-firebase.git (fetch y push)`.

3. **Push**
   ```bash
   git push origin master
   ```
   No debería pedir usuario/contraseña si SSH está bien configurado.

4. **Comprobar** en GitHub y en Vercel igual que en la opción A.

---

## 7. Comandos específicos (resumen)

**Si eliges HTTPS (token):**
```bash
cd c:\Users\User\my-days-test
git push origin master
```
(Usuario: `Javier-eng`, contraseña: tu PAT.)

**Si eliges SSH:**
```bash
ssh -T git@github.com
cd c:\Users\User\my-days-test
git remote set-url origin git@github.com:Javier-eng/alarmas-firebase.git
git push origin master
```

**Para ver si hay commits locales que no están en GitHub (después de un fetch):**
```bash
git fetch origin
git log origin/master..master --oneline
```
Si sale algo, esos commits están solo en local y hay que hacer push.

---

## 8. Qué debe pasar para que Vercel vuelva a desplegar solo

1. **Reconectar Git con GitHub** (HTTPS con PAT o SSH con tus llaves) como arriba.
2. **Hacer push:** `git push origin master`.
3. Vercel, al estar conectado al repo `Javier-eng/alarmas-firebase`, detectará el push y lanzará un deploy automático.

No hace falta tocar la carpeta `.vercel` ni la configuración del proyecto en Vercel para esto; el fallo está solo en que los cambios no están llegando a GitHub.
