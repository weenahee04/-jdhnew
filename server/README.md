# JDH Wallet API

Production-ready Crypto Wallet API integration layer with support for Solana and EVM chains.

## Features

- ✅ **Multi-chain RPC** - Solana (Helius/public RPC) with fallback support
- ✅ **Transaction History** - Enriched transaction data via Helius or RPC fallback
- ✅ **Token Metadata** - Name, symbol, decimals, logos with verified token list
- ✅ **Real-time Pricing** - CoinGecko + Jupiter Price API with fallback chain
- ✅ **Swap Aggregation** - Jupiter for Solana (0x/1inch for EVM - optional)
- ✅ **Webhook Support** - Helius webhook handling for real-time notifications
- ✅ **Caching** - Redis with in-memory fallback, TTL-based with stale-while-revalidate
- ✅ **Reliability** - Retry with exponential backoff, circuit breaker, timeouts
- ✅ **Observability** - Structured logging with request IDs
- ✅ **Security** - Input validation, CORS, optional API key auth
- ✅ **Type Safety** - Full TypeScript with Zod validation

## Architecture

```
src/
├── config/          # Environment configuration with Zod validation
├── modules/
│   ├── rpc/         # RPC providers (Helius, public RPC)
│   ├── indexer/     # Transaction history (Helius, RPC fallback)
│   ├── metadata/    # Token metadata (Jupiter, verified tokens)
│   ├── pricing/     # Price providers (CoinGecko, Jupiter)
│   ├── swap/        # Swap aggregators (Jupiter)
│   ├── notify/      # Webhook handlers
│   ├── cache/       # Redis cache wrapper
│   └── common/      # Logger, retry, circuit breaker, timeout
├── routes/          # Fastify routes with validation
├── types/           # Shared TypeScript types
└── utils/           # Validation utilities
```

## Environment Variables

See `.env.example` for all available options. Key variables:

```bash
# Server
PORT=3001
NODE_ENV=development
API_KEY=your-api-key-here  # Optional, for API authentication

# Solana
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key
HELIUS_API_KEY=your-helius-api-key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Fallback
SOLANA_CLUSTER=mainnet-beta

# Pricing
COINGECKO_API_KEY=optional  # For higher rate limits

# Redis
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379

# Feature Flags
ENABLE_SWAP=true
ENABLE_NOTIFICATIONS=true
ENABLE_EVM=false
```

## Installation

```bash
cd server
pnpm install
```

## Development

```bash
pnpm dev
```

Server will start on `http://localhost:3001`

## Build

```bash
pnpm build
pnpm start
```

## Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## API Endpoints

### Portfolio

```http
GET /v1/portfolio?chain=solana&address=YOUR_ADDRESS
```

Returns complete portfolio with token balances and USD values.

### Transaction History

```http
GET /v1/history?chain=solana&address=YOUR_ADDRESS&limit=100&cursor=...
```

Returns paginated transaction history.

### Token Metadata

```http
GET /v1/token/meta?chain=solana&id=MINT_ADDRESS
```

Returns token name, symbol, decimals, logo, verified status.

### Prices

```http
GET /v1/prices?chain=solana&ids=MINT1,MINT2&fiat=usd
```

Returns real-time prices for multiple tokens.

### Swap Quote

```http
POST /v1/swap/quote
Content-Type: application/json

{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000",
  "chain": "solana",
  "slippageBps": 50
}
```

Returns swap quote with price impact.

### Build Swap Transaction

```http
POST /v1/swap/build
Content-Type: application/json

{
  "userPublicKey": "YOUR_PUBLIC_KEY",
  "inputMint": "...",
  "outputMint": "...",
  "inputAmount": "...",
  "slippageBps": 50,
  "quoteResponse": { ... }
}
```

Returns unsigned transaction for client to sign.

### Webhook Handler

```http
POST /v1/notify/webhook/helius
Content-Type: application/json

{ ... webhook payload ... }
```

Handles provider webhooks (Helius, etc.)

## Unified WalletData API

The `src/modules/walletData/index.ts` exports a unified interface:

```typescript
import {
  getPortfolio,
  getTokenBalances,
  getHistory,
  getTokenMeta,
  getPricesData,
  getSwapQuoteData,
  buildSwapTx,
} from './modules/walletData/index.js';

// Get complete portfolio
const portfolio = await getPortfolio(address, 'solana');

// Get transaction history
const history = await getHistory(address, 'solana', { limit: 100 });

// Get token metadata
const metadata = await getTokenMeta(mintAddress, 'solana');

// Get prices
const prices = await getPricesData([mint1, mint2], 'solana', 'usd');

// Get swap quote
const quote = await getSwapQuoteData(inputMint, outputMint, amount, 'solana');

// Build swap transaction
const tx = await buildSwapTx({
  userPublicKey,
  inputMint,
  outputMint,
  inputAmount,
  slippageBps: 50,
  quoteResponse: quote,
}, 'solana');
```

## Provider Abstraction

All providers implement interfaces and can be swapped:

- **RPC**: `HeliusRpcProvider` → `SolanaRpcProvider` (fallback)
- **Indexer**: `HeliusIndexerProvider` → `SolanaRpcIndexerProvider` (fallback)
- **Metadata**: `JupiterMetadataProvider` + verified tokens JSON
- **Pricing**: `CoinGeckoPricingProvider` → `JupiterPricingProvider` (fallback)

## Caching Strategy

- **Token Metadata**: 24h TTL
- **Prices**: 30-60s TTL
- **Portfolio/History**: 10-30s TTL
- **Cache Stampede Protection**: In-memory mutex per key
- **Stale-While-Revalidate**: Supported (background refresh)

## Error Handling

All endpoints return consistent error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": { ... }
}
```

## Security

- ✅ Input validation via Zod schemas
- ✅ Address format validation per chain
- ✅ Optional API key authentication
- ✅ CORS configuration
- ✅ Rate limiting (100 req/min default)
- ✅ Never logs or stores private keys/seeds

## Logging

Structured logging with request IDs:

```typescript
logger.info('Operation completed', { address, chain });
logger.error('Operation failed', error, { context });
```

## Testing

Unit tests for each module with mocked HTTP calls. Integration tests using Fastify inject.

## License

MIT

