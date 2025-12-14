# ⚡ Build JDH Chain Program - ตอนนี้!

## ⚠️ สถานะ: ต้องติดตั้ง Tools ก่อน

Tools ยังไม่ได้ติดตั้ง ต้องติดตั้งก่อน build

---

## 🚀 วิธีติดตั้งเร็วที่สุด

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ (แนะนำ)

1. **เปิด PowerShell as Administrator**
   - คลิกขวาที่ PowerShell → Run as Administrator

2. **รันสคริปต์:**
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   .\install-solana-tools.ps1
   ```

3. **รอให้ติดตั้งเสร็จ** (10-30 นาที)

4. **รีสตาร์ท PowerShell**

5. **Build:**
   ```powershell
   anchor build
   ```

---

### วิธีที่ 2: ติดตั้งด้วยตนเอง (เร็วขึ้น)

#### 1. ติดตั้ง Rust
```powershell
# ดาวน์โหลดและรัน
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
& "$env:TEMP\rustup-init.exe"
```
**⚠️ หลังติดตั้งเสร็จ → รีสตาร์ท PowerShell**

#### 2. ติดตั้ง Solana CLI
```powershell
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
& "$env:TEMP\solana-install-init.exe" stable
```
**⚠️ หลังติดตั้งเสร็จ → รีสตาร์ท PowerShell**

#### 3. ติดตั้ง Anchor
```powershell
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```
**⚠️ หลังติดตั้งเสร็จ → รีสตาร์ท PowerShell**

#### 4. ตรวจสอบ
```powershell
rustc --version
solana --version
anchor --version
```

#### 5. Build!
```powershell
cd "C:\Users\ADMIN\Downloads\jjdh a"
anchor build
```

---

## ⏱️ เวลาที่ใช้

- **ติดตั้ง Rust:** ~5-10 นาที
- **ติดตั้ง Solana CLI:** ~2-5 นาที
- **ติดตั้ง Anchor:** ~5-15 นาที
- **Build Program:** ~5-10 นาที (ครั้งแรก)

**รวม:** ~20-40 นาที

---

## ✅ หลังติดตั้งเสร็จ

```powershell
# 1. Build
anchor build

# 2. Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy
```

---

## 📞 ถ้ามีปัญหา

ดูที่ `STEP_BY_STEP_BUILD.md` หรือ `INSTALL_SOLANA_PROGRAM.md`




