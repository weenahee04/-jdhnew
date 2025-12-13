# Install Solana Development Tools
# Run as Administrator

Write-Host "Starting installation..." -ForegroundColor Cyan

# Check Rust
Write-Host "Checking Rust..." -ForegroundColor Yellow
$rustCheck = Get-Command rustc -ErrorAction SilentlyContinue
if ($rustCheck) {
    $rustVersion = rustc --version
    Write-Host "Rust installed: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "Rust not installed. Downloading installer..." -ForegroundColor Red
    $rustupPath = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupPath
    Write-Host "Please run: $rustupPath" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again" -ForegroundColor Yellow
    Start-Process $rustupPath
    exit
}

# Check Solana CLI
Write-Host "Checking Solana CLI..." -ForegroundColor Yellow
$solanaCheck = Get-Command solana -ErrorAction SilentlyContinue
if ($solanaCheck) {
    $solanaVersion = solana --version
    Write-Host "Solana CLI installed: $solanaVersion" -ForegroundColor Green
} else {
    Write-Host "Solana CLI not installed. Installing..." -ForegroundColor Red
    $solanaInstaller = "$env:TEMP\solana-install-init.exe"
    Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $solanaInstaller
    & $solanaInstaller stable
    Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Yellow
    exit
}

# Check Anchor
Write-Host "Checking Anchor..." -ForegroundColor Yellow
$anchorCheck = Get-Command anchor -ErrorAction SilentlyContinue
if ($anchorCheck) {
    $anchorVersion = anchor --version
    Write-Host "Anchor installed: $anchorVersion" -ForegroundColor Green
} else {
    Write-Host "Anchor not installed. Installing..." -ForegroundColor Red
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    Write-Host "Please restart PowerShell and run this script again" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "All tools installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd 'C:\Users\ADMIN\Downloads\jjdh a'" -ForegroundColor White
Write-Host "  2. anchor build" -ForegroundColor White



