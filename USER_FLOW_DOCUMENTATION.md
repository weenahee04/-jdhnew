# 📋 User Flow Documentation - JDH Wallet

## 🔵 Flow การสมัครสมาชิก (Registration Flow)

### Step-by-Step:

```
1. Landing Page
   └─ ผู้ใช้กด "Open account"
   ↓
2. AUTH_REGISTER (หน้า Sign Up)
   ├─ กรอก Email Address
   ├─ กรอก Password (อย่างน้อย 6 ตัวอักษร)
   └─ กด "Sign Up"
   ↓
3. ระบบตรวจสอบข้อมูล
   ├─ ✅ Email format ถูกต้อง
   ├─ ✅ Password อย่างน้อย 6 ตัวอักษร
   ├─ ✅ Email ยังไม่ถูกใช้งาน
   └─ ❌ ถ้าไม่ผ่าน → แสดง error message
   ↓
4. Terms & Conditions Modal (ถ้ายังไม่ยอมรับ)
   ├─ แสดงข้อกำหนดและเงื่อนไข
   ├─ ต้องติ๊ก checkbox "ฉันยอมรับ..."
   └─ กด "ยอมรับ" หรือ "ปฏิเสธ"
   ↓
5. WALLET_CREATE (สร้าง Wallet)
   ├─ INIT: เริ่มต้น
   ├─ GENERATING: สร้าง Seed Phrase (แสดง progress bar)
   ├─ BACKUP: แสดง Seed Phrase
   │   ├─ กด "กดเพื่อแสดง Key"
   │   ├─ Security Warning Modal แสดงขึ้น
   │   │   ├─ แสดงคำเตือน 5 ข้อ
   │   │   └─ กด "ฉันเข้าใจแล้ว"
   │   └─ Seed Phrase 12 คำแสดงขึ้นมา
   │       ├─ คัดลอก Seed Phrase
   │       └─ กด "ฉันจดบันทึกเรียบร้อยแล้ว"
   ├─ VERIFY: ยืนยัน Seed Phrase
   │   ├─ เลือกคำที่ถูกต้องจาก 4 ตัวเลือก
   │   └─ ถ้าถูกต้อง → ไป SUCCESS
   └─ SUCCESS: สำเร็จ
       ├─ แสดง Welcome Modal
       └─ กด "เริ่มใช้งาน"
   ↓
6. APP (เข้าสู่ระบบ)
   ├─ ระบบบันทึกข้อมูล:
   │   ├─ User account → localStorage ('jdh_users')
   │   ├─ Wallet mnemonic → localStorage ('jdh_wallet_{userId}')
   │   ├─ Wallet address → User profile
   │   └─ Session → sessionStorage ('jdh_current_user')
   └─ แสดง Dashboard พร้อม wallet
```

### ข้อมูลที่ถูกบันทึก:

1. **User Account** (localStorage: `jdh_users`)
   ```json
   {
     "user@example.com": {
       "password": "hashed_password",
       "user": {
         "id": "user_1234567890_abc123",
         "email": "user@example.com",
         "createdAt": 1234567890,
         "hasWallet": true,
         "walletAddress": "ABC123..."
       }
     }
   }
   ```

2. **Wallet Mnemonic** (localStorage: `jdh_wallet_{userId}`)
   - เก็บ Seed Phrase 12 คำ (สำหรับ demo - ใน production ควรเข้ารหัส)

3. **Session** (sessionStorage: `jdh_current_user`)
   - เก็บข้อมูล user ปัจจุบันที่ล็อกอินอยู่

---

## 🟢 Flow การล็อกอิน (Login Flow)

### Step-by-Step:

