#Requires -Version 5.1
<#
.SYNOPSIS
  Prepare Alhayaa production files on Windows (before uploading to VPS).

.EXAMPLE
  cd infra
  Copy-Item .env.example .env
  # Edit .env with your DOMAIN and secrets
  .\scripts\deploy.ps1 -Bootstrap
  .\scripts\deploy.ps1 -Ssl
#>
param(
    [switch]$Bootstrap,
    [switch]$Ssl,
    [switch]$GenerateSecrets
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Get-DotEnv {
    param([string]$Path)
    $vars = @{}
    if (-not (Test-Path $Path)) { return $vars }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $vars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
    return $vars
}

if ($GenerateSecrets) {
    function New-RandomSecret([int]$Bytes = 48) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $buf = New-Object byte[] $Bytes
        $rng.GetBytes($buf)
        return [Convert]::ToBase64String($buf) -replace '[+/=]', 'x'
    }
    Write-Host "POSTGRES_PASSWORD=$(New-RandomSecret)"
    Write-Host "JWT_ACCESS_SECRET=$(New-RandomSecret)"
    Write-Host "JWT_REFRESH_SECRET=$(New-RandomSecret)"
    exit 0
}

$envFile = Join-Path $Root ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "Missing infra/.env — copy .env.example and edit values."
    exit 1
}

$env = Get-DotEnv $envFile
$domain = $env["DOMAIN"]
if (-not $domain) {
    Write-Error "Set DOMAIN in infra/.env"
    exit 1
}

if ($Bootstrap) {
    Copy-Item (Join-Path $Root "nginx\default.bootstrap.conf") (Join-Path $Root "nginx\default.conf") -Force
    Write-Host "Nginx bootstrap config written (HTTP only)."
}

if ($Ssl) {
    $template = Get-Content (Join-Path $Root "nginx\default.conf.template") -Raw
    $out = $template -replace 'DOMAIN_PLACEHOLDER', $domain
    Set-Content -Path (Join-Path $Root "nginx\default.conf") -Value $out -NoNewline
    Write-Host "Nginx HTTPS config written for domain: $domain"
}

if (-not $Bootstrap -and -not $Ssl) {
    Write-Host "Alhayaa deploy helper (Windows)"
    Write-Host ""
    Write-Host "  .\scripts\deploy.ps1 -GenerateSecrets   # random passwords for .env"
    Write-Host "  .\scripts\deploy.ps1 -Bootstrap         # HTTP nginx config (first deploy)"
    Write-Host "  .\scripts\deploy.ps1 -Ssl               # HTTPS nginx config (after SSL)"
    Write-Host ""
    Write-Host "On the VPS (Linux), run:"
    Write-Host "  chmod +x scripts/deploy.sh"
    Write-Host "  ./scripts/deploy.sh"
}
