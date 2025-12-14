# 📥 ติดตั้ง Solana CLI บน Windows

## 🎯 วิธีที่ 1: ดาวน์โหลด Installer โดยตรง (แนะนำ)

### ขั้นตอน:

1. **ดาวน์โหลด Installer:**
   - ไปที่: https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
   - หรือไปที่: https://docs.solana.com/cli/install-solana-cli-tools
   - คลิกดาวน์โหลดไฟล์ `.exe`

2. **รัน Installer:**
   - ดับเบิลคลิกไฟล์ที่ดาวน์โหลดมา
   - หรือรันใน PowerShell:
     ```powershell
     & "$env:USERPROFILE\Downloads\solana-install-init.exe" stable
     ```

3. **เลือก "stable" เมื่อถูกถาม**

4. **รีสตาร์ท PowerShell** (สำคัญ!)

5. **ตรวจสอบการติดตั้ง:**
   ```powershell
   solana --version
   ```
   ควรเห็น: `solana-cli x.x.x`

---

## 🎯 วิธีที่ 2: ใช้ PowerShell Script

### ขั้นตอน:

1. **เปิด PowerShell as Administrator**

2. **รันคำสั่ง:**
   ```powershell
   # ดาวน์โหลด installer
   Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
   
   # รัน installer
   & "$env:TEMP\solana-install-init.exe" stable
   ```

3. **รีสตาร์ท PowerShell**

4. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

## ⚠️ ถ้ามีปัญหา Network

### วิธีแก้:

1. **ใช้ VPN หรือ Proxy** (ถ้ามี)
2. **ดาวน์โหลดด้วย Browser** แทน PowerShell
3. **ลองอีกครั้งในภายหลัง**

---

## 🔧 หลังติดตั้งเสร็จ

### ตั้งค่า Wallet (ถ้ายังไม่มี):

```powershell
solana-keygen new
```

### ตั้งค่า Cluster:

```powershell
# สำหรับ development
solana config set --url devnet

# สำหรับ production
solana config set --url mainnet-beta
```

### ตรวจสอบ Configuration:

```powershell
solana config get
```

---

## 📍 ตำแหน่งที่ติดตั้ง

Solana CLI จะถูกติดตั้งที่:
```
C:\Users\<YourUsername>\.local\share\solana\install\active_release\bin
```

PATH จะถูกเพิ่มอัตโนมัติ แต่ถ้าไม่พบคำสั่ง:
```powershell
$env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
```

---

## ✅ ตรวจสอบว่าติดตั้งสำเร็จ

```powershell
solana --version
solana-keygen --version
solana config get
```

ควรเห็น:
- `solana-cli x.x.x`
- `solana-keygen x.x.x`
- Configuration info

---

## 🔗 Links ที่เกี่ยวข้อง

- **Official Docs:** https://docs.solana.com/cli/install-solana-cli-tools
- **Direct Download:** https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe
- **GitHub Releases:** https://github.com/anza-xyz/agave/releases

---

## 🐛 Troubleshooting

### Solana command not found
- **แก้:** รีสตาร์ท PowerShell
- หรือเพิ่ม PATH manually:
  ```powershell
  [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.local\share\solana\install\active_release\bin", [EnvironmentVariableTarget]::User)
  ```

### Installer ไม่สามารถดาวน์โหลดได้
- **แก้:** ดาวน์โหลดด้วย Browser แทน
- หรือลองอีกครั้งในภายหลัง

### Permission denied
- **แก้:** รัน PowerShell as Administrator

---

## 📝 ขั้นตอนต่อไป

หลังติดตั้ง Solana CLI สำเร็จ:

1. **ติดตั้ง Anchor:**
   ```powershell
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

2. **Build Program:**
   ```powershell
   anchor build
   ```

3. **Deploy:**
   ```powershell
   solana config set --url devnet
   solana airdrop 2
   anchor deploy
   ```

---

**พร้อมใช้งานแล้ว!** 🚀




