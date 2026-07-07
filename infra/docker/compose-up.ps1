param(
    [switch]$NoForceRecreate,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Services
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$localDockerConfig = Join-Path $scriptDir ".docker-cli"

if (-not (Test-Path -LiteralPath $localDockerConfig)) {
    New-Item -ItemType Directory -Path $localDockerConfig | Out-Null
}

$env:DOCKER_CONFIG = $localDockerConfig
Set-Location -LiteralPath $scriptDir

Write-Host "Using Docker config: $localDockerConfig"

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$dockerVersionOutput = & docker version --format "{{.Server.Version}}" 2>&1
$dockerVersionExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

if ($dockerVersionExitCode -ne 0) {
    $message = @"
Docker Engine belum bisa diakses dari terminal ini.

Langkah perbaikan Windows:
1. Buka Docker Desktop dan tunggu sampai status engine running.
2. Jika masih permission denied, buka PowerShell sebagai Administrator.
3. Jalankan: net localgroup docker-users $env:USERNAME /add
4. Logout atau restart Windows, lalu jalankan ulang script ini.

Detail error:
$dockerVersionOutput
"@
    Write-Host $message -ForegroundColor Red
    exit 1
}

$composeArgs = @("compose", "up", "-d")

if (-not $NoForceRecreate) {
    $composeArgs += "--force-recreate"
}

if ($Services.Count -gt 0) {
    $composeArgs += $Services
}

& docker @composeArgs
exit $LASTEXITCODE
