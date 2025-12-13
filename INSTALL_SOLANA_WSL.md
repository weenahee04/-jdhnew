# 🚀 ติดตั้ง Solana CLI ใน WSL

## ✅ WSL พร้อมใช้งานแล้ว!

ตอนนี้ติดตั้ง Solana CLI ใน WSL ต่อ

---

## 📋 ขั้นตอนการติดตั้ง

### ขั้นตอนที่ 1: เปิด WSL

```powershell
wsl
```

หรือเปิด Terminal แล้วพิมพ์ `wsl`

---

### ขั้นตอนที่ 2: ติดตั้ง Solana CLI

ใน WSL terminal:

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

**หมายเหตุ:** 
- WSL installer ยังรองรับ "stable" channel!
- เลือก "stable" เมื่อถูกถาม

---

### ขั้นตอนที่ 3: เพิ่ม PATH (ถ้าจำเป็น)

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

**หรือเพิ่มใน `~/.bashrc` เพื่อให้ใช้ได้ทุกครั้ง:**

```bash
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

### ขั้นตอนที่ 4: ตรวจสอบ

```bash
solana --version
```

**ควรเห็น:** `solana-cli 1.18.xx` (หรือ version ที่ติดตั้ง)

---

### ขั้นตอนที่ 5: ตั้งค่า Solana

```bash
# ตั้งค่า devnet
solana config set --url devnet

# ตรวจสอบ config
solana config get

# สร้าง wallet (ถ้ายังไม่มี)
solana-keygen new

# รับ airdrop (devnet)
solana airdrop 2
```

---

## 🎯 ใช้ Solana CLI จาก PowerShell

**ถ้าติดตั้งใน WSL แล้ว สามารถใช้จาก PowerShell ได้:**

```powershell
# ตรวจสอบ version
wsl solana --version

# ตั้งค่า config
wsl solana config set --url devnet

# รับ airdrop
wsl solana airdrop 2
```

---

## ✅ เสร็จแล้ว!

ตอนนี้คุณสามารถใช้ Solana CLI ได้แล้ว! 🎉

---

## 📝 สรุปคำสั่ง

```bash
# ใน WSL
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# เลือก "stable"

# เพิ่ม PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# ตรวจสอบ
solana --version

# ตั้งค่า
solana config set --url devnet
```

---

**ลองทำตามขั้นตอนนี้ดู!** 🚀

