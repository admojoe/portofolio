<#
  Delete unused image assets (run locally on Windows PowerShell)

  Usage (PowerShell):
    cd "D:\admojoe website"
    .\tools\delete-unused-assets.ps1

  This script will delete the listed files and attempt to remove the
  empty `assets\videos` folder.
#>

$files = @(
  'assets\images\architecture.webp',
  'assets\images\commercial.webp',
  'assets\images\featured-audio-video-placeholder.webp',
  'assets\images\hasnur01.webp',
  'assets\images\industrial.webp',
  'assets\images\industrial-500.webp',
  'assets\images\industrial-1000.webp',
  'assets\images\jakarta_akademi_01.webp',
  'assets\images\rectangle_light.webp'
)

Write-Host "Preparing to delete" ($files.Count) "files..." -ForegroundColor Cyan

foreach ($f in $files) {
  if (Test-Path $f) {
    try {
      Remove-Item -LiteralPath $f -Force
      Write-Host "Deleted:" $f -ForegroundColor Green
    } catch {
      Write-Host "Failed to delete:" $f -ForegroundColor Yellow
    }
  } else {
    Write-Host "Not found (skipped):" $f -ForegroundColor DarkGray
  }
}

# Remove empty folder assets\videos if it exists
$videosDir = 'assets\videos'
if (Test-Path $videosDir) {
  $items = Get-ChildItem -LiteralPath $videosDir -Force -ErrorAction SilentlyContinue
  if ($items.Count -eq 0) {
    try {
      Remove-Item -LiteralPath $videosDir -Force
      Write-Host "Removed empty folder:" $videosDir -ForegroundColor Green
    } catch {
      Write-Host "Failed to remove folder:" $videosDir -ForegroundColor Yellow
    }
  } else {
    Write-Host "Folder not empty, skipping removal:" $videosDir -ForegroundColor DarkGray
  }
}

Write-Host "Done." -ForegroundColor Cyan
