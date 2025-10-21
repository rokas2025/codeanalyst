# Railway Environment Variables Setup Script
# This script uses Railway's GraphQL API to configure environment variables

$RAILWAY_TOKEN = "cec1ffa3-3a94-47bf-a6e2-d25f2880abb4"
$RAILWAY_API = "https://backboard.railway.app/graphql/v2"

Write-Host "Setting up Railway Development Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Test authentication
Write-Host "Testing Railway API connection..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $RAILWAY_TOKEN"
    "Content-Type" = "application/json"
}

# Query to get projects
$query = @{
    query = "query { me { id email projects { edges { node { id name services { edges { node { id name } } } } } } } }"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $RAILWAY_API -Method Post -Headers $headers -Body $query
    
    if ($response.data.me) {
        Write-Host "✅ Successfully connected to Railway!" -ForegroundColor Green
        Write-Host "User: $($response.data.me.email)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Projects found:" -ForegroundColor Yellow
        
        foreach ($edge in $response.data.me.projects.edges) {
            $project = $edge.node
            Write-Host "  - $($project.name) (ID: $($project.id))" -ForegroundColor White
            
            if ($project.services.edges.Count -gt 0) {
                Write-Host "    Services:" -ForegroundColor Gray
                foreach ($serviceEdge in $project.services.edges) {
                    $service = $serviceEdge.node
                    Write-Host "      * $($service.name) (ID: $($service.id))" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error connecting to Railway API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "This might be a Vercel token instead of a Railway token." -ForegroundColor Yellow
    Write-Host "Please get your Railway API token from:" -ForegroundColor Yellow
    Write-Host "  https://railway.app/account/tokens" -ForegroundColor Cyan
}

