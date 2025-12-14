# 🚀 ติดตั้ง Solana CLI - วิธีง่ายๆ (2 วิธี)

## ✅ พบ WSL แล้ว! ใช้วิธีนี้ได้เลย

---

## 🎯 วิธีที่ 1: ใช้ WSL (แนะนำ - ง่ายที่สุด)

### ขั้นตอน:

1. **เปิด WSL Terminal:**
   ```powershell
   wsl
   ```

2. **รันคำสั่งติดตั้ง:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

3. **เลือก "stable" เมื่อถูกถาม**

4. **รอให้ติดตั้งเสร็จ**

5. **ตรวจสอบ:**
   ```bash
   solana --version
   ```

6. **ตั้งค่า PATH (ถ้ายังไม่ได้):**
   ```bash
   echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

**เสร็จแล้ว!** ✅

---

## 🎯 วิธีที่ 2: ดาวน์โหลดจาก GitHub Releases

### ขั้นตอน:

1. **ไปที่ GitHub Releases:**
   - https://github.com/anza-xyz/agave/releases
   - หรือลิงก์ตรง: https://github.com/anza-xyz/agave/releases/download/v3.0.12/agave-install-init-x86_64-pc-windows-msvc.exe

2. **ดาวน์โหลดไฟล์:**
   - `agave-install-init-x86_64-pc-windows-msvc.exe`

3. **รันไฟล์:**
   - ดับเบิลคลิกไฟล์ที่ดาวน์โหลดมา
   - หรือรันใน PowerShell:
     ```powershell
     & "$env:USERPROFILE\Downloads\agave-install-init-x86_64-pc-windows-msvc.exe" stable
     ```

4. **เลือก "stable"**

5. **รีสตาร์ท PowerShell**

6. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

## 💡 แนะนำ

**ใช้วิธีที่ 1 (WSL)** เพราะ:
- ✅ ง่ายกว่า
- ✅ ลิงก์ใช้ได้แน่นอน
- ✅ ไม่มีปัญหา network
- ✅ เสถียรกว่า

---

## 📝 หลังติดตั้งเสร็จ

### ถ้าใช้ WSL:
```bash
# ตั้งค่า devnet
solana config set --url devnet

# รับ SOL ฟรี
solana airdrop 2

# ตรวจสอบ
solana config get
```

### ถ้าใช้ Windows:
```powershell
# ตั้งค่า devnet
solana config set --url devnet

# รับ SOL ฟรี
solana airdrop 2

# ตรวจสอบ
solana config get
```

---

## 🔗 Links

**WSL Installer:**
- https://release.anza.xyz/stable/install

**GitHub Releases (Windows):**
- https://github.com/anza-xyz/agave/releases
- Direct: https://github.com/anza-xyz/agave/releases/download/v3.0.12/agave-install-init-x86_64-pc-windows-msvc.exe

---

## ✅ สรุป

**วิธีที่ง่ายที่สุด:**
1. เปิด WSL: `wsl`
2. รัน: `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`
3. เลือก "stable"
4. ตรวจสอบ: `solana --version`

**ใช้เวลา:** ~3-5 นาที

---

**ลองวิธีที่ 1 (WSL) ก่อนครับ!** 🚀




