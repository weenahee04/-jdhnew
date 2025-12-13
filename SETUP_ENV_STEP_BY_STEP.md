# 📝 ตั้งค่า Environment Variables - Step by Step

## 🎯 วิธีที่ 1: ใช้ Vercel CLI (แนะนำ)

### ขั้นตอน:

#### 1. ตั้งค่า SOLANA_CLUSTER (ง่ายที่สุด - ไม่ต้องมี API Key)

รันคำสั่งนี้:
```bash
vercel env add SOLANA_CLUSTER production
```

**เมื่อถาม:**
- **Value:** พิมพ์ `mainnet-beta` แล้วกด Enter
- **Environment:** เลือก `Production` (กด Enter)

---

#### 2. ตั้งค่า JUPITER_BASE_URL (ง่าย - ไม่ต้องมี API Key)

รันคำสั่งนี้:
```bash
vercel env add JUPITER_BASE_URL production
```

**เมื่อถาม:**
- **Value:** พิมพ์ `https://quote-api.jup.ag` แล้วกด Enter
- **Environment:** เลือก `Production` (กด Enter)

---

#### 3. ตั้งค่า HELIUS_RPC_URL (ต้องมี API Key)

**ก่อนอื่น:** ต้องได้ Helius RPC Key ก่อน

**วิธีได้ Helius RPC Key:**
1. ไปที่ https://www.helius.dev/
2. สมัครสมาชิก (ฟรี)
3. สร้าง API Key
4. Copy RPC URL (จะมีรูปแบบ: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`)

**แล้วรัน:**
```bash
vercel env add HELIUS_RPC_URL production
```

**เมื่อถาม:**
- **Value:** วาง Helius RPC URL ที่ copy มา (เช่น `https://mainnet.helius-rpc.com/?api-key=abc123`)
- **Environment:** เลือก `Production` (กด Enter)

---

#### 4. ตั้งค่า GEMINI_API_KEY (ไม่บังคับ - สำหรับ AI Insights)

**ถ้าต้องการ AI Insights:**
1. ไปที่ https://aistudio.google.com/app/apikey
2. สร้าง API Key
3. รัน:
```bash
vercel env add GEMINI_API_KEY production
```

**เมื่อถาม:**
- **Value:** วาง Gemini API Key
- **Environment:** เลือก `Production` (กด Enter)

---

### ตรวจสอบว่าเพิ่มแล้ว

```bash
vercel env ls
```

ควรเห็น:
```
HELIUS_RPC_URL
SOLANA_CLUSTER
JUPITER_BASE_URL
GEMINI_API_KEY (ถ้าเพิ่ม)
```

---

### Redeploy

```bash
vercel --prod
```

---

## 🎯 วิธีที่ 2: ใช้ Vercel Dashboard (เห็นภาพ)

### ขั้นตอน:

1. **เปิด Vercel Dashboard**
   - ไปที่: https://vercel.com/weenahee04-8034s-projects/jdh-wallet

2. **ไปที่ Settings**
   - คลิก "Settings" ด้านบน

3. **คลิก Environment Variables**
   - ทางซ้ายมือ

4. **เพิ่ม Variables ทีละตัว:**

   **Variable 1: SOLANA_CLUSTER**
   - Key: `SOLANA_CLUSTER`
   - Value: `mainnet-beta`
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 2: JUPITER_BASE_URL**
   - Key: `JUPITER_BASE_URL`
   - Value: `https://quote-api.jup.ag`
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 3: HELIUS_RPC_URL**
   - Key: `HELIUS_RPC_URL`
   - Value: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` (ใส่ key จริง)
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 4: GEMINI_API_KEY (Optional)**
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_key`
   - Environment: เลือก `Production`
   - คลิก "Add"

5. **Redeploy**
   - ไปที่ "Deployments"
   - คลิก "..." ที่ deployment ล่าสุด
   - เลือก "Redeploy"

---

## ✅ Checklist

- [ ] SOLANA_CLUSTER = `mainnet-beta`
- [ ] JUPITER_BASE_URL = `https://quote-api.jup.ag`
- [ ] HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- [ ] GEMINI_API_KEY = `your_key` (optional)
- [ ] Redeploy หลังตั้งค่า

---

## 🆘 ถ้ายังไม่มี Helius RPC Key

1. ไปที่ https://www.helius.dev/
2. คลิก "Get Started" หรือ "Sign Up"
3. สมัครสมาชิก (ใช้ Google/GitHub)
4. ไปที่ Dashboard
5. สร้าง API Key
6. Copy RPC URL มาใช้

---

**Status:** ⚠️ Ready to Setup

