# 🚀 Backend Setup Guide - Production Database

## 📋 ตัวเลือก Backend (แนะนำ)

### 1. Supabase (แนะนำ - ง่ายที่สุด) ⭐

**ข้อดี:**
- ✅ ฟรี tier (500MB database)
- ✅ PostgreSQL database
- ✅ Authentication built-in
- ✅ Real-time subscriptions
- ✅ REST API อัตโนมัติ
- ✅ Row Level Security

**Setup:**
1. ไปที่ https://supabase.com
2. สร้าง project
3. Copy API keys
4. ตั้งค่า environment variables

---

### 2. Firebase (Google)

**ข้อดี:**
- ✅ ฟรี tier
- ✅ Firestore database
- ✅ Authentication
- ✅ Real-time

**Setup:**
1. ไปที่ https://firebase.google.com
2. สร้าง project
3. Enable Firestore
4. Copy config

---

### 3. MongoDB Atlas

**ข้อดี:**
- ✅ ฟรี tier (512MB)
- ✅ NoSQL database
- ✅ Flexible schema

**Setup:**
1. ไปที่ https://www.mongodb.com/cloud/atlas
2. สร้าง cluster
3. Get connection string

---

### 4. Vercel Serverless Functions + Supabase

**ข้อดี:**
- ✅ ใช้ Vercel (deploy อยู่แล้ว)
- ✅ Serverless functions
- ✅ Supabase database

**Setup:**
1. สร้าง Supabase project
2. สร้าง API routes ใน Vercel
3. ตั้งค่า environment variables

---

## 🎯 แนะนำ: Supabase (ง่ายที่สุด)

### ขั้นตอน Setup:

#### 1. สร้าง Supabase Project

1. ไปที่ https://supabase.com
2. Sign up (ใช้ GitHub/Google)
3. New Project
4. ตั้งชื่อ project (เช่น `jdh-wallet`)
5. ตั้งค่า Database Password
6. เลือก Region (ใกล้ที่สุด)
7. Create project

#### 2. สร้าง Database Tables

ไปที่ SQL Editor ใน Supabase Dashboard:

```sql
-- Users table
CREATE TABLE users (
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
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mnemonic_encrypted TEXT NOT NULL, -- Encrypted seed phrase
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
```

#### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on wallets table
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own wallets
CREATE POLICY "Users can access own wallets" ON wallets
  FOR ALL USING (user_id = auth.uid());
```

#### 4. Get API Keys

1. ไปที่ Project Settings → API
2. Copy:
   - `Project URL` (เช่น `https://xxxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (สำหรับ server-side)

---

## 🔧 Setup Backend API

### Option A: Vercel Serverless Functions

สร้าง folder `api/` ใน project:

```
api/
├── auth/
│   ├── register.ts
│   ├── login.ts
│   └── logout.ts
├── wallet/
│   ├── create.ts
│   ├── get.ts
│   └── update.ts
└── user/
    └── profile.ts
```

### Option B: Supabase Client (Direct)

ใช้ `@supabase/supabase-js` ใน frontend (แต่ต้องมี backend สำหรับ sensitive operations)

---

## 📝 Environment Variables

เพิ่มใน Vercel:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key (server-side only)
```

---

## 🔐 Security

### 1. Password Hashing
- ใช้ `bcrypt` หรือ `argon2` ใน backend
- ไม่เก็บ plain text password

### 2. Seed Phrase Encryption
- เข้ารหัส seed phrase ก่อนเก็บใน database
- ใช้ AES-256 หรือ similar
- Key เก็บใน environment variable

### 3. API Authentication
- ใช้ JWT tokens
- หรือ Supabase Auth

---

## 🚀 Next Steps

1. **เลือก Backend Platform** (แนะนำ Supabase)
2. **สร้าง Database Tables**
3. **Setup API Routes**
4. **Update Frontend** (แก้ไข authService.ts)
5. **Deploy & Test**

---

**Status:** ⚠️ **Ready to Setup**

