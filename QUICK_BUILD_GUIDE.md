# ⚡ Quick Build Guide - JDH Chain Solana Program

## 🚀 ขั้นตอนเร็วๆ

### 1. ติดตั้ง Tools (ครั้งเดียว)

```powershell
# 1. ติดตั้ง Rust
# ไปที่: https://rustup.rs/ หรือรัน:
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe"

# 2. ติดตั้ง Solana CLI
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
& "$env:TEMP\solana-install-init.exe" stable

# 3. ติดตั้ง Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# รีสตาร์ท PowerShell หลังติดตั้ง
```

### 2. Build Program

```powershell
cd "C:\Users\ADMIN\Downloads\jjdh a"
anchor build
```

### 3. Deploy to Devnet

```powershell
solana config set --url devnet
solana airdrop 2
anchor deploy
```

---

## 📍 ตำแหน่งไฟล์

- **Program:** `programs/jdh-chain/src/`
- **Config:** `Anchor.toml`
- **Client:** `clients/jdhChainClient.ts`

---

## ⚠️ หมายเหตุ

- ต้องติดตั้ง Rust, Solana CLI และ Anchor ก่อน
- ใช้เวลา ~10-30 นาทีในการติดตั้ง tools
- Build ครั้งแรกอาจใช้เวลา ~5-10 นาที



