# 🔧 แก้ไข WSL กระพริบแล้วหาย

## ⚠️ ปัญหา

WSL กระพริบแล้วหายไป = WSL ยังไม่ได้ติดตั้งหรือ Virtual Machine Platform ยังไม่ได้เปิดใช้งาน

---

## ✅ วิธีแก้ที่ 1: เปิดใช้งาน WSL Features (ต้องใช้ Administrator)

### ขั้นตอน:

1. **เปิด PowerShell as Administrator:**
   - กด `Win + X`
   - เลือก "Windows PowerShell (Admin)" หรือ "Terminal (Admin)"

2. **เปิดใช้งาน Virtual Machine Platform:**
   ```powershell
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

3. **เปิดใช้งาน Windows Subsystem for Linux:**
   ```powershell
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   ```

4. **รีสตาร์ทคอมพิวเตอร์**

5. **หลังรีสตาร์ท:**
   ```powershell
   wsl --set-default-version 2
   wsl --install
   ```

6. **รีสตาร์ทอีกครั้ง**

7. **หลังรีสตาร์ท:**
   ```powershell
   wsl
   ```

**เสร็จแล้ว!** ✅

---

## ✅ วิธีแก้ที่ 2: ใช้ Windows Installer พร้อม Version เฉพาะ (ไม่ต้องใช้ WSL)

### ขั้นตอน:

1. **หา version ล่าสุด:**
   - ไปที่: https://github.com/anza-xyz/agave/releases
   - ดู version ล่าสุด (เช่น `v1.18.26`)

2. **ไปที่ Downloads:**
   ```powershell
   cd $env:USERPROFILE\Downloads
   ```

3. **รัน installer พร้อม version:**
   ```powershell
   .\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26
   ```

4. **รอให้ติดตั้งเสร็จ (~2-3 นาที)**

5. **เพิ่ม PATH:**
   ```powershell
   $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$solanaPath", [EnvironmentVariableTarget]::User)
   ```

6. **รีสตาร์ท PowerShell (ปิดแล้วเปิดใหม่)**

7. **ตรวจสอบ:**
   ```powershell
   solana --version
   ```

**เสร็จแล้ว!** ✅

---

## ✅ วิธีแก้ที่ 3: ใช้ Chocolatey (ถ้ามี)

### ขั้นตอน:

1. **ติดตั้ง Chocolatey (ถ้ายังไม่มี):**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **ติดตั้ง Solana CLI:**
   ```powershell
   choco install solana-cli
   ```

**หมายเหตุ:** Solana CLI อาจไม่มีใน Chocolatey repository

---

## 📋 Version ล่าสุด

**Latest Stable:**
- `v1.18.26` - Latest (แนะนำ)

**ดู version ทั้งหมด:**
https://github.com/anza-xyz/agave/releases

---

## 🎯 แนะนำ

**ถ้า WSL ยังไม่ทำงาน:**
- **ใช้วิธีที่ 2: Windows Installer พร้อม Version เฉพาะ** (ง่ายที่สุด ไม่ต้องใช้ WSL)

**ถ้าต้องการใช้ WSL:**
- **ใช้วิธีที่ 1: เปิดใช้งาน WSL Features** (ต้องใช้ Administrator และรีสตาร์ท 2 ครั้ง)

---

## ✅ สรุป

**วิธีที่ง่ายที่สุด (ไม่ต้องใช้ WSL):**
1. ไปที่: https://github.com/anza-xyz/agave/releases
2. หา version ล่าสุด (เช่น `v1.18.26`)
3. `.\solana-install-init-x86_64-pc-windows-msvc.exe --data-dir "$env:USERPROFILE\.local\share\solana\install" v1.18.26`
4. เพิ่ม PATH และรีสตาร์ท PowerShell

**ลองวิธีไหนดี?** 🚀

