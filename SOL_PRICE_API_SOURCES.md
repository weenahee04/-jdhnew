# แหล่ง API สำหรับดึงราคา SOL (Solana)

## 📊 API ที่ใช้อยู่ตอนนี้

### 1. **Jupiter Price API** (ใช้อยู่ตอนนี้) ⭐
- **URL:** `https://price.jup.ag/v4/price`
- **Mint Address:** `So11111111111111111111111111111111111111112`
- **Method:** GET หรือ POST
- **ตัวอย่าง:**
  ```typescript
  // GET Request
  GET https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112
  
  // POST Request
  POST https://price.jup.ag/v4/price
  Body: { "ids": ["So11111111111111111111111111111111111111112"] }
  ```
- **Response:**
  ```json
  {
    "data": {
      "So11111111111111111111111111111111111111112": {
        "id": "So11111111111111111111111111111111111111112",
        "symbol": "SOL",
        "name": "Solana",
        "price": 150.25,
        "priceChange24h": 2.5,
        "decimals": 9
      }
    }
  }
  ```
- **ข้อดี:**
  - ✅ ฟรี ไม่ต้อง API Key
  - ✅ Real-time price
  - ✅ รองรับ Solana tokens ทั้งหมด
  - ✅ มี price change 24h
- **ข้อเสีย:**
  - ⚠️ อาจมี rate limit
  - ⚠️ บางครั้งอาจ timeout

---

## 🔄 API อื่นๆ ที่สามารถใช้ได้

### 2. **CoinGecko API** (แนะนำ) ⭐⭐⭐
- **URL:** `https://api.coingecko.com/api/v3/simple/price`
- **Coin ID:** `solana`
- **Method:** GET
- **ตัวอย่าง:**
  ```typescript
  GET https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true
  ```
- **Response:**
  ```json
  {
    "solana": {
      "usd": 150.25,
      "usd_24h_change": 2.5
    }
  }
  ```
- **ข้อดี:**
  - ✅ ฟรี (มี rate limit)
  - ✅ ข้อมูลครบถ้วน
  - ✅ มี historical data
  - ✅ รองรับหลายสกุลเงิน
- **ข้อเสีย:**
  - ⚠️ Rate limit: 10-50 calls/minute (free tier)
  - ⚠️ ต้องใช้ Coin ID (`solana`) ไม่ใช่ mint address

---

### 3. **Binance API** (แนะนำสำหรับ real-time) ⭐⭐⭐
- **URL:** `https://api.binance.com/api/v3/ticker/price`
- **Symbol:** `SOLUSDT`
- **Method:** GET
- **ตัวอย่าง:**
  ```typescript
  GET https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT
  ```
- **Response:**
  ```json
  {
    "symbol": "SOLUSDT",
    "price": "150.25000000"
  }
  ```
- **24h Change:**
  ```typescript
  GET https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT
  ```
- **ข้อดี:**
  - ✅ Real-time จาก exchange จริง
  - ✅ ฟรี ไม่ต้อง API Key
  - ✅ Rate limit สูง
  - ✅ มี volume, high, low
- **ข้อเสีย:**
  - ⚠️ ราคาเป็น USD เท่านั้น
  - ⚠️ ต้องแปลงเป็น THB เอง

---

### 4. **CoinMarketCap API** (ต้อง API Key) ⭐⭐
- **URL:** `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`
- **Symbol:** `SOL`
- **Method:** GET
- **Headers:** `X-CMC_PRO_API_KEY: your-api-key`
- **ตัวอย่าง:**
  ```typescript
  GET https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL&convert=USD
  ```
- **ข้อดี:**
  - ✅ ข้อมูลครบถ้วน
  - ✅ มี market cap, volume
- **ข้อเสีย:**
  - ❌ ต้องสมัคร API Key
  - ❌ Free tier มี rate limit ต่ำ

---

### 5. **DEXScreener API** (สำหรับ Solana tokens) ⭐⭐
- **URL:** `https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112`
- **Method:** GET
- **ตัวอย่าง:**
  ```typescript
  GET https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112
  ```
- **Response:**
  ```json
  {
    "pairs": [{
      "priceUsd": "150.25",
      "priceChange": {
        "h24": 2.5
      }
    }]
  }
  ```
