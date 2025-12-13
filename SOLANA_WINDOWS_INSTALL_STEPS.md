# 🚀 ติดตั้ง Solana CLI บน Windows - ขั้นตอนละเอียด

## ⚠️ ปัญหา Git Bash

Git Bash (MINGW64) ไม่รองรับ Solana installer เพราะเป็น Windows emulation layer

**วิธีแก้:** ใช้ Windows Installer โดยตรงใน PowerShell

---

## ✅ ขั้นตอนการติดตั้ง

### 1. เปิด PowerShell

**ไม่ใช่ Git Bash!** ต้องใช้ PowerShell

---

### 2. ไปที่โฟลเดอร์ Downloads

```powershell
cd $env:USERPROFILE\Downloads
```

---

### 3. ตรวจสอบว่ามี installer หรือไม่

```powershell
Get-ChildItem solana-install-init*.exe
```

**ถ้าไม่มี:** ดาวน์โหลดจาก:
https://github.com/anza-xyz/agave/releases

---

### 4. รัน installer

```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" latest
```

**หมายเหตุ:**
- `--data-dir`: บอกตำแหน่งติดตั้ง
- `latest`: ใช้ version ล่าสุด (Windows installer รองรับ)

---

### 5. รอให้ติดตั้งเสร็จ

รอ ~2-3 นาที

---

### 6. เพิ่ม PATH

```powershell
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
```

---

### 7. รีสตาร์ท PowerShell

**ปิด PowerShell แล้วเปิดใหม่** (เพื่อให้ PATH ใหม่มีผล)

---

### 8. ตรวจสอบ

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

## 📝 คำสั่งทั้งหมด (Copy-Paste)

```powershell
# 1. ไปที่ Downloads
cd $env:USERPROFILE\Downloads

# 2. รัน installer
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" latest

# 3. เพิ่ม PATH
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)

# 4. รีสตาร์ท PowerShell แล้วตรวจสอบ
solana --version
```

---

## ⚠️ หมายเหตุ

- **ต้องใช้ PowerShell** (ไม่ใช่ Git Bash!)
- **ต้องระบุ `--data-dir`** เพื่อบอกตำแหน่งติดตั้ง
- **ใช้ `latest`** แทน "stable" (Windows installer รองรับ)
- **รีสตาร์ท PowerShell** หลังเพิ่ม PATH

---

## ✅ สรุป

**วิธีแก้:**
1. เปิด PowerShell (ไม่ใช่ Git Bash)
2. รัน installer พร้อม `--data-dir` และ `latest`
3. เพิ่ม PATH
4. รีสตาร์ท PowerShell
5. ตรวจสอบ: `solana --version`

**ลองใช้ PowerShell ดูครับ!** 🚀


