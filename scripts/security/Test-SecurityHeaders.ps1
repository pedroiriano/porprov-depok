[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Domain,

    [switch]$Insecure
)

$ErrorActionPreference = 'Stop'

function Get-HeaderValues {
    param(
        [Parameter(Mandatory)]
        [string[]]$HeaderLines,

        [Parameter(Mandatory)]
        [string]$Name
    )

    $prefix = "${Name}:"
    return @(
        $HeaderLines |
            Where-Object { $_.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase) } |
            ForEach-Object { $_.Substring($_.IndexOf(':') + 1).Trim() }
    )
}

function Test-CspDirectives {
    param(
        [Parameter(Mandatory)]
        [string]$Policy,

        [Parameter(Mandatory)]
        [string]$Url
    )

    # SECURITY: base-uri, form-action, dan frame-ancestors tidak mempunyai
    # fallback ke default-src dan wajib selalu didefinisikan eksplisit.
    $requiredDirectives = @(
        'default-src',
        'base-uri',
        'object-src',
        'frame-ancestors',
        'form-action'
    )

    $definedDirectives = @(
        $Policy -split ';' |
            ForEach-Object { $_.Trim().Split(' ', 2, [StringSplitOptions]::RemoveEmptyEntries)[0] } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )

    foreach ($directive in $requiredDirectives) {
        if ($definedDirectives -notcontains $directive) {
            throw "CSP $Url tidak mendefinisikan directive wajib: $directive"
        }
    }
}

function Invoke-HeaderProbe {
    param(
        [Parameter(Mandatory)]
        [string]$Url
    )

    $headerFile = Join-Path ([IO.Path]::GetTempPath()) ("porprov-headers-{0}.txt" -f [Guid]::NewGuid())
    try {
        $arguments = @('--silent', '--show-error', '--max-time', '30', '--dump-header', $headerFile, '--output', 'NUL')
        if ($Insecure) {
            $arguments += '--insecure'
        }
        $arguments += $Url

        $output = @(& curl.exe @arguments 2>&1)
        if ($LASTEXITCODE -ne 0) {
            throw "Probe gagal untuk ${Url}: $($output -join ' ')"
        }

        $headerLines = @(
            Get-Content -LiteralPath $headerFile |
                Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        )
        if ($headerLines.Count -eq 0 -or $headerLines[0] -notmatch '^HTTP/') {
            throw "Response $Url tidak memiliki blok status HTTP"
        }
        return $headerLines
    }
    finally {
        Remove-Item -LiteralPath $headerFile -Force -ErrorAction SilentlyContinue
    }
}

$httpsBase = "https://$Domain"
$httpBase = "http://$Domain"
$targets = @(
    @{ Url = "$httpBase/"; CleartextRedirect = $true; NoStore = $false; Status = 308 },
    @{ Url = "$httpBase/robots.txt"; CleartextRedirect = $true; NoStore = $false; Status = 308 },
    @{ Url = "$httpBase/sitemap.xml"; CleartextRedirect = $true; NoStore = $false; Status = 308 },
    @{ Url = "$httpsBase/"; CleartextRedirect = $false; NoStore = $false; Status = 200 },
    @{ Url = "$httpsBase/admin"; CleartextRedirect = $false; NoStore = $false; Status = 308 },
    @{ Url = "$httpsBase/admin/"; CleartextRedirect = $false; NoStore = $true; NoUnsafeInlineStyle = $true; Status = 200 },
    @{ Url = "$httpsBase/admin/assets/images/logo-porprov.png"; CleartextRedirect = $false; NoStore = $true; NoUnsafeInlineStyle = $true; Status = 200 },
    @{ Url = "$httpsBase/robots.txt"; CleartextRedirect = $false; NoStore = $false; Status = 200 },
    @{ Url = "$httpsBase/sitemap.xml"; CleartextRedirect = $false; NoStore = $false; Status = 200 },
    @{ Url = "$httpsBase/livescore"; CleartextRedirect = $false; NoStore = $true; Status = 200 },
    @{ Url = "$httpsBase/__porprov_security_probe_not_found__"; CleartextRedirect = $false; NoStore = $false; Status = 404 },
    @{ Url = "$httpsBase/api/v1/master-data/cabors"; CleartextRedirect = $false; NoStore = $true; Status = 200 },
    @{ Url = "$httpsBase/uploads/__porprov_security_probe_not_found__"; CleartextRedirect = $false; NoStore = $false; Status = 404 },
    @{ Url = "$httpsBase/realms/porprov/.well-known/openid-configuration"; CleartextRedirect = $false; NoStore = $false; Status = 200 },
    @{
        Url = "$httpsBase/realms/porprov/protocol/openid-connect/auth?client_id=porprov-admin-web&redirect_uri=$([Uri]::EscapeDataString("$httpsBase/admin/"))&response_type=code&scope=openid&state=security-header-probe&code_challenge=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA&code_challenge_method=S256"
        CleartextRedirect = $false
        NoStore = $true
        Status = 200
    }
)

