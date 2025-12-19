# Frontend API Integration Guide

## ✅ สิ่งที่เชื่อมต่อแล้ว

### 1. Wallet API Client (`services/walletApi.ts`)
- ✅ API client สำหรับเรียก backend API
- ✅ Support ทุก endpoints: portfolio, history, metadata, prices, swap
- ✅ Error handling และ type safety

### 2. Service Layer (`services/walletApiService.ts`)
- ✅ Wrapper functions ที่ fallback ไปใช้ direct RPC/API
- ✅ `getPortfolioFromApi()` - Portfolio data
- ✅ `getHistoryFromApi()` - Transaction history
- ✅ `getPricesFromApi()` - Token prices
- ✅ `getTokenMetadataFromApi()` - Token metadata
- ✅ `getSwapQuoteFromApi()` - Swap quotes
- ✅ `buildSwapTransactionFromApi()` - Build swap transactions

### 3. Hooks
- ✅ `hooks/useWalletBalancesApi.ts` - Hook ที่ใช้ API สำหรับ wallet balances
- ✅ `hooks/useMockCoinPrices.ts` - อัพเดทให้ใช้ API สำหรับ prices

### 4. Integration Points
- ✅ `App.tsx` - ใช้ API สำหรับ transaction history
- ✅ `App.tsx` - ใช้ API สำหรับ swap (`handleSwap`)
- ✅ `components/ActionModals.tsx` - ใช้ API สำหรับ swap quotes
- ✅ `services/jupiterApi.ts` - Jupiter swap with API integration
- ✅ `services/priceApiService.ts` - Price service with API integration

### 5. Configuration
- ✅ `config.ts` - เพิ่ม `USE_WALLET_API` flag และ `WALLET_API_URL`
- ✅ `env.example` - เพิ่ม environment variables

## 🔧 วิธีใช้งาน

### 1. ตั้งค่า Environment Variables

```bash
# .env.local หรือ .env
VITE_WALLET_API_URL=http://localhost:3001
VITE_USE_WALLET_API=true
VITE_WALLET_API_KEY=your-api-key-optional
```

### 2. เปิดใช้งาน API

ตั้งค่า `VITE_USE_WALLET_API=true` ใน environment variables

### 3. Fallback Behavior

ระบบจะ fallback ไปใช้ direct RPC/API อัตโนมัติถ้า:
- API server ไม่สามารถเข้าถึงได้
- API return error
- `USE_WALLET_API` เป็น `false`

## 📋 API Endpoints ที่ใช้

### Portfolio
```typescript
GET /v1/portfolio?chain=solana&address=YOUR_ADDRESS
```

### Transaction History
```typescript
GET /v1/history?chain=solana&address=YOUR_ADDRESS&limit=100
```

### Token Metadata
```typescript
GET /v1/token/meta?chain=solana&id=MINT_ADDRESS
```

### Prices
```typescript
GET /v1/prices?chain=solana&ids=MINT1,MINT2&fiat=usd
```

### Swap Quote
```typescript
POST /v1/swap/quote
{
  "inputMint": "...",
  "outputMint": "...",
  "amount": "...",
  "chain": "solana",
  "slippageBps": 50
}
```

### Build Swap Transaction
```typescript
POST /v1/swap/build
{
  "userPublicKey": "...",
  "inputMint": "...",
  "outputMint": "...",
  "inputAmount": "...",
  "slippageBps": 50,
  "quoteResponse": { ... }
}
```

## 🔄 Flow การทำงาน

### Wallet Balances
1. `useWalletBalances` hook เรียก `getPortfolioFromApi()`
2. ถ้า `USE_WALLET_API=true` → เรียก backend API
3. ถ้า API ล้มเหลว → fallback ไปใช้ direct RPC (`getBalanceSol`, `getTokenBalances`)

### Transaction History
1. `App.tsx` เรียก `getHistoryFromApi()`
2. ถ้า `USE_WALLET_API=true` → เรียก backend API
3. ถ้า API ล้มเหลว → fallback ไปใช้ Helius API

### Prices
1. `useMockCoinPrices` hook เรียก `getTokenPricesApi()`
2. ถ้า `USE_WALLET_API=true` → เรียก backend API
3. ถ้า API ล้มเหลว → fallback ไปใช้ Jupiter/CoinGecko

### Swap
1. `ActionModals.tsx` เรียก `getSwapQuoteApi()` สำหรับ quote
2. `App.tsx` เรียก `buildSwapTransactionApi()` สำหรับ build transaction
3. ถ้า API ล้มเหลว → fallback ไปใช้ Jupiter API โดยตรง

## 🚀 การ Deploy

### Development
```bash
# Start backend API server
cd server
npm run dev

# Start frontend
npm run dev
```

### Production
1. Deploy backend API server (Vercel, Railway, etc.)
2. Set `VITE_WALLET_API_URL` ใน Vercel environment variables
3. Set `VITE_USE_WALLET_API=true` เพื่อเปิดใช้งาน

## 📝 Notes

- **Non-breaking**: การใช้ API เป็น optional - ระบบจะ fallback อัตโนมัติ
- **Type-safe**: ทุก API calls มี TypeScript types
- **Error handling**: มี error handling และ logging
- **Performance**: ใช้ caching จาก backend API

## 🔍 Debugging

เปิด console เพื่อดู logs:
- `🔍 Wallet API called` - API ถูกเรียก
- `⚠️ Wallet API failed, falling back` - API ล้มเหลว, ใช้ fallback
- `✅ Wallet API success` - API สำเร็จ

