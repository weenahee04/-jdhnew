# 🚀 คู่มือ Deploy ไป Vercel - JDH Crypto Wallet

## 📊 สถานะโปรเจกต์ปัจจุบัน

### ✅ สิ่งที่พร้อมแล้ว
- ✅ **Code Structure**: React + Vite + TypeScript พร้อมแล้ว
- ✅ **Vercel Config**: มี `vercel.json` แล้ว
- ✅ **API Routes**: มี Serverless Functions ใน `/api` แล้ว
- ✅ **Git Status**: Working tree clean, พร้อม deploy
- ✅ **Build Script**: `npm run build` พร้อมใช้งาน
- ✅ **Dependencies**: ติดตั้งครบแล้ว

### ⚠️ สิ่งที่ต้องทำ
- ⚠️ **Environment Variables**: ต้องเพิ่มใน Vercel Dashboard
- ⚠️ **Supabase Setup**: ตรวจสอบว่า database tables พร้อมแล้ว
- ⚠️ **Build Test**: ทดสอบ build local ก่อน deploy

---

## 🔑 Environment Variables ที่ต้องเพิ่มใน Vercel

### Required Variables (จำเป็น)

เพิ่มใน **Vercel Dashboard** → **Settings** → **Environment Variables**:

| Variable Name | Description | ตัวอย่าง Value |
|--------------|-------------|----------------|
| `SUPABASE_URL` | Supabase Project URL | `https://kwxgpxmxhbtqbrupbluj.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | Secret key สำหรับ JWT tokens | `(64 bytes hex string)` |
| `ENCRYPTION_KEY` | Key สำหรับ encrypt wallet mnemonics | `(32 bytes hex string)` |
| `VITE_USE_BACKEND_API` | เปิดใช้ backend API | `true` |

### Optional Variables (ไม่บังคับ)

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `GEMINI_API_KEY` | สำหรับ AI market insights | - |
| `HELIUS_RPC_URL` | Solana RPC endpoint | - |
| `SOLANA_CLUSTER` | Solana network | `mainnet-beta` |
| `JUPITER_BASE_URL` | Jupiter swap API | `https://quote-api.jup.ag` |

### 📝 วิธีเพิ่ม Environment Variables

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project → **Settings** → **Environment Variables**
3. สำหรับแต่ละตัวแปร:
   - คลิก **"Add"**
   - ใส่ **Name** และ **Value**
   - เลือก **Environment**: Production, Preview, Development (เลือกทั้งหมด)
   - คลิก **"Save"**

**หมายเหตุ:** ดูค่า Environment Variables ที่มีอยู่แล้วในไฟล์ `VERCEL_ENV_VALUES.md`

---

## 📋 Vercel Configuration

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

**✅ Configuration นี้ถูกต้องแล้ว!**

---

## 🚀 วิธี Deploy ไป Vercel

### Option 1: ใช้ Vercel CLI (แนะนำ - เร็วที่สุด)

#### 1. ติดตั้ง Vercel CLI
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

# หรือ deploy to preview (สำหรับทดสอบ)
vercel
```

---

### Option 2: ใช้ Git Integration (แนะนำสำหรับ Production)

#### 1. เชื่อมต่อกับ Git Repository
```bash
# ตรวจสอบว่า remote มีอยู่แล้ว
git remote -v

# ถ้ายังไม่มี ให้เพิ่ม:
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin master
```

#### 2. เชื่อมต่อกับ Vercel
1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. กด **"Add New Project"**
3. เลือก Git repository (GitHub/GitLab/Bitbucket)
4. Vercel จะ auto-detect settings
5. **เพิ่ม Environment Variables** (ดูด้านบน)
6. กด **"Deploy"**

---

### Option 3: ใช้ Vercel Dashboard (Manual Deploy)

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือก Project
3. กด **"Deployments"** tab
4. กด **"Redeploy"** หรือ **"Deploy"**

---

## ✅ Checklist ก่อน Deploy

### Pre-Deployment Checklist

- [x] Code ถูก commit แล้ว (working tree clean)
- [ ] **Environment Variables ตั้งค่าแล้วใน Vercel**
- [ ] **ทดสอบ build local**: `npm run build`
- [ ] **ตรวจสอบ Supabase database tables**:
  - [ ] `users` table
  - [ ] `wallets` table
  - [ ] `transactions` table (ถ้ามี)
  - [ ] `mining_challenges` table (ถ้ามี)
- [ ] **ตรวจสอบ API endpoints** ทำงานได้
- [ ] **ตรวจสอบ .gitignore** ไม่ commit sensitive files

---

## 🧪 ทดสอบหลัง Deploy

### 1. ตรวจสอบ Build
1. ไปที่ Vercel Dashboard → **Deployments**
2. ดู build logs
3. ตรวจสอบว่า build สำเร็จ (Status: Ready)

### 2. ตรวจสอบ API Endpoints
```bash
# Test Supabase connection (ถ้ามี endpoint)
curl https://your-project.vercel.app/api/test-supabase