$results = foreach ($target in $targets) {
    $lines = Invoke-HeaderProbe -Url $target.Url
    $statusLine = $lines[0]
    $cspValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Content-Security-Policy')
    $hstsValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Strict-Transport-Security')
    $cacheValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Cache-Control')
    $serverValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Server')
    $poweredByValues = @(Get-HeaderValues -HeaderLines $lines -Name 'X-Powered-By')
    $frameOptionsValues = @(Get-HeaderValues -HeaderLines $lines -Name 'X-Frame-Options')
    $contentTypeOptionsValues = @(Get-HeaderValues -HeaderLines $lines -Name 'X-Content-Type-Options')
    $referrerPolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Referrer-Policy')
    $permissionsPolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Permissions-Policy')
    $openerPolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Cross-Origin-Opener-Policy')
    $embedderPolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Cross-Origin-Embedder-Policy')
    $resourcePolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'Cross-Origin-Resource-Policy')
    $crossDomainPolicyValues = @(Get-HeaderValues -HeaderLines $lines -Name 'X-Permitted-Cross-Domain-Policies')

    if ($statusLine -notmatch "^HTTP/\S+ $($target.Status)\b") {
        throw "Status $($target.Url) tidak sesuai; diharapkan $($target.Status), diterima: $statusLine"
    }

    if ($cspValues.Count -ne 1) {
        throw "Response $($target.Url) harus memiliki tepat satu CSP; ditemukan $($cspValues.Count)"
    }
    Test-CspDirectives -Policy $cspValues[0] -Url $target.Url
    if ($cspValues[0] -match '(?i)fonts\.(?:googleapis|gstatic)\.com') {
        throw "CSP $($target.Url) masih mengizinkan dependency font Google eksternal"
    }
    if ($target.NoUnsafeInlineStyle -and $cspValues[0] -match "(?i)(?:^|;)\s*style-src\s+[^;]*'unsafe-inline'") {
        throw "CSP $($target.Url) tidak boleh memakai unsafe-inline pada style-src"
    }

    if ($target.Url.StartsWith('https://', [StringComparison]::OrdinalIgnoreCase)) {
        if ($hstsValues.Count -ne 1) {
            throw "Response HTTPS $($target.Url) harus memiliki tepat satu HSTS; ditemukan $($hstsValues.Count)"
        }
        if ($hstsValues[0] -notmatch '(?i)^max-age=(\d+)(?:;|$)' -or [long]$Matches[1] -lt 31536000) {
            throw "HSTS $($target.Url) wajib memiliki max-age minimal satu tahun"
        }
        if ($hstsValues[0] -notmatch '(?i)(?:^|;)\s*includeSubDomains(?:;|$)') {
            throw "HSTS $($target.Url) wajib mencakup includeSubDomains"
        }

        $singletonHeaders = @{
            'X-Frame-Options' = $frameOptionsValues
            'X-Content-Type-Options' = $contentTypeOptionsValues
            'Referrer-Policy' = $referrerPolicyValues
            'Permissions-Policy' = $permissionsPolicyValues
            'Cross-Origin-Opener-Policy' = $openerPolicyValues
            'Cross-Origin-Embedder-Policy' = $embedderPolicyValues
            'Cross-Origin-Resource-Policy' = $resourcePolicyValues
            'X-Permitted-Cross-Domain-Policies' = $crossDomainPolicyValues
        }
        foreach ($header in $singletonHeaders.GetEnumerator()) {
            if (@($header.Value).Count -ne 1) {
                throw "Response HTTPS $($target.Url) harus memiliki tepat satu $($header.Key)"
            }
        }
        if ($contentTypeOptionsValues[0] -ne 'nosniff') {
            throw "X-Content-Type-Options $($target.Url) wajib bernilai nosniff"
        }
        if ($openerPolicyValues[0] -ne 'same-origin') {
            throw "Cross-Origin-Opener-Policy $($target.Url) wajib bernilai same-origin"
        }
        if ($embedderPolicyValues[0] -ne 'require-corp') {
            throw "Cross-Origin-Embedder-Policy $($target.Url) wajib bernilai require-corp"
        }
        if ($resourcePolicyValues[0] -ne 'same-origin') {
            throw "Cross-Origin-Resource-Policy $($target.Url) wajib bernilai same-origin"
        }
    }
    elseif ($hstsValues.Count -ne 0) {
        throw "Response HTTP $($target.Url) tidak boleh mengirim HSTS"
    }

    if ($target.CleartextRedirect) {
        if ($cspValues[0] -notmatch "form-action\s+'none'") {
            throw "CSP redirect $($target.Url) wajib memakai form-action 'none'"
        }
    }

    if ($target.NoStore -and -not ($cacheValues -match '(?:^|,)\s*(?:private,\s*)?no-store(?:\s*(?:,|$))')) {
        throw "Response sensitif $($target.Url) wajib memakai Cache-Control no-store"
    }

    if ($poweredByValues.Count -ne 0) {
        throw "Response $($target.Url) membocorkan X-Powered-By"
    }
    if ($serverValues -match '/\d') {
        throw "Response $($target.Url) membocorkan versi server: $($serverValues -join ', ')"
    }

    [pscustomobject]@{
        Url = $target.Url
        Status = $statusLine
        CspCount = $cspValues.Count
        HstsCount = $hstsValues.Count
        DefensiveHeaders = if ($target.Url.StartsWith('https://')) { 8 } else { 3 }
        CacheControl = $cacheValues -join ' | '
    }
}

$results | Format-Table -AutoSize
Write-Output 'PASS: CSP lengkap dan tunggal, HSTS HTTPS tunggal, serta header sensitif tervalidasi.'
