# 🚀 คู่มือ Deploy เว็บ Production - JDH Wallet

## 📋 สารบัญ

1. [เตรียมความพร้อม](#เตรียมความพร้อม)
2. [วิธี Deploy (เลือก 1 วิธี)](#วิธี-deploy)
3. [ตั้งค่า Environment Variables](#ตั้งค่า-environment-variables)
4. [ตั้งค่า Solana Mainnet](#ตั้งค่า-solana-mainnet)
5. [ทดสอบหลัง Deploy](#ทดสอบหลัง-deploy)
6. [Troubleshooting](#troubleshooting)

---

## ✅ เตรียมความพร้อม

### 1. ตรวจสอบไฟล์ที่จำเป็น

```bash
# ตรวจสอบว่ามีไฟล์เหล่านี้
- package.json ✅
- vite.config.ts ✅
- .env.example ✅
- dist/ (จะสร้างตอน build)
```

### 2. สร้าง Production Build

```bash
# Build production
npm run build

# ตรวจสอบว่า build สำเร็จ
# ควรมี folder dist/ ที่มีไฟล์:
# - index.html
# - assets/ (JS, CSS files)
```

### 3. ทดสอบ Production Build ท้องถิ่น

```bash
# Preview production build
npm run preview

# เปิดเบราว์เซอร์ไปที่ http://localhost:4173
# ทดสอบทุกฟีเจอร์ให้แน่ใจว่าทำงานได้
```

---

## 🚀 วิธี Deploy

เลือก **1 วิธี** ที่เหมาะกับคุณ:

### วิธีที่ 1: Vercel (แนะนำ - ง่ายที่สุด) ⭐

**ข้อดี:**
- ✅ ฟรี (Free tier)
- ✅ Deploy อัตโนมัติจาก Git
- ✅ HTTPS อัตโนมัติ
- ✅ Custom domain ฟรี
- ✅ เร็วมาก

**ขั้นตอน:**

1. **ติดตั้ง Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy ครั้งแรก (จะถามคำถาม)
   vercel

   # Deploy production
   vercel --prod
   ```

4. **ตั้งค่า Environment Variables**
   - ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
   - เลือก Project → Settings → Environment Variables
   - เพิ่ม:
     ```
     HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
     SOLANA_CLUSTER=mainnet-beta
     GEMINI_API_KEY=your_gemini_key (optional)
     JUPITER_BASE_URL=https://quote-api.jup.ag
     ```

5. **Redeploy หลังตั้งค่า Environment Variables**
   ```bash
   vercel --prod
   ```

**URL ที่ได้:** `https://your-project.vercel.app`

---

### วิธีที่ 2: Netlify

**ข้อดี:**
- ✅ ฟรี (Free tier)
- ✅ Deploy จาก Git หรือ Drag & Drop
- ✅ HTTPS อัตโนมัติ

**ขั้นตอน:**

1. **ติดตั้ง Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   # Deploy ครั้งแรก
   netlify deploy

   # Deploy production
   netlify deploy --prod
   ```

4. **ตั้งค่า Environment Variables**
   - ไปที่ [Netlify Dashboard](https://app.netlify.com)
   - เลือก Site → Site settings → Environment variables
   - เพิ่ม environment variables เหมือน Vercel

**URL ที่ได้:** `https://your-site.netlify.app`

---

### วิธีที่ 3: Railway

**ข้อดี:**
- ✅ ฟรี $5 credit/เดือน
- ✅ Deploy จาก Git
- ✅ รองรับ environment variables

**ขั้นตอน:**

1. **ไปที่ [Railway](https://railway.app)**
2. **New Project → Deploy from GitHub**
3. **เลือก Repository**
4. **ตั้งค่า Environment Variables** ใน Railway Dashboard
5. **Deploy อัตโนมัติ**

---

### วิธีที่ 4: Cloudflare Pages

**ข้อดี:**
- ✅ ฟรี
- ✅ เร็วมาก (CDN)
- ✅ Deploy จาก Git

**ขั้นตอน:**

1. **ไปที่ [Cloudflare Pages](https://pages.cloudflare.com)**
2. **Create a project → Connect to Git**
3. **ตั้งค่า Build:**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **ตั้งค่า Environment Variables** ใน Settings

---

### วิธีที่ 5: GitHub Pages (Static Hosting)

**ข้อดี:**
- ✅ ฟรี
- ✅ ง่าย

**ข้อจำกัด:**
- ⚠️ ต้องตั้งค่า base path ใน vite.config.ts
- ⚠️ ไม่รองรับ environment variables (ต้อง hard-code)

**ขั้นตอน:**

1. **แก้ไข vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // เปลี่ยนเป็นชื่อ repo ของคุณ
     // ... rest of config
   })
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   # ติดตั้ง gh-pages
   npm install -D gh-pages

   # เพิ่ม script ใน package.json
   "deploy": "npm run build && gh-pages -d dist"

   # Deploy
   npm run deploy
   ```

---

## 🔐 ตั้งค่า Environment Variables

### สำหรับ Production (Mainnet)

สร้างไฟล์ `.env.production` หรือตั้งค่าใน hosting dashboard:

```env
# Solana Mainnet (ต้องมี)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
SOLANA_CLUSTER=mainnet-beta

# Jupiter Swap API
JUPITER_BASE_URL=https://quote-api.jup.ag

# Gemini AI (Optional - สำหรับ AI insights)
GEMINI_API_KEY=your_gemini_api_key_here
```

### วิธีได้ Helius RPC Key (ฟรี)

1. ไปที่ [Helius Dashboard](https://www.helius.dev/)
2. สมัครสมาชิก (ฟรี)
3. สร้าง API Key
4. Copy RPC URL มาใส่ใน `HELIUS_RPC_URL`

**ตัวอย่าง:**
```
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=abc123xyz789
```

---

## 🌐 ตั้งค่า Solana Mainnet

### ตรวจสอบว่าใช้ Mainnet

1. **ตรวจสอบ `services/solanaClient.ts`**
   ```typescript
   // ควรใช้ mainnet-beta
   const cluster = process.env.SOLANA_CLUSTER || 'mainnet-beta';
   ```

2. **ตั้งค่า Environment Variable**
   ```env
   SOLANA_CLUSTER=mainnet-beta
   ```

3. **ตรวจสอบ Helius RPC URL**
   - ต้องเป็น mainnet URL
   - ตัวอย่าง: `https://mainnet.helius-rpc.com/?api-key=...`

---

## ✅ ทดสอบหลัง Deploy

### Checklist การทดสอบ

- [ ] **หน้า Landing Page** - เปิดได้ปกติ
- [ ] **สมัครสมาชิก** - สร้าง account ได้
- [ ] **ล็อกอิน** - ล็อกอินได้
- [ ] **สร้าง Wallet** - สร้าง wallet ได้
- [ ] **ดู Balance** - แสดง balance ได้ (ต้องมี SOL)
- [ ] **โอน SOL** - โอน SOL ได้ (ทดสอบด้วยจำนวนน้อย)
- [ ] **รับ SOL** - แสดง address และ QR code ได้
- [ ] **Swap** - Swap SOL ↔ USDC ได้
- [ ] **Transaction History** - แสดงประวัติได้
- [ ] **Settings** - แก้ไข display name ได้

### ทดสอบด้วย Mainnet SOL

⚠️ **คำเตือน:** ใช้ Mainnet SOL จริง - ต้องระวัง!

1. **รับ Test SOL**
   - ใช้ faucet หรือ wallet อื่น
   - เริ่มด้วยจำนวนน้อย (0.1 SOL)

2. **ทดสอบโอน**
   - ส่งไปยัง wallet อื่น
   - ตรวจสอบ transaction ใน [Solana Explorer](https://explorer.solana.com)

---

## 🔧 Troubleshooting

### ปัญหา: Build ล้มเหลว

**สาเหตุ:**
- Environment variables ไม่ครบ
- Dependencies ไม่ครบ

**แก้ไข:**
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install

# Build อีกครั้ง
npm run build
```

---

### ปัญหา: API Error (RPC)

**สาเหตุ:**
- Helius RPC URL ผิด
- API key หมดอายุ
- Rate limit

**แก้ไข:**
1. ตรวจสอบ Helius RPC URL ใน dashboard
2. สร้าง API key ใหม่
3. ตั้งค่า environment variable ใหม่
4. Redeploy

---

### ปัญหา: Transaction ไม่ทำงาน

**สาเหตุ:**
- ใช้ devnet แทน mainnet
- ไม่มี SOL สำหรับ gas fee

**แก้ไข:**
1. ตรวจสอบ `SOLANA_CLUSTER=mainnet-beta`
2. ตรวจสอบว่ามี SOL ใน wallet
3. ตรวจสอบ network ใน browser console

---

### ปัญหา: ข้อมูลไม่เก็บ (localStorage)

**สาเหตุ:**
- Browser ปิด localStorage
- Incognito mode
- Storage quota เต็ม

**แก้ไข:**
1. ตรวจสอบ browser settings
2. ใช้ normal mode (ไม่ใช่ incognito)
3. Clear storage และลองใหม่

---

## 📊 Monitoring & Analytics

### ควรติดตั้ง

1. **Error Tracking**
   - Sentry
   - LogRocket

2. **Analytics**
   - Google Analytics
   - Plausible (Privacy-friendly)

3. **Performance**
   - Vercel Analytics (ถ้าใช้ Vercel)
   - Lighthouse CI

---

## 🔒 Security Checklist

ก่อนเปิดให้คนนอกใช้:

- [ ] ตั้งค่า `SOLANA_CLUSTER=mainnet-beta`
- [ ] ใช้ Helius RPC URL ที่ถูกต้อง
- [ ] ตรวจสอบว่าไม่มี console.log sensitive data
- [ ] ตั้งค่า HTTPS (อัตโนมัติใน Vercel/Netlify)
- [ ] ตรวจสอบว่าไม่มี API keys ใน code
- [ ] ทดสอบทุกฟีเจอร์ให้แน่ใจว่าทำงานได้

---

## 📝 Quick Start (Vercel)

```bash
# 1. Build
npm run build

# 2. Deploy
npm install -g vercel
vercel login
vercel --prod

# 3. ตั้งค่า Environment Variables ใน Vercel Dashboard

# 4. Redeploy
vercel --prod
```

**เสร็จแล้ว!** 🎉

---

## 🆘 ต้องการความช่วยเหลือ?

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Solana Mainnet:** https://docs.solana.com/clusters
- **Helius RPC:** https://www.helius.dev/

---

**Status:** ✅ Ready for Production Deployment  
**Last Updated:** 2024-12-13

