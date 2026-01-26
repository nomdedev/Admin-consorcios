<#
Genera JWT_SECRET y NEXTAUTH_SECRET seguros y muestra snippets .env para Railway y Vercel.
Uso: powershell -ExecutionPolicy Bypass -File .\scripts\generate-secrets.ps1
#>

function New-RandomBase64([int]$bytes=48) {
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    $buffer = New-Object byte[] $bytes
    $rng.GetBytes($buffer)
    return [Convert]::ToBase64String($buffer)
}

$jwt = New-RandomBase64 48
$nextauth = New-RandomBase64 48

Write-Host "Generando secrets..." -ForegroundColor Green
Write-Host "JWT_SECRET=$jwt" -ForegroundColor Yellow
Write-Host "NEXTAUTH_SECRET=$nextauth" -ForegroundColor Yellow

$railwaySnippet = @"
# Railway (API) - copiar en Settings → Variables
JWT_SECRET=$jwt
NEXTAUTH_SECRET=$nextauth
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
"@

$vercelSnippet = @"
# Vercel (admin-web) - copiar en Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXTAUTH_URL=https://admin.vecinosimple.com
NEXTAUTH_SECRET=$nextauth
"@

$envDir = Join-Path $PSScriptRoot "envs"
if (-not (Test-Path $envDir)) { New-Item -ItemType Directory -Path $envDir | Out-Null }

$railwayFile = Join-Path $envDir "railway.env.template"
$vercelFile = Join-Path $envDir "vercel.admin.env.template"

$railwaySnippet | Out-File -FilePath $railwayFile -Encoding utf8
$vercelSnippet | Out-File -FilePath $vercelFile -Encoding utf8

Write-Host "\nSnippets guardados en: $railwayFile, $vercelFile" -ForegroundColor Green
Write-Host "Copiá los valores a Railway y Vercel. No subas estos archivos al repo." -ForegroundColor Cyan

Write-Host "\nRailway snippet:\n" -ForegroundColor White
Write-Host $railwaySnippet

Write-Host "\nVercel snippet (admin-web):\n" -ForegroundColor White
Write-Host $vercelSnippet
