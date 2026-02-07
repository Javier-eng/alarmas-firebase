@echo off
chcp 65001 >nul
echo.
echo ============================================================
echo   DIAGNOSTICO: Git - GitHub - Vercel
echo ============================================================
echo.

echo [1] Repositorio Git y remoto
echo ------------------------------------------------------------
git status
echo.
git remote -v
echo.

echo [2] Rama y ultimo commit
echo ------------------------------------------------------------
git branch -vv
git log -1 --oneline
echo.

echo [3] Prueba de conexion SSH a GitHub
echo ------------------------------------------------------------
echo Ejecutando: ssh -T git@github.com
echo.
ssh -T git@github.com
echo.
echo (Si ves "successfully authenticated" = SSH OK. Si falla = usa HTTPS con token.)
echo.

echo [4] Commits locales que aun no estan en origin/master
echo ------------------------------------------------------------
git fetch origin 2>nul
git log origin/master..master --oneline
if errorlevel 1 echo No se pudo hacer fetch. Revisa conexion o credenciales.
echo.

echo [5] Configuracion Vercel
echo ------------------------------------------------------------
if exist .vercel\project.json (
    type .vercel\project.json
) else (
    echo No existe .vercel\project.json
)
echo.

echo ============================================================
echo   RESUMEN Y PROXIMOS PASOS
echo ============================================================
echo.
echo - Si SSH funciono: puedes usar:
echo     git remote set-url origin git@github.com:Javier-eng/alarmas-firebase.git
echo     git push origin master
echo.
echo - Si SSH fallo: usa HTTPS con Personal Access Token:
echo     1. Crea un token en https://github.com/settings/tokens (scope: repo)
echo     2. Ejecuta: git push origin master
echo     3. Usuario: Javier-eng   Contraseña: [tu token]
echo.
echo Detalle completo en: DIAGNOSTICO_DEPLOY.md
echo.
pause
