# 🚀 Quick Add Environment Variables to Vercel

## 📋 All Values Ready - Copy & Paste

### 1. SUPABASE_URL
```
https://kwxgpxmxhbtqbrupbluj.supabase.co
```

### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGdweG14aGJ0cWJydXBibHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTgwMDUsImV4cCI6MjA4MTE3NDAwNX0.1MakhOFRkso_cqUPU21EfS6YAoIHn5T8V6ECUBlgX-k
```

### 3. SUPABASE_SERVICE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGdweG14aGJ0cWJydXBibHVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU5ODAwNSwiZXhwIjoyMDgxMTc0MDA1fQ.wPC9UT8-OaN334RhmtNvld83jsAqgQtpsDcBeJfkiW8
```

### 4. JWT_SECRET
```
25e16191d5c96801a37ce615173ebd1b138f7b1ad00757779112f259affbbebaed1d8c8d44b7b0235afb494e78a1f45603aa6b3e83785d7d25e681ad5d8f7493
```

### 5. ENCRYPTION_KEY
```
98a2bf4944b27a9e70eaf4679650577241ad6c27dd9f9dbb4b5cddb9d9f87465
```

### 6. VITE_USE_BACKEND_API
```
true
```

---

## 🎯 Step-by-Step: Add to Vercel

### Step 1: ไปที่ Vercel Dashboard

1. เปิด https://vercel.com
2. Login
3. เลือก Project: `jdh-crypto-wallet` (หรือชื่อ project ของคุณ)

### Step 2: ไปที่ Environment Variables

1. คลิก **"Settings"** (⚙️) ที่เมนูบน
2. คลิก **"Environment Variables"** (ในเมนูซ้าย)

### Step 3: เพิ่มตัวแปรทีละตัว

**สำหรับแต่ละตัวแปร (6 ตัว):**

1. คลิก **"Add"** (ปุ่มสีเขียว)
2. ใส่ **Name** (ชื่อตัวแปร - copy จากด้านบน)
3. ใส่ **Value** (ค่า - copy จากด้านบน)
4. เลือก **Environment**:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
   - (เลือกทั้ง 3)
5. คลิก **"Save"**

**ทำซ้ำสำหรับทั้ง 6 ตัวแปร**

---

## ✅ ตรวจสอบ

หลังจากเพิ่มครบทั้ง 6 ตัว ควรเห็น:

```
SUPABASE_URL              ✅
SUPABASE_ANON_KEY         ✅
SUPABASE_SERVICE_KEY      ✅
JWT_SECRET                ✅
ENCRYPTION_KEY            ✅
VITE_USE_BACKEND_API      ✅
```

---

## 🚀 Next: Deploy

หลังจากเพิ่ม environment variables แล้ว:

1. **Commit & Push Code:**
   ```bash
   git add .
   git commit -m "Add backend API with Supabase"
   git push
   ```

2. **Vercel จะ Deploy อัตโนมัติ** (หรือ deploy manual: `vercel --prod`)

3. **Test:**
   - เปิดเว็บ
   - สมัครสมาชิก
   - สร้าง wallet
   - Login

---

**Status:** ✅ **Ready to Add to Vercel!**

