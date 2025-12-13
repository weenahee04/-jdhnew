# 🔐 Vercel Environment Variables Setup

## 📋 Supabase Credentials

คุณได้ให้ Supabase credentials มาแล้ว:

- **Project URL:** `https://kwxgpxmxhbtqbrupbluj.supabase.co`
- **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGdweG14aGJ0cWJydXBibHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTgwMDUsImV4cCI6MjA4MTE3NDAwNX0.1MakhOFRkso_cqUPU21EfS6YAoIHn5T8V6ECUBlgX-k`

⚠️ **ยังขาด:** `SUPABASE_SERVICE_KEY` (service_role key)

---

## 🔑 Generate Keys

รันคำสั่งนี้เพื่อ generate keys:

```bash
# Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 Environment Variables สำหรับ Vercel

เพิ่มใน **Vercel Dashboard** → **Settings** → **Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://kwxgpxmxhbtqbrupbluj.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGdweG14aGJ0cWJydXBibHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTgwMDUsImV4cCI6MjA4MTE3NDAwNX0.1MakhOFRkso_cqUPU21EfS6YAoIHn5T8V6ECUBlgX-k` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | `(get from Supabase Settings → API → service_role key)` | Production, Preview, Development |
| `JWT_SECRET` | `(generated key - 64 bytes hex)` | Production, Preview, Development |
| `ENCRYPTION_KEY` | `(generated key - 32 bytes hex)` | Production, Preview, Development |
| `VITE_USE_BACKEND_API` | `true` | Production, Preview, Development |

---

## 🚀 Step-by-Step: Add to Vercel

### 1. ไปที่ Vercel Dashboard

1. เปิด https://vercel.com
2. Login
3. เลือก Project `jdh-crypto-wallet`

### 2. เพิ่ม Environment Variables

1. คลิก **"Settings"** → **"Environment Variables"**
2. สำหรับแต่ละตัวแปร:
   - คลิก **"Add"**
   - ใส่ **Name** และ **Value**
   - เลือก **Environment** (Production, Preview, Development)
   - คลิก **"Save"**

### 3. Get Service Role Key

⚠️ **สำคัญ:** ต้องไปที่ Supabase เพื่อ get `SUPABASE_SERVICE_KEY`:

1. ไปที่ Supabase Dashboard
2. **Settings** → **API**
3. หา **"service_role" key** (ไม่ใช่ anon key)
4. Copy มาใส่ใน Vercel

---

## ✅ Checklist

- [x] Supabase URL
- [x] Supabase anon key
- [ ] Supabase service_role key (ต้องไป get)
- [ ] Generate encryption key
- [ ] Generate JWT secret
- [ ] Add all to Vercel
- [ ] Deploy

---

**Status:** ⚠️ **Need Service Role Key & Generated Keys**

