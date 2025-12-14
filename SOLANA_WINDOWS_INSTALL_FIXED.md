# 🚀 ติดตั้ง Solana CLI บน Windows - แก้ไขแล้ว

## ✅ คำสั่งที่ถูกต้อง

### 1. ไปที่โฟลเดอร์ Downloads:
```powershell
cd $env:USERPROFILE\Downloads
```

### 2. รัน installer พร้อม "stable":
```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable
```

**สำคัญ:** ใช้ `stable` แทน `latest`!

---

## 📋 ขั้นตอนทั้งหมด

### 1. ไปที่ Downloads
```powershell
cd $env:USERPROFILE\Downloads
```

### 2. รัน installer
```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable
```

### 3. รอให้ติดตั้งเสร็จ (~2-3 นาที)

### 4. เพิ่ม PATH
```powershell
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
```

### 5. รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)

### 6. ตรวจสอบ
```powershell
solana --version
```

**ถ้าเห็น version:** ติดตั้งสำเร็จ! ✅

---

## 🎯 ตั้งค่า Devnet (ถ้าต้องการ)

```powershell
solana config set --url devnet
solana airdrop 2
solana config get
```

---

## ⚠️ หมายเหตุ

- **ใช้ `stable`** แทน `latest` (Windows installer รองรับ)
- **ต้องระบุ `--data-dir`** เพื่อบอกตำแหน่งติดตั้ง
- **รีสตาร์ท PowerShell** หลังเพิ่ม PATH

---

## ✅ สรุป

**คำสั่งที่ถูกต้อง:**
```powershell
cd $env:USERPROFILE\Downloads
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable
```

**ลองใช้ `stable` ดูครับ!** 🚀



