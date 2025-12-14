# 🚀 ติดตั้ง Solana CLI - ขั้นตอนตอนนี้

## ✅ สิ่งที่คุณมีแล้ว

- ✅ `solana-install-init-x86_64-pc-windows-msvc.exe` - Installer
- ✅ `solana-release-x86_64-pc-windows-msvc.yml` - Metadata (version: v3.0.12)

---

## ⚠️ ปัญหา

1. **Version `v3.0.12` ไม่รองรับ** - Installer รองรับ `v1.18.26` แทน
2. **ต้องใช้ Administrator privileges** - ต้องรัน PowerShell as Admin

---

## ✅ วิธีติดตั้ง

### ขั้นตอนที่ 1: เปิด PowerShell as Administrator

1. **กด `Win + X`**
2. **เลือก "Windows PowerShell (Admin)" หรือ "Terminal (Admin)"**

### ขั้นตอนที่ 2: ไปที่ Downloads และติดตั้ง

```powershell
cd $env:USERPROFILE\Downloads
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
```

**หมายเหตุ:** ใช้ `v1.18.26` (ไม่ใช่ `v3.0.12`)

### ขั้นตอนที่ 3: รอให้ติดตั้งเสร็จ (~2-3 นาที)

### ขั้นตอนที่ 4: เพิ่ม PATH

```powershell
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
```

### ขั้นตอนที่ 5: รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)

### ขั้นตอนที่ 6: ตรวจสอบ

```powershell
solana --version
```

**ควรเห็น:** `solana-cli 1.18.26`

---

## 🎯 หรือใช้สคริปต์อัตโนมัติ

1. **เปิด PowerShell as Administrator**
2. **รันสคริปต์:**
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   .\install-solana-admin.ps1
   ```

---

## 📋 สรุป

**Version ที่ใช้:** `v1.18.26` (ไม่ใช่ v3.0.12)

**ต้องใช้:** Administrator privileges

**คำสั่ง:**
```powershell
# เปิด PowerShell as Admin แล้วรัน:
cd $env:USERPROFILE\Downloads
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
```

---

**ลองทำตามขั้นตอนนี้ดู!** 🚀


