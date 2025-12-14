# Install Solana CLI
# This script will open the download page for you

Write-Host "Solana CLI Installation" -ForegroundColor Cyan
Write-Host ""
Write-Host "Due to network issues, please download manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Download from official site" -ForegroundColor Green
Write-Host "  URL: https://docs.solana.com/cli/install-solana-cli-tools" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Direct download link" -ForegroundColor Green
Write-Host "  URL: https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -ForegroundColor White
Write-Host ""
Write-Host "Opening download page..." -ForegroundColor Yellow

# Open browser to download page
Start-Process "https://docs.solana.com/cli/install-solana-cli-tools"

Write-Host ""
Write-Host "After downloading:" -ForegroundColor Cyan
Write-Host "  1. Run the installer" -ForegroundColor White
Write-Host "  2. Choose 'stable' when prompted" -ForegroundColor White
Write-Host "  3. Restart PowerShell" -ForegroundColor White
Write-Host "  4. Verify: solana --version" -ForegroundColor White
Write-Host ""




