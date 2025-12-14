# 📥 ติดตั้ง Solana CLI บน Windows

## ⚠️ ปัญหา Network

ไม่สามารถดาวน์โหลด Solana installer อัตโนมัติได้เนื่องจาก network issue

---

## ✅ วิธีติดตั้ง (Manual)

### วิธีที่ 1: ดาวน์โหลด Installer โดยตรง

1. **ดาวน์โหลด installer:**
   - URL: https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
   - หรือไปที่: https://docs.solana.com/cli/install-solana-cli-tools

2. **รัน installer:**
   ```powershell
   # หลังจากดาวน์โหลดแล้ว
   & "$env:USERPROFILE\Downloads\solana-install-init.exe" stable
   ```
   หรือดับเบิลคลิกไฟล์ที่ดาวน์โหลดมา

3. **เลือก "stable" เมื่อถูกถาม**

4. **รีสตาร์ท PowerShell**

5. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

### วิธีที่ 2: ใช้ WSL (ถ้ามี)

ถ้าคุณมี WSL (Windows Subsystem for Linux) ติดตั้งอยู่:

```bash
# ใน WSL terminal
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

---

## 🔗 Links

- **Official Docs:** https://docs.solana.com/cli/install-solana-cli-tools
- **Direct Download:** https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
- **GitHub Releases:** https://github.com/anza-xyz/agave/releases

---

## 📝 หลังติดตั้งเสร็จ

```powershell
# ตรวจสอบ
solana --version

# ตั้งค่า devnet (สำหรับ deploy)
solana config set --url devnet

# รับ SOL ฟรี
solana airdrop 2
```

---

## ⚠️ หมายเหตุ

- ต้องมี Rust ติดตั้งแล้ว (✅ ติดตั้งแล้ว)
- หลังติดตั้ง Solana แล้ว ต้องติดตั้ง Anchor ต่อ
- ใช้เวลา ~2-5 นาทีในการติดตั้ง




