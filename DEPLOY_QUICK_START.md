# ⚡ Quick Start - Deploy JDH Wallet (5 นาที)

## 🎯 วิธีที่เร็วที่สุด: Vercel

### ขั้นตอน:

1. **Build Project**
   ```bash
   npm run build
   ```

2. **ติดตั้ง Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Login & Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

4. **ตั้งค่า Environment Variables**
   
   ไปที่: https://vercel.com/dashboard → Project → Settings → Environment Variables
   
   เพิ่ม:
   ```
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   SOLANA_CLUSTER=mainnet-beta
   GEMINI_API_KEY=your_key (optional)
   JUPITER_BASE_URL=https://quote-api.jup.ag
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

**เสร็จแล้ว!** 🎉  
URL: `https://your-project.vercel.app`

---

## 🔑 วิธีได้ Helius RPC Key (ฟรี)

1. ไปที่ https://www.helius.dev/
2. สมัครสมาชิก (ฟรี)
3. สร้าง API Key
4. Copy RPC URL มาใส่ใน Environment Variables

---

## ⚠️ สิ่งสำคัญ

- ✅ ตั้งค่า `SOLANA_CLUSTER=mainnet-beta` (สำหรับ production)
- ✅ ใช้ Helius RPC URL ที่ถูกต้อง
- ✅ ทดสอบทุกฟีเจอร์หลัง deploy

---

## 🆘 มีปัญหา?

ดู `DEPLOYMENT_PRODUCTION.md` สำหรับรายละเอียดเพิ่มเติม

