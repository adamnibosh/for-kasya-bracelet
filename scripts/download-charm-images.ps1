$ErrorActionPreference = "Continue"
$outDir = Join-Path $PSScriptRoot "..\assets\charms"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$base = "https://www.nomination.com"
$known = @{
  "heart-silver"   = "$base/media/catalog/product/3/3/330106_01_01_e32c.jpg"
  "cherry"         = "$base/media/catalog/product/0/3/030215_05_01_6cb8.jpg"
  "cat-black"      = "$base/media/catalog/product/3/3/330102_36_01_7237.jpg"
  "butterfly"      = "$base/media/catalog/product/3/3/330304_35_01_a850.jpg"
  "kitten"         = "$base/media/catalog/product/3/3/330111_45_01_fc2b.jpg"
  "bmw"            = "$base/media/catalog/product/3/3/330311_05_01_9e8d.jpg"
  "star"           = "$base/media/catalog/product/0/3/030110_17_01_fda7.jpg"
  "blank-silver"   = "$base/media/catalog/product/S/L/SL_CONF_152_PORTALINK_2362x2362_07_6081.jpg"
}

function Get-FirstProductImage($slug) {
  try {
    $url = "$base/us_en/$slug"
    $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15).Content
    if ($html -match 'media/catalog/product/([0-9a-zA-Z_/]+_01_[0-9a-zA-Z]+\.jpg)') {
      return "$base/media/catalog/product/$($matches[1])"
    }
  } catch {}
  return $null
}

function Save-Image($id, $imgUrl) {
  if (-not $imgUrl) { Write-Host "SKIP $id"; return $false }
  $path = Join-Path $outDir "$id.jpg"
  try {
    Invoke-WebRequest -Uri "$imgUrl`?quality=90&fit=bounds&height=800&width=800" -OutFile $path -UseBasicParsing -TimeoutSec 20
    Write-Host "OK $id"
    return $true
  } catch {
    Write-Host "FAIL $id - $_"
    return $false
  }
}

$manifest = @{}

foreach ($k in $known.Keys) {
  if (Save-Image $k $known[$k]) { $manifest[$k] = "assets/charms/$k.jpg" }
}

foreach ($letter in [char[]](65..90)) {
  $l = $letter.ToString().ToLower()
  $id = "letter-$l"
  $slug = "composable-classic-link-letter-$l-silver"
  $img = Get-FirstProductImage $slug
  if (-not $img -and $letter -eq 'A') { $img = $known['letter-a'] }
  if ($img -and (Save-Image $id $img)) { $manifest[$id] = "assets/charms/$id.jpg" }
  Start-Sleep -Milliseconds 300
}

$moreSlugs = @{
  "heart-pink"    = @("composable-classic-link-heart-enamel-pink", "composable-classic-link-pink-enamel-heart", "composable-classic-link-enamel-heart")
  "infinity"      = @("composable-classic-link-infinity", "composable-classic-link-silver-infinity")
  "i-love-u"      = @("composable-classic-link-i-love-you", "composable-classic-link-love")
  "moon"          = @("composable-classic-link-moon", "composable-classic-link-moon-silver-stars")
  "flower"        = @("composable-classic-link-flower", "composable-classic-link-silver-flower")
  "enamel-blue"   = @("composable-classic-link-blue", "composable-classic-link-enamel-blue")
  "enamel-pink"   = @("composable-classic-link-pink", "composable-classic-link-enamel-pink")
  "bow-pink"      = @("composable-classic-link-bow", "composable-classic-link-ribbon-pink")
  "bow-blue"      = @("composable-classic-link-blue-bow")
  "jellyfish"     = @("composable-classic-link-jellyfish", "composable-classic-link-sea")
  "checkered-red" = @("composable-classic-link-check", "composable-classic-link-vichy")
  "heart-magnetic"= @("composable-classic-link-magnetic-heart", "composable-classic-link-heart-magnetic")
  "nameplate"     = @("composable-classic-link-name", "composable-classic-link-custom-name")
}

foreach ($id in $moreSlugs.Keys) {
  foreach ($slug in $moreSlugs[$id]) {
    $img = Get-FirstProductImage $slug
    if ($img -and (Save-Image $id $img)) { $manifest[$id] = "assets/charms/$id.jpg"; break }
  }
}

# Fallbacks: reuse closest real photo
$fallbacks = @{
  "heart-pink"     = "heart-silver"
  "heart-magnetic" = "heart-silver"
  "infinity"       = "heart-silver"
  "i-love-u"       = "heart-silver"
  "moon"           = "star"
  "flower"         = "cherry"
  "enamel-blue"    = "butterfly"
  "enamel-pink"    = "heart-silver"
  "bow-pink"       = "heart-silver"
  "bow-blue"       = "butterfly"
  "jellyfish"      = "butterfly"
  "checkered-red"  = "cherry"
  "nameplate"      = "letter-a"
}
foreach ($id in $fallbacks.Keys) {
  if (-not $manifest.ContainsKey($id) -and $manifest.ContainsKey($fallbacks[$id])) {
    Copy-Item (Join-Path $outDir "$($fallbacks[$id]).jpg") (Join-Path $outDir "$id.jpg") -Force
    $manifest[$id] = "assets/charms/$id.jpg"
    Write-Host "FALLBACK $id <- $($fallbacks[$id])"
  }
}

$manifest | ConvertTo-Json | Set-Content (Join-Path $outDir "manifest.json")
Write-Host "Done. $($manifest.Count) images."