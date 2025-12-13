# Easy Solana CLI Installer for Windows
# Just run this script!

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Solana CLI Easy Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if already installed
Write-Host "Checking if Solana CLI is already installed..." -ForegroundColor Yellow
$solanaCheck = Get-Command solana -ErrorAction SilentlyContinue
if ($solanaCheck) {
    $version = solana --version
    Write-Host "Solana CLI is already installed: $version" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're all set!" -ForegroundColor Green
    exit
}

Write-Host "Solana CLI not found. Starting installation..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Download
Write-Host "Step 1: Downloading installer..." -ForegroundColor Cyan
$installerPath = "$env:TEMP\solana-installer.exe"
$downloadUrl = "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe"

try {
    Write-Host "  Downloading from: $downloadUrl" -ForegroundColor Gray
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    Write-Host "  Download complete!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: Could not download installer automatically." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually:" -ForegroundColor Yellow
    Write-Host "  1. Open this URL in your browser:" -ForegroundColor White
    Write-Host "     $downloadUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Save the file to: $installerPath" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Then run this script again" -ForegroundColor White
    Write-Host ""
    exit
}

# Step 2: Install
Write-Host ""
Write-Host "Step 2: Running installer..." -ForegroundColor Cyan
Write-Host "  This will take a few minutes..." -ForegroundColor Gray

try {
    $process = Start-Process -FilePath $installerPath -ArgumentList "stable" -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "  Installation complete!" -ForegroundColor Green
    } else {
        Write-Host "  Installation may have issues. Exit code: $($process.ExitCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERROR: Could not run installer" -ForegroundColor Red
    Write-Host "  Please run manually: $installerPath" -ForegroundColor Yellow
    exit
}

# Step 3: Add to PATH
Write-Host ""
Write-Host "Step 3: Adding to PATH..." -ForegroundColor Cyan
$solanaBin = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
if (Test-Path $solanaBin) {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    if ($currentPath -notlike "*$solanaBin*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaBin", [EnvironmentVariableTarget]::User)
        Write-Host "  PATH updated!" -ForegroundColor Green
    } else {
        Write-Host "  PATH already contains Solana" -ForegroundColor Green
    }
} else {
    Write-Host "  Warning: Solana bin directory not found at expected location" -ForegroundColor Yellow
}

# Step 4: Verify
Write-Host ""
Write-Host "Step 4: Verifying installation..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Please close and reopen PowerShell, then run:" -ForegroundColor Yellow
Write-Host "  solana --version" -ForegroundColor White
Write-Host ""
Write-Host "If it doesn't work, restart your computer." -ForegroundColor Yellow
Write-Host ""

# Try to verify in current session
$env:PATH += ";$solanaBin"
Start-Sleep -Seconds 2

$solanaCheck2 = Get-Command solana -ErrorAction SilentlyContinue
if ($solanaCheck2) {
    $version = solana --version
    Write-Host "SUCCESS! Solana CLI installed: $version" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. solana-keygen new" -ForegroundColor White
    Write-Host "  2. solana config set --url devnet" -ForegroundColor White
    Write-Host "  3. solana airdrop 2" -ForegroundColor White
} else {
    Write-Host "Installation complete, but verification failed in this session." -ForegroundColor Yellow
    Write-Host "Please restart PowerShell and run: solana --version" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green



