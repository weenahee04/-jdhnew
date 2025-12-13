# 🔐 Seed Phrase Storage Documentation

## ✅ ระบบจดจำ Seed Phrase กับ Email

### คำตอบ: **ใช่ ระบบจดจำ seed phrase ไว้กับ email (ผ่าน user account)**

---

## 📊 วิธีการเก็บข้อมูล

### 1. **User Account** (localStorage: `jdh_users`)
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

**Key:** Email address (lowercase)  
**เก็บ:** User profile, password hash, wallet address

### 2. **Seed Phrase** (localStorage: `jdh_wallet_{userId}`)
```
Key: jdh_wallet_user_1234567890_abc123
Value: "word1 word2 word3 ... word12"
```

**Key:** `jdh_wallet_{userId}` (ใช้ user.id ไม่ใช่ email โดยตรง)  
**เก็บ:** Seed phrase 12 คำ (plain text สำหรับ demo)

---

## 🔄 Flow การเก็บ Seed Phrase

### เมื่อสมัครสมาชิกและสร้าง Wallet:

```
1. สมัครสมาชิก (email: user@example.com)
   ↓
2. สร้าง User Account
   ├─ id: "user_1234567890_abc123"
   ├─ email: "user@example.com"
   └─ hasWallet: false
   ↓
3. สร้าง Wallet
   ├─ Generate mnemonic: "word1 word2 ... word12"
   └─ Create keypair
   ↓
4. บันทึกข้อมูล
   ├─ User Account → localStorage['jdh_users']['user@example.com']
   │   └─ hasWallet: true
   │   └─ walletAddress: "ABC123..."
   └─ Seed Phrase → localStorage['jdh_wallet_user_1234567890_abc123']
       └─ Value: "word1 word2 ... word12"
```

---

## 🔑 การเชื่อมโยง Email กับ Seed Phrase

### วิธีการ:

1. **Email → User ID**
   ```typescript
   // หา user จาก email
   const userData = users[email.toLowerCase()];
   const userId = userData.user.id; // "user_1234567890_abc123"
   ```

2. **User ID → Seed Phrase**
   ```typescript
   // หา seed phrase จาก user id
   const seedPhrase = localStorage.getItem(`jdh_wallet_${userId}`);
   ```

3. **Flow ทั้งหมด:**
   ```
   Email → User Account → User ID → Seed Phrase → Wallet
   ```

---

## 🔐 การล็อกอินและโหลด Wallet

### Step-by-Step:

```
1. Login (email: user@example.com, password: ****)
   ↓
2. ตรวจสอบ Email & Password
   ├─ หา user จาก email
   └─ ตรวจสอบ password hash
   ↓
3. โหลด User Account
   ├─ user.id = "user_1234567890_abc123"
   ├─ user.hasWallet = true
   └─ user.walletAddress = "ABC123..."
   ↓
4. โหลด Seed Phrase
   ├─ Key: `jdh_wallet_user_1234567890_abc123`
   └─ Value: "word1 word2 ... word12"
   ↓
5. สร้าง Wallet จาก Seed Phrase
   ├─ mnemonicToKeypair(seedPhrase)
   └─ Load wallet into app
   ↓
6. เข้าสู่ App
   └─ แสดง Dashboard พร้อม wallet
```

---

## 📝 Code Implementation

### การบันทึก Seed Phrase:
```typescript
// App.tsx - handleWalletCreated
const handleWalletCreated = async (mnemonic: string) => {
  await loadFromMnemonic(mnemonic);
  
  // Save wallet to user account
  if (currentUser && wallet.publicKey) {
    updateUserWallet(currentUser.email, wallet.publicKey);
    
    // Store mnemonic in localStorage
    localStorage.setItem(`jdh_wallet_${currentUser.id}`, mnemonic);
  }
};
```

### การโหลด Seed Phrase เมื่อ Login:
```typescript
// App.tsx - handleAuthComplete (Login)
const result = await loginUser(email, password);
if (result.success && result.user) {
  // Check if user has wallet
  if (result.user.hasWallet && result.user.walletAddress) {
    // Load seed phrase from localStorage
    const storedMnemonic = localStorage.getItem(`jdh_wallet_${result.user.id}`);
    if (storedMnemonic) {
      await loadFromMnemonic(storedMnemonic);
    }
  }
}
```

---

## 🔒 Security Considerations

### ⚠️ ข้อควรระวัง (สำหรับ Demo):

1. **Seed Phrase เก็บแบบ Plain Text**
   - ❌ ไม่ได้เข้ารหัส
   - ⚠️ ใครเข้าถึง localStorage ได้ = เห็น seed phrase
   - ✅ ใน production ควรเข้ารหัสก่อนเก็บ

2. **การเชื่อมโยง Email กับ Seed Phrase**
   - ✅ ใช้ user.id เป็น key (ไม่ใช่ email โดยตรง)
   - ✅ Email → User ID → Seed Phrase (2 steps)
   - ⚠️ แต่ถ้าเข้าถึง localStorage ได้ทั้งคู่ = เชื่อมโยงได้

3. **Session Management**
   - ✅ ใช้ sessionStorage สำหรับ session (หายเมื่อปิด browser)
   - ✅ Seed phrase เก็บใน localStorage (ถาวร)

---

## 🔄 Auto-Login Flow

### เมื่อเปิดแอปใหม่:

```
1. App เปิดขึ้นมา
   ↓
2. ตรวจสอบ Session (sessionStorage)
   ├─ getCurrentUser() → user object
   └─ ถ้ามี → user.id = "user_1234567890_abc123"
   ↓
3. ตรวจสอบว่ามี Wallet หรือไม่
   ├─ user.hasWallet = true
   └─ user.walletAddress = "ABC123..."
   ↓
4. โหลด Seed Phrase
   ├─ Key: `jdh_wallet_user_1234567890_abc123`
   └─ Value: "word1 word2 ... word12"
   ↓
5. สร้าง Wallet
   └─ loadFromMnemonic(seedPhrase)
   ↓
6. เข้าสู่ App อัตโนมัติ
   └─ แสดง Dashboard
```

---

## 📊 Data Structure Summary

### localStorage Keys:

| Key | Value | Purpose |
|-----|-------|---------|
| `jdh_users` | `{email: {password, user}}` | User accounts |
| `jdh_wallet_{userId}` | `"word1 word2 ... word12"` | Seed phrase |

### sessionStorage Keys:

| Key | Value | Purpose |
|-----|-------|---------|
| `jdh_current_user` | `{id, email, hasWallet, ...}` | Current session |

---

## ✅ สรุป

### ระบบจดจำ Seed Phrase กับ Email:

1. ✅ **ใช่** - ระบบจดจำ seed phrase ไว้กับ email (ผ่าน user account)
2. ✅ **เชื่อมโยงผ่าน User ID** - Email → User ID → Seed Phrase
3. ✅ **Auto-load เมื่อ Login** - โหลด wallet อัตโนมัติเมื่อ login
4. ✅ **Auto-login** - โหลด wallet อัตโนมัติเมื่อเปิดแอปใหม่ (ถ้ามี session)

### Flow:
```
Email → User Account → User ID → Seed Phrase → Wallet
```

### ข้อดี:
- ✅ ไม่ต้องกรอก seed phrase ซ้ำเมื่อ login
- ✅ Auto-load wallet
- ✅ User-friendly

### ข้อควรระวัง:
- ⚠️ Seed phrase เก็บแบบ plain text (สำหรับ demo)
- ⚠️ ควรเข้ารหัสใน production
- ⚠️ เก็บ seed phrase ไว้ในที่ปลอดภัย (backup)

