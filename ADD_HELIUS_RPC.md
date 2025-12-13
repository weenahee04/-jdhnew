# 🔑 เพิ่ม HELIUS_RPC_URL

## เมื่อได้ Helius RPC URL แล้ว

รันคำสั่งนี้:

```bash
vercel env add HELIUS_RPC_URL production
```

**เมื่อถาม:**
- **Value:** วาง Helius RPC URL ที่ copy มา
  - ตัวอย่าง: `https://mainnet.helius-rpc.com/?api-key=abc123xyz789`
- **Environment:** เลือก `Production` (กด Enter)

---

## วิธีที่ 2: ใช้ Vercel Dashboard

1. ไปที่: https://vercel.com/weenahee04-8034s-projects/jdh-wallet
2. Settings → Environment Variables
3. เพิ่ม:
   - Key: `HELIUS_RPC_URL`
   - Value: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
   - Environment: `Production`
4. คลิก "Add"

---

## หลังจากเพิ่มแล้ว

```bash
# ตรวจสอบ
vercel env ls

# Redeploy
vercel --prod
```

