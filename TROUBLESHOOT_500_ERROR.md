# 🐛 Troubleshoot HTTP 500 Error

## 🔍 Current Issue

**Error:** `HTTP 500` จาก `/api/auth/register`

## 📋 Debug Steps

### Step 1: Test Supabase Connection

เปิด URL นี้ใน browser:

```
https://jdh-wallet.vercel.app/api/test-supabase
```

**ควรเห็น:**
```json
{
  "success": true,
  "envCheck": {
    "SUPABASE_URL": true,
    "SUPABASE_SERVICE_KEY": true,
    "SUPABASE_URL_VALUE": "Set"
  },
  "supabaseConnected": true,
  "tableQuery": {
    "success": true,
    "error": null,
    "dataCount": 0
  }
}
```

**ถ้าเห็น error:**
- `SUPABASE_URL: false` → Environment variable ไม่ถูกตั้งค่า
- `Failed to initialize Supabase` → Environment variables ไม่ถูกต้อง
- `tableQuery.error` → Database table ไม่มีหรือ schema ไม่ตรง

### Step 2: Check Vercel Logs

```bash
vercel logs
```

หรือไปที่ Vercel Dashboard → Deployments → Latest → Functions → `/api/auth/register` → Logs

### Step 3: Verify Environment Variables

```bash
vercel env ls
```

ตรวจสอบว่าเห็น:
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_KEY` ✅

---

## 🛠️ Common Fixes

### Fix 1: Environment Variables Not Set

```bash
# Re-add if missing
echo "https://kwxgpxmxhbtqbrupbluj.supabase.co" | vercel env add SUPABASE_URL production
```

### Fix 2: Database Table Missing

1. ไปที่ Supabase Dashboard
2. SQL Editor
3. รัน SQL จาก `QUICK_SQL_SETUP.sql`

### Fix 3: Wrong Service Key

1. ไปที่ Supabase Dashboard
2. Settings → API
3. Copy service_role key ใหม่
4. อัพเดทใน Vercel

---

**Status:** ⚠️ **Test endpoint created - Check /api/test-supabase**



