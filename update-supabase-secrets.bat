@echo off
echo 🔄 Actualizando .env.local con nuevos secrets de Supabase...
echo.

REM Crear backup del .env.local actual
copy .env.local .env.local.backup-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2% 2>nul

echo 📝 Pega los nuevos valores de Supabase (uno por línea):
echo.

echo 🔑 SERVICE_ROLE_KEY:
set /p SERVICE_ROLE_KEY=

echo 🔑 JWT_SECRET:
set /p JWT_SECRET=

echo 🔑 ANON_KEY:
set /p ANON_KEY=

echo 🔑 DATABASE_PASSWORD:
set /p DB_PASSWORD=

echo.
echo ✅ Actualizando .env.local...

REM Actualizar NEXT_PUBLIC_SUPABASE_ANON_KEY
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=\".*\"', 'NEXT_PUBLIC_SUPABASE_ANON_KEY=\"%ANON_KEY%\"' | Set-Content .env.local"

REM Agregar SUPABASE_SERVICE_ROLE_KEY si no existe
findstr /C:"SUPABASE_SERVICE_ROLE_KEY" .env.local >nul
if errorlevel 1 (
    echo. >> .env.local
    echo # Supabase Service Role Key (Backend only) >> .env.local
    echo SUPABASE_SERVICE_ROLE_KEY="%SERVICE_ROLE_KEY%" >> .env.local
) else (
    powershell -Command "(Get-Content .env.local) -replace 'SUPABASE_SERVICE_ROLE_KEY=\".*\"', 'SUPABASE_SERVICE_ROLE_KEY=\"%SERVICE_ROLE_KEY%\"' | Set-Content .env.local"
)

REM Agregar SUPABASE_JWT_SECRET si no existe
findstr /C:"SUPABASE_JWT_SECRET" .env.local >nul
if errorlevel 1 (
    echo SUPABASE_JWT_SECRET="%JWT_SECRET%" >> .env.local
) else (
    powershell -Command "(Get-Content .env.local) -replace 'SUPABASE_JWT_SECRET=\".*\"', 'SUPABASE_JWT_SECRET=\"%JWT_SECRET%\"' | Set-Content .env.local"
)

REM Actualizar DATABASE_URL con nueva password
powershell -Command "(Get-Content .env.local) -replace 'DATABASE_URL=\"postgresql://[^:]+:[^@]+@', 'DATABASE_URL=\"postgresql://postgres:%DB_PASSWORD%@' | Set-Content .env.local"

echo.
echo ✅ .env.local actualizado exitosamente!
echo 📋 Backup creado: .env.local.backup-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
echo.
echo 🔍 Ejecuta 'node scripts/verify-secrets.js' para verificar
echo.
pause