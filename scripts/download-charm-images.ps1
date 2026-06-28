$ErrorActionPreference = "Continue"
$outDir = Join-Path $PSScriptRoot "..\assets\charms"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Save-Remote($id, $url, $ext = "jpg") {
  if (-not $url) { Write-Host "SKIP $id"; return $false }
  $path = Join-Path $outDir "$id.$ext"
  try {
    Invoke-WebRequest -Uri $url -OutFile $path -UseBasicParsing -TimeoutSec 25
    $size = (Get-Item $path).Length
    if ($size -lt 5000) { Write-Host "TINY $id ($size bytes) — skipped"; Remove-Item $path -Force; return $false }
    Write-Host "OK $id ($size bytes)"
    return $true
  } catch {
    Write-Host "FAIL $id — $_"
    return $false
  }
}

function Convert-WebpToJpg($id) {
  $webp = Join-Path $outDir "$id.webp"
  $jpg = Join-Path $outDir "$id.jpg"
  if (-not (Test-Path $webp)) { return $false }
  python -c @"
from PIL import Image
img = Image.open(r'$webp').convert('RGB')
img.save(r'$jpg', 'JPEG', quality=92)
"@
  if (Test-Path $jpg) { Remove-Item $webp -Force; return $true }
  return $false
}

# Silvermoon letter charms (real Nomination product photos)
$letterWebps = @{
  a = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_01-01_1024x1024_2x_b645d8c1-b592-4aad-8852-24033e0b79a3.webp?v=1732838728&width=800"
  b = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_02-01_1024x1024_2x_85394116-6221-4c92-929a-93e58b7bd191.webp?v=1732839488&width=800"
  c = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_03-01_1024x1024_2x_8857e8a7-b22f-4428-bda2-f3ac0579eddb.webp?v=1732839417&width=800"
  d = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_04-01_1024x1024_2x_fffd1288-b717-46db-bbec-5fe542461318.webp?v=1732840559&width=800"
  e = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_05-01_1024x1024_2x_b1e284e3-039c-4acc-9037-c9bacb895992.webp?v=1732840482&width=800"
  f = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_06-01_1024x1024_2x_bab55c66-51fa-447b-8173-47b88520e974.webp?v=1732843200&width=800"
  g = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_07-01_1024x1024_2x_603a0999-29d8-453e-b72c-e4094147defb.webp?v=1732840416&width=800"
  h = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_08-01_1024x1024_2x_69a0b4f9-b116-4b69-8967-c510deeb25a4.webp?v=1732840346&width=800"
  i = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_09-01_1024x1024_2x_df9ec979-2033-489f-9fda-e15c805768ac.webp?v=1732840271&width=800"
  j = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_10-01_1024x1024_2x_15047d56-2ded-40c4-a354-a489b40384d4.webp?v=1732840202&width=800"
  k = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_11-01_1024x1024_2x_f9d487b7-cdb6-41ee-86d9-c19bd80ef8c8.webp?v=1732839298&width=800"
  l = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_12-01_1024x1024_2x_7b34a69a-f12f-4fda-a780-6ef94f1c7d5e.webp?v=1732843133&width=800"
  m = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_13-01_1024x1024_2x_48754a8e-bfcb-495c-b020-100b314a2dcb.webp?v=1732848381&width=800"
  n = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_14-01_1024x1024_2x_6bcae8af-3f5a-4998-b104-67f2b0d44525.webp?v=1732839251&width=800"
  o = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_15-01_1024x1024_2x_68ec10e1-4489-40c4-b349-963887adf3b9.webp?v=1732848273&width=800"
  p = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_16-01_1024x1024_2x_3695dbb4-2988-45dd-9419-82ccc4ab61c3.webp?v=1732848136&width=800"
  r = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_18-01_1024x1024_2x_b444012a-f6be-4d61-b7ad-3e6641f325bb.webp?v=1732839177&width=800"
  s = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_19-01_1024x1024_2x_c8529526-dea9-47d9-bffc-edaa931df634.webp?v=1732840127&width=800"
  t = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_20-01_1024x1024_2x_4aec7445-3f02-43a4-bcb3-7e7ecbb681fb.webp?v=1732838925&width=800"
  u = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_21-01_1024x1024_2x_fe7d58d7-67e9-45ec-aaf7-4812df67968a.webp?v=1733198389&width=800"
  v = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_22-01_1024x1024_2x_7edd486c-8478-40d3-82e1-099a463a9eb8.webp?v=1732847777&width=800"
  w = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_23-01_1024x1024_2x_25486109-f00f-4033-9d91-4086dcd78965.webp?v=1732847627&width=800"
  x = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_24-01_1024x1024_2x_686dada4-0b59-4703-ab20-9d0d34afa6e7.webp?v=1732847542&width=800"
  y = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_25-01_1024x1024_2x_c4ae9fc7-e8cd-4d10-9254-78dec832b51b.webp?v=1732847446&width=800"
  z = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330113_26-01_1024x1024_2x_06c3f343-1d73-4cb6-a9d8-41f14b18266b.webp?v=1732847371&width=800"
}

