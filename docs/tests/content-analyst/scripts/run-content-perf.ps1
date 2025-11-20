param(
    [ValidateSet('smoke','sustained','spike')]
    [string]$Profile = 'smoke',

    [string]$BaseUrl = 'https://codeanalyst-staging.up.railway.app/api',

    [string]$AuthToken = $env:CONTENT_ANALYST_TEST_TOKEN
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Error 'k6 CLI is required. Install: https://k6.io/docs/get-started/installation'
}

if (-not $AuthToken) {
    Write-Error 'Provide an auth token via -AuthToken or CONTENT_ANALYST_TEST_TOKEN env var.'
}

$scriptPath = Join-Path $PSScriptRoot 'k6-content-analyst.js'
$env:BASE_URL = $BaseUrl
$env:AUTH_TOKEN = $AuthToken
$env:TEST_PROFILE = $Profile

Write-Host "Running Content Analyst perf suite"
Write-Host "Profile : $Profile"
Write-Host "Base URL: $BaseUrl"

Push-Location $PSScriptRoot
try {
    k6 run $scriptPath
} finally {
    Pop-Location
}

