@echo off
echo ========================================
echo   Despliegue a Vercel - MyDays Test
echo ========================================
echo.

REM Verificar si Vercel CLI está instalado
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/4] Vercel CLI no encontrado. Instalando...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: No se pudo instalar Vercel CLI.
        echo Asegurate de tener Node.js y npm instalados.
        pause
        exit /b 1
    )
    echo Vercel CLI instalado correctamente.
) else (
    echo [1/4] Vercel CLI ya esta instalado.
)
echo.

REM Verificar si está logueado (intentar un comando que requiere auth)
echo [2/4] Verificando sesion de Vercel...
vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo No estas logueado. Abriendo navegador para iniciar sesion...
    echo Por favor, acepta en el navegador cuando se abra.
    echo.
    call vercel login
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: No se pudo iniciar sesion.
        pause
        exit /b 1
    )
) else (
    echo Ya estas logueado en Vercel.
)
echo.

REM Verificar variables de entorno
echo [3/4] Verificando variables de entorno...
echo IMPORTANTE: Asegurate de haber configurado las variables VITE_FIREBASE_* en Vercel.
echo Ve a: https://vercel.com -^> Tu proyecto -^> Settings -^> Environment Variables
echo.
pause
echo.

REM Desplegar
echo [4/4] Desplegando a produccion...
echo.
call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El despliegue fallo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Despliegue completado exitosamente!
echo ========================================
echo.
echo IMPORTANTE: Copia la URL de produccion que aparece arriba
echo y añadela en Firebase Console:
echo Authentication -^> Settings -^> Authorized domains
echo.
pause
　