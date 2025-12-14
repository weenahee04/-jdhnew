# 📥 ติดตั้ง Tools ด้วยตนเอง (Manual Installation)

## ✅ Rust - ติดตั้งสำเร็จแล้ว!

Rust ติดตั้งแล้ว: `rustc 1.92.0`

---

## ⏳ Solana CLI - ต้องติดตั้ง

### วิธีที่ 1: ดาวน์โหลดด้วยตนเอง (แนะนำ)

1. **ไปที่:** https://docs.solana.com/cli/install-solana-cli-tools
2. **ดาวน์โหลด:** Windows installer
3. **รัน installer** และเลือก "stable"
4. **รีสตาร์ท PowerShell**

### วิธีที่ 2: ใช้ Chocolatey (ถ้ามี)

```powershell
choco install solana-cli
```

### วิธีที่ 3: ใช้ Winget (ถ้ามี)

```powershell
winget install Solana.SolanaCLI
```

### ตรวจสอบหลังติดตั้ง:

```powershell
solana --version
```

---

## ⏳ Anchor - ต้องติดตั้ง (หลัง Solana)

```powershell
# ติดตั้ง Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# ติดตั้ง Anchor latest
avm install latest
avm use latest

# ตรวจสอบ
anchor --version
```

---

## 🚀 หลังติดตั้งเสร็จทั้งหมด

```powershell
cd "C:\Users\ADMIN\Downloads\jjdh a"
anchor build
```

---

## 📝 สรุปสถานะ

- ✅ Rust: ติดตั้งแล้ว
- ⏳ Solana CLI: ต้องติดตั้ง (ดาวน์โหลดด้วยตนเอง)
- ⏳ Anchor: ต้องติดตั้ง (หลัง Solana)

---

## 🔗 Links

- **Solana CLI:** https://docs.solana.com/cli/install-solana-cli-tools
- **Anchor:** https://www.anchor-lang.com/docs/installation