# Test auth endpoint (ควร return error without credentials)
curl -X POST https://your-project.vercel.app/api/auth/login
```

### 3. ตรวจสอบ Frontend
1. เปิด URL: `https://your-project.vercel.app`
2. ทดสอบ:
   - [ ] หน้า Landing Page เปิดได้
   - [ ] สมัครสมาชิกได้ (`/api/auth/register`)
   - [ ] ล็อกอินได้ (`/api/auth/login`)
   - [ ] สร้าง wallet ได้ (`/api/wallet/save`)
   - [ ] ดึง wallet ได้ (`/api/wallet/get`)
   - [ ] ส่ง/รับเหรียญได้ (ถ้ามี)

---

## 🔧 Troubleshooting

### Build Failed

**ปัญหา:** Build ล้มเหลว

**วิธีแก้:**
1. ดู build logs ใน Vercel Dashboard
2. ตรวจสอบ error messages
3. ทดสอบ build local: `npm run build`
4. ตรวจสอบว่า dependencies ติดตั้งครบ: `npm install --legacy-peer-deps`

### API 500 Error

**ปัญหา:** API endpoints return 500

**วิธีแก้:**
1. ตรวจสอบ Environment Variables ใน Vercel Dashboard
2. ตรวจสอบ Supabase connection
3. ดู Function Logs ใน Vercel Dashboard → **Functions** tab
4. ตรวจสอบว่า `SUPABASE_SERVICE_KEY` ถูกต้อง

### Frontend ไม่ทำงาน

**ปัญหา:** หน้าเว็บไม่แสดงผล

**วิธีแก้:**
1. ตรวจสอบ `vercel.json` configuration
2. ตรวจสอบ `outputDirectory` (ควรเป็น `dist`)
3. ตรวจสอบ build output ใน Vercel Dashboard
4. ตรวจสอบ browser console สำหรับ errors

### Environment Variables ไม่ทำงาน

**ปัญหา:** Environment Variables ไม่ถูก inject

**วิธีแก้:**
1. ตรวจสอบว่าเพิ่มใน Vercel Dashboard แล้ว
2. ตรวจสอบว่าเลือก Environment ถูกต้อง (Production, Preview, Development)
3. **Redeploy** หลังเพิ่ม Environment Variables
4. ตรวจสอบว่าใช้ `VITE_` prefix สำหรับ client-side variables

---

## 📝 API Endpoints ที่มีอยู่

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - ล็อกอิน

### Wallet
- `POST /api/wallet/save` - บันทึก wallet (encrypted)
- `GET /api/wallet/get` - ดึง wallet

### User
- `GET /api/user/profile` - ดึงข้อมูล user
- `GET /api/user/wallet` - ดึง wallet ของ user

### Mining (ถ้ามี)
- `POST /api/mining/challenge` - สร้าง mining challenge
- `POST /api/mining/commit` - commit mining result
- `POST /api/mining/verify` - verify mining result
- `GET /api/mining/stats` - ดึง mining statistics
- `GET /api/mining/websocket` - WebSocket endpoint

### Airdrop (ถ้ามี)
- `POST /api/airdrop/claim` - Claim airdrop

---

## 🔐 Security Checklist

- [x] **API Keys**: ไม่ expose ใน client-side bundle
- [x] **Wallet Encryption**: ใช้ AES-256-CBC encryption
- [x] **JWT Tokens**: ใช้ JWT สำหรับ authentication
- [x] **Environment Variables**: เก็บใน Vercel (ไม่ commit)
- [ ] **HTTPS**: Vercel ใช้ HTTPS อัตโนมัติ ✅
- [ ] **CORS**: ตั้งค่า CORS ถ้าจำเป็น

---

## 📊 Project Structure

```
├── api/                    # Vercel Serverless Functions
│   ├── auth/              # Authentication endpoints
│   ├── wallet/            # Wallet endpoints
│   ├── user/              # User endpoints
│   ├── mining/            # Mining endpoints
│   └── airdrop/           # Airdrop endpoints
├── components/            # React components
├── services/              # API services
├── lib/                   # Utilities
├── hooks/                 # React hooks
├── config.ts              # Configuration
├── vercel.json            # Vercel configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies
```

---

## 🎯 Quick Deploy Commands

```bash
# 1. ติดตั้ง Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy to production
vercel --prod

# 4. View deployments
vercel ls

# 5. View logs
vercel logs

# 6. Open project in browser
vercel open
```

---

## ✅ สรุป

**สถานะโปรเจกต์:**
- ✅ Code พร้อม deploy
- ✅ Configuration ถูกต้อง
- ⚠️ ต้องเพิ่ม Environment Variables ใน Vercel
- ⚠️ ต้องทดสอบ build และ API endpoints

**ขั้นตอนถัดไป:**
1. ✅ ตรวจสอบโปรเจกต์ (เสร็จแล้ว)
2. ⏳ เพิ่ม Environment Variables ใน Vercel Dashboard
3. ⏳ Deploy ไป Vercel (ใช้ Vercel CLI หรือ Git Integration)
4. ⏳ ทดสอบหลัง deploy

---

## 📚 เอกสารเพิ่มเติม

- `DEPLOY_TO_VERCEL.md` - คู่มือ deploy แบบละเอียด
- `VERCEL_ENV_VALUES.md` - Environment Variables values
- `VERCEL_ENV_SETUP.md` - วิธีตั้งค่า Environment Variables
- `PRODUCTION_CHECKLIST.md` - Production readiness checklist

---

**พร้อม deploy แล้ว! 🚀**



