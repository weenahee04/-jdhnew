# 🌐 ตรวจสอบ Network Status

## 📋 วิธีตรวจสอบว่าใช้ Mainnet หรือไม่

### 1. ตรวจสอบใน Browser Console

เปิด Browser Console (F12) แล้วพิมพ์:

```javascript
// ตรวจสอบ RPC endpoint
console.log('RPC Endpoint:', window.location.href.includes('vercel.app') ? 'Production' : 'Local');

// ตรวจสอบ Solana Connection
// (ต้องเปิดหน้า wallet ก่อน)
```

### 2. ตรวจสอบ Environment Variables ใน Vercel

1. ไปที่ Vercel Dashboard
2. เลือก Project → Settings → Environment Variables
3. ตรวจสอบ:
   - `SOLANA_CLUSTER` = `mainnet-beta` ✅
   - `HELIUS_RPC_URL` = `https://mainnet.helius-rpc.com/?api-key=...` ✅

### 3. ตรวจสอบใน Code

**File:** `services/solanaClient.ts`

```typescript
// ถ้ามี HELIUS_RPC_URL → ใช้ Helius (mainnet)
// ถ้าไม่มี → ใช้ SOLANA_CLUSTER หรือ default
const cluster = process.env.SOLANA_CLUSTER || 'devnet';
```

**Default Behavior:**
- **Production (Vercel):** ใช้ `mainnet-beta` ถ้าไม่มี env var
- **Development (Local):** ใช้ `devnet` ถ้าไม่มี env var

---

## ✅ Network Configuration

### Production (Vercel)

**ต้องตั้งค่า:**
- ✅ `SOLANA_CLUSTER=mainnet-beta`
- ✅ `HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

**ผลลัพธ์:**
- ใช้ Solana Mainnet
- ใช้ SOL จริง
- Transaction บน Mainnet

### Development (Local)

**Default:**
- `SOLANA_CLUSTER` ไม่ตั้งค่า → ใช้ `devnet`
- `HELIUS_RPC_URL` ไม่ตั้งค่า → ใช้ `clusterApiUrl('devnet')`

**ถ้าต้องการใช้ Mainnet ใน Local:**
- ตั้งค่า `.env.local`:
  ```
  SOLANA_CLUSTER=mainnet-beta
  HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
  ```

---

## 🔍 วิธีตรวจสอบว่าใช้ Mainnet จริง

### 1. ตรวจสอบ Transaction Explorer

เมื่อทำ transaction สำเร็จ:
- **Mainnet:** `https://explorer.solana.com/tx/...` (ไม่มี `?cluster=`)
- **Devnet:** `https://explorer.solana.com/tx/...?cluster=devnet`

### 2. ตรวจสอบ Wallet Address

- **Mainnet:** Address จะเหมือนกันทุกที่ (real address)
- **Devnet:** Address จะใช้ได้เฉพาะใน devnet

### 3. ตรวจสอบ Balance

- **Mainnet:** Balance จะเป็น SOL จริง (ต้องมี SOL จริง)
- **Devnet:** Balance จะเป็น devnet SOL (ฟรีจาก faucet)

---

## ⚠️ คำเตือน

**ถ้าใช้ Mainnet:**
- ⚠️ ใช้ SOL จริง - ต้องระวัง!
- ⚠️ Transaction fees จริง
- ⚠️ ไม่สามารถ revert transaction ได้

**ถ้าใช้ Devnet:**
- ✅ ใช้ SOL ฟรี (จาก faucet)
- ✅ Transaction fees ไม่ใช่ของจริง
- ✅ ปลอดภัยสำหรับทดสอบ

---

## 🛠️ วิธีเปลี่ยน Network

### เปลี่ยนเป็น Mainnet:

1. **Vercel:**
   ```bash
   vercel env add SOLANA_CLUSTER production
   # พิมพ์: mainnet-beta
   
   vercel env add HELIUS_RPC_URL production
   # พิมพ์: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   ```

2. **Local (.env.local):**
   ```env
   SOLANA_CLUSTER=mainnet-beta
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   ```

### เปลี่ยนเป็น Devnet:

1. **Vercel:**
   ```bash
   vercel env add SOLANA_CLUSTER production
   # พิมพ์: devnet
   ```

2. **Local (.env.local):**
   ```env
   SOLANA_CLUSTER=devnet
   # หรือลบ HELIUS_RPC_URL ออก
   ```

---

## 📊 สถานะปัจจุบัน

จาก code analysis:
- ✅ Default ใน production: `mainnet-beta`
- ✅ Default ใน development: `devnet`
- ✅ ถ้ามี `HELIUS_RPC_URL` → ใช้ Helius (mainnet)
- ✅ Explorer URL จะถูกต้องตาม cluster

**สรุป:** ระบบพร้อมใช้ Mainnet แล้ว! ✅

