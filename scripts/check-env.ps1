# Environment Checker Script
# Quickly verify which Supabase environment your app is connected to

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Supabase Environment Checker" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    exit 1
}

$supabaseUrl = (Get-Content ".env" | Select-String "VITE_SUPABASE_URL").ToString()

Write-Host "Current .env Configuration:" -ForegroundColor Yellow
Write-Host "  $supabaseUrl" -ForegroundColor White
Write-Host ""

# Determine environment
if ($supabaseUrl -match "tvxrdwljausdxdtkugcc") {
    Write-Host "Connected to: STAGING" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Branch ID: tvxrdwljausdxdtkugcc" -ForegroundColor Gray
    Write-Host "  URL: https://tvxrdwljausdxdtkugcc.supabase.co" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Safe to test and experiment" -ForegroundColor Green
    Write-Host "  No production data" -ForegroundColor Green
    Write-Host "  Isolated environment" -ForegroundColor Green
    Write-Host ""
}
elseif ($supabaseUrl -match "ierrbnbghexwlwgizvww") {
    Write-Host "Connected to: PRODUCTION" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Project ID: ierrbnbghexwlwgizvww" -ForegroundColor Gray
    Write-Host "  URL: https://ierrbnbghexwlwgizvww.supabase.co" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  BE CAREFUL - Live data!" -ForegroundColor Yellow
    Write-Host "  Real customers and bookings" -ForegroundColor Yellow
    Write-Host "  Changes affect production" -ForegroundColor Yellow
    Write-Host ""
}
else {
    Write-Host "Unknown environment" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