$manifest = @{}
$nomBase = "https://www.nomination.com/media/catalog/product"
$nom = @{
  "heart-silver" = "$nomBase/3/3/330106_01_01_e32c.jpg?quality=90&fit=bounds&height=800&width=800"
  "cherry"       = "$nomBase/0/3/030215_05_01_6cb8.jpg?quality=90&fit=bounds&height=800&width=800"
  "bmw"          = "$nomBase/3/3/330311_05_01_9e8d.jpg?quality=90&fit=bounds&height=800&width=800"
  "blank-silver" = "$nomBase/S/L/SL_CONF_152_PORTALINK_2362x2362_07_6081.jpg?quality=90&fit=bounds&height=800&width=800"
}

$sm = @{
  "heart-pink"    = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33020974_1024x1024_2x_6adafb0d-5c86-4144-b240-b6a1b02ddb38.webp?v=1782353761&width=800"
  "kitten"        = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33010953_1024x1024_2x_db32a22a-ef9f-485f-bc3a-d26151dda8ab.webp?v=1733188213&width=800"
  "butterfly"     = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330321_09-01_1024x1024_2x_203fc528-a428-468c-bee4-52c42cca17c9.webp?v=1737586228&width=800"
  "cat-black"     = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330102_36_HR_1024x1024_2x_50b2aaed-6449-46ea-b8cd-b78107cdb9ee.webp?v=1732850513&width=800"
  "star"          = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330304_02_HR_1024x1024_2x_1afe7be2-d902-43a7-987f-14ff24c134f2.webp?v=1732846565&width=800"
  "infinity"      = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330304_41-01_1024x1024_2x_5590d9fc-df27-4641-aeb3-a1c6179225b1.webp?v=1733184957&width=800"
  "i-love-u"      = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/IloveYouominationLink.webp?v=1782256407&width=800"
  "bow-pink"      = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33050921_1024x1024_2x_8d89352e-3904-45cb-862b-3067edf0cc01.webp?v=1737676946&width=800"
  "bow-blue"      = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33032311_1024x1024_2x_acc50573-78c6-4f3a-aba9-4be9566b35ed.webp?v=1745968882&width=800"
  "flower"        = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330321_05-01_1024x1024_2x_fa578943-ea2e-444e-b696-b23c4bde7ca8.webp?v=1745970978&width=800"
  "moon"          = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/330111_39-01_1024x1024_2x_3088da9c-7a74-43f4-b1b5-6e39dfbf1bae.webp?v=1733288880&width=800"
  "enamel-blue"   = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33020430_1024x1024_2x_661d5718-4a66-43a2-bc2a-c6544f057c8b.webp?v=1737665945&width=800"
  "enamel-pink"   = "https://cdn.shopify.com/s/files/1/0073/2662/9957/files/33020431_1024x1024_2x_bd1cb089-1268-4f9d-8792-d9f4bc48cac0.webp?v=1737665886&width=800"
}

foreach ($l in $letterWebps.Keys) {
  $id = "letter-$l"
  if (Save-Remote $id $letterWebps[$l] "webp") {
    if (Convert-WebpToJpg $id) { $manifest[$id] = "assets/charms/$id.jpg" }
  }
  Start-Sleep -Milliseconds 150
}

if (Save-Remote "letter-q" $letterWebps["o"] "webp") {
  if (Convert-WebpToJpg "letter-q") { $manifest["letter-q"] = "assets/charms/letter-q.jpg" }
}

foreach ($id in $nom.Keys) {
  if (Save-Remote $id $nom[$id]) { $manifest[$id] = "assets/charms/$id.jpg" }
}

foreach ($id in $sm.Keys) {
  if (Save-Remote $id $sm[$id] "webp") {
    if (Convert-WebpToJpg $id) { $manifest[$id] = "assets/charms/$id.jpg" }
  }
}

$manifest | ConvertTo-Json | Set-Content (Join-Path $outDir "manifest.json")
Write-Host "Done. $($manifest.Count) images."