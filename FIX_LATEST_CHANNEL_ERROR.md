# 🔧 แก้ไข Error: Invalid release channel latest

## ⚠️ ปัญหา

Error: `error: Invalid value for '<release>': Invalid release channel latest`

**สาเหตุ:** Windows installer ไม่รองรับ "latest" เป็น release channel

---

## ✅ วิธีแก้: ใช้ "stable" แทน

### คำสั่งที่ถูกต้อง:

```powershell
cd $env:USERPROFILE\Downloads
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable
```

---

## 🎯 Release Channels ที่รองรับ

Windows installer รองรับ:
- **`stable`** - Latest stable release (แนะนำ)
- **`beta`** - Beta release
- **`edge`** - Edge/development release
- **Version number** - เช่น `1.18.26`

---

## 📝 ขั้นตอนการติดตั้ง (แก้ไขแล้ว)

### 1. ไปที่โฟลเดอร์ Downloads:
```powershell
cd $env:USERPROFILE\Downloads
```

### 2. รัน installer พร้อม "stable":
```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable
```

### 3. รอให้ติดตั้งเสร็จ (~2-3 นาที)

### 4. เพิ่ม PATH:
```powershell
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
```

### 5. รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)

### 6. ตรวจสอบ:
```powershell
solana --version
```

---

## 📋 คำสั่งทั้งหมด (Copy-Paste)

```powershell
# 1. ไปที่ Downloads
cd $env:USERPROFILE\Downloads

# 2. รัน installer พร้อม "stable"
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" stable

# 3. เพิ่ม PATH
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)

# 4. รีสตาร์ท PowerShell แล้วตรวจสอบ
solana --version
```

---

## ⚠️ หมายเหตุ

- **ใช้ `stable`** แทน `latest`
- **ต้องระบุ `--data-dir`** เพื่อบอกตำแหน่งติดตั้ง
- **รีสตาร์ท PowerShell** หลังเพิ่ม PATH

---

## ✅ สรุป

**วิธีแก้:**
1. ใช้ `stable` แทน `latest`
2. รัน installer ใหม่
3. เพิ่ม PATH
4. รีสตาร์ท PowerShell
5. ตรวจสอบ: `solana --version`

**ลองใช้ `stable` ดูครับ!** 🚀



