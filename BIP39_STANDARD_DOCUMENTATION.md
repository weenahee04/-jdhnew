# 🔐 BIP39 Standard Documentation - JDH Wallet

## ✅ ระบบ Seed Phrase ที่ใช้

### มาตรฐานที่ใช้:
- **BIP39 (Bitcoin Improvement Proposal 39)** - มาตรฐานสากลสำหรับ Mnemonic Seed Phrases
- **BIP44** - Hierarchical Deterministic (HD) Wallet Structure
- **ed25519** - Cryptographic algorithm สำหรับ Solana

---

## 📊 เปรียบเทียบกับ Wallet อื่นๆ

### ✅ ใช้มาตรฐานเดียวกันกับ:

| Wallet | BIP39 | Seed Words | Derivation Path | Compatible? |
|--------|-------|------------|-----------------|-------------|
| **JDH Wallet** | ✅ | 12 words | `m/44'/501'/0'/0'` | ✅ |
| **Phantom** | ✅ | 12 words | `m/44'/501'/0'/0'` | ✅ |
| **Solflare** | ✅ | 12 words | `m/44'/501'/0'/0'` | ✅ |
| **MetaMask** | ✅ | 12 words | `m/44'/60'/0'/0` | ⚠️ (Ethereum path) |
| **Trust Wallet** | ✅ | 12/24 words | `m/44'/60'/0'/0` | ⚠️ (Ethereum path) |
| **Ledger** | ✅ | 24 words | `m/44'/501'/0'/0'` | ✅ |

---

## 🔑 Derivation Path สำหรับ Solana

### Path ที่ใช้:
```
m/44'/501'/0'/0'
```

### ความหมาย:
- `m` = master key
- `44'` = BIP44 standard (hardened)
- `501'` = Solana coin type (hardened)
- `0'` = Account index (hardened)
- `0'` = Change index (hardened)

### หมายเหตุ:
- **Hardened derivation** (`'`) = ปลอดภัยกว่า ไม่สามารถ derive กลับได้
- **501** = Coin type สำหรับ Solana (ตาม [SLIP-0044](https://github.com/satoshilabs/slips/blob/master/slip-0044.md))

---

## 📚 Libraries ที่ใช้

### 1. **@scure/bip39** (v1.3.0)
```typescript
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
```

**คุณสมบัติ:**
- ✅ BIP39 compliant
- ✅ ใช้ English wordlist (2048 คำ)
- ✅ รองรับ 12 และ 24 words
- ✅ Secure random generation
- ✅ Validation

### 2. **ed25519-hd-key** (v1.3.0)
```typescript
import { derivePath } from 'ed25519-hd-key';
```

**คุณสมบัติ:**
- ✅ HD key derivation สำหรับ ed25519
- ✅ รองรับ Solana's derivation path
- ✅ Compatible กับ Solana wallets

---

## 🔄 Flow การสร้าง Seed Phrase

### Step-by-Step:

```
1. Generate Entropy (128 bits สำหรับ 12 words)
   └─ ใช้ crypto-secure random
   ↓
2. Convert Entropy → Mnemonic
   └─ ใช้ BIP39 wordlist (2048 คำ)
   ↓
3. Mnemonic → Seed (512 bits)
   └─ ใช้ PBKDF2 (2048 iterations)
   ↓
4. Seed → Master Key
   └─ ใช้ HMAC-SHA512
   ↓
5. Master Key → Derived Key
   └─ ใช้ derivation path: m/44'/501'/0'/0'
   ↓
6. Derived Key → Solana Keypair
   └─ ใช้ ed25519 curve
```

---

## 🔐 Security Features

### ✅ มาตรฐานความปลอดภัย:

1. **Entropy Generation**
   - ใช้ `crypto.getRandomValues()` (browser)
   - 128 bits entropy สำหรับ 12 words
   - 256 bits entropy สำหรับ 24 words

2. **Wordlist**
   - English wordlist (2048 คำ)
   - ตรวจสอบ checksum
   - Validate mnemonic ก่อนใช้

3. **Key Derivation**
   - Hardened derivation (ปลอดภัยกว่า)
   - ใช้ ed25519 (เหมาะกับ Solana)
   - ไม่สามารถ reverse engineer ได้

---

## 🔄 Compatibility

### ✅ สามารถ Import/Export กับ:

1. **Phantom Wallet**
   - ✅ ใช้ seed phrase เดียวกันได้
   - ✅ Derivation path เหมือนกัน

2. **Solflare**
   - ✅ Compatible 100%

3. **Hardware Wallets (Ledger)**
   - ✅ รองรับ Solana derivation path
   - ⚠️ ต้องใช้ Ledger app

### ⚠️ ไม่ Compatible กับ:

1. **MetaMask / Trust Wallet**
   - ❌ ใช้ derivation path ต่างกัน (Ethereum: `m/44'/60'/0'/0`)
   - ❌ ใช้ elliptic curve ต่างกัน (secp256k1 vs ed25519)

---

## 📝 Code Implementation

### การสร้าง Mnemonic:
```typescript
// services/solanaClient.ts
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export const createMnemonic = (strength: 128 | 256 = 128) => 
  generateMnemonic(wordlist, strength);
```

### การแปลง Mnemonic → Keypair:
```typescript
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { derivePath } from 'ed25519-hd-key';

export const mnemonicToKeypair = (mnemonic: string, path: string = "m/44'/501'/0'/0'") => {
  // Validate mnemonic
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic');
  }
  
  // Convert mnemonic to seed
  const seed = mnemonicToSeedSync(mnemonic);
  
  // Derive key using HD path
  const derived = derivePath(path, seed.toString('hex'));
  
  // Create Solana keypair
  return Keypair.fromSeed(derived.key.slice(0, 32));
};
```

---

## 🧪 Testing Compatibility

### ทดสอบ Import จาก Wallet อื่น:

1. **จาก Phantom:**
   ```
   1. Export seed phrase จาก Phantom
   2. Import ใน JDH Wallet
   3. ควรได้ wallet address เดียวกัน
   ```

2. **จาก Solflare:**
   ```
   1. Export seed phrase จาก Solflare
   2. Import ใน JDH Wallet
   3. ควรได้ wallet address เดียวกัน
   ```

---

## 📚 References

### Standards:
- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) - Mnemonic code
- [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) - HD Wallet structure
- [SLIP-0044](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) - Coin types

### Solana Specific:
- [Solana Wallet Standard](https://docs.solana.com/wallet-guide)
- [ed25519 for Solana](https://docs.solana.com/terminology#ed25519)

---

## ✅ สรุป

### ระบบ Seed Phrase ของ JDH Wallet:

1. ✅ **ใช้ BIP39 มาตรฐาน** - เหมือนกับ wallet อื่นๆ
2. ✅ **12 words** - มาตรฐานสำหรับ Solana
3. ✅ **Derivation path: `m/44'/501'/0'/0'`** - มาตรฐาน Solana
4. ✅ **Compatible กับ Phantom, Solflare** - ใช้ seed phrase เดียวกันได้
5. ✅ **Secure** - ใช้ hardened derivation และ ed25519

### ข้อดี:
- ✅ มาตรฐานสากล
- ✅ Compatible กับ wallet อื่นๆ
- ✅ ปลอดภัย
- ✅ สามารถ backup/restore ได้

### ข้อควรระวัง:
- ⚠️ เก็บ seed phrase ไว้ในที่ปลอดภัย
- ⚠️ ห้ามแชร์ seed phrase กับใคร
- ⚠️ ตรวจสอบ derivation path ก่อน import

