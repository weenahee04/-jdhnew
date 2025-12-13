# 🚀 Production Backend Setup - Step by Step

## 📋 Overview

เปลี่ยนจาก **localStorage** → **Supabase Database** สำหรับเก็บข้อมูลจริง

---

## ✅ Step 1: สร้าง Supabase Project

### 1.1 ไปที่ Supabase

1. เปิด https://supabase.com
2. Sign up / Login (ใช้ GitHub หรือ Google)
3. คลิก **"New Project"**

### 1.2 ตั้งค่า Project

- **Name:** `jdh-wallet` (หรือชื่ออื่น)
- **Database Password:** ตั้งรหัสผ่านที่แข็งแรง (จดไว้!)
- **Region:** เลือกใกล้ที่สุด (เช่น `Southeast Asia (Singapore)`)
- **Pricing Plan:** เลือก **Free** (500MB database)

4. คลิก **"Create new project"**
5. รอ ~2 นาที (Supabase จะ setup database)

---

## ✅ Step 2: สร้าง Database Tables

### 2.1 ไปที่ SQL Editor

1. ใน Supabase Dashboard → คลิก **"SQL Editor"** (เมนูซ้าย)
2. คลิก **"New query"**

### 2.2 รัน SQL Script

⚠️ **สำคัญ:** 
- **อย่า copy markdown code block delimiters** (` ```sql ` หรือ ` ``` `)
- Copy เฉพาะ SQL code เท่านั้น

**วิธีที่ 1: ใช้ไฟล์ `supabase_setup.sql`**
1. เปิดไฟล์ `supabase_setup.sql` ในโปรเจค
2. Copy ทั้งหมด (Ctrl+A, Ctrl+C)
3. Paste ใน Supabase SQL Editor

**วิธีที่ 2: Copy จากด้านล่าง**

Copy SQL นี้ (เริ่มจาก `-- Users table`):

```
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  wallet_address TEXT,
  has_wallet BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table (เก็บ seed phrases - encrypted)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mnemonic_encrypted TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
```

3. คลิก **"Run"** (หรือกด `Ctrl+Enter`)
4. ควรเห็น **"Success. No rows returned"**

---

## ✅ Step 3: Get API Keys

### 3.1 ไปที่ Project Settings

1. ใน Supabase Dashboard → คลิก **"Settings"** (⚙️)
2. คลิก **"API"** (ในเมนูซ้าย)

### 3.2 Copy Keys

คุณจะเห็น:

- **Project URL:** `https://xxxxx.supabase.co`
  - Copy ไว้ (ใช้เป็น `SUPABASE_URL`)

- **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Copy ไว้ (ใช้เป็น `SUPABASE_ANON_KEY`)

- **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - ⚠️ **สำคัญ:** Copy ไว้ (ใช้เป็น `SUPABASE_SERVICE_KEY`)
  - ⚠️ **อย่าแชร์ key นี้!** (มีสิทธิ์เต็มใน database)

---

## ✅ Step 4: Generate Encryption Key

### 4.1 สร้าง Encryption Key

รันคำสั่งนี้ใน terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**ตัวอย่าง output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Copy key ที่ได้มา (ใช้สำหรับ encrypt/decrypt seed phrases)

---

## ✅ Step 5: Generate JWT Secret

### 5.1 สร้าง JWT Secret

รันคำสั่งนี้ใน terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**ตัวอย่าง output:**
```
1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0
```

Copy key ที่ได้มา (ใช้สำหรับ JWT authentication)

---

## ✅ Step 6: Setup Environment Variables ใน Vercel

### 6.1 ไปที่ Vercel Dashboard

1. เปิด https://vercel.com
2. Login
3. เลือก Project `jdh-crypto-wallet` (หรือชื่อ project ของคุณ)

### 6.2 เพิ่ม Environment Variables

1. คลิก **"Settings"** → **"Environment Variables"**
2. เพิ่มตัวแปรต่อไปนี้:

| Name | Value | Environment |
|------|-------|--------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `JWT_SECRET` | `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0` | Production, Preview, Development |
| `ENCRYPTION_KEY` | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2` | Production, Preview, Development |

3. สำหรับแต่ละตัวแปร:
   - คลิก **"Add"**
   - ใส่ **Name** และ **Value**
   - เลือก **Environment** (Production, Preview, Development)
   - คลิก **"Save"**

---

## ✅ Step 7: Switch Frontend to Backend API

### 7.1 แก้ไข `services/authService.ts`

เปลี่ยนจาก:
```typescript
import * as authService from './authService';
```

เป็น:
```typescript
import * as authService from './authServiceBackend';
```

### 7.2 อัพเดท `App.tsx`

แก้ไข `handleWalletCreated` และ `handleAuthComplete` ให้ใช้ backend API

---

## ✅ Step 8: Deploy

### 8.1 Push Code

```bash
git add .
git commit -m "Add backend API support"
git push
```

### 8.2 Vercel จะ Deploy อัตโนมัติ

หรือ deploy manual:

```bash
vercel --prod
```

---

## ✅ Step 9: Test

### 9.1 Test Registration

1. เปิดเว็บ
2. สมัครสมาชิก (email + password)
3. ตรวจสอบใน Supabase Dashboard → **"Table Editor"** → **"users"**
   - ควรเห็น user ใหม่

### 9.2 Test Login

1. Logout
2. Login ด้วย email + password เดิม
3. ควรเข้าสู่ระบบได้

### 9.3 Test Wallet Creation

1. สร้าง wallet
2. ตรวจสอบใน Supabase Dashboard → **"Table Editor"** → **"wallets"**
   - ควรเห็น wallet ใหม่ (mnemonic_encrypted)

---

## ✅ Checklist

- [ ] สร้าง Supabase project
- [ ] สร้าง database tables
- [ ] Get API keys (URL, anon key, service_role key)
- [ ] Generate encryption key
- [ ] Generate JWT secret
- [ ] Setup environment variables ใน Vercel
- [ ] Switch frontend to backend API
- [ ] Deploy
- [ ] Test registration
- [ ] Test login
- [ ] Test wallet creation

---

## 🔐 Security Notes

### ⚠️ ข้อควรระวัง:

1. **SUPABASE_SERVICE_KEY**
   - ⚠️ **อย่า expose ใน client-side!**
   - ใช้ใน server-side (API routes) เท่านั้น

2. **ENCRYPTION_KEY**
   - ⚠️ **อย่า expose ใน client-side!**
   - ใช้ใน server-side เท่านั้น

3. **JWT_SECRET**
   - ⚠️ **อย่า expose ใน client-side!**
   - ใช้ใน server-side เท่านั้น

---

## 📝 Files Created

- `api/auth/register.ts` - User registration
- `api/auth/login.ts` - User login
- `api/wallet/save.ts` - Save wallet (encrypted)
- `api/wallet/get.ts` - Get wallet (decrypted)
- `api/user/wallet.ts` - Update user wallet
- `api/user/profile.ts` - Update user profile
- `services/authServiceBackend.ts` - Frontend API client

---

## 🚀 Status

**Ready to Setup!** ✅

ทำตามขั้นตอนข้างต้นทีละขั้น แล้วจะได้ backend database ที่เก็บข้อมูลจริง!