- **ข้อดี:**
  - ✅ ฟรี
  - ✅ รองรับ Solana tokens
- **ข้อเสีย:**
  - ⚠️ อาจไม่มีข้อมูล SOL โดยตรง (SOL ไม่ใช่ token)

---

## 💡 แนะนำการใช้งาน

### Option 1: ใช้ Jupiter (ปัจจุบัน) + CoinGecko (fallback)
```typescript
// 1. ลอง Jupiter ก่อน
const jupiterPrice = await getJupiterPrice('So11111111111111111111111111111111111111112');

// 2. ถ้า Jupiter fail ใช้ CoinGecko
if (!jupiterPrice) {
  const coinGeckoPrice = await getCoinGeckoPrice('solana');
}
```

### Option 2: ใช้ CoinGecko เป็นหลัก (แนะนำ)
```typescript
// CoinGecko มีข้อมูลครบถ้วนและเสถียรกว่า
const solPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true')
  .then(res => res.json())
  .then(data => data.solana);
```

### Option 3: ใช้ Binance สำหรับ real-time
```typescript
// Binance ให้ราคา real-time จาก exchange
const solPrice = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT')
  .then(res => res.json())
  .then(data => parseFloat(data.price));
```

---

## 📝 ตัวอย่างโค้ดสำหรับเพิ่ม CoinGecko Fallback

```typescript
// services/priceService.ts

// เพิ่มฟังก์ชันดึงราคา SOL จาก CoinGecko
export const getSOLPriceFromCoinGecko = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
      {
        signal: AbortSignal.timeout(5000),
        mode: 'cors',
      }
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.solana?.usd || 0;
  } catch (error) {
    return 0;
  }
};

// เพิ่มฟังก์ชันดึงราคา SOL จาก Binance
export const getSOLPriceFromBinance = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT',
      {
        signal: AbortSignal.timeout(5000),
        mode: 'cors',
      }
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return parseFloat(data.price) || 0;
  } catch (error) {
    return 0;
  }
};

// ใช้หลายแหล่งข้อมูล (fallback chain)
export const getSOLPriceWithFallback = async (): Promise<{ price: number; source: string }> => {
  // 1. ลอง Jupiter ก่อน
  const jupiterPrice = await getTokenPrices([TOKEN_MINTS.SOL]);
  if (jupiterPrice[TOKEN_MINTS.SOL]?.price > 0) {
    return { price: jupiterPrice[TOKEN_MINTS.SOL].price, source: 'jupiter' };
  }
  
  // 2. ลอง CoinGecko
  const coinGeckoPrice = await getSOLPriceFromCoinGecko();
  if (coinGeckoPrice > 0) {
    return { price: coinGeckoPrice, source: 'coingecko' };
  }
  
  // 3. ลอง Binance
  const binancePrice = await getSOLPriceFromBinance();
  if (binancePrice > 0) {
    return { price: binancePrice, source: 'binance' };
  }
  
  return { price: 0, source: 'none' };
};
```

---

## 🎯 สรุป

| API | ฟรี | Rate Limit | Real-time | ข้อมูลครบ | แนะนำ |
|-----|-----|------------|-----------|-----------|-------|
| **Jupiter** | ✅ | สูง | ✅ | ⚠️ | ⭐⭐ |
| **CoinGecko** | ✅ | 10-50/min | ✅ | ✅ | ⭐⭐⭐ |
| **Binance** | ✅ | สูงมาก | ✅ | ⚠️ | ⭐⭐⭐ |
| **CoinMarketCap** | ❌ | ต่ำ | ✅ | ✅ | ⭐⭐ |
| **DEXScreener** | ✅ | สูง | ✅ | ⚠️ | ⭐ |

**แนะนำ:** ใช้ **CoinGecko** เป็นหลัก + **Binance** เป็น fallback สำหรับ real-time price

---

## 📚 เอกสารเพิ่มเติม

- [Jupiter Price API Docs](https://station.jup.ag/docs/apis/price-api)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [Binance API Docs](https://binance-docs.github.io/apidocs/spot/en/#symbol-price-ticker)
- [CoinMarketCap API Docs](https://coinmarketcap.com/api/documentation/v1/)

