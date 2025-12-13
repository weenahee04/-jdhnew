# PowerShell Script สำหรับติดตั้ง Solana Program Development Tools
# Run as Administrator (แนะนำ)

Write-Host "เริ่มติดตั้ง Solana Development Tools..." -ForegroundColor Cyan
Write-Host ""

# 1. ตรวจสอบ Rust
Write-Host "ตรวจสอบ Rust..." -ForegroundColor Yellow
$rustInstalled = $false
try {
    $null = rustc --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $?) {
        $rustVersion = rustc --version 2>&1
        Write-Host "Rust ติดตั้งแล้ว: $rustVersion" -ForegroundColor Green
        $rustInstalled = $true
    }
} catch {
    $rustInstalled = $false
}

if (-not $rustInstalled) {
    Write-Host "Rust ยังไม่ได้ติดตั้ง" -ForegroundColor Red
    Write-Host "กำลังดาวน์โหลด Rust installer..." -ForegroundColor Yellow
    
    $rustupPath = "$env:TEMP\rustup-init.exe"
    try {
        Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupPath -ErrorAction Stop
        Write-Host "ดาวน์โหลดสำเร็จ: $rustupPath" -ForegroundColor Green
        Write-Host "กรุณารัน installer นี้: $rustupPath" -ForegroundColor Yellow
        Write-Host "หลังจากติดตั้งเสร็จ รีสตาร์ท PowerShell และรันสคริปต์นี้อีกครั้ง" -ForegroundColor Yellow
        Start-Process $rustupPath
        exit
    } catch {
        Write-Host "ไม่สามารถดาวน์โหลด Rust installer ได้: $_" -ForegroundColor Red
        exit
    }
}

# 2. ตรวจสอบ Solana CLI
Write-Host ""
Write-Host "ตรวจสอบ Solana CLI..." -ForegroundColor Yellow
$solanaInstalled = $false
try {
    $null = solana --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $?) {
        $solanaVersion = solana --version 2>&1
        Write-Host "Solana CLI ติดตั้งแล้ว: $solanaVersion" -ForegroundColor Green
        $solanaInstalled = $true
    }
} catch {
    $solanaInstalled = $false
}

if (-not $solanaInstalled) {
    Write-Host "Solana CLI ยังไม่ได้ติดตั้ง" -ForegroundColor Red
    Write-Host "กำลังติดตั้ง Solana CLI..." -ForegroundColor Yellow
    
    $solanaInstaller = "$env:TEMP\solana-install-init.exe"
    try {
        Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $solanaInstaller -ErrorAction Stop
        Write-Host "กำลังรัน Solana installer..." -ForegroundColor Yellow
        & $solanaInstaller stable
        
        # เพิ่ม PATH
        $solanaBin = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
        if (Test-Path $solanaBin) {
            $env:PATH += ";$solanaBin"
            [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::User)
            Write-Host "เพิ่ม Solana PATH แล้ว" -ForegroundColor Green
        }
        
        Write-Host "กรุณารีสตาร์ท PowerShell และรันสคริปต์นี้อีกครั้ง" -ForegroundColor Yellow
        exit
    } catch {
        Write-Host "ไม่สามารถติดตั้ง Solana CLI ได้: $_" -ForegroundColor Red
        exit
    }
}

# 3. ตรวจสอบ Anchor
Write-Host ""
Write-Host "ตรวจสอบ Anchor Framework..." -ForegroundColor Yellow
$anchorInstalled = $false
try {
    $null = anchor --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $?) {
        $anchorVersion = anchor --version 2>&1
        Write-Host "Anchor ติดตั้งแล้ว: $anchorVersion" -ForegroundColor Green
        $anchorInstalled = $true
    }
} catch {
    $anchorInstalled = $false
}

if (-not $anchorInstalled) {
    Write-Host "Anchor ยังไม่ได้ติดตั้ง" -ForegroundColor Red
    Write-Host "กำลังติดตั้ง Anchor..." -ForegroundColor Yellow
    
    # ติดตั้ง AVM
    Write-Host "   กำลังติดตั้ง Anchor Version Manager (AVM)..." -ForegroundColor Yellow
    try {
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        Write-Host "   กำลังติดตั้ง Anchor latest..." -ForegroundColor Yellow
        avm install latest
        avm use latest
        Write-Host "กรุณารีสตาร์ท PowerShell และรันสคริปต์นี้อีกครั้ง" -ForegroundColor Yellow
        exit
    } catch {
        Write-Host "ไม่สามารถติดตั้ง Anchor ได้: $_" -ForegroundColor Red
        Write-Host "กรุณาติดตั้งด้วยตนเอง: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force" -ForegroundColor Yellow
        exit
    }
}

# 4. ตรวจสอบ Solana Wallet
Write-Host ""
Write-Host "ตรวจสอบ Solana Wallet..." -ForegroundColor Yellow
$walletPath = "$env:USERPROFILE\.config\solana\id.json"
if (Test-Path $walletPath) {
    Write-Host "Solana Wallet พบแล้ว: $walletPath" -ForegroundColor Green
} else {
    Write-Host "ยังไม่มี Solana Wallet" -ForegroundColor Yellow
    Write-Host "   กำลังสร้าง wallet ใหม่..." -ForegroundColor Yellow
    try {
        solana-keygen new --no-bip39-passphrase
    } catch {
        Write-Host "ไม่สามารถสร้าง wallet ได้ (ข้ามขั้นตอนนี้)" -ForegroundColor Yellow
    }
}

# 5. สรุป
Write-Host ""
Write-Host "ติดตั้ง tools เสร็จสมบูรณ์!" -ForegroundColor Green
Write-Host ""
Write-Host "ขั้นตอนต่อไป:" -ForegroundColor Cyan
Write-Host "   1. cd 'C:\Users\ADMIN\Downloads\jjdh a'" -ForegroundColor White
Write-Host "   2. anchor build" -ForegroundColor White
Write-Host "   3. solana config set --url devnet" -ForegroundColor White
Write-Host "   4. solana airdrop 2" -ForegroundColor White
Write-Host "   5. anchor deploy" -ForegroundColor White
Write-Host ""
