# 🔧 แก้ไข Error: solana-install no longer supports installing by channel

## ⚠️ ปัญหา

Error: `solana-install no longer supports installing by channel. Please specify a release version as vX.Y.Z.`

**สาเหตุ:** Solana installer เวอร์ชันใหม่ไม่รองรับ "stable" แล้ว ต้องระบุ version แทน

---

## ✅ วิธีแก้

### ระบุ Version แทน "stable"

**Version ล่าสุด:** `v3.0.12`

### คำสั่งที่ถูกต้อง:

```powershell
& "$env:USERPROFILE\Downloads\solana-install-init-x86_64-pc-windows-msvc.exe" v3.0.12
```

หรือ

```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe v3.0.12
```

---

## 🎯 หรือใช้ WSL (แนะนำ - ง่ายกว่า)

WSL installer ยังรองรับ "stable":

```powershell
# เปิด WSL
wsl

# ใน WSL terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

**เลือก "stable" เมื่อถูกถาม**

---

## 📋 Version ที่แนะนำ

- **v3.0.12** - Latest stable (แนะนำ)
- **v3.0.11** - Previous stable
- **v3.0.10** - Older stable

ดู version ทั้งหมด: https://github.com/anza-xyz/agave/releases

---

## ✅ หลังติดตั้งเสร็จ

1. **รีสตาร์ท PowerShell**
2. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```
3. **ตั้งค่า devnet:**
   ```powershell
   solana config set --url devnet
   solana airdrop 2
   ```

---

## 💡 แนะนำ

**ใช้ WSL ง่ายกว่า:**
- ไม่ต้องระบุ version
- เลือก "stable" ได้
- ลิงก์ใช้ได้แน่นอน

---

**ลองรันใหม่พร้อมระบุ version v3.0.12 ครับ!** 🚀



