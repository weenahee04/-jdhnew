# 📋 ขั้นตอนถัดไป - คู่มือละเอียด

## ✅ สิ่งที่ทำแล้ว

- [x] สร้าง Supabase project
- [x] สร้าง database tables (users, wallets)
- [x] สร้าง API routes
- [x] สร้าง Supabase helper
- [x] Generate encryption key & JWT secret

---

## 🎯 ขั้นตอนที่เหลือ (3 ขั้นตอน)

### Step 1: Get SUPABASE_SERVICE_KEY จาก Supabase

#### 1.1 เปิด Supabase Dashboard

1. ไปที่ https://supabase.com
2. Login
3. เลือก Project: `jdh-wallet` (หรือชื่อที่คุณตั้ง)

#### 1.2 ไปที่ Settings → API

1. คลิก **"Settings"** (⚙️) ที่เมนูซ้าย
2. คลิก **"API"** (ในเมนูซ้าย)

#### 1.3 หา service_role key

คุณจะเห็น 2 keys:

1. **anon public** key (มีแล้ว)
   - ใช้สำหรับ client-side (frontend)
   - ปลอดภัยกว่า

2. **service_role** key (ต้อง copy)
   - ⚠️ **สำคัญ:** Scroll ลงไปหา
   - ใช้สำหรับ server-side (API routes)
   - ⚠️ **อย่าแชร์ key นี้!** (มีสิทธิ์เต็มใน database)
   - มักจะยาวกว่า anon key

#### 1.4 Copy service_role key

1. คลิกที่ **"Reveal"** หรือ **"Copy"** ข้าง service_role key
2. Copy ทั้งหมด (จะยาวมาก)
3. เก็บไว้ (จะใช้ใน Step 2)

---

### Step 2: เพิ่ม Environment Variables ใน Vercel

#### 2.1 เปิด Vercel Dashboard

1. ไปที่ https://vercel.com
2. Login
3. เลือก Project: `jdh-crypto-wallet` (หรือชื่อ project ของคุณ)

#### 2.2 ไปที่ Settings → Environment Variables

1. คลิก **"Settings"** (⚙️) ที่เมนูบน
2. คลิก **"Environment Variables"** (ในเมนูซ้าย)

#### 2.3 เพิ่มตัวแปรทีละตัว

**สำหรับแต่ละตัวแปร:**

1. คลิก **"Add"** (ปุ่มสีเขียว)
2. ใส่ **Name** (ชื่อตัวแปร)
3. ใส่ **Value** (ค่าจากด้านล่าง)
4. เลือก **Environment**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (เลือกทั้ง 3)
5. คลิก **"Save"**

#### 2.4 ตัวแปรที่ต้องเพิ่ม (6 ตัว)

##### 1. SUPABASE_URL

- **Name:** `SUPABASE_URL`
- **Value:** 
  ```
  https://kwxgpxmxhbtqbrupbluj.supabase.co
  ```
- **Environment:** Production, Preview, Development

---

##### 2. SUPABASE_ANON_KEY

- **Name:** `SUPABASE_ANON_KEY`
- **Value:**
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3eGdweG14aGJ0cWJydXBibHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTgwMDUsImV4cCI6MjA4MTE3NDAwNX0.1MakhOFRkso_cqUPU21EfS6YAoIHn5T8V6ECUBlgX-k
  ```
- **Environment:** Production, Preview, Development

---

##### 3. SUPABASE_SERVICE_KEY

- **Name:** `SUPABASE_SERVICE_KEY`
- **Value:** (paste service_role key ที่ copy จาก Step 1)
- **Environment:** Production, Preview, Development
- ⚠️ **สำคัญ:** อย่าแชร์ key นี้!

---

##### 4. JWT_SECRET

- **Name:** `JWT_SECRET`
- **Value:**
  ```
  25e16191d5c96801a37ce615173ebd1b138f7b1ad00757779112f259affbbebaed1d8c8d44b7b0235afb494e78a1f45603aa6b3e83785d7d25e681ad5d8f7493
  ```
- **Environment:** Production, Preview, Development

---

##### 5. ENCRYPTION_KEY

- **Name:** `ENCRYPTION_KEY`
- **Value:**
  ```
  98a2bf4944b27a9e70eaf4679650577241ad6c27dd9f9dbb4b5cddb9d9f87465
  ```
- **Environment:** Production, Preview, Development

---

##### 6. VITE_USE_BACKEND_API

- **Name:** `VITE_USE_BACKEND_API`
- **Value:**
  ```
  true
  ```
- **Environment:** Production, Preview, Development

---

#### 2.5 ตรวจสอบ

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

### Step 3: Deploy

#### 3.1 Commit & Push Code

```bash
# ตรวจสอบว่ามีไฟล์ใหม่
git status

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Add backend API with Supabase"

