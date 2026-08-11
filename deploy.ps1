# ZETS final deployment helper
# Run this PowerShell script on a machine with Git and Docker installed.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

Write-Host "Pushing latest commits..." -ForegroundColor Cyan
git push origin HEAD

Write-Host "Creating clean backup archive..." -ForegroundColor Cyan
$zipPath = Join-Path $root "zets-final-backup.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
# Use tar (available on Windows 10+) with exclusions
tar -acf $zipPath --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist --exclude=.playwright --exclude=zets-final-backup.zip .

Write-Host "Starting Docker stack..." -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose up --build -d
} else {
    Write-Warning "Docker not found in PATH. Please install Docker and re-run."
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "ZETS IS LIVE! Access your portals below:" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Public Dashboard   : http://localhost:3000/public"
Write-Host "Supplier Portal    : http://localhost:3000/supplier"
Write-Host "PMU Portal         : http://localhost:3000/pmu"
Write-Host "PRAZ Regulator     : http://localhost:3000/praz"
Write-Host "Offline Bid Drafter: http://localhost:3000/offline/bid-draft"
Write-Host "=================================================" -ForegroundColor Green
Write-Host "To shut down the system, run: docker compose down"
