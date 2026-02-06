@echo off
echo ========================================
echo   Push a GitHub y Deploy en Vercel
echo ========================================
echo.

REM Verificar estado de Git
echo [1/3] Verificando estado de Git...
git status
echo.

REM Mostrar commits pendientes
echo [2/3] Commits locales pendientes de push:
git log origin/master..HEAD --oneline
echo.

REM Instrucciones para push
echo [3/3] Para hacer push a GitHub:
echo.
echo IMPORTANTE: Necesitas un Personal Access Token de GitHub
echo.
echo 1. Ve a: https://github.com/settings/tokens
echo 2. Click en "Generate new token (classic)"
echo 3. Dale un nombre: "my-days-deploy"
echo 4. Selecciona el scope: repo
echo 5. Genera el token y copialo
echo.
echo Luego ejecuta:
echo   git push origin master
echo.
echo Cuando te pida credenciales:
echo   Usuario: Javier-eng
echo   Contraseña: [pega tu Personal Access Token aqui]
echo.
echo Vercel detectara automaticamente el push y hara el deploy.
echo.
pause
