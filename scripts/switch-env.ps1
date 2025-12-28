param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("production", "staging")]
    [string]$Environment
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Environment Switcher" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$sourceFile = ".env.$Environment"

if (-not (Test-Path $sourceFile)) {
    Write-Host "ERROR: $sourceFile not found!" -ForegroundColor Red
    exit 1
}

# Backup current .env
if (Test-Path ".env") {
    Copy-Item -Path ".env" -Destination ".env.backup" -Force
    Write-Host "Backed up current .env to .env.backup" -ForegroundColor Gray
}

# Switch to new environment
Copy-Item -Path $sourceFile -Destination ".env" -Force

Write-Host ""
Write-Host "Switched to $Environment environment!" -ForegroundColor Green
Write-Host ""

# Show current configuration
Write-Host "Current Configuration:" -ForegroundColor Yellow
Get-Content ".env" | Select-String "VITE_SUPABASE_URL" | ForEach-Object {
    Write-Host "  $_" -ForegroundColor White
}
Write-Host ""

# Remind about dev server
Write-Host "IMPORTANT: Restart your dev server for changes to take effect!" -ForegroundColor Yellow
Write-Host "  1. Stop: Ctrl+C in the terminal running 'npm run dev'" -ForegroundColor Gray
Write-Host "  2. Start: npm run dev" -ForegroundColor Gray
Write-Host ""

if ($Environment -eq "staging") {
    Write-Host "You are now using STAGING database:" -ForegroundColor Cyan
    Write-Host "  - Empty database with schema only" -ForegroundColor White
    Write-Host "  - Safe to test new features" -ForegroundColor White
    Write-Host "  - No production data" -ForegroundColor White
}
else {
    Write-Host "You are now using PRODUCTION database:" -ForegroundColor Red
    Write-Host "  - BE CAREFUL - This is live data!" -ForegroundColor Yellow
    Write-Host "  - Real customer data" -ForegroundColor White
    Write-Host "  - Real bookings" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
