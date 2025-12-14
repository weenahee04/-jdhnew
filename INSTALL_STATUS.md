# 📊 สถานะการติดตั้ง Tools

## ✅ Rust - ติดตั้งสำเร็จ!

```
rustc 1.92.0 (ded5c06cf 2025-12-08)
```

---

## ⏳ Solana CLI - ต้องติดตั้งด้วยตนเอง

**ปัญหา:** ไม่สามารถดาวน์โหลดผ่านสคริปต์ได้ (network issue)

### วิธีติดตั้ง:

1. **ไปที่:** https://docs.solana.com/cli/install-solana-cli-tools
2. **ดาวน์โหลด:** Windows installer
3. **รัน installer** และเลือก "stable"
4. **รีสตาร์ท PowerShell**
5. **ตรวจสอบ:**
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

## 📝 สรุป

- ✅ **Rust:** ติดตั้งแล้ว
- ⏳ **Solana CLI:** ต้องดาวน์โหลดและติดตั้งด้วยตนเอง
- ⏳ **Anchor:** ต้องติดตั้งหลัง Solana

---

## 🔗 Links

- **Solana CLI:** https://docs.solana.com/cli/install-solana-cli-tools
- **Anchor:** https://www.anchor-lang.com/docs/installation




