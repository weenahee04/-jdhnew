# 🔧 แก้ไข Error: solana-install no longer supports installing by channel

## ⚠️ ปัญหา

Error: `solana-install no longer supports installing by channel. Please specify a release version as vX.Y.Z.`

**สาเหตุ:** Windows installer ไม่รองรับ channel (stable, latest, beta) แล้ว ต้องระบุ version เฉพาะ

---

## ✅ วิธีแก้ที่ 1: ใช้ Version เฉพาะ

### หา Version ล่าสุด:

1. **ไปที่ GitHub Releases:**
   https://github.com/anza-xyz/agave/releases

2. **ดู version ล่าสุด** (เช่น `v1.18.26`)

### คำสั่งที่ถูกต้อง:

```powershell
cd $env:USERPROFILE\Downloads
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
```

**หมายเหตุ:** ใช้ `v1.18.26` (มี `v` นำหน้า)

---

## ✅ วิธีแก้ที่ 2: ใช้ WSL (แนะนำ - ง่ายกว่า)

WSL installer ยังรองรับ "stable" channel!

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

## 📋 Version ที่แนะนำ

**Latest Stable Versions:**
- `v1.18.26` - Latest (แนะนำ)
- `v1.18.25` - Previous
- `v1.18.24` - Older

**ดู version ทั้งหมด:**
https://github.com/anza-xyz/agave/releases

---

## 🎯 ขั้นตอนการติดตั้ง (ใช้ Version)

### 1. ไปที่ Downloads:
```powershell
cd $env:USERPROFILE\Downloads
```

### 2. รัน installer พร้อม version:
```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
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

## 💡 แนะนำ

**วิธีที่ง่ายที่สุด:**
1. **รีสตาร์ทคอมพิวเตอร์** (เพราะเพิ่งติดตั้ง WSL)
2. **ใช้ WSL:** `wsl`
3. **ติดตั้ง Solana:** `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`
4. **เลือก "stable"**

**WSL installer ยังรองรับ "stable" channel และง่ายกว่า!**

---

## ✅ สรุป

**วิธีที่ 1: ใช้ Version เฉพาะ**
```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
```

**วิธีที่ 2: ใช้ WSL (แนะนำ)**
```bash
# หลังรีสตาร์ท
wsl
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

**ลองวิธีไหนดี?** 🚀