```
1. Landing Page หรือหน้าใดๆ
   └─ ผู้ใช้กด "Login"
   ↓
2. AUTH_LOGIN (หน้า Sign In)
   ├─ กรอก Email Address
   ├─ กรอก Password
   └─ กด "Sign In"
   ↓
3. ระบบตรวจสอบข้อมูล
   ├─ ✅ Email ถูกต้อง
   ├─ ✅ Password ถูกต้อง
   └─ ❌ ถ้าไม่ผ่าน → แสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
   ↓
4. ตรวจสอบว่ามี Wallet หรือไม่
   ├─ ถ้ามี Wallet (hasWallet = true)
   │   ├─ โหลด mnemonic จาก localStorage
   │   ├─ สร้าง Keypair จาก mnemonic
   │   ├─ ตั้งค่า session
   │   └─ เข้าสู่ APP (Dashboard)
   └─ ถ้ายังไม่มี Wallet
       └─ ไปหน้า WALLET_CREATE
   ↓
5. APP (Dashboard)
   ├─ แสดงยอดเงินคงเหลือ
   ├─ แสดงรายการสินทรัพย์
   └─ พร้อมใช้งาน
```

### Auto-Login (เมื่อเปิดแอปใหม่):

```
1. App เปิดขึ้นมา
   ↓
2. ตรวจสอบ sessionStorage ('jdh_current_user')
   ├─ ถ้ามี session
   │   ├─ โหลด user data
   │   ├─ ตรวจสอบว่ามี wallet หรือไม่
   │   ├─ ถ้ามี → โหลด wallet จาก localStorage
   │   └─ เข้าสู่ APP อัตโนมัติ
   └─ ถ้าไม่มี → แสดง Landing Page
```

---

## 🔐 Security & Data Storage

### ข้อมูลที่เก็บใน Browser:

1. **localStorage** (ถาวร - อยู่จนกว่าจะ clear)
   - `jdh_users`: ข้อมูล user accounts ทั้งหมด
   - `jdh_wallet_{userId}`: Seed phrase ของแต่ละ user

2. **sessionStorage** (ชั่วคราว - หายเมื่อปิด browser)
   - `jdh_current_user`: User ที่ล็อกอินอยู่ปัจจุบัน

### ⚠️ หมายเหตุสำคัญ:

1. **Password Hashing**
   - ใช้ simple hash สำหรับ demo
   - ใน production ควรใช้ bcrypt หรือ similar

2. **Seed Phrase Storage**
   - เก็บใน localStorage แบบ plain text (สำหรับ demo)
   - ใน production ควรเข้ารหัสก่อนเก็บ

3. **Session Management**
   - ใช้ sessionStorage (หายเมื่อปิด browser)
   - ถ้าต้องการให้จำ login ควรใช้ localStorage + token

---

## 🔄 Flow Diagram

### Registration:
```
Landing → Register → Terms → Wallet Create → Verify → Success → App
```

### Login:
```
Landing → Login → (Auto-load Wallet) → App
```

### Logout:
```
App → Logout → Clear Session → Landing
```

---

## 📝 Code Flow Reference

### Registration Handler:
```typescript
handleAuthComplete(email, password)
  → registerUser(email, password)
  → setCurrentUser(user)
  → showTermsModal (if not accepted)
  → setCurrentView('WALLET_CREATE')
  → handleWalletCreated(mnemonic)
  → updateUserWallet(email, walletAddress)
  → save mnemonic to localStorage
  → showWelcomeModal
  → setCurrentView('APP')
```

### Login Handler:
```typescript
handleAuthComplete(email, password)
  → loginUser(email, password)
  → setCurrentUser(user)
  → check user.hasWallet
  → if hasWallet:
      → load mnemonic from localStorage
      → loadFromMnemonic(mnemonic)
      → setCurrentView('APP')
  → else:
      → setCurrentView('WALLET_CREATE')
```

### Auto-Login on Mount:
```typescript
useEffect(() => {
  const user = getCurrentUser()
  if (user && user.hasWallet) {
    load mnemonic from localStorage
    loadFromMnemonic(mnemonic)
    setCurrentView('APP')
  }
}, [])
```

