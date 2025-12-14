# ติดตั้ง Solana CLI (ต้องใช้ Administrator)

Write-Host "=== ติดตั้ง Solana CLI ===" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่าเป็น Administrator หรือไม่
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: ต้องใช้ PowerShell as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "วิธีแก้:" -ForegroundColor Yellow
    Write-Host "1. กด Win + X" -ForegroundColor White
    Write-Host "2. เลือก 'Windows PowerShell (Admin)' หรือ 'Terminal (Admin)'" -ForegroundColor White
    Write-Host "3. รันสคริปต์นี้อีกครั้ง" -ForegroundColor White
    Write-Host ""
    Write-Host "หรือรันคำสั่งนี้โดยตรง:" -ForegroundColor Yellow
    Write-Host "cd `$env:USERPROFILE\Downloads" -ForegroundColor Cyan
    Write-Host ".\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir `"`$env:USERPROFILE\.local\share\solana\install`" v1.18.26" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ ตรวจสอบ Administrator privileges สำเร็จ" -ForegroundColor Green
Write-Host ""

# ไปที่ Downloads
$downloadsPath = "$env:USERPROFILE\Downloads"
cd $downloadsPath

Write-Host "Version: v1.18.26" -ForegroundColor Green
Write-Host "กำลังติดตั้ง..." -ForegroundColor Yellow
Write-Host ""

# ติดตั้ง Solana CLI
$installPath = "$env:USERPROFILE\.local\share\solana\install"
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir $installPath v1.18.26

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== ติดตั้งสำเร็จ! ===" -ForegroundColor Green
    Write-Host ""
    
    # เพิ่ม PATH
    $solanaBinPath = "$installPath\active_release\bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
    
    if ($currentPath -notlike "*$solanaBinPath*") {
        Write-Host "กำลังเพิ่ม PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaBinPath", [EnvironmentVariableTarget]::User)
        Write-Host "✓ เพิ่ม PATH สำเร็จ" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "=== ขั้นตอนต่อไป ===" -ForegroundColor Cyan
    Write-Host "1. รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)" -ForegroundColor White
    Write-Host "2. ตรวจสอบ: solana --version" -ForegroundColor White
    Write-Host "3. ตั้งค่า: solana config set --url devnet" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "=== ติดตั้งล้มเหลว ===" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
}


