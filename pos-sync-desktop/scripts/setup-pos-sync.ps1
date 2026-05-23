#Requires -Version 5.1
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$posDir = Join-Path $root "pos-sync-desktop"

Write-Host "== Alhayaa POS Sync setup ==" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js غير مثبت." -ForegroundColor Red
  exit 1
}

Push-Location $posDir
try {
  if (-not (Test-Path "node_modules")) { npm install }
  npm run build

  $userData = Join-Path $env:APPDATA "alhayaa-pos-sync"
  $configFile = Join-Path $userData "config.json"
  New-Item -ItemType Directory -Force -Path $userData | Out-Null
  Copy-Item "config.example.json" $configFile -Force
  Write-Host "تم الإعداد: $configFile" -ForegroundColor Green
  Write-Host "شغّل: npm run dev  أو  release\Alhayaa-POSSync-Setup-1.0.0.exe"
}
finally {
  Pop-Location
}
