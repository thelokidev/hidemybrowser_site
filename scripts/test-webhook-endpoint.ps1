# Test Webhook Endpoint
# This script tests if your webhook endpoint is accessible and working

Write-Host "Testing Webhook Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Get ngrok URL
try {
    $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
    $ngrokUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" }).public_url
    
    if (-not $ngrokUrl) {
        Write-Host "ERROR: ngrok is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Start ngrok first:" -ForegroundColor Yellow
        Write-Host "  .\ngrok.exe http 3000" -ForegroundColor White
        exit 1
    }
    
    Write-Host "OK: ngrok URL found: $ngrokUrl" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Cannot connect to ngrok API" -ForegroundColor Red
    Write-Host "Make sure ngrok is running on port 4040" -ForegroundColor Yellow
    exit 1
}

# Test webhook endpoint
$webhookUrl = "$ngrokUrl/api/webhooks/dodopayments"
Write-Host ""
Write-Host "Testing endpoint: $webhookUrl" -ForegroundColor Cyan

try {
    # Try a simple GET request (should fail but confirms endpoint exists)
    $response = Invoke-WebRequest -Uri $webhookUrl -Method GET -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $statusDesc = $_.Exception.Response.StatusDescription
    
    Write-Host ""
    if ($statusCode -eq 405) {
        Write-Host "OK: Endpoint is ACCESSIBLE (405 Method Not Allowed is expected)" -ForegroundColor Green
        Write-Host "    The endpoint only accepts POST requests, which is correct!" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Endpoint responded with: $statusCode $statusDesc" -ForegroundColor Yellow
        Write-Host "         This might be okay if your dev server is running" -ForegroundColor Gray
    }
}

# Check if dev server is running
Write-Host ""
Write-Host "Checking if Next.js dev server is running..." -ForegroundColor Cyan

try {
    $localhost = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "OK: Dev server is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Dev server is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start your dev server:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    exit 1
}

# Display configuration instructions
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "COPY THIS URL TO DODOPAYMENTS WEBHOOK SETTINGS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   $webhookUrl" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://dashboard.dodopayments.com/" -ForegroundColor White
Write-Host "2. Navigate to: Settings -> Webhooks" -ForegroundColor White
Write-Host "3. Update/Create webhook endpoint with the URL above" -ForegroundColor White
Write-Host "4. Copy the webhook secret (starts with whsec_)" -ForegroundColor White
Write-Host "5. Add to .env.local: DODO_WEBHOOK_SECRET=whsec_..." -ForegroundColor White
Write-Host "6. Restart dev server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete! Test by sending a webhook from DodoPayments." -ForegroundColor Green
