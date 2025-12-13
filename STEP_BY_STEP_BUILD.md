# 📝 ขั้นตอนการ Build และ Deploy JDH Chain Program

## 🎯 สิ่งที่ต้องทำ (3 ขั้นตอนหลัก)

---

## ✅ ขั้นตอนที่ 1: ติดตั้ง Tools (ทำครั้งเดียว)

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ (แนะนำ)

1. เปิด PowerShell **as Administrator** (คลิกขวา → Run as Administrator)
2. ไปที่โฟลเดอร์โปรเจค:
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   ```
3. รันสคริปต์:
   ```powershell
   .\install-solana-tools.ps1
   ```
4. รอให้ติดตั้งเสร็จ (อาจใช้เวลา 10-30 นาที)
5. **รีสตาร์ท PowerShell** หลังติดตั้งเสร็จ

### วิธีที่ 2: ติดตั้งด้วยตนเอง

#### 1.1 ติดตั้ง Rust
- ไปที่: https://rustup.rs/
- ดาวน์โหลดและรัน installer
- หรือรันใน PowerShell:
  ```powershell
  Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
  & "$env:TEMP\rustup-init.exe"
  ```

#### 1.2 ติดตั้ง Solana CLI
```powershell
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install-init.exe"
& "$env:TEMP\solana-install-init.exe" stable
```

#### 1.3 ติดตั้ง Anchor
```powershell
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### ✅ ตรวจสอบว่าติดตั้งสำเร็จ
```powershell
rustc --version    # ควรแสดง: rustc 1.x.x
solana --version   # ควรแสดง: solana-cli 1.x.x
anchor --version   # ควรแสดง: anchor-cli 0.x.x
```

---

## ✅ ขั้นตอนที่ 2: Build Program

1. เปิด PowerShell (ไม่ต้องเป็น Administrator)
2. ไปที่โฟลเดอร์โปรเจค:
   ```powershell
   cd "C:\Users\ADMIN\Downloads\jjdh a"
   ```
3. Build program:
   ```powershell
   anchor build
   ```
4. รอให้ build เสร็จ (ครั้งแรกอาจใช้เวลา 5-10 นาที)

### ✅ ตรวจสอบว่า Build สำเร็จ
- ควรเห็นข้อความ: `✅ Build successful`
- ไฟล์จะถูกสร้างใน: `target/deploy/jdh_chain.so`

---

## ✅ ขั้นตอนที่ 3: Deploy to Devnet

1. ตั้งค่า cluster เป็น devnet:
   ```powershell
   solana config set --url devnet
   ```

2. รับ SOL ฟรีสำหรับ deploy (2 SOL):
   ```powershell
   solana airdrop 2
   ```

3. Deploy program:
   ```powershell
   anchor deploy
   ```

4. **บันทึก Program ID** ที่ได้ (จะใช้ในการ update code)

### ✅ ตรวจสอบว่า Deploy สำเร็จ
- ควรเห็น Program ID จริง (ไม่ใช่ placeholder)
- ควรเห็น: `Deploy success`

---

## 🔄 หลัง Deploy สำเร็จ

### 1. Update Program ID ใน Code

หลังจาก deploy จะได้ Program ID จริง ต้อง update ใน 2 ไฟล์:

#### ไฟล์ที่ 1: `programs/jdh-chain/src/lib.rs`
```rust
// เปลี่ยนจาก:
declare_id!("JDHChaiN111111111111111111111111111111111");

// เป็น Program ID จริงที่ได้จาก deploy:
declare_id!("YourActualProgramIDHere...");
```

#### ไฟล์ที่ 2: `clients/jdhChainClient.ts`
```typescript
// เปลี่ยนจาก:
export const JDH_CHAIN_PROGRAM_ID = new PublicKey('JDHChaiN111111111111111111111111111111111');

// เป็น Program ID จริง:
export const JDH_CHAIN_PROGRAM_ID = new PublicKey('YourActualProgramIDHere...');
```

### 2. Build และ Deploy อีกครั้ง
```powershell
anchor build
anchor deploy
```

---

## 📋 Checklist

- [ ] ติดตั้ง Rust
- [ ] ติดตั้ง Solana CLI
- [ ] ติดตั้ง Anchor
- [ ] ตรวจสอบ tools ทั้งหมด (`rustc --version`, `solana --version`, `anchor --version`)
- [ ] Build program (`anchor build`)
- [ ] ตั้งค่า devnet (`solana config set --url devnet`)
- [ ] รับ SOL (`solana airdrop 2`)
- [ ] Deploy program (`anchor deploy`)
- [ ] Update Program ID ใน `lib.rs` และ `jdhChainClient.ts`
- [ ] Build และ Deploy อีกครั้ง

---

## ⚠️ ปัญหาที่อาจเจอ

### Rust ไม่พบ
- **แก้:** รีสตาร์ท PowerShell หลังติดตั้ง Rust

### Solana CLI ไม่พบ
- **แก้:** เพิ่ม PATH: `$env:USERPROFILE\.local\share\solana\install\active_release\bin`
- หรือรีสตาร์ท PowerShell

### Anchor ไม่พบ
- **แก้:** ตรวจสอบว่า Rust ติดตั้งแล้ว (`cargo --version`)
- ติดตั้ง AVM อีกครั้ง: `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`

### Build Error
- **แก้:** ตรวจสอบว่า `Anchor.toml` ถูกต้อง
- ตรวจสอบว่า `Cargo.toml` ใน `programs/jdh-chain/` ถูกต้อง

### Deploy Error: Insufficient funds
- **แก้:** รับ SOL เพิ่ม: `solana airdrop 2`

---

## 🎉 เสร็จแล้ว!

หลังจาก deploy สำเร็จ คุณจะได้:
- ✅ Solana Program ที่ deploy บน devnet
- ✅ Program ID สำหรับใช้ใน frontend
- ✅ พร้อม integrate กับ frontend

---

## 📞 ขั้นตอนต่อไป

หลังจาก deploy สำเร็จ:
1. Integrate `jdhChainClient.ts` กับ frontend
2. เพิ่ม UI สำหรับเรียกใช้ program functions
3. Test ทุก functions (mint, transfer, stake, etc.)



