# 🚀 Deploy ไป Vercel - คู่มือ

## ✅ สถานะปัจจุบัน

- ✅ Code ถูก commit แล้ว (working tree clean)
- ✅ มี commits ล่าสุด:
  - Add debug documentation for login seed phrase issue
  - Add detailed logging to login flow
  - Add error handling to prevent RPC upgrade popup
  - Add seed phrase compatibility documentation

---

## 🚀 วิธี Deploy ไป Vercel

### Option 1: ใช้ Vercel CLI (แนะนำ)

#### 1. ติดตั้ง Vercel CLI (ถ้ายังไม่มี)

```bash
npm install -g vercel
```

#### 2. Login เข้า Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
# Deploy to production
vercel --prod

# หรือ deploy to preview
vercel
```

---

### Option 2: ใช้ Git Integration (แนะนำสำหรับ Production)

#### 1. สร้าง Git Repository (ถ้ายังไม่มี)

```bash
# สร้าง repository บน GitHub/GitLab/Bitbucket
# แล้วเพิ่ม remote:

git remote add origin https://github.com/your-username/your-repo.git
git push -u origin master
```

#### 2. เชื่อมต่อกับ Vercel

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. กด "Add New Project"
3. เลือก Git repository
4. Vercel จะ auto-detect settings
5. กด "Deploy"

---

### Option 3: ใช้ Vercel Dashboard (Manual Deploy)

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project
3. กด "Deployments" tab
4. กด "Redeploy" หรือ "Deploy"

---

## ⚙️ Vercel Configuration

### ไฟล์ `vercel.json` (มีอยู่แล้ว)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔑 Environment Variables

### ตรวจสอบว่า Environment Variables ตั้งค่าแล้วหรือยัง:

1. ไปที่ Vercel Dashboard
2. เลือก Project → Settings → Environment Variables
3. ตรวจสอบว่ามี variables เหล่านี้:

**Required:**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `JWT_SECRET`
- ✅ `ENCRYPTION_KEY`
- ✅ `HELIUS_RPC_URL`
- ✅ `SOLANA_CLUSTER`

**Optional:**
- ⚠️ `GEMINI_API_KEY` (สำหรับ AI insights)
- ⚠️ `JUPITER_BASE_URL` (default: https://quote-api.jup.ag)

---

## 📋 Checklist ก่อน Deploy

- [x] Code ถูก commit แล้ว
- [ ] Environment Variables ตั้งค่าแล้ว
- [ ] Database (Supabase) setup แล้ว
- [ ] API endpoints ทำงานได้
- [ ] Build command ทำงานได้ (`npm run build`)

---

## 🧪 ทดสอบหลัง Deploy

### 1. ตรวจสอบ Build

1. ไปที่ Vercel Dashboard → Deployments
2. ดู build logs
3. ตรวจสอบว่า build สำเร็จ

### 2. ตรวจสอบ API Endpoints

```bash
# Test Supabase connection
curl https://your-project.vercel.app/api/test-supabase

# Test auth (should return error without credentials)
curl https://your-project.vercel.app/api/auth/login
```

### 3. ตรวจสอบ Frontend

1. เปิด URL: `https://your-project.vercel.app`
2. ทดสอบ:
   - [ ] หน้า Landing Page เปิดได้
   - [ ] สมัครสมาชิกได้
   - [ ] ล็อกอินได้
   - [ ] สร้าง wallet ได้
   - [ ] ส่ง/รับเหรียญได้

---

## 🔧 Troubleshooting

### Build Failed

**ปัญหา:** Build ล้มเหลว

**วิธีแก้:**
1. ดู build logs ใน Vercel Dashboard
2. ตรวจสอบ error messages
3. ทดสอบ build local: `npm run build`

### API 500 Error

**ปัญหา:** API endpoints return 500

**วิธีแก้:**
1. ตรวจสอบ Environment Variables
2. ตรวจสอบ Supabase connection
3. ดู Function Logs ใน Vercel Dashboard

### Frontend ไม่ทำงาน

**ปัญหา:** หน้าเว็บไม่แสดงผล

**วิธีแก้:**
1. ตรวจสอบ `vercel.json` configuration
2. ตรวจสอบ `outputDirectory` (ควรเป็น `dist`)
3. ตรวจสอบ build output

---

## 📝 Quick Deploy Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployments
vercel ls

# View logs
vercel logs
```

---

## ✅ สรุป

**สถานะ:**
- ✅ Code พร้อม deploy
- ⚠️ ต้องตั้งค่า Git remote (ถ้ายังไม่มี)
- ⚠️ ต้องตรวจสอบ Environment Variables

**ขั้นตอนถัดไป:**
1. ติดตั้ง Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

หรือ

1. สร้าง Git repository
2. Push code ไป repository
3. เชื่อมต่อกับ Vercel Dashboard
4. Deploy




