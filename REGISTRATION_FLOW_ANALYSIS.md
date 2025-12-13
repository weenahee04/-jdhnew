# 📋 Registration Flow Analysis & Popup Recommendations

## Current Flow

```
1. Landing Page
   ↓
2. Onboarding (3 screens - ข้ามได้)
   ↓
3. AUTH_REGISTER (สมัครสมาชิก)
   ↓
4. WALLET_CREATE (สร้างกระเป๋า)
   ├─ INIT → GENERATING → BACKUP → VERIFY → SUCCESS
   └─ มี warning เกี่ยวกับ screenshot แล้ว
   ↓
5. APP (เข้าสู่ระบบ)
```

## 🔴 Critical Popups ที่ต้องเพิ่ม

### 1. **Terms & Conditions + Privacy Policy** (ก่อนสร้าง wallet)
**Location**: หลัง AUTH_REGISTER ก่อน WALLET_CREATE
**Content**:
- Terms of Service
- Privacy Policy
- User Agreement
- Checkbox: "ฉันยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว"
**Action**: ไม่สามารถสร้าง wallet ได้ถ้าไม่ยอมรับ

### 2. **Security Warning (ก่อนแสดง Seed Phrase)**
**Location**: ก่อนแสดง seed phrase ใน BACKUP step
**Content**:
- ⚠️ ห้ามแคปหน้าจอ
- ⚠️ ห้ามส่ง seed phrase ทางอีเมล/ข้อความ
- ⚠️ เก็บไว้ในที่ปลอดภัยเท่านั้น
- ⚠️ หากสูญหายจะไม่สามารถกู้คืนได้
**Action**: Confirm ก่อนแสดง seed phrase

### 3. **Import Security Warning**
**Location**: ก่อน import wallet
**Content**:
- ⚠️ ตรวจสอบให้แน่ใจว่าเป็น seed phrase ของคุณเอง
- ⚠️ อย่าใส่ seed phrase ในที่สาธารณะ
- ⚠️ ตรวจสอบว่าไม่มีใครมองเห็นหน้าจอ
**Action**: Confirm ก่อน import

### 4. **Welcome & Security Tips (หลังสร้าง wallet สำเร็จ)**
**Location**: หลัง SUCCESS ก่อนเข้าสู่ APP
**Content**:
- 🎉 ยินดีต้อนรับสู่ JDH Wallet
- 💡 Security Tips:
  - เก็บ seed phrase ไว้ในที่ปลอดภัย
  - อย่าแชร์ private key กับใคร
  - ตรวจสอบ address ก่อนส่ง
  - ใช้ 2FA ถ้ามี
**Action**: "เข้าใจแล้ว" button

## ⚠️ Important Popups ที่ควรเพิ่ม

### 5. **Send Transaction Confirmation**
**Location**: ก่อนส่ง transaction
**Content**:
- จำนวนเงิน
- ปลายทาง address
- Network fee
- Total amount
**Action**: Confirm/Cancel

### 6. **Swap Confirmation**
**Location**: ก่อน swap
**Content**:
- From/To tokens
- Amount
- Estimated output
- Price impact
- Slippage tolerance
- Network fee
**Action**: Confirm/Cancel

### 7. **Logout Confirmation** (มีแล้ว)
**Location**: ก่อน logout
**Status**: ✅ มีแล้ว (showLogoutConfirm)

### 8. **Browser Security Warning**
**Location**: เมื่อ detect browser ที่ไม่ปลอดภัย
**Content**:
- ⚠️ แนะนำให้ใช้ browser ที่อัปเดตล่าสุด
- ⚠️ ตรวจสอบ HTTPS
- ⚠️ อย่าใช้ในคอมพิวเตอร์สาธารณะ

## 📝 Nice to Have Popups

### 9. **First Transaction Guide**
**Location**: ครั้งแรกที่ส่ง transaction
**Content**: Tutorial วิธีส่ง transaction

### 10. **Backup Reminder**
**Location**: หลังใช้งาน 3-7 วัน
**Content**: "คุณได้ backup seed phrase แล้วหรือยัง?"

### 11. **Network Warning**
**Location**: เมื่อ network ไม่เสถียร
**Content**: Warning เกี่ยวกับ network issues

## 🎯 Priority Implementation

### High Priority (ต้องมี)
1. ✅ Terms & Conditions popup
2. ✅ Security warning ก่อนแสดง seed phrase
3. ✅ Send transaction confirmation
4. ✅ Swap confirmation

### Medium Priority (ควรมี)
5. Import security warning
6. Welcome & Security Tips
7. Browser security warning

### Low Priority (Nice to have)
8. First transaction guide
9. Backup reminder
10. Network warning

