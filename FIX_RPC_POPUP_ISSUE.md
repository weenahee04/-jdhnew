# 🔧 แก้ไข Popup การซื้อ API (1200 USD)

## 🐛 ปัญหา

เมื่อกดส่งเหรียญหรือรับเหรียญ จะขึ้น popup ให้ซื้อ API ของ SOL ในราคา 1200 USD ถึงจะใช้งานได้ (เป็นภาษาอังกฤษ)

## 🔍 สาเหตุ

Popup นี้มาจาก **RPC endpoint** (Helius หรือ Solana RPC) ที่:
1. มี rate limit และต้อง upgrade plan
2. API key หมดอายุหรือไม่ถูกต้อง
3. ต้องซื้อ subscription เพื่อใช้งาน

## ✅ วิธีแก้ไข

### 1. ตรวจสอบ RPC Endpoint

**ตรวจสอบว่าใช้ RPC endpoint ไหน:**
- ไปที่ Browser Console (F12)
- ดู log: `🌐 Using Helius RPC URL: ...` หรือ `🌐 Using Solana cluster: ...`

### 2. ตรวจสอบ Helius RPC Key

**ถ้าใช้ Helius RPC:**
1. ไปที่ [Helius Dashboard](https://www.helius.dev/)
2. ตรวจสอบ API key ยังใช้งานได้หรือไม่
3. ตรวจสอบ plan (Free tier มี rate limit)
4. ถ้าเกิน rate limit → ต้อง upgrade plan

### 3. เปลี่ยน RPC Endpoint

**Option 1: ใช้ Solana Public RPC (ฟรี แต่ช้า)**
```env
# ลบ HELIUS_RPC_URL ออก หรือไม่ตั้งค่า
# ระบบจะใช้ clusterApiUrl('mainnet-beta') แทน
```

**Option 2: ใช้ QuickNode หรือ RPC อื่น**
```env
HELIUS_RPC_URL=https://your-quicknode-url.com
```

**Option 3: ใช้ Helius Free Tier (มี rate limit)**
- สมัคร Helius (ฟรี)
- สร้าง API key
- ใช้ใน `HELIUS_RPC_URL`

### 4. อัปเดต Error Handling

**Code ได้รับการอัปเดตแล้ว:**
- เพิ่ม error handling ใน `sendSol()`
- เพิ่ม error handling ใน `sendToken()`
- เพิ่ม error handling ใน `getBalanceSol()`
- ตรวจสอบ error messages ที่มีคำว่า "upgrade", "purchase", "subscription", "1200"

**Error messages จะแสดงเป็น:**
- `"RPC endpoint error. Please check your RPC configuration or contact support."`

---

## 🛠️ การแก้ไขที่ทำแล้ว

### 1. เพิ่ม Error Handling

**File:** `services/solanaClient.ts`

```typescript
// เพิ่ม error handling ใน sendSol()
catch (error: any) {
  const errorMsg = error?.message || error?.toString() || '';
  if (errorMsg.toLowerCase().includes('upgrade') || 
      errorMsg.toLowerCase().includes('purchase') || 
      errorMsg.toLowerCase().includes('subscription') ||
      errorMsg.toLowerCase().includes('1200')) {
    throw new Error('RPC endpoint error. Please check your RPC configuration or contact support.');
  }
  throw new Error(error.message || 'การโอน SOL ล้มเหลว');
}
```

### 2. ป้องกัน Popup

- ตรวจสอบ error messages ก่อนแสดง
- แสดง error message ที่เป็นมิตรกับผู้ใช้
- ไม่แสดง popup จาก RPC endpoint โดยตรง

---

## 📋 Checklist การแก้ไข

- [x] เพิ่ม error handling ใน `sendSol()`
- [x] เพิ่ม error handling ใน `sendToken()`
- [x] เพิ่ม error handling ใน `getBalanceSol()`
- [x] ตรวจสอบ error messages ที่มีคำว่า "upgrade", "purchase", "subscription", "1200"
- [ ] ตรวจสอบ RPC endpoint configuration
- [ ] ตรวจสอบ Helius API key
- [ ] ทดสอบการส่ง/รับเหรียญ

---

## 🎯 วิธีทดสอบ

### 1. ทดสอบ Send SOL
1. เปิด Send modal
2. กรอก address และ amount
3. กดส่ง
4. **ตรวจสอบ:** ไม่ควรมี popup เกี่ยวกับการซื้อ API

### 2. ทดสอบ Receive
1. เปิด Receive modal
2. **ตรวจสอบ:** ไม่ควรมี popup เกี่ยวกับการซื้อ API

### 3. ตรวจสอบ Console
1. เปิด Browser Console (F12)
2. ดู error messages
3. **ตรวจสอบ:** Error messages ควรเป็นภาษาไทยหรือข้อความที่เข้าใจง่าย

---

## ⚠️ หมายเหตุ

### ถ้ายังมี Popup:

1. **ตรวจสอบ Browser Extensions**
   - ปิด browser extensions ที่อาจจะ inject popup
   - ทดสอบใน incognito mode

2. **ตรวจสอบ RPC Response**
   - ดู Network tab ใน Browser DevTools
   - ตรวจสอบ response จาก RPC endpoint
   - ดูว่ามี redirect ไปหน้า upgrade หรือไม่

3. **ตรวจสอบ Helius Dashboard**
   - ไปที่ Helius Dashboard
   - ตรวจสอบ API usage
   - ตรวจสอบ plan และ rate limits

---

## 🔗 Resources

- [Helius Dashboard](https://www.helius.dev/)
- [Solana RPC Endpoints](https://docs.solana.com/cluster/rpc-endpoints)
- [QuickNode](https://www.quicknode.com/)

---

## ✅ สรุป

**การแก้ไข:**
- ✅ เพิ่ม error handling ใน `sendSol()`, `sendToken()`, `getBalanceSol()`
- ✅ ตรวจสอบ error messages ที่มีคำว่า "upgrade", "purchase", "subscription", "1200"
- ✅ แสดง error message ที่เป็นมิตรกับผู้ใช้

**สิ่งที่ต้องทำ:**
- ⚠️ ตรวจสอบ RPC endpoint configuration
- ⚠️ ตรวจสอบ Helius API key
- ⚠️ ทดสอบการส่ง/รับเหรียญ

