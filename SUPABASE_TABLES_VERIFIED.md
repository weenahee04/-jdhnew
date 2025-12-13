# ✅ Supabase Tables - Verified

## 📊 Tables Created

### ✅ 1. `users` table
- **Purpose:** เก็บข้อมูล user accounts
- **Columns:**
  - `id` (UUID, Primary Key)
  - `email` (TEXT, Unique)
  - `password_hash` (TEXT)
  - `display_name` (TEXT)
  - `wallet_address` (TEXT)
  - `has_wallet` (BOOLEAN)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### ✅ 2. `wallets` table
- **Purpose:** เก็บ encrypted seed phrases
- **Columns:**
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key → users.id)
  - `mnemonic_encrypted` (TEXT)
  - `public_key` (TEXT)
  - `created_at` (TIMESTAMP)

### ✅ Indexes Created
- `idx_users_email` - สำหรับค้นหา user จาก email
- `idx_wallets_user_id` - สำหรับค้นหา wallet จาก user_id

---

## ⚠️ Note: "UNRESTRICTED" Label

ถ้าเห็น label **"UNRESTRICTED"** ใน Table Editor:
- หมายถึง **Row Level Security (RLS)** ยังไม่ได้เปิดใช้งาน
- สำหรับ production ควรเปิด RLS แต่ตอนนี้ยังไม่จำเป็น
- สามารถเปิดได้ทีหลังเมื่อพร้อม

---

## 🎯 Next Steps

### Step 1: Get API Keys ✅ (ทำต่อ)

1. ไปที่ **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### Step 2: Generate Encryption & JWT Keys

```bash
# Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Add Environment Variables ใน Vercel

เพิ่มใน Vercel Dashboard → Settings → Environment Variables

---

## ✅ Checklist

- [x] สร้าง Supabase project
- [x] สร้าง database tables (users, wallets)
- [x] สร้าง indexes
- [ ] Get API keys
- [ ] Generate encryption & JWT keys
- [ ] Add environment variables
- [ ] Deploy & test

---

**Status:** ✅ **Tables Created Successfully!**

