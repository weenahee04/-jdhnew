# Quick Start Guide

## Installation

```bash
cd server
npm install  # or pnpm install
```

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your API keys (optional - will work with mocked providers):
```bash
# Minimum required for Solana
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# OR
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional but recommended
HELIUS_API_KEY=your-key  # For enriched transaction history
COINGECKO_API_KEY=your-key  # For higher rate limits
REDIS_URL=redis://localhost:6379  # For caching
```

## Development

```bash
npm run dev
```

Server starts on `http://localhost:3001`

## Testing

```bash
npm test
```

## Production Build

```bash
npm run build
npm start
```

## API Examples

### Get Portfolio
```bash
curl "http://localhost:3001/v1/portfolio?chain=solana&address=YOUR_ADDRESS"
```

### Get Transaction History
```bash
curl "http://localhost:3001/v1/history?chain=solana&address=YOUR_ADDRESS&limit=100"
```

### Get Token Metadata
```bash
curl "http://localhost:3001/v1/token/meta?chain=solana&id=MINT_ADDRESS"
```

### Get Prices
```bash
curl "http://localhost:3001/v1/prices?chain=solana&ids=MINT1,MINT2&fiat=usd"
```

### Get Swap Quote
```bash
curl -X POST http://localhost:3001/v1/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "1000000000",
    "chain": "solana",
    "slippageBps": 50
  }'
```

## Health Check

```bash
curl http://localhost:3001/health
```

