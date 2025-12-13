# 🔧 ติดตั้ง Solana CLI - วิธีทางเลือก

## ⚠️ ถ้าลิงก์หลักใช้ไม่ได้

ลองวิธีเหล่านี้:

---

## 🎯 วิธีที่ 1: ใช้ GitHub Releases (แนะนำ)

### ขั้นตอน:

1. **ไปที่ GitHub Releases:**
   - URL: https://github.com/anza-xyz/agave/releases
   - หรือ: https://github.com/solana-labs/solana/releases

2. **หาไฟล์ Windows installer:**
   - มองหาไฟล์ที่ลงท้ายด้วย `.exe`
   - หรือ `solana-install-init-x86_64-pc-windows-msvc.exe`

3. **ดาวน์โหลดและรัน**

---

## 🎯 วิธีที่ 2: ใช้ Chocolatey (ถ้ามี)

```powershell
choco install solana-cli
```

---

## 🎯 วิธีที่ 3: ใช้ Scoop (ถ้ามี)

```powershell
scoop install solana
```

---

## 🎯 วิธีที่ 4: ใช้ WSL (Windows Subsystem for Linux)

ถ้าคุณมี WSL ติดตั้งอยู่:

```bash
# ใน WSL terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

---

## 🎯 วิธีที่ 5: Build จาก Source (ขั้นสูง)

```powershell
# ติดตั้ง Rust (ถ้ายังไม่มี)
# แล้ว build จาก source
git clone https://github.com/anza-xyz/agave.git
cd agave
cargo build --release
```

---

## 🔍 ตรวจสอบลิงก์ที่ใช้ได้

ลองลิงก์เหล่านี้:

1. **Official Docs:**
   - https://docs.solana.com/cli/install-solana-cli-tools

2. **Anza (New Maintainer):**
   - https://release.anza.xyz/stable/install

3. **GitHub Releases:**
   - https://github.com/anza-xyz/agave/releases
   - https://github.com/solana-labs/solana/releases

4. **Direct Download (Alternative):**
   - https://github.com/anza-xyz/agave/releases/latest
   - มองหาไฟล์ Windows installer

---

## 💡 แนะนำ

**ถ้าลิงก์หลักใช้ไม่ได้:**
1. ลอง GitHub Releases ก่อน (วิธีที่ 1)
2. หรือใช้ WSL ถ้ามี (วิธีที่ 4)
3. หรือใช้ Chocolatey/Scoop ถ้ามี (วิธีที่ 2-3)

---

## 📝 หมายเหตุ

Solana CLI ตอนนี้ดูแลโดย **Anza** (ไม่ใช่ Solana Labs แล้ว)
- URL ใหม่: `release.anza.xyz`
- GitHub: `anza-xyz/agave`

---

## 🔗 Links ที่ควรลอง

- https://github.com/anza-xyz/agave/releases
- https://release.anza.xyz/stable/install
- https://docs.solana.com/cli/install-solana-cli-tools

---

**ลองวิธีเหล่านี้ดูครับ!** 🚀