# Push
git push
```

#### 3.2 Vercel จะ Deploy อัตโนมัติ

- Vercel จะ detect การ push
- Deploy อัตโนมัติ
- รอ ~2-3 นาที

#### 3.3 หรือ Deploy Manual

```bash
# Deploy to production
vercel --prod
```

---

### Step 4: Test (หลัง Deploy)

#### 4.1 เปิดเว็บ

1. ไปที่ URL ของเว็บ (จาก Vercel Dashboard)
2. เปิด Developer Tools (F12)
3. ดู Console (ไม่ควรมี error)

#### 4.2 Test Registration

1. คลิก **"สมัครสมาชิก"**
2. กรอก Email + Password
3. คลิก **"สมัครสมาชิก"**
4. ควร redirect ไปหน้า Terms & Conditions

**ตรวจสอบ:**
- ไปที่ Supabase Dashboard → Table Editor → users
- ควรเห็น user ใหม่

#### 4.3 Test Wallet Creation

1. Accept Terms & Conditions
2. สร้าง Wallet
3. บันทึก Seed Phrase
4. Verify Seed Phrase

**ตรวจสอบ:**
- ไปที่ Supabase Dashboard → Table Editor → wallets
- ควรเห็น wallet ใหม่ (mnemonic_encrypted)

#### 4.4 Test Login

1. Logout
2. Login ด้วย email + password เดิม
3. ควรเข้าสู่ระบบได้และโหลด wallet อัตโนมัติ

---

## ✅ Checklist สรุป

### Setup Supabase
- [x] สร้าง Supabase project
- [x] สร้าง database tables
- [ ] Get SUPABASE_SERVICE_KEY

### Setup Vercel
- [ ] Add SUPABASE_URL
- [ ] Add SUPABASE_ANON_KEY
- [ ] Add SUPABASE_SERVICE_KEY
- [ ] Add JWT_SECRET
- [ ] Add ENCRYPTION_KEY
- [ ] Add VITE_USE_BACKEND_API

### Deploy & Test
- [ ] Commit & push code
- [ ] Deploy to Vercel
- [ ] Test registration
- [ ] Test wallet creation
- [ ] Test login

---

## 🆘 Troubleshooting

### Error: "Missing Supabase environment variables"

**สาเหตุ:** Environment variables ยังไม่ได้เพิ่มใน Vercel

**แก้ไข:**
1. ตรวจสอบว่าเพิ่มครบทั้ง 6 ตัว
2. ตรวจสอบว่าเลือก Environment ถูกต้อง (Production, Preview, Development)
3. Redeploy

---

### Error: "Invalid API key"

**สาเหตุ:** SUPABASE_SERVICE_KEY ไม่ถูกต้อง

**แก้ไข:**
1. ไปที่ Supabase → Settings → API
2. Copy service_role key ใหม่
3. อัพเดทใน Vercel
4. Redeploy

---

### Error: "Table does not exist"

**สาเหตุ:** Tables ยังไม่ได้สร้างใน Supabase

**แก้ไข:**
1. ไปที่ Supabase → SQL Editor
2. รัน SQL script จาก `QUICK_SQL_SETUP.sql`
3. ตรวจสอบ Table Editor ว่ามี tables แล้ว

---

## 📝 Files Reference

- `VERCEL_ENV_VALUES.md` - Environment variables values
- `QUICK_SQL_SETUP.sql` - SQL script สำหรับสร้าง tables
- `PRODUCTION_BACKEND_SETUP.md` - คู่มือ setup ทั้งหมด

---

**Status:** ⚠️ **Ready to Complete Setup**

ทำตาม Step 1-4 ตามลำดับ แล้วจะใช้งานได้!

