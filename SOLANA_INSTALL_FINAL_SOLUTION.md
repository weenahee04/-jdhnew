# 🚀 ติดตั้ง Solana CLI - วิธีสุดท้าย

## ⚠️ ปัญหา

Windows installer ไม่รองรับ channel (stable/latest) แล้ว ต้องระบุ version เฉพาะ

---

## ✅ วิธีที่ 1: ใช้ WSL (แนะนำที่สุด)

### ขั้นตอน:

1. **รีสตาร์ทคอมพิวเตอร์** (เพราะเพิ่งติดตั้ง WSL)

2. **หลังรีสตาร์ท:**
   ```powershell
   wsl
   ```

3. **ตั้งค่า username และ password** (ครั้งแรก)

4. **ติดตั้ง Solana CLI:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

5. **เลือก "stable" เมื่อถูกถาม**

6. **ตรวจสอบ:**
   ```bash
   solana --version
   ```

**เสร็จแล้ว!** ✅

---

## ✅ วิธีที่ 2: ใช้ Version เฉพาะ (Windows Installer)

### ขั้นตอน:

1. **หา version ล่าสุด:**
   - ไปที่: https://github.com/anza-xyz/agave/releases
   - ดู version ล่าสุด (เช่น `v1.18.26`)

2. **ไปที่ Downloads:**
   ```powershell
   cd $env:USERPROFILE\Downloads
   ```

3. **รัน installer พร้อม version:**
   ```powershell
   .\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
   ```

4. **รอให้ติดตั้งเสร็จ (~2-3 นาที)**

5. **เพิ่ม PATH:**
   ```powershell
   $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
   ```

6. **รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)**

7. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

## 📋 Version ล่าสุด

**Latest Stable:**
- `v1.18.26` - Latest (แนะนำ)

**ดู version ทั้งหมด:**
https://github.com/anza-xyz/agave/releases

---

## 🎯 ใช้ Solana CLI

**ถ้าใช้ WSL:**
```powershell
# จาก PowerShell
wsl solana --version
wsl solana config set --url devnet
wsl solana airdrop 2
```

**หรือเข้า WSL ก่อน:**
```powershell
wsl
# แล้วใช้คำสั่ง solana ตามปกติ
solana --version
solana config set --url devnet
```

**ถ้าใช้ Windows Installer:**
```powershell
# ใช้ได้โดยตรงใน PowerShell
solana --version
solana config set --url devnet
solana airdrop 2
```

---

## 💡 แนะนำ

**วิธีที่ง่ายที่สุด:**
1. **รีสตาร์ทคอมพิวเตอร์** (เพราะเพิ่งติดตั้ง WSL)
2. **ใช้ WSL:** `wsl`
3. **ติดตั้ง Solana:** `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`
4. **เลือก "stable"**

**WSL installer ยังรองรับ "stable" channel และง่ายกว่า!**

---

## ✅ สรุป

**วิธีที่ 1: ใช้ WSL (แนะนำ)**
- รีสตาร์ทคอมพิวเตอร์
- `wsl`
- `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`
- เลือก "stable"

**วิธีที่ 2: ใช้ Version เฉพาะ**
- ไปที่ GitHub Releases หา version
- `.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26`

**ลองวิธีไหนดี?** 🚀



