# 💾 ระบบเก็บข้อมูลสมาชิก - JDH Wallet

## 📊 สรุปการเก็บข้อมูล

### ⚠️ **ข้อมูลเก็บใน Browser เท่านั้น (ไม่มี Backend)**

ระบบใช้ **localStorage** และ **sessionStorage** ของ browser ในการเก็บข้อมูลทั้งหมด

---

## 🗂️ โครงสร้างการเก็บข้อมูล

### 1. **User Accounts** (localStorage: `jdh_users`)

**Key:** `jdh_users`  
**Storage:** `localStorage` (ถาวร - อยู่จนกว่าจะ clear browser data)  
**Format:** JSON object

```json
{
  "user@example.com": {
    "password": "123456789",  // hashed password (simple hash)
    "user": {
      "id": "user_1234567890_abc123",
      "email": "user@example.com",
      "createdAt": 1234567890,
      "hasWallet": true,
      "walletAddress": "ABC123...",
      "displayName": "username"
    }
  },
  "another@example.com": {
    "password": "987654321",
    "user": {
      "id": "user_9876543210_xyz789",
      "email": "another@example.com",
      "createdAt": 1234567891,
      "hasWallet": false
    }
  }
}
```

**ข้อมูลที่เก็บ:**
- ✅ Email (เป็น key)
- ✅ Password (hashed - simple hash สำหรับ demo)
- ✅ User ID (unique)
- ✅ Created timestamp
- ✅ Wallet address (ถ้ามี)
- ✅ Display name

---

### 2. **Seed Phrase / Mnemonic** (localStorage: `jdh_wallet_{userId}`)

**Key:** `jdh_wallet_{userId}` (ใช้ user.id ไม่ใช่ email)  
**Storage:** `localStorage` (ถาวร)  
**Format:** String (12 words)

**ตัวอย่าง:**
```
Key: jdh_wallet_user_1234567890_abc123
Value: "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
```

**ข้อมูลที่เก็บ:**
- ✅ Seed phrase 12 คำ (BIP39 standard)
- ⚠️ **เก็บแบบ plain text** (สำหรับ demo - ควรเข้ารหัสใน production)

---

### 3. **Current Session** (sessionStorage: `jdh_current_user`)

**Key:** `jdh_current_user`  
**Storage:** `sessionStorage` (ชั่วคราว - หายเมื่อปิด browser)  
**Format:** JSON object

```json
{
  "id": "user_1234567890_abc123",
  "email": "user@example.com",
  "createdAt": 1234567890,
  "hasWallet": true,
  "walletAddress": "ABC123...",
  "displayName": "username"
}
```

**ข้อมูลที่เก็บ:**
- ✅ User ที่ล็อกอินอยู่ปัจจุบัน
- ✅ ใช้สำหรับ auto-login เมื่อเปิดแอปใหม่ (ถ้ายังไม่ปิด browser)

---

## 🔄 Flow การเก็บข้อมูล

### เมื่อสมัครสมาชิก:

```
1. User กรอก Email + Password
   ↓
2. registerUser(email, password)
   ├─ สร้าง User object
   │   ├─ id: "user_1234567890_abc123"
   │   ├─ email: "user@example.com"
   │   ├─ createdAt: Date.now()
   │   └─ hasWallet: false
   ├─ Hash password (simple hash)
   └─ บันทึกใน localStorage['jdh_users']
       Key: "user@example.com"
       Value: {password: "hashed", user: {...}}
```

---

### เมื่อสร้าง Wallet:

```
1. สร้าง Seed Phrase (BIP39)
   ↓
2. handleWalletCreated(mnemonic)
   ├─ โหลด wallet จาก mnemonic
   ├─ บันทึก wallet address
   │   └─ updateUserWallet(email, walletAddress)
   │       └─ อัพเดท localStorage['jdh_users'][email].user
   │           ├─ hasWallet: true
   │           └─ walletAddress: "ABC123..."
   └─ บันทึก seed phrase
       └─ localStorage.setItem(`jdh_wallet_${userId}`, mnemonic)
```

---

### เมื่อล็อกอิน:

```
1. User กรอก Email + Password
   ↓
2. loginUser(email, password)
   ├─ ตรวจสอบ email & password จาก localStorage['jdh_users']
   ├─ ถ้าถูกต้อง
   │   ├─ setCurrentUser(user) → sessionStorage['jdh_current_user']
   │   └─ return {success: true, user}
   └─ ถ้าไม่ถูกต้อง
       └─ return {success: false, error}
   ↓
3. handleAuthComplete (Login)
   ├─ ตรวจสอบว่ามี wallet หรือไม่
   ├─ ถ้ามี wallet
   │   ├─ โหลด seed phrase จาก localStorage[`jdh_wallet_${userId}`]
   │   ├─ loadFromMnemonic(seedPhrase)
   │   └─ เข้าสู่ APP
   └─ ถ้าไม่มี wallet
       └─ ไปหน้า WALLET_CREATE
```

