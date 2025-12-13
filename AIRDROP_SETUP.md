# 🎁 Airdrop System Setup Guide

## 📋 Overview

ระบบ Airdrop ที่ส่ง JDH token อัตโนมัติผ่าน Solana blockchain เมื่อผู้ใช้กรอกโค้ดที่ขึ้นต้นด้วย `JI-68006751`

## 🔧 Setup Steps

### 1. สร้าง Airdrop Wallet

คุณต้องสร้าง wallet ใหม่สำหรับ airdrop ที่มี JDH token อยู่:

```bash
# สร้าง wallet ใหม่
solana-keygen new --outfile airdrop-wallet.json

# ดู public key
solana-keygen pubkey airdrop-wallet.json

# ฝาก JDH token ไปยัง wallet นี้ (อย่างน้อย 10,000 JDH ต่อการ claim)
```

### 2. Export Private Key

```bash
# แปลง private key เป็น base58 format
cat airdrop-wallet.json | jq -r '.[0:64]' | xxd -r -p | base58
```

หรือใช้ Node.js:
```javascript
const fs = require('fs');
const bs58 = require('bs58');
const keypair = JSON.parse(fs.readFileSync('airdrop-wallet.json', 'utf8'));
const privateKey = bs58.encode(Buffer.from(keypair));
console.log(privateKey);
```

### 3. เพิ่ม Environment Variable ใน Vercel

ไปที่ Vercel Dashboard → Project Settings → Environment Variables:

- **Key:** `AIRDROP_WALLET_PRIVATE_KEY`
- **Value:** Private key ในรูปแบบ base58 (จากขั้นตอนที่ 2)
- **Environment:** Production, Preview, Development

### 4. สร้าง Database Table

รัน SQL script ใน Supabase SQL Editor:

```sql
-- Create airdrop_claims table
CREATE TABLE IF NOT EXISTS airdrop_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  transaction_signature TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_code ON airdrop_claims(code);
CREATE INDEX IF NOT EXISTS idx_airdrop_claims_wallet ON airdrop_claims(wallet_address);
```

หรือใช้ไฟล์ `supabase_airdrop_setup.sql`

### 5. ตรวจสอบ RPC Endpoint

ตรวจสอบว่า environment variables เหล่านี้ถูกตั้งค่าแล้ว:
- `HELIUS_RPC_URL` หรือ `SOLANA_CLUSTER` (ควรเป็น `mainnet-beta`)

## 🚀 How It Works

1. **User กรอกโค้ด** → Frontend validate ว่าโค้ดขึ้นต้นด้วย `JI-68006751`
2. **Frontend เรียก API** → `POST /api/airdrop/claim` พร้อม `code` และ `walletAddress`
3. **Backend ตรวจสอบ:**
   - โค้ดถูกต้องหรือไม่
   - โค้ดถูกใช้แล้วหรือยัง (ตรวจสอบใน database)
   - Airdrop wallet มี JDH token เพียงพอหรือไม่
4. **Backend ส่ง JDH token** → ใช้ airdrop wallet ส่ง 10,000 JDH ไปยัง wallet ของผู้ใช้
5. **บันทึกใน Database** → บันทึก transaction signature และข้อมูล claim

## 🔒 Security Notes

- **Private Key:** เก็บ private key ใน Vercel Environment Variables เท่านั้น อย่า commit ลง git
- **Code Validation:** โค้ดต้องขึ้นต้นด้วย `JI-68006751` และถูกใช้ได้ครั้งเดียว
- **Rate Limiting:** พิจารณาเพิ่ม rate limiting เพื่อป้องกัน abuse
- **Monitoring:** ตรวจสอบ balance ของ airdrop wallet เป็นประจำ

## 📊 Monitoring

ตรวจสอบ airdrop claims:
```sql
SELECT * FROM airdrop_claims ORDER BY claimed_at DESC LIMIT 10;
```

ตรวจสอบ balance ของ airdrop wallet:
```bash
solana balance <AIRDROP_WALLET_PUBLIC_KEY>
```

## ⚠️ Important

- Airdrop wallet ต้องมี JDH token และ SOL (สำหรับ gas fee) เพียงพอ
- แต่ละ claim ใช้ SOL ~0.000005 สำหรับ gas fee
- ตรวจสอบ balance เป็นประจำและเติม JDH token เมื่อจำเป็น

