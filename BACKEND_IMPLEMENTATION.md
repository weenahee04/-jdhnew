# 🚀 Backend Implementation Guide - Production Ready

## 📋 Overview

เปลี่ยนจาก localStorage → Backend Database (Supabase)

---

## 🎯 Step 1: Setup Supabase

### 1.1 สร้าง Supabase Project

1. ไปที่ https://supabase.com
2. Sign up / Login
3. New Project
4. ตั้งค่า:
   - **Name:** `jdh-wallet`
   - **Database Password:** (ตั้งรหัสผ่านที่แข็งแรง)
   - **Region:** เลือกใกล้ที่สุด
5. Create project (รอ ~2 นาที)

### 1.2 สร้าง Database Tables

ไปที่ **SQL Editor** ใน Supabase Dashboard:

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
  mnemonic_encrypted TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
```

### 1.3 Get API Keys

1. ไปที่ **Project Settings** → **API**
2. Copy:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (เก็บไว้เป็นความลับ!)

---

## 🔧 Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

---

## 🔐 Step 3: Generate Encryption Key

```bash
# Generate 32-byte key for AES-256
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy key ที่ได้มา (ใช้สำหรับ encrypt/decrypt seed phrases)

---

## 📝 Step 4: Setup Environment Variables

เพิ่มใน Vercel Dashboard:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_32_byte_hex_key
```

---

## 🚀 Step 5: Deploy API Routes

API routes ที่สร้างไว้:
- `api/auth/register.ts` - สมัครสมาชิก
- `api/auth/login.ts` - ล็อกอิน
- `api/wallet/save.ts` - บันทึก wallet
- `api/wallet/get.ts` - โหลด wallet

Vercel จะ deploy อัตโนมัติเมื่อ push code

---

## 🔄 Step 6: Update Frontend

แก้ไข `services/authService.ts` ให้เรียก backend API แทน localStorage

---

## ✅ Checklist

- [ ] สร้าง Supabase project
- [ ] สร้าง database tables
- [ ] Get API keys
- [ ] Install dependencies
- [ ] Generate encryption key
- [ ] ตั้งค่า environment variables
- [ ] Deploy API routes
- [ ] Update frontend
- [ ] Test registration
- [ ] Test login
- [ ] Test wallet save/load

---

**Status:** ⚠️ **Ready to Implement**