---

### เมื่อเปิดแอปใหม่ (Auto-login):

```
1. App.tsx component mount
   ↓
2. useEffect(() => {
     const user = getCurrentUser(); // จาก sessionStorage
     if (user && user.hasWallet) {
       // โหลด wallet อัตโนมัติ
       const mnemonic = localStorage.getItem(`jdh_wallet_${user.id}`);
       if (mnemonic) {
         loadFromMnemonic(mnemonic);
         setCurrentView('APP');
       }
     }
   })
```

---

## 📍 ตำแหน่งข้อมูลใน Browser

### localStorage (ถาวร)

| Key | Value | ตัวอย่าง |
|-----|-------|----------|
| `jdh_users` | `{email: {password, user}}` | `{"user@example.com": {...}}` |
| `jdh_wallet_{userId}` | `"word1 word2 ... word12"` | `"abandon ability able ..."` |

### sessionStorage (ชั่วคราว)

| Key | Value | ตัวอย่าง |
|-----|-------|----------|
| `jdh_current_user` | `{id, email, hasWallet, ...}` | `{"id": "user_123...", ...}` |

---

## 🔐 Security Notes

### ⚠️ ข้อควรระวัง:

1. **Password Hashing**
   - ใช้ simple hash (ไม่ปลอดภัย)
   - ควรใช้ bcrypt หรือ similar ใน production

2. **Seed Phrase Storage**
   - เก็บแบบ **plain text** (ไม่ปลอดภัย)
   - ควรเข้ารหัสก่อนเก็บใน production

3. **No Backend**
   - ข้อมูลทั้งหมดอยู่ใน browser
   - ถ้า clear browser data → ข้อมูลหายหมด
   - ไม่สามารถ sync ระหว่าง devices ได้

4. **Session Management**
   - ใช้ sessionStorage (หายเมื่อปิด browser)
   - ไม่มี "Remember me" option

---

## 🔄 การเชื่อมโยง Email กับ Seed Phrase

### Flow:

```
Email → User Account → User ID → Seed Phrase
```

### Code:

```typescript
// 1. หา user จาก email
const users = getUsers(); // localStorage['jdh_users']
const userData = users[email.toLowerCase()];
const userId = userData.user.id; // "user_1234567890_abc123"

// 2. หา seed phrase จาก user id
const seedPhrase = localStorage.getItem(`jdh_wallet_${userId}`);
// "word1 word2 ... word12"

// 3. สร้าง wallet จาก seed phrase
loadFromMnemonic(seedPhrase);
```

---

## 📝 ตัวอย่างข้อมูลจริง

### localStorage['jdh_users']:

```json
{
  "test@example.com": {
    "password": "123456789",
    "user": {
      "id": "user_1702456789_abc123",
      "email": "test@example.com",
      "createdAt": 1702456789000,
      "hasWallet": true,
      "walletAddress": "7xKXtg2CZ3QZ4Z5Z6Z7Z8Z9Z0Z1Z2Z3Z4Z5Z6Z7Z8Z9Z0",
      "displayName": "test"
    }
  }
}
```

### localStorage['jdh_wallet_user_1702456789_abc123']:

```
"abandon ability able about above absent absorb abstract absurd abuse access accident"
```

### sessionStorage['jdh_current_user']:

```json
{
  "id": "user_1702456789_abc123",
  "email": "test@example.com",
  "createdAt": 1702456789000,
  "hasWallet": true,
  "walletAddress": "7xKXtg2CZ3QZ4Z5Z6Z7Z8Z9Z0Z1Z2Z3Z4Z5Z6Z7Z8Z9Z0",
  "displayName": "test"
}
```

---

## ✅ สรุป

### ข้อมูลเก็บที่ไหน?

1. **User Accounts** → `localStorage['jdh_users']`
2. **Seed Phrases** → `localStorage['jdh_wallet_{userId}']`
3. **Current Session** → `sessionStorage['jdh_current_user']`

### ข้อมูลหายเมื่อไหร่?

- **localStorage:** หายเมื่อ clear browser data
- **sessionStorage:** หายเมื่อปิด browser tab/window

### ข้อจำกัด:

- ❌ ไม่มี Backend API
- ❌ ไม่สามารถ sync ระหว่าง devices ได้
- ❌ ข้อมูลหายเมื่อ clear browser data
- ⚠️ Seed phrase เก็บแบบ plain text (ไม่ปลอดภัย)

---

**Status:** ⚠️ **Client-side Only - No Backend**

