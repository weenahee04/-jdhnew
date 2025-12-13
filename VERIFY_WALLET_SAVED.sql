-- 🔍 ตรวจสอบว่า Wallet ถูกบันทึกหรือไม่

-- 1. ตรวจสอบ wallets table
SELECT 
  w.id,
  w.user_id,
  w.public_key,
  CASE 
    WHEN w.mnemonic_encrypted IS NOT NULL THEN 'Encrypted ✅' 
    ELSE 'NULL ❌' 
  END as mnemonic_status,
  w.created_at
FROM wallets w
ORDER BY w.created_at DESC
LIMIT 10;

-- 2. ตรวจสอบ users ที่มี wallet
SELECT 
  u.id,
  u.email,
  u.has_wallet,
  u.wallet_address,
  CASE 
    WHEN w.id IS NOT NULL THEN 'Wallet exists ✅' 
    ELSE 'No wallet ❌' 
  END as wallet_status,
  u.created_at
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 3. ตรวจสอบ users ที่มี has_wallet = true แต่ไม่มี wallet ใน wallets table
SELECT 
  u.id,
  u.email,
  u.has_wallet,
  u.wallet_address,
  'has_wallet=true but no wallet record ❌' as issue
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.has_wallet = true AND w.id IS NULL;

-- 4. ตรวจสอบ wallets ที่ไม่มี user
SELECT 
  w.id,
  w.user_id,
  w.public_key,
  'Wallet exists but no user ❌' as issue
FROM wallets w
LEFT JOIN users u ON w.user_id = u.id
WHERE u.id IS NULL;



