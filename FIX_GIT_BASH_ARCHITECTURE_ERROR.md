# 🔧 แก้ไข Error: machine architecture is currently unsupported

## ⚠️ ปัญหา

Error: `agave-install-init: machine architecture is currently unsupported`

**สาเหตุ:** Git Bash (MINGW64) ไม่ใช่ Linux จริงๆ มันเป็น Windows emulation layer ที่ Solana installer ไม่รองรับ

---

## ✅ วิธีแก้: ใช้ Windows Installer โดยตรง

### ขั้นตอน:

1. **เปิด PowerShell** (ไม่ใช่ Git Bash!)

2. **ไปที่โฟลเดอร์ Downloads:**
   ```powershell
   cd $env:USERPROFILE\Downloads
   ```

3. **รัน installer พร้อมระบุ data-dir:**
   ```powershell
   .\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" latest
   ```

4. **รอให้ติดตั้งเสร็จ** (~2-3 นาที)

5. **เพิ่ม PATH:**
   ```powershell
   $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
   ```

6. **รีสตาร์ท PowerShell** (ปิดแล้วเปิดใหม่)

7. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

**เสร็จแล้ว!** ✅

---

## 🎯 ถ้าไม่มี installer

### ดาวน์โหลด installer:

1. **ไปที่:**
   https://github.com/anza-xyz/agave/releases

2. **ดาวน์โหลด:**
   `agave-install-init-x86_64-pc-windows-msvc.exe`

3. **รันตามขั้นตอนข้างบน**

---

## 📝 คำสั่งทั้งหมด (Copy-Paste)

```powershell
# ไปที่ Downloads
cd $env:USERPROFILE\Downloads

# รัน installer
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" latest

# เพิ่ม PATH
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)

# รีสตาร์ท PowerShell แล้วตรวจสอบ
solana --version
```

---

## ⚠️ หมายเหตุ

- **ต้องใช้ PowerShell** (ไม่ใช่ Git Bash!)
- **ต้องระบุ `--data-dir`** เพื่อบอกตำแหน่งติดตั้ง
- **ใช้ `latest`** แทน "stable" (Windows installer รองรับ)

---

## ✅ สรุป

**วิธีแก้:**
1. เปิด PowerShell (ไม่ใช่ Git Bash)
2. รัน installer พร้อม `--data-dir` และ `latest`
3. เพิ่ม PATH
4. รีสตาร์ท PowerShell
5. ตรวจสอบ: `solana --version`

**ลองใช้ PowerShell ดูครับ!** 🚀


