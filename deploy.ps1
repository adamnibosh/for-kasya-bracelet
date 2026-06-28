$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$repoName = "for-kasya-bracelet"
$owner = "adamnibosh"
$url = "https://$owner.github.io/$repoName/?for=Kasya"
$gifterUrl = "https://$owner.github.io/$repoName/?view=gifter&for=Kasya"

Write-Host "`n=== Deploy $repoName ===" -ForegroundColor Magenta

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Sign in to GitHub..." -ForegroundColor Yellow
    gh auth login --hostname github.com --git-protocol https --web
}

git add -A
$dirty = git status --porcelain
if ($dirty) {
    $msg = if ($args[0]) { $args[0] } else { "Update bracelet designer" }
    git commit -m $msg
}

git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

Write-Host "`nPushed. Waiting for GitHub Pages..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds(180)
$live = $false
while ((Get-Date) -lt $deadline) {
    $status = gh api "repos/$owner/$repoName/pages" --jq .status 2>$null
    try {
        $html = (Invoke-WebRequest -Uri "https://$owner.github.io/$repoName/" -UseBasicParsing -TimeoutSec 15).Content
        if ($status -eq "built" -and $html -like "*Charm Atelier*") {
            $live = $true
            break
        }
    } catch {}
    Write-Host "  waiting... ($status)" -ForegroundColor DarkYellow
    Start-Sleep -Seconds 10
}

Write-Host "`n========================================" -ForegroundColor Magenta
if ($live) {
    Write-Host " LIVE!" -ForegroundColor Green
} else {
    Write-Host " Pushed - may take 1-2 min to build" -ForegroundColor Yellow
}
Write-Host " Send Kasya:  $url" -ForegroundColor Cyan
Write-Host " Your view:    $gifterUrl" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Magenta

Set-Content -Path "$env:USERPROFILE\Desktop\kasya-bracelet-link.txt" -Value @"
Send this to Kasya:
$url

Your gifter view (after she shares her design link):
$gifterUrl
"@