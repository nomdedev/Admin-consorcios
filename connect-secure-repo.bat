@echo off
echo 🔒 Conectando al nuevo repositorio seguro...
echo.

REM Verificar que estamos en el directorio correcto
if not exist ".git" (
    echo ❌ Error: No se encuentra repositorio Git
    pause
    exit /b 1
)

REM Agregar el nuevo remote
git remote add origin https://github.com/nomdedev/vecinosimple-secure.git

REM Cambiar a rama main
git branch -M main

REM Push inicial
echo 📤 Subiendo código seguro...
git push -u origin main

echo.
echo ✅ ¡Repositorio seguro conectado exitosamente!
echo.
echo 🔐 Próximos pasos de seguridad:
echo 1. Genera nuevos secrets: node scripts/generate-secrets.js
echo 2. Configura variables en Vercel/Railway/Supabase
echo 3. Actualiza DNS y dominios si es necesario
echo.
pause