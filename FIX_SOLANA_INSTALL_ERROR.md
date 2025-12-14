# 🔧 แก้ไข Error: Please specify the release

## ⚠️ ปัญหา

Error: `Please specify the release to install for x86_64-pc-windows-msvc`

**สาเหตุ:** ไม่ได้ระบุ release (เช่น "stable") เมื่อรัน installer

---

## ✅ วิธีแก้

### วิธีที่ 1: รันใหม่พร้อมระบุ release

**ถ้ารัน installer อยู่:**
1. กด Enter เพื่อปิดหน้าต่างปัจจุบัน
2. รันใหม่พร้อมระบุ "stable":
   ```powershell
   & "$env:USERPROFILE\Downloads\agave-install-init-x86_64-pc-windows-msvc.exe" stable
   ```
   หรือ
   ```powershell
   & "$env:TEMP\solana-installer.exe" stable
   ```

### วิธีที่ 2: ใช้ WSL (แนะนำ - ง่ายกว่า)

```powershell
# เปิด WSL
wsl

# ใน WSL terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

**เลือก "stable" เมื่อถูกถาม**

---

## 📝 คำสั่งที่ถูกต้อง

### Windows (PowerShell):
```powershell
# ระบุ "stable" หลังชื่อไฟล์
.\agave-install-init-x86_64-pc-windows-msvc.exe stable
```

### WSL (Bash):
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# แล้วเลือก "stable" เมื่อถูกถาม
```

---

## 🔍 ตรวจสอบว่าไฟล์อยู่ที่ไหน

```powershell
# ตรวจสอบ Downloads
Get-ChildItem "$env:USERPROFILE\Downloads\*solana*.exe"
Get-ChildItem "$env:USERPROFILE\Downloads\*agave*.exe"

# ตรวจสอบ Temp
Get-ChildItem "$env:TEMP\*solana*.exe"
Get-ChildItem "$env:TEMP\*agave*.exe"
```

---

## ✅ หลังแก้ไข

1. **รอให้ติดตั้งเสร็จ** (~2-3 นาที)
2. **รีสตาร์ท PowerShell**
3. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

## 💡 แนะนำ

**ใช้ WSL ง่ายกว่า:**
- ไม่ต้องระบุ release (เลือกใน installer)
- ลิงก์ใช้ได้แน่นอน
- ไม่มีปัญหา network

---

**ลองรันใหม่พร้อมระบุ "stable" ครับ!** 🚀




