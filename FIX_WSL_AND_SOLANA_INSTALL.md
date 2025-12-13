# 🔧 แก้ไข WSL และติดตั้ง Solana CLI

## ⚠️ ปัญหา

WSL กระพริบแล้วหายไป = WSL ยังไม่ได้ติดตั้งหรือ Virtual Machine Platform ยังไม่ได้เปิด

---

## ✅ วิธีที่ 1: ติดตั้ง WSL (แนะนำ)

### ขั้นตอน:

1. **เปิด PowerShell เป็น Administrator:**
   - คลิกขวาที่ PowerShell
   - เลือก "Run as Administrator"

2. **รันคำสั่งติดตั้ง WSL:**
   ```powershell
   wsl --install
   ```

3. **รีสตาร์ทคอมพิวเตอร์** (จำเป็น)

4. **หลังรีสตาร์ท:**
   ```powershell
   wsl
   ```

5. **ตั้งค่า username และ password** (ครั้งแรก)

6. **ติดตั้ง Solana CLI ใน WSL:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

---

## ✅ วิธีที่ 2: ใช้ Git Bash (ไม่ต้องติดตั้ง WSL)

### ถ้ามี Git Bash อยู่แล้ว:

1. **เปิด Git Bash**

2. **รันคำสั่ง:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

3. **เลือก "stable" เมื่อถูกถาม**

4. **เพิ่ม PATH ใน Git Bash:**
   ```bash
   echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

5. **ตรวจสอบ:**
   ```bash
   solana --version
   ```

---

## ✅ วิธีที่ 3: ติดตั้ง Solana CLI โดยตรงบน Windows

### ใช้ Windows Installer (ต้องระบุ version):

1. **ดาวน์โหลด installer:**
   - ไปที่: https://github.com/anza-xyz/agave/releases
   - ดาวน์โหลด: `agave-install-init-x86_64-pc-windows-msvc.exe`

2. **รัน installer:**
   ```powershell
   # ต้องระบุ data-dir และ release
   .\agave-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" latest
   ```

3. **เพิ่ม PATH:**
   ```powershell
   $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
   ```

4. **รีสตาร์ท PowerShell**

5. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

---

## ✅ วิธีที่ 4: ใช้ Docker Desktop (ถ้ามี)

### ถ้ามี Docker Desktop:

1. **เปิด Docker Desktop**

2. **รัน container:**
   ```powershell
   docker run -it --rm ubuntu:latest bash
   ```

3. **ติดตั้ง Solana CLI ใน container:**
   ```bash
   sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
   ```

---

## 🎯 แนะนำ

**วิธีที่ง่ายที่สุด:**
- **ถ้ามี Git Bash:** ใช้วิธีที่ 2
- **ถ้าไม่มี:** ติดตั้ง WSL (วิธีที่ 1) หรือใช้ Windows Installer (วิธีที่ 3)

---

## 📝 ตรวจสอบว่ามี Git Bash หรือไม่

```powershell
# ตรวจสอบ Git Bash
where.exe git
where.exe bash
```

**ถ้าเจอ:** ใช้ Git Bash ได้เลย!

---

## ✅ สรุป

**วิธีที่ง่ายที่สุด:**
1. ใช้ Git Bash (ถ้ามี)
2. หรือติดตั้ง WSL: `wsl --install` (ต้องรีสตาร์ท)
3. หรือใช้ Windows Installer (ต้องระบุ version)

**ลองวิธีไหนก่อนดี?** 🚀


