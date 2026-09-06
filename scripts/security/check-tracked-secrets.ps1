[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$excluded = @(
    '.env.example',
    'package-lock.json',
    'go.sum'
)
$credentialPattern = '(?i)(password|passwd|secret|token|private[_-]?key)\s*[:=]\s*["''][^"'']{8,}["'']'
$privateKeyPattern = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
$databaseDumpPattern = '^-- PostgreSQL database dump(?: complete)?$'
$violations = [System.Collections.Generic.List[string]]::new()

foreach ($file in (git ls-files)) {
    if ($excluded | Where-Object { $file.EndsWith($_) }) { continue }
    if ($file -match '(^|/)(theme-reference|public/assets)/') { continue }
    if ($file -match '\.(md|docx|png|jpe?g|gif|webp|ico|woff2?|ttf|pdf|gz|zip)$') { continue }
    if ($file -match '(_test\.go|\.spec\.[jt]sx?|\.test\.[jt]sx?)$') { continue }
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $file))
    if (-not [System.IO.File]::Exists($fullPath)) { continue }
    if ([System.IO.FileInfo]::new($fullPath).Length -gt 2MB) { continue }

    $lineNumber = 0
    foreach ($line in [System.IO.File]::ReadLines($fullPath)) {
        $lineNumber++
        if ($line -match '\$\{[A-Z0-9_]+(?::[-?+][^}]*)?\}') { continue }
        if ($line -match '["'']\$[A-Z_][A-Z0-9_]*["'']') { continue }
        if ($line -match $credentialPattern -or $line -match $privateKeyPattern -or $line -match $databaseDumpPattern) {
            $violations.Add("${file}:${lineNumber}")
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Error ("Credential literal terdeteksi pada file tracked (nilai disembunyikan):`n" + ($violations -join "`n"))
    exit 1
}

Write-Output 'Tidak ditemukan credential literal pada source tracked.'
