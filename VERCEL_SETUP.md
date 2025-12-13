# 🚀 Vercel Deployment - Setup Guide

## ✅ Project Created

**Project Name:** `jdh-wallet`  
**Project URL:** https://jdh-wallet-qiaj78gg8-weenahee04-8034s-projects.vercel.app  
**Dashboard:** https://vercel.com/weenahee04-8034s-projects/jdh-wallet

---

## 📋 ขั้นตอนต่อไป

### 1. เพิ่ม Environment Variables

รันคำสั่งเหล่านี้เพื่อเพิ่ม environment variables:

```bash
# Helius RPC URL (ต้องมี)
vercel env add HELIUS_RPC_URL production
# แล้วใส่: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Solana Cluster
vercel env add SOLANA_CLUSTER production
# แล้วใส่: mainnet-beta

# Jupiter API (optional)
vercel env add JUPITER_BASE_URL production
# แล้วใส่: https://quote-api.jup.ag

# Gemini API (optional)
vercel env add GEMINI_API_KEY production
# แล้วใส่: your_gemini_api_key
```

**หรือ** ไปที่ Vercel Dashboard:
1. ไปที่ https://vercel.com/weenahee04-8034s-projects/jdh-wallet
2. Settings → Environment Variables
3. เพิ่ม:
   - `HELIUS_RPC_URL` = `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
   - `SOLANA_CLUSTER` = `mainnet-beta`
   - `JUPITER_BASE_URL` = `https://quote-api.jup.ag`
   - `GEMINI_API_KEY` = `your_key` (optional)

### 2. Redeploy

หลังจากตั้งค่า environment variables แล้ว:

```bash
vercel --prod
```

---

## 🔑 วิธีได้ Helius RPC Key (ฟรี)

1. ไปที่ https://www.helius.dev/
2. สมัครสมาชิก (ฟรี)
3. สร้าง API Key
4. Copy RPC URL มาใส่ใน `HELIUS_RPC_URL`

---

## ✅ Checklist

- [x] Project created on Vercel
- [x] vercel.json configured
- [ ] Environment variables added
- [ ] Redeploy after adding env vars
- [ ] Test production site

---

## 🆘 Troubleshooting

### Build Failed
- ตรวจสอบว่า environment variables ถูกต้อง
- ตรวจสอบ logs ใน Vercel Dashboard

### API Errors
- ตรวจสอบ Helius RPC URL
- ตรวจสอบ API key ยังใช้งานได้

---

**Status:** ⚠️ Waiting for Environment Variables

