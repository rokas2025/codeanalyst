# Railway API Setup Script
$ErrorActionPreference = "Stop"

$RAILWAY_TOKEN = "cec1ffa3-3a94-47bf-a6e2-d25f2880abb4"
$RAILWAY_API = "https://backboard.railway.app/graphql/v2"

Write-Host "Connecting to Railway API..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RAILWAY_TOKEN"
    "Content-Type" = "application/json"
}

# Simple query to get projects
$body = @{
    query = "query { projects { edges { node { id name services { edges { node { id name } } } } } } }"
} | ConvertTo-Json

try {
    Write-Host "Fetching your Railway projects..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $RAILWAY_API -Method Post -Headers $headers -Body $body
    
    if ($response.data.projects) {
        Write-Host "Successfully connected to Railway!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Projects:" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($edge in $response.data.projects.edges) {
            $project = $edge.node
            Write-Host "Project: $($project.name)" -ForegroundColor Green
            Write-Host "  ID: $($project.id)" -ForegroundColor Gray
            
            if ($project.services.edges) {
                Write-Host "  Services:" -ForegroundColor Yellow
                foreach ($serviceEdge in $project.services.edges) {
                    $service = $serviceEdge.node
                    Write-Host "    - $($service.name) (ID: $($service.id))" -ForegroundColor White
                }
            }
            Write-Host ""
        }
        
        # Save for next step
        $response.data | ConvertTo-Json -Depth 10 | Out-File "railway-projects.json"
        Write-Host "Project data saved to railway-projects.json" -ForegroundColor Green
        
    } else {
        Write-Host "No projects found or authentication failed" -ForegroundColor Red
        if ($response.errors) {
            Write-Host "Errors:" -ForegroundColor Red
            $response.errors | ForEach-Object {
                Write-Host "  - $($_.message)" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
