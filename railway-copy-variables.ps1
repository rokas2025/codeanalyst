# Railway Variables Copy Script
$ErrorActionPreference = "Stop"

$RAILWAY_TOKEN = "cec1ffa3-3a94-47bf-a6e2-d25f2880abb4"
$RAILWAY_API = "https://backboard.railway.app/graphql/v2"

$headers = @{
    "Authorization" = "Bearer $RAILWAY_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "Fetching environment variables..." -ForegroundColor Cyan
Write-Host ""

# Production service ID (codeanalyst)
$prodServiceId = "db8d0941-1563-4e4b-b918-81fa26a25dad"

# Development service ID (web)
$devServiceId = "34acccef-54a8-419a-8673-ee86a8caf4f4"

# Query to get service details including variables
$query = @{
    query = "query { service(id: `"$prodServiceId`") { id name variables { edges { node { id name } } } } }"
} | ConvertTo-Json

try {
    Write-Host "Step 1: Checking production service..." -ForegroundColor Yellow
    $prodResponse = Invoke-RestMethod -Uri $RAILWAY_API -Method Post -Headers $headers -Body $query
    
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host ($prodResponse | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
