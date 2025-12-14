# 🚀 เริ่มต้นที่นี่ - Build และ Deploy JDH Chain

## 📋 สรุปขั้นตอน (3 ขั้นตอน)

---

## 1️⃣ ติดตั้ง Tools (ทำครั้งเดียว)

### วิธีง่าย: ใช้สคริปต์

1. เปิด **PowerShell as Administrator**
   - คลิกขวาที่ PowerShell → Run as Administrator

2. ไปที่โฟลเดอร์โปรเจค:
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   ```

3. รันสคริปต์:
   ```powershell
   .\install-solana-tools.ps1
   ```

4. รอให้ติดตั้งเสร็จ (10-30 นาที)

5. **รีสตาร์ท PowerShell** หลังติดตั้งเสร็จ

### ตรวจสอบว่าติดตั้งสำเร็จ:
```powershell
rustc --version
solana --version
anchor --version
```

---

## 2️⃣ Build Program

1. เปิด PowerShell (ไม่ต้องเป็น Administrator)

2. ไปที่โฟลเดอร์โปรเจค:
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   ```

3. Build:
   ```powershell
   anchor build
   ```

4. รอให้ build เสร็จ (5-10 นาที)

---

## 3️⃣ Deploy to Devnet

1. ตั้งค่า devnet:
   ```powershell
   solana config set --url devnet
   ```

2. รับ SOL ฟรี:
   ```powershell
   solana airdrop 2
   ```

3. Deploy:
   ```powershell
   anchor deploy
   ```

4. **บันทึก Program ID** ที่ได้

5. Update Program ID ใน:
   - `programs/jdh-chain/src/lib.rs`
   - `clients/jdhChainClient.ts`

6. Build และ Deploy อีกครั้ง:
   ```powershell
   anchor build
   anchor deploy
   ```

---

## 📖 ดูรายละเอียดเพิ่มเติม

- `STEP_BY_STEP_BUILD.md` - คู่มือละเอียด
- `INSTALL_SOLANA_PROGRAM.md` - วิธีติดตั้ง tools
- `QUICK_BUILD_GUIDE.md` - คู่มือแบบย่อ

---

## ⚠️ ถ้ามีปัญหา

ดูที่ `STEP_BY_STEP_BUILD.md` ส่วน "ปัญหาที่อาจเจอ"




