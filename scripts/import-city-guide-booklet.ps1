[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$ApiBaseUrl = "http://localhost:8000/api/v1",
    [string]$KeycloakUrl = "http://localhost:8080",
    [string]$Realm = "porprov",
    [string]$ClientId = "porprov-mobile-admin",
    [string]$Username = $(if ($env:PORPROV_SEED_USERNAME) { $env:PORPROV_SEED_USERNAME } else { "admin_depok" }),
    [string]$DataPath = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DataPath)) {
    $DataPath = Join-Path $PSScriptRoot "..\data\city-guide\booklet-porprov-xv-2026.json"
}

function Get-NormalizedKey {
    param([Parameter(Mandatory)]$Item)

    return ("{0}|{1}" -f $Item.title.Trim().ToLowerInvariant(), $Item.category.Trim().ToLowerInvariant())
}

function Get-ResponseItems {
    param($Response)

    if ($null -eq $Response) {
        return
    }
    if ($Response -is [string] -and $Response.Trim() -eq "null") {
        return
    }
    if ($Response.PSObject.Properties.Name -contains "data") {
        if ($null -eq $Response.data) {
            return
        }
        return @($Response.data)
    }
    return @($Response)
}

if (-not (Test-Path -LiteralPath $DataPath -PathType Leaf)) {
    throw "Dataset City Guide tidak ditemukan: $DataPath"
}

$resolvedDataPath = (Resolve-Path -LiteralPath $DataPath).Path
$records = Get-Content -Raw -LiteralPath $resolvedDataPath | ConvertFrom-Json
$records = @($records)
if ($records.Count -ne 165) {
    throw "Dataset harus memuat tepat 165 entri, tetapi ditemukan $($records.Count)."
}

$requiredCategories = [ordered]@{
    "Coffee Shop" = 62
    "Wisata Kuliner" = 10
    "Tempat Menginap" = 42
    "Wisata Buatan" = 17
    "Wisata Situ" = 12
    "Pusat Perbelanjaan" = 11
    "Rumah Sakit" = 11
}

foreach ($category in $requiredCategories.Keys) {
    $actual = @($records | Where-Object category -eq $category).Count
    if ($actual -ne $requiredCategories[$category]) {
        throw "Kategori '$category' harus berisi $($requiredCategories[$category]) entri, ditemukan $actual."
    }
}

foreach ($record in $records) {
    if ([string]::IsNullOrWhiteSpace($record.title) -or
        [string]::IsNullOrWhiteSpace($record.category) -or
        [string]::IsNullOrWhiteSpace($record.address) -or
        $null -eq $record.latitude -or
        $null -eq $record.longitude) {
        throw "Data wajib tidak lengkap pada '$($record.booklet_title)'."
    }
}

if ($DryRun) {
    Write-Host "Dry run valid: $($records.Count) entri siap diimpor dari $resolvedDataPath"
    $requiredCategories.GetEnumerator() | ForEach-Object {
        Write-Host ("- {0}: {1}" -f $_.Key, $_.Value)
    }
    exit 0
}

$password = $env:PORPROV_SEED_PASSWORD
if ([string]::IsNullOrWhiteSpace($password)) {
    $securePassword = Read-Host "Password Keycloak untuk '$Username'" -AsSecureString
    $credential = [System.Net.NetworkCredential]::new("", $securePassword)
    $password = $credential.Password
}

$tokenEndpoint = "$($KeycloakUrl.TrimEnd('/'))/realms/$Realm/protocol/openid-connect/token"
$tokenResponse = Invoke-RestMethod -Method Post -Uri $tokenEndpoint -ContentType "application/x-www-form-urlencoded" -Body @{
    grant_type = "password"
    client_id = $ClientId
    username = $Username
    password = $password
}
if ([string]::IsNullOrWhiteSpace($tokenResponse.access_token)) {
    throw "Keycloak tidak mengembalikan access token."
}

$headers = @{ Authorization = "Bearer $($tokenResponse.access_token)" }
$endpoint = "$($ApiBaseUrl.TrimEnd('/'))/master-data/city-guides"
$existingResponse = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$existingItems = @((Get-ResponseItems $existingResponse) | Where-Object { $null -ne $_ })
$existingByKey = @{}

foreach ($item in $existingItems) {
    $key = Get-NormalizedKey $item
    if ($existingByKey.ContainsKey($key)) {
        Write-Warning "Duplikat aktif sudah ada untuk '$($item.title)' / '$($item.category)'; entri pertama dipakai sebagai target update."
        continue
    }
    $existingByKey[$key] = $item
}

$created = 0
$updated = 0
$failed = 0

foreach ($record in $records) {
    $key = Get-NormalizedKey $record
    $existing = $existingByKey[$key]
    $imageUrl = [string]$record.image_url
    if ([string]::IsNullOrWhiteSpace($imageUrl) -and $null -ne $existing) {
        $imageUrl = [string]$existing.image_url
    }
    $payload = @{
        title = [string]$record.title
        category = [string]$record.category
        description = [string]$record.description
        address = [string]$record.address
        image_url = $imageUrl
        latitude = [double]$record.latitude
        longitude = [double]$record.longitude
    } | ConvertTo-Json -Depth 5

    try {
        if ($null -ne $existing) {
            $target = "$endpoint/$($existing.id)"
            if ($PSCmdlet.ShouldProcess("$($record.title) [$($record.category)]", "Update City Guide")) {
                Invoke-RestMethod -Method Put -Uri $target -Headers $headers -ContentType "application/json; charset=utf-8" -Body $payload | Out-Null
                $updated++
            }
        }
        else {
            if ($PSCmdlet.ShouldProcess("$($record.title) [$($record.category)]", "Create City Guide")) {
                $createdItem = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -ContentType "application/json; charset=utf-8" -Body $payload
                $existingByKey[$key] = $createdItem
                $created++
            }
        }
    }
    catch {
        $failed++
        Write-Error "Gagal mengimpor '$($record.title)' [$($record.category)]: $($_.Exception.Message)" -ErrorAction Continue
    }
}

$verificationResponse = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$verificationItems = @((Get-ResponseItems $verificationResponse) | Where-Object { $null -ne $_ })
$verificationKeys = @{}
foreach ($item in $verificationItems) {
    $verificationKeys[(Get-NormalizedKey $item)] = $true
}
$missing = @($records | Where-Object { -not $verificationKeys.ContainsKey((Get-NormalizedKey $_)) })

Write-Host "Import City Guide selesai: created=$created updated=$updated failed=$failed active_total=$($verificationItems.Count) missing_dataset=$($missing.Count)"
if ($failed -gt 0 -or $missing.Count -gt 0) {
    throw "Import belum lengkap. Periksa error di atas."
}
