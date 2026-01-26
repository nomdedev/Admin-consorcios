# Pre-deployment verification script for VecinoSimple
# Usage: .\scripts\pre-deploy-verification.ps1 [admin-web|resident-app|staff-app|all]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("admin-web", "resident-app", "staff-app", "all")]
    [string]$TargetApp
)

# Colors for output
$RED = "`e[91m"
$GREEN = "`e[92m"
$YELLOW = "`e[93m"
$BLUE = "`e[94m"
$NC = "`e[0m" # No Color

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    Write-Host "$Color$Message$NC"
}

# Main execution
Write-ColorOutput $BLUE "🚀 Starting pre-deployment verification..."
Write-Host ""

$allPassed = $true

if ($TargetApp -eq "all") {
    Write-ColorOutput $YELLOW "🔍 Verifying all apps..."
    $apps = @("admin-web", "resident-app", "staff-app")
} else {
    $apps = @($TargetApp)
}

foreach ($app in $apps) {
    Write-ColorOutput $BLUE "🔍 Verifying $app..."

    $appDir = "apps\$app"

    # Check if app directory exists
    if (-not (Test-Path $appDir)) {
        Write-ColorOutput $RED "❌ App directory $appDir not found"
        $allPassed = $false
        continue
    }

    # Navigate to app directory
    Push-Location $appDir

    try {
        # Check if package.json exists
        if (-not (Test-Path "package.json")) {
            Write-ColorOutput $RED "❌ package.json not found in $appDir"
            $allPassed = $false
            continue
        }

        # Check if vercel.json exists
        if (-not (Test-Path "vercel.json")) {
            Write-ColorOutput $RED "❌ vercel.json not found in $appDir"
            $allPassed = $false
            continue
        }

        # Check if src/app directory exists
        if (-not (Test-Path "src\app")) {
            Write-ColorOutput $RED "❌ src\app directory not found in $appDir"
            $allPassed = $false
            continue
        }

        # Check for required error pages
        $requiredPages = @("error.tsx", "not-found.tsx")
        foreach ($page in $requiredPages) {
            if (-not (Test-Path "src\app\$page")) {
                Write-ColorOutput $YELLOW "⚠️  $page not found in $appDir\src\app"
            }
        }

        # App-specific checks
        if ($app -eq "resident-app" -or $app -eq "staff-app") {
            # Check for offline page
            if (-not (Test-Path "src\app\offline\page.tsx")) {
                Write-ColorOutput $YELLOW "⚠️  offline/page.tsx not found in $appDir\src\app"
            }

            # Check for maintenance page
            if (-not (Test-Path "src\app\mantenimiento\page.tsx")) {
                Write-ColorOutput $YELLOW "⚠️  mantenimiento/page.tsx not found in $appDir\src\app"
            }

            # Check for PWA files
            if (-not (Test-Path "public\manifest.json")) {
                Write-ColorOutput $YELLOW "⚠️  manifest.json not found in $appDir\public"
            }
        }

        # Try to build the app
        Write-ColorOutput $BLUE "🔨 Testing build for $app..."
        $buildResult = & pnpm build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput $GREEN "✅ Build successful for $app"
        } else {
            Write-ColorOutput $RED "❌ Build failed for $app"
            Write-Host $buildResult
            $allPassed = $false
            continue
        }

        Write-ColorOutput $GREEN "✅ $app verification passed"

    } finally {
        Pop-Location
    }

    if ($TargetApp -eq "all") {
        Write-Host ""
    }
}

Write-Host ""
if ($allPassed) {
    Write-ColorOutput $GREEN "🎉 Pre-deployment verification completed successfully!"
    Write-Host ""
    Write-ColorOutput $YELLOW "📋 Ready for deployment. You can now run:"
    Write-Host "  .\scripts\deploy.ps1 $TargetApp"
} else {
    Write-ColorOutput $RED "❌ Pre-deployment verification failed. Please fix the issues above."
    exit 1
}