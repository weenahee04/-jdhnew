# 📋 ขั้นตอนต่อไป - JDH Mining System

## ✅ สิ่งที่ทำเสร็จแล้ว

- ✅ Solana Program code (mining.rs)
- ✅ Backend API endpoints
- ✅ Frontend MiningPage component
- ✅ Merkle tree implementation
- ✅ Database schema
- ✅ Documentation

---

## 🚀 ขั้นตอนที่ต้องทำ (เรียงตามลำดับ)

### 1️⃣ Setup Database (สำคัญที่สุด)

**ทำใน Supabase:**

1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. Copy เนื้อหาจาก `supabase_mining_setup.sql`
4. Paste และ Run

**ตรวจสอบ:**
```sql
-- ตรวจสอบว่า tables ถูกสร้างแล้ว
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'mining%';
```

---

### 2️⃣ Setup Environment Variables

**เพิ่มใน Vercel:**

1. ไปที่ Vercel Dashboard → Project → Settings → Environment Variables
2. เพิ่ม:
   ```
   MINING_COMMITMENT_KEYPAIR=<your-base58-keypair>
   ```

**สร้าง Keypair:**
```powershell
# ถ้ายังไม่มี Solana CLI ติดตั้งก่อน
solana-keygen new --outfile mining-commitment.json

# อ่าน secret key และ encode เป็น base58
# (จะใช้ใน production สำหรับ commit Merkle roots)
```

**หมายเหตุ:** สำหรับ development สามารถใช้ placeholder ก่อนได้

---

### 3️⃣ Build & Deploy Solana Program

**ถ้ายังไม่ได้ติดตั้ง tools:**
```powershell
# ดู CURRENT_STATUS.md สำหรับขั้นตอนติดตั้ง
```

**Build Program:**
```powershell
cd "C:\Users\ADMIN\Downloads\jjdh a"
anchor build
```

**Deploy to Devnet:**
```powershell
solana config set --url devnet
solana airdrop 2
anchor deploy
```

**บันทึก Program ID** ที่ได้จาก deploy

---

### 4️⃣ Update Program ID

**หลัง deploy จะได้ Program ID จริง:**

1. **Update `programs/jdh-chain/src/lib.rs`:**
   ```rust
   declare_id!("YourActualProgramIDHere...");
   ```

2. **Update `clients/jdhChainClient.ts`:**
   ```typescript
   export const JDH_CHAIN_PROGRAM_ID = new PublicKey('YourActualProgramIDHere...');
   ```

3. **Build และ Deploy อีกครั้ง:**
   ```powershell
   anchor build
   anchor deploy
   ```

---

### 5️⃣ Initialize Mining Vault (On-chain)

**เรียกใช้ Solana Program:**

ต้องเรียก `initialize_mining_vault` function ด้วย:
- `entry_fee_cap`: 10 JDH (หรือตามต้องการ)

**วิธีเรียก:**
- ใช้ Solana CLI
- หรือสร้าง script ใน `scripts/initialize-vault.ts`
- หรือใช้ Anchor test

---

### 6️⃣ Test Mining System

**ทดสอบใน Browser:**

1. เปิดแอป
2. ไปที่หน้า Mining (จาก Sidebar)
3. เชื่อมต่อ wallet
4. ทดสอบ:
   - Request challenge
   - Solve PoW
   - Submit solution
   - ดู stats

---

### 7️⃣ Setup Merkle Commitment Schedule

**ตั้งค่าให้ commit อัตโนมัติ:**

สร้าง cron job หรือ scheduled function:
- Commit ทุก 100 events
- หรือทุก 1 ชั่วโมง

**ตัวอย่าง (Vercel Cron):**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/mining/commit",
    "schedule": "0 * * * *"
  }]
}
```

---

## 📝 Checklist

- [ ] Run `supabase_mining_setup.sql` ใน Supabase
- [ ] เพิ่ม `MINING_COMMITMENT_KEYPAIR` ใน Vercel
- [ ] Build Solana program (`anchor build`)
- [ ] Deploy Solana program (`anchor deploy`)
- [ ] Update Program ID ใน code
- [ ] Initialize Mining Vault on-chain
- [ ] Test mining flow ใน browser
- [ ] Setup Merkle commitment schedule

---

## 🔧 Troubleshooting

### Database ไม่มี tables
- ตรวจสอบว่า run SQL script แล้ว
- ตรวจสอบ Supabase connection

### API errors
- ตรวจสอบ environment variables
- ดู Vercel logs

### Solana Program errors
- ตรวจสอบว่า deploy สำเร็จ
- ตรวจสอบ Program ID ถูกต้อง

### Frontend ไม่แสดง
- ตรวจสอบว่า import MiningPage แล้ว
- ตรวจสอบ NavTab.MINING ใน types.ts

---

## 📚 เอกสารที่เกี่ยวข้อง

- `MINING_SYSTEM_DOCUMENTATION.md` - เอกสารระบบ
- `MINING_SETUP_GUIDE.md` - คู่มือ setup
- `supabase_mining_setup.sql` - Database schema
- `CURRENT_STATUS.md` - สถานะปัจจุบัน

---

## ⚡ Quick Start (ถ้าต้องการทดสอบเร็ว)

1. **Run SQL script** ใน Supabase
2. **Deploy to Vercel** (API endpoints)
3. **Test ใน browser** (frontend พร้อมแล้ว)

**หมายเหตุ:** Solana Program สามารถทำทีหลังได้ (frontend จะทำงานได้ แต่ deposit/withdraw ยังไม่ได้)

---

## 🎯 สิ่งที่สำคัญที่สุดตอนนี้

1. **Database Setup** - ต้องทำก่อน (API ต้องใช้)
2. **Deploy API** - Deploy ไป Vercel
3. **Test Frontend** - ทดสอบว่า mining interface ทำงาน

Solana Program สามารถทำทีหลังได้ (สำหรับ deposit/withdraw จริงๆ)

---

**พร้อมเริ่มได้เลย!** 🚀

