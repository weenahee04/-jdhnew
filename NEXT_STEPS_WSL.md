# 🚀 ขั้นตอนต่อไป - ติดตั้ง Solana CLI ใน WSL

## 📋 สถานะปัจจุบัน

- ✅ WSL พร้อมใช้งานแล้ว
- ⏳ Solana CLI - ยังไม่ได้ติดตั้ง
- ⏳ Anchor Framework - ยังไม่ได้ติดตั้ง
- ⏳ Rust - ต้องตรวจสอบ

---

## ✅ ขั้นตอนที่ 1: ติดตั้ง Solana CLI ใน WSL

### เปิด WSL และติดตั้ง:

```powershell
# จาก PowerShell
wsl
```

**ใน WSL terminal:**

```bash
# ติดตั้ง Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# เลือก "stable" เมื่อถูกถาม
```

### เพิ่ม PATH:

```bash
# เพิ่ม PATH ชั่วคราว
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# หรือเพิ่มใน ~/.bashrc เพื่อให้ใช้ได้ทุกครั้ง
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### ตรวจสอบ:

```bash
solana --version
```

**ควรเห็น:** `solana-cli 1.18.xx`

---

## ✅ ขั้นตอนที่ 2: ติดตั้ง Rust (ถ้ายังไม่มี)

### ตรวจสอบ Rust:

```bash
rustc --version
```

### ถ้ายังไม่มี Rust:

```bash
# ติดตั้ง Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# เลือก default (กด Enter)

# Reload shell
source ~/.bashrc

# ตรวจสอบ
rustc --version
```

---

## ✅ ขั้นตอนที่ 3: ติดตั้ง Anchor Framework

```bash
# ติดตั้ง Anchor Version Manager (avm)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# ติดตั้ง Anchor latest
avm install latest
avm use latest

# ตรวจสอบ
anchor --version
```

---

## ✅ ขั้นตอนที่ 4: ตรวจสอบ Tools ทั้งหมด

```bash
# ตรวจสอบทุก tool
rustc --version
solana --version
anchor --version
```

**ควรเห็น:**
- `rustc 1.xx.x`
- `solana-cli 1.18.xx`
- `anchor-cli 0.xx.x`

---

## ✅ ขั้นตอนที่ 5: Build Solana Program

### ไปที่โปรเจค:

```bash
# จาก WSL
cd /mnt/c/Users/ADMIN/Downloads/jjdh\ a
```

### Build:

```bash
anchor build
```

**รอให้ build เสร็จ (~5-10 นาที ครั้งแรก)**

---

## ✅ ขั้นตอนที่ 6: ตั้งค่า Solana และ Deploy

### ตั้งค่า devnet:

```bash
solana config set --url devnet
solana config get
```

### สร้าง wallet (ถ้ายังไม่มี):

```bash
solana-keygen new
```

### รับ airdrop:

```bash
solana airdrop 2
```

### Deploy program:

```bash
anchor deploy
```

---

## 🎯 สรุปคำสั่งทั้งหมด

```bash
# 1. ติดตั้ง Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# เลือก "stable"

# 2. เพิ่ม PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 3. ตรวจสอบ Solana
solana --version

# 4. ติดตั้ง Rust (ถ้ายังไม่มี)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc

# 5. ติดตั้ง Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# 6. ตรวจสอบทุก tool
rustc --version
solana --version
anchor --version

# 7. Build program
cd /mnt/c/Users/ADMIN/Downloads/jjdh\ a
anchor build

# 8. ตั้งค่าและ deploy
solana config set --url devnet
solana-keygen new
solana airdrop 2
anchor deploy
```

---

## ⏱️ เวลาที่ใช้

- **ติดตั้ง Solana CLI:** ~2-5 นาที
- **ติดตั้ง Rust:** ~5-10 นาที (ถ้ายังไม่มี)
- **ติดตั้ง Anchor:** ~5-15 นาที
- **Build Program:** ~5-10 นาที (ครั้งแรก)
- **Deploy:** ~2-5 นาที

**รวม:** ~20-40 นาที

---

## 💡 หมายเหตุ

- **ใช้ WSL terminal** สำหรับคำสั่งทั้งหมด
- **PATH จะถูกบันทึกใน ~/.bashrc** เพื่อให้ใช้ได้ทุกครั้ง
- **Build ครั้งแรกจะใช้เวลานาน** เพราะต้อง compile dependencies

---

**เริ่มจากเปิด WSL แล้วติดตั้ง Solana CLI ก่อน!** 🚀


