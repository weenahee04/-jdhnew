# 🔧 ติดตั้ง Solana CLI - วิธีแก้ปัญหา

## ⚠️ ถ้าลิงก์หลักใช้ไม่ได้

ลองวิธีเหล่านี้:

---

## 🎯 วิธีที่ 1: ใช้ GitHub Releases (แนะนำที่สุด)

### ขั้นตอน:

1. **ไปที่ GitHub:**
   - https://github.com/anza-xyz/agave/releases
   - หรือ: https://github.com/solana-labs/solana/releases

2. **หาไฟล์ Windows:**
   - มองหาไฟล์ที่ชื่อคล้าย: `solana-install-init-x86_64-pc-windows-msvc.exe`
   - หรือไฟล์ `.exe` ที่เป็น Windows installer

3. **ดาวน์โหลดและรัน**

---

## 🎯 วิธีที่ 2: ใช้ WSL (ถ้ามี)

ถ้าคุณมี WSL (Windows Subsystem for Linux):

```bash
# ใน WSL terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

**ตรวจสอบว่ามี WSL:**
```powershell
wsl --version
```

**ถ้ายังไม่มี WSL:**
```powershell
wsl --install
```

---

## 🎯 วิธีที่ 3: ใช้ Chocolatey (ถ้ามี)

```powershell
choco install solana-cli
```

**ตรวจสอบว่ามี Chocolatey:**
```powershell
choco --version
```

---

## 🎯 วิธีที่ 4: ข้าม Solana CLI (สำหรับตอนนี้)

**สำหรับ Mining System:**
- Frontend และ Backend API ทำงานได้โดยไม่ต้องมี Solana CLI
- Solana CLI ใช้สำหรับ build และ deploy program เท่านั้น
- สามารถทำทีหลังได้

**สิ่งที่ทำได้เลย:**
1. ✅ Run Database setup (Supabase)
2. ✅ Deploy API to Vercel
3. ✅ Test Mining frontend
4. ⏳ Build/Deploy Solana Program (ทำทีหลัง)

---

## 🎯 วิธีที่ 5: ใช้ Docker (ถ้ามี)

```powershell
# Pull Solana image
docker pull solanalabs/solana:latest

# Run Solana CLI in container
docker run -it solanalabs/solana:latest solana --version
```

---

## 💡 แนะนำ

**ถ้าลิงก์ใช้ไม่ได้:**

1. **ลอง GitHub Releases ก่อน** (วิธีที่ 1)
   - https://github.com/anza-xyz/agave/releases
   - มักจะมีไฟล์ Windows installer

2. **หรือใช้ WSL** (วิธีที่ 2)
   - ง่ายกว่าและเสถียรกว่า

3. **หรือข้ามไปก่อน** (วิธีที่ 4)
   - Mining system ทำงานได้โดยไม่ต้องมี Solana CLI
   - Build/Deploy program ทำทีหลังได้

---

## 📝 หมายเหตุ

**Solana CLI ใช้สำหรับ:**
- Build Solana programs (`anchor build`)
- Deploy programs (`anchor deploy`)
- สร้าง keypairs (`solana-keygen`)

**ไม่จำเป็นสำหรับ:**
- Frontend mining interface ✅
- Backend API ✅
- Database setup ✅
- Testing mining flow ✅

---

## 🔗 Links ที่ควรลอง

1. **GitHub Releases:**
   - https://github.com/anza-xyz/agave/releases
   - https://github.com/solana-labs/solana/releases

2. **Anza Installer (Linux/Mac/WSL):**
   - https://release.anza.xyz/stable/install

3. **Official Docs:**
   - https://docs.solana.com/cli/install-solana-cli-tools

---

## ✅ สรุป

**ถ้าลิงก์ใช้ไม่ได้:**
1. ลอง GitHub Releases
2. หรือใช้ WSL
3. **หรือข้ามไปก่อน** - Mining system ทำงานได้โดยไม่ต้องมี Solana CLI

**Mining System พร้อมใช้งานแล้ว!** 🚀
**Solana Program build/deploy ทำทีหลังได้**

---

**ลองวิธีเหล่านี้ดูครับ!** 💪




