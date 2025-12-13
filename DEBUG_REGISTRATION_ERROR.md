# 🐛 Debug Registration Error (HTTP 500)

## 🔍 Current Issue

**Error:** `HTTP 500` จาก `/api/auth/register`

## 📋 Possible Causes

### 1. Supabase Environment Variables Missing

**ตรวจสอบ:**
- `SUPABASE_URL` ถูกต้องหรือไม่
- `SUPABASE_SERVICE_KEY` ถูกต้องหรือไม่

**วิธีตรวจสอบ:**
```bash
vercel env ls
```

### 2. Supabase Connection Failed

**ตรวจสอบ:**
- Supabase project ยัง active อยู่หรือไม่
- Database tables สร้างแล้วหรือไม่

### 3. Database Table Schema Mismatch

**ตรวจสอบ:**
- Table `users` มี columns ถูกต้องหรือไม่
- Column names ตรงกับ code หรือไม่

## 🔧 Debug Steps

### Step 1: Check Vercel Logs

```bash
vercel logs --follow
```

หรือไปที่ Vercel Dashboard → Deployments → Latest → Functions → `/api/auth/register` → Logs

### Step 2: Test API Directly

ใช้ curl หรือ Postman:

```bash
curl -X POST https://jdh-wallet.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 3: Check Supabase

1. ไปที่ Supabase Dashboard
2. Table Editor → users
3. ตรวจสอบว่า table มีอยู่และมี columns ถูกต้อง

## 🛠️ Quick Fixes

### Fix 1: Verify Environment Variables

```bash
# Check if variables are set
vercel env ls | grep SUPABASE
```

### Fix 2: Test Supabase Connection

สร้าง test API route:

```typescript
// api/test-supabase.ts
import { getSupabaseClient } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('users').select('count');
    return res.json({ success: !error, error, data });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
}
```

---

**Status:** ⚠️ **Need to Check Vercel Logs for Actual Error**

