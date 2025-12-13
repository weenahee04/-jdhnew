# 🔍 วิธีตรวจสอบ Database ใน Supabase

## 📋 ขั้นตอนการตรวจสอบ

### 1. ตรวจสอบ Tables

1. ไปที่ Supabase Dashboard
2. เปิด **Database** → **Tables** (ใน sidebar ด้านซ้าย)
3. ตรวจสอบว่ามี tables ต่อไปนี้หรือไม่:
   - ✅ `users` - เก็บข้อมูล user accounts
   - ✅ `wallets` - เก็บข้อมูล wallet (encrypted mnemonic)

### 2. ตรวจสอบ Data ใน Tables

#### ตรวจสอบ Table `users`:
1. คลิกที่ table `users`
2. ดูที่ tab **Table Editor** หรือ **Data**
3. ตรวจสอบ:
   - มี records หรือไม่?
   - `has_wallet` column = `true` หรือไม่?
   - `wallet_address` column มีค่าหรือไม่?

#### ตรวจสอบ Table `wallets`:
1. คลิกที่ table `wallets`
2. ดูที่ tab **Table Editor** หรือ **Data**
3. ตรวจสอบ:
   - มี records หรือไม่?
   - `user_id` column ตรงกับ user ID ใน table `users` หรือไม่?
   - `mnemonic_encrypted` column มีค่าหรือไม่?
   - `public_key` column มีค่าหรือไม่?

### 3. ตรวจสอบ RLS (Row Level Security) Policies

1. ไปที่ **Database** → **Policies** (ใน sidebar ด้านซ้าย)
2. ตรวจสอบว่า table `wallets` มี policies หรือไม่:
   - ถ้าไม่มี → อาจจะต้อง disable RLS หรือสร้าง policies

### 4. ตรวจสอบ API Functions

1. ไปที่ **Database** → **Functions** (ใน sidebar ด้านซ้าย)
2. ตรวจสอบว่ามี functions หรือไม่:
   - ถ้าไม่มี → ไม่เป็นไร (เราใช้ Vercel Serverless Functions แทน)

---

## 🐛 ถ้า Tables ไม่มี

### สร้าง Tables ใหม่:

1. ไปที่ **SQL Editor** (ใน sidebar ด้านซ้าย)
2. คัดลอก SQL จากไฟล์ `QUICK_SQL_SETUP.sql`
3. วางใน SQL Editor
4. กด **Run** หรือ **Execute**

---

## 🔍 วิธีตรวจสอบว่า Wallet ถูกบันทึกหรือไม่

### วิธีที่ 1: ใช้ Supabase Dashboard

1. ไปที่ **Database** → **Tables** → `wallets`
2. ดู records:
   - ถ้ามี record → wallet ถูกบันทึกแล้ว ✅
   - ถ้าไม่มี record → wallet ยังไม่ถูกบันทึก ❌

### วิธีที่ 2: ใช้ SQL Query

1. ไปที่ **SQL Editor**
2. Run query นี้:
```sql
-- ตรวจสอบ wallets
SELECT 
  w.id,
  w.user_id,
  w.public_key,
  CASE 
    WHEN w.mnemonic_encrypted IS NOT NULL THEN 'Encrypted' 
    ELSE 'NULL' 
  END as mnemonic_status,
  w.created_at
FROM wallets w
ORDER BY w.created_at DESC
LIMIT 10;

-- ตรวจสอบ users ที่มี wallet
SELECT 
  u.id,
  u.email,
  u.has_wallet,
  u.wallet_address,
  CASE 
    WHEN w.id IS NOT NULL THEN 'Wallet exists' 
    ELSE 'No wallet' 
  END as wallet_status
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
ORDER BY u.created_at DESC
LIMIT 10;
```

---

## 🛠️ ถ้า Wallet ไม่ถูกบันทึก

### ตรวจสอบ Vercel Logs:

1. ไปที่ Vercel Dashboard
2. เปิด Project → **Functions** → `/api/wallet/save`
3. ดู logs:
   - มี error หรือไม่?
   - API return success หรือไม่?

### ตรวจสอบ Environment Variables:

1. ไปที่ Vercel Dashboard
2. เปิด Project → **Settings** → **Environment Variables**
3. ตรวจสอบ:
   - `SUPABASE_URL` ถูกต้องหรือไม่?
   - `SUPABASE_SERVICE_KEY` ถูกต้องหรือไม่?
   - `ENCRYPTION_KEY` ถูกต้องหรือไม่?

---

## 📝 สรุป

1. ✅ ตรวจสอบว่า tables `users` และ `wallets` มีอยู่
2. ✅ ตรวจสอบว่า table `wallets` มี records
3. ✅ ตรวจสอบว่า table `users` มี `has_wallet = true` และ `wallet_address` มีค่า
4. ✅ ตรวจสอบ RLS policies (ถ้ามี)
5. ✅ ตรวจสอบ Vercel logs สำหรับ API errors

