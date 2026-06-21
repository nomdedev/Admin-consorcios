# Script para cargar .env y ejecutar migraciones
$envFile = ".env"
$envLines = Get-Content $envFile | Where-Object { $_ -match "^[^#]" -and $_.Trim() }

foreach ($line in $envLines) {
    if ($line -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^"|"$'
        [Environment]::SetEnvironmentVariable($name, $value)
        Write-Host "Loaded $name"
    }
}

Write-Host "DATABASE_URL is set: $([bool]$env:DATABASE_URL)"
Write-Host "Executing migrations..."
cd packages/database
npm run migrate:dev
