# 🔐 ตั้งค่า Environment Variables บน Vercel

## 📋 Environment Variables ที่ต้องตั้งค่า

### 1. HELIUS_RPC_URL (ต้องมี) ⚠️
**สำหรับ:** เชื่อมต่อ Solana Mainnet

**วิธีได้:**
1. ไปที่ https://www.helius.dev/
2. สมัครสมาชิก (ฟรี)
3. สร้าง API Key
4. Copy RPC URL

**ตัวอย่าง:**
```
https://mainnet.helius-rpc.com/?api-key=abc123xyz789
```

---

### 2. SOLANA_CLUSTER (ต้องมี) ⚠️
**สำหรับ:** ระบุว่าใช้ Solana Mainnet

**ค่า:**
```
mainnet-beta
```

---

### 3. JUPITER_BASE_URL (ต้องมี) ⚠️
**สำหรับ:** Jupiter Swap API

**ค่า:**
```
https://quote-api.jup.ag
```

---

### 4. GEMINI_API_KEY (ไม่บังคับ) ℹ️
**สำหรับ:** AI Market Insights (ถ้าไม่ใส่ก็จะไม่มี AI insights)

**วิธีได้:**
1. ไปที่ https://aistudio.google.com/app/apikey
2. สมัครสมาชิก
3. สร้าง API Key

---

## 🚀 วิธีตั้งค่า (เลือก 1 วิธี)

### วิธีที่ 1: ใช้ Vercel CLI (แนะนำ - เร็ว)

รันคำสั่งเหล่านี้ทีละคำสั่ง:

```bash
# 1. Helius RPC URL
vercel env add HELIUS_RPC_URL production

# 2. Solana Cluster
vercel env add SOLANA_CLUSTER production

# 3. Jupiter API
vercel env add JUPITER_BASE_URL production

# 4. Gemini API (optional)
vercel env add GEMINI_API_KEY production
```

**เมื่อรันคำสั่ง:**
- มันจะถามให้ใส่ค่า
- พิมพ์ค่าแล้วกด Enter
- เลือก environment: `Production` (กด Enter)

---

### วิธีที่ 2: ใช้ Vercel Dashboard (ง่าย - เห็นภาพ)

1. **ไปที่ Vercel Dashboard**
   - https://vercel.com/weenahee04-8034s-projects/jdh-wallet

2. **คลิก Settings**
   - ด้านบนมีเมนู "Settings"

3. **คลิก Environment Variables**
   - ทางซ้ายมือ

4. **เพิ่ม Variables**

   **Variable 1:**
   - Key: `HELIUS_RPC_URL`
   - Value: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 2:**
   - Key: `SOLANA_CLUSTER`
   - Value: `mainnet-beta`
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 3:**
   - Key: `JUPITER_BASE_URL`
   - Value: `https://quote-api.jup.ag`
   - Environment: เลือก `Production`
   - คลิก "Add"

   **Variable 4 (Optional):**
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key`
   - Environment: เลือก `Production`
   - คลิก "Add"

5. **Redeploy**
   - ไปที่ "Deployments"
   - คลิก "..." ที่ deployment ล่าสุด
   - เลือก "Redeploy"

---

## ✅ ตรวจสอบว่าเพิ่มแล้ว

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

## 🔄 Redeploy หลังตั้งค่า

```bash
vercel --prod
```

หรือไปที่ Dashboard → Deployments → Redeploy

---

## 🆘 Troubleshooting

### ไม่มี Helius RPC Key?
- ไปที่ https://www.helius.dev/
- สมัครสมาชิก (ฟรี)
- สร้าง API Key

### Environment Variables ไม่ทำงาน?
- ตรวจสอบว่าเลือก "Production" environment
- Redeploy หลังตั้งค่า
- ตรวจสอบ logs: `vercel inspect <url> --logs`

---

**Status:** ⚠️ Waiting for Environment Variables

