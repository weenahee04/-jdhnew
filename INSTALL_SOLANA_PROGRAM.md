# 🔧 ติดตั้ง Solana Program Development Tools (Windows)

## 📋 Prerequisites

ต้องติดตั้ง tools เหล่านี้ก่อน build และ deploy Solana Program:

---

## 1. ติดตั้ง Rust

### วิธีที่ 1: ใช้ rustup (แนะนำ)
```powershell
# Download และรัน installer
# ไปที่: https://rustup.rs/
# หรือรันคำสั่งนี้:
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe"

# หลังจากติดตั้งเสร็จ รีสตาร์ท PowerShell
```

### วิธีที่ 2: ใช้ Chocolatey
```powershell
choco install rust
```

### ตรวจสอบการติดตั้ง
```powershell
rustc --version
cargo --version
```

---

## 2. ติดตั้ง Solana CLI

### Windows (PowerShell)
```powershell
# Download installer
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
& "$env:TEMP\solana-install-init.exe" stable

# เพิ่ม PATH (ถ้ายังไม่มี)
$env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::User)
```

### ตรวจสอบการติดตั้ง
```powershell
solana --version
```

### ตั้งค่า Wallet (ถ้ายังไม่มี)
```powershell
solana-keygen new
```

---

## 3. ติดตั้ง Anchor Framework

### ใช้ Cargo (ต้องมี Rust ก่อน)
```powershell
# ติดตั้ง Anchor Version Manager (AVM)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# ติดตั้ง Anchor เวอร์ชันล่าสุด
avm install latest

# ใช้ Anchor เวอร์ชันล่าสุด
avm use latest

# ตรวจสอบ
anchor --version
```

### หรือติดตั้ง Anchor CLI โดยตรง
```powershell
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked --force
```

---

## 4. Build Program

หลังจากติดตั้ง tools ทั้งหมดแล้ว:

```powershell
cd "C:\Users\ADMIN\Downloads\jjdh a"

# Build program
anchor build
```

---

## 5. Deploy to Devnet

```powershell
# ตั้งค่า cluster เป็น devnet
solana config set --url devnet

# รับ SOL สำหรับ deploy (2 SOL)
solana airdrop 2

# Deploy program
anchor deploy
```

---

## 6. Deploy to Mainnet

```powershell
# ตั้งค่า cluster เป็น mainnet
solana config set --url mainnet-beta

# ตรวจสอบ balance (ต้องมี SOL สำหรับ deploy ~2-3 SOL)
solana balance

# Deploy program
anchor deploy
```

---

## ⚠️ Troubleshooting

### Rust ไม่พบ
- รีสตาร์ท PowerShell หลังติดตั้ง Rust
- ตรวจสอบ PATH: `$env:PATH`

### Solana CLI ไม่พบ
- ตรวจสอบว่า PATH ถูกต้อง: `$env:USERPROFILE\.local\share\solana\install\active_release\bin`
- รีสตาร์ท PowerShell

### Anchor ไม่พบ
- ตรวจสอบว่า Rust ติดตั้งแล้ว: `cargo --version`
- ติดตั้ง AVM อีกครั้ง: `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`

---

## 📝 Quick Start (หลังจากติดตั้งแล้ว)

```powershell
# 1. Build
anchor build

# 2. Test (ถ้ามี tests)
anchor test

# 3. Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy

# 4. Update Program ID
# หลัง deploy จะได้ Program ID จริง
# Update ใน: programs/jdh-chain/src/lib.rs (declare_id!)
# และ: clients/jdhChainClient.ts (JDH_CHAIN_PROGRAM_ID)
```

---

## 🔗 Resources

- [Rust Installation](https://www.rust-lang.org/tools/install)
- [Solana Installation](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Installation](https://www.anchor-lang.com/docs/installation)




