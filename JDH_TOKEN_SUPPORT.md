# 🪙 JDH Token Support - Implementation Guide

## ✅ Implementation Complete

ระบบรองรับการโอนและรับ JDH token แล้ว!

---

## 📋 JDH Token Information

**Token Address:** `5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx`  
**Symbol:** JDH  
**Network:** Solana (Mainnet)  
**DEX:** Raydium  
**Source:** [DEXScreener](https://dexscreener.com/solana/5favdbaqtdz4dizcqzcmpdscbywfcc1ssvu8snbcemjx)

---

## 🔧 What Was Added

### 1. SPL Token Transfer Function
**File:** `services/solanaClient.ts`

```typescript
export const sendToken = async (
  from: Keypair,
  to: string,
  mintAddress: string,
  amount: number,
  decimals?: number
)
```

**Features:**
- ✅ สร้าง Associated Token Account อัตโนมัติ (ถ้ายังไม่มี)
- ✅ ตรวจสอบว่า sender มี token account
- ✅ แปลง amount เป็น smallest unit ตาม decimals
- ✅ ส่ง transaction จริงบน Solana blockchain

### 2. Token Transfer Hook
**File:** `hooks/useSolanaWallet.ts`

```typescript
const transferToken = useCallback(async (to: string, mintAddress: string, amount: number, decimals?: number) => {
  // Transfer SPL token
})
```

### 3. Updated Send Handler
**File:** `App.tsx`

```typescript
const handleSendAsset = async ({ to, amount, symbol, mintAddress }) => {
  if (symbol === 'SOL') {
    // Transfer SOL
  } else {
    // Transfer SPL Token (including JDH)
  }
}
```

**Features:**
- ✅ รองรับทั้ง SOL และ SPL tokens
- ✅ Auto-detect mint address จาก coin.id
- ✅ Error handling

### 4. JDH Token in Constants
**File:** `services/priceService.ts`

```typescript
export const TOKEN_MINTS: Record<string, string> = {
  // ...
  JDH: '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx',
};
```

---

## 🚀 How to Use

### โอน JDH Token

1. **เปิด Send Modal**
   - ไปที่ Dashboard
   - กดปุ่ม "Send" หรือเลือก JDH token แล้วกด "Send"

2. **เลือก JDH Token**
   - เลือก JDH จาก dropdown (ถ้ามีใน wallet)

3. **กรอกข้อมูล**
   - **Address:** ที่อยู่ผู้รับ (Solana wallet address)
   - **Amount:** จำนวน JDH ที่ต้องการโอน

4. **ยืนยัน**
   - กด "ยืนยันการโอน"
   - ตรวจสอบข้อมูลใน confirmation modal
   - กด "ยืนยัน"

5. **รอ Confirmation**
   - Transaction จะถูกส่งไปยัง Solana blockchain
   - รอ confirmation (~1-2 วินาที)
   - แสดง transaction signature และ explorer link

### รับ JDH Token

1. **เปิด Receive Modal**
   - ไปที่ Dashboard
   - กดปุ่ม "Receive" หรือเลือก JDH token แล้วกด "Receive"

2. **แสดง Address**
   - ระบบจะแสดง wallet address ของคุณ
   - แสดง QR code สำหรับสแกน

3. **Copy Address**
   - กดปุ่ม Copy เพื่อคัดลอก address
   - ส่ง address นี้ให้ผู้ส่ง

4. **หมายเหตุ**
   - สำหรับ SPL tokens (เช่น JDH) ผู้รับต้องมี Associated Token Account
   - ถ้ายังไม่มี ระบบจะสร้างอัตโนมัติเมื่อมีการส่ง token มา

---

## ⚠️ Important Notes

### 1. Associated Token Account (ATA)

สำหรับ SPL tokens (รวมถึง JDH):
- **ผู้ส่ง:** ต้องมี token account (ตรวจสอบอัตโนมัติ)
- **ผู้รับ:** ต้องมี token account (สร้างอัตโนมัติเมื่อส่ง)

### 2. Gas Fees

- **SOL Transfer:** ~0.000005 SOL
- **Token Transfer:** ~0.000005 SOL (ต้องมี SOL สำหรับ gas)

### 3. Decimals

- JDH token decimals จะถูกดึงอัตโนมัติจาก blockchain
- ถ้าไม่พบ จะใช้ default 9 decimals

### 4. Network

- Default: **devnet** (สำหรับทดสอบ)
- Production: ตั้งค่า `SOLANA_CLUSTER=mainnet-beta` ใน `.env`

---

## 🔍 Technical Details

### Token Transfer Flow

```
User Input
  ↓
handleSendAsset()
  ↓
Check: SOL or Token?
  ├─ SOL → transferSol()
  └─ Token → transferToken()
       ↓
    sendToken()
       ↓
    Get/Create ATA
       ↓
    Create Transfer Instruction
       ↓
    Send Transaction
       ↓
    Confirm Transaction
       ↓
    Return Signature
```

### Files Modified

1. `services/solanaClient.ts`
   - Added `sendToken()` function
   - Uses `@solana/spl-token` library

2. `hooks/useSolanaWallet.ts`
   - Added `transferToken()` hook
   - Exported in return object

3. `App.tsx`
   - Updated `handleSendAsset()` to support tokens
   - Added `transferToken` from hook

4. `components/ActionModals.tsx`
   - Updated `onSend` interface to accept `mintAddress`
   - Updated `handleSendConfirm()` to pass mint address

5. `services/priceService.ts`
   - Added JDH token to `TOKEN_MINTS`

---

## ✅ Testing Checklist

- [x] Token transfer function implemented
- [x] Hook updated
- [x] Send handler updated
- [x] JDH token address added
- [x] Interface updated
- [ ] **Manual Testing Required:**
  - [ ] Test sending JDH token
  - [ ] Test receiving JDH token
  - [ ] Verify transaction on Solana Explorer
  - [ ] Test error handling

---

## 🔗 Resources

- [JDH Token on DEXScreener](https://dexscreener.com/solana/5favdbaqtdz4dizcqzcmpdscbywfcc1ssvu8snbcemjx)
- [Solana SPL Token Program](https://spl.solana.com/token)
- [Associated Token Account](https://spl.solana.com/associated-token-account)

---

**Status:** ✅ **Implementation Complete**  
**Ready for Testing:** ✅ Yes  
**Production Ready:** ⚠️ Requires testing on mainnet

