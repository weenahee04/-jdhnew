# 🔨 JDH Bonded PoW Puzzle Mining System

## 📋 Overview

A comprehensive Bonded Proof of Work (PoW) Puzzle Mining system for JDH tokens that combines:
- **Anti-bot refundable deposits** - Users must deposit JDH to participate
- **Tiered access** - Mining tiers based on deposit amount
- **Entry fees** - Small capped fees routed to mining pool
- **Hashcash-style PoW** - Server-issued challenges with client-side solving
- **Real-time dashboard** - WebSocket/SSE for live stats
- **On-chain anchoring** - Merkle root commitments to Solana
- **Anti-abuse mechanisms** - Rate limits, cooldowns, daily caps, adaptive difficulty

---

## 🏗️ Architecture

### 1. Solana Program (`programs/jdh-chain/src/mining.rs`)

**Mining Vault:**
- Stores user deposits (refundable, no yield)
- Manages tiered access based on deposit amount
- Handles entry fee payments to pool authority
- Enforces withdrawal cooldowns (24 hours)

**Tiers:**
- **Bronze:** 0-999 JDH (1,000 points/day)
- **Silver:** 1,000-9,999 JDH (5,000 points/day)
- **Gold:** 10,000-99,999 JDH (25,000 points/day)
- **Platinum:** 100,000+ JDH (100,000 points/day)

### 2. Backend API (`api/mining/`)

**Endpoints:**
- `POST /api/mining/challenge` - Generate PoW challenge
- `POST /api/mining/verify` - Verify PoW solution
- `GET /api/mining/stats` - Get mining statistics
- `GET /api/mining/websocket` - Real-time stats (SSE)
- `POST /api/mining/commit` - Commit Merkle root to Solana

**Features:**
- Rate limiting (1 challenge per 10 seconds)
- Adaptive difficulty (mobile: 4 zeros, desktop: 6 zeros)
- Daily caps enforcement
- Full audit logging

### 3. Frontend (`components/MiningPage.tsx`)

**Features:**
- Real-time mining interface
- Web Worker for PoW solving (non-blocking)
- Live stats dashboard
- Leaderboard
- Latest Merkle commitment display

### 4. Merkle Tree (`lib/merkle.ts`)

**Features:**
- Merkle tree construction from mining events
- Proof generation for individual events
- Receipt verification
- Periodic on-chain commitments

---

## 🔐 Security Features

### Anti-Bot Measures
1. **Refundable Deposits** - Must deposit JDH to mine (anti-bot barrier)
2. **Rate Limiting** - Max 1 challenge per 10 seconds per wallet
3. **Cooldown Periods** - 24-hour cooldown for withdrawals
4. **Daily Caps** - Tier-based daily point limits
5. **Adaptive Difficulty** - Higher difficulty for desktop (prevents mobile bot advantage)
6. **One-Time Challenges** - Each challenge can only be used once
7. **Short Expiry** - Challenges expire after 1 minute

### Audit Logging
- All actions logged to `mining_audit_logs` table
- Includes: challenge generation, solution attempts, successes, failures
- Full traceability for abuse detection

---

## 📊 Database Schema

### Tables

1. **mining_points** - Daily points per wallet
2. **mining_audit_logs** - Full audit trail
3. **mining_sessions** - Active mining sessions
4. **merkle_commitments** - On-chain commitments
5. **mining_events** - Events for Merkle tree

See `supabase_mining_setup.sql` for full schema.

---

## 🚀 Setup Instructions

### 1. Database Setup

Run the SQL script in Supabase:
```sql
-- Run supabase_mining_setup.sql
```

### 2. Environment Variables

Add to Vercel:
```
MINING_COMMITMENT_KEYPAIR=<base58-encoded-keypair>
```

### 3. Deploy Solana Program

```bash
anchor build
anchor deploy
```

### 4. Initialize Mining Vault

Call `initialize_mining_vault` with entry fee cap.

---

## 💻 Usage

### Starting a Mining Session

1. **Deposit JDH** into Mining Vault (on-chain)
2. **Pay Entry Fee** (capped, routed to pool)
3. **Request Challenge** from `/api/mining/challenge`
4. **Solve PoW** - Find nonce where `sha256(seed+wallet+nonce+salt)` has required leading zeros
5. **Submit Solution** to `/api/mining/verify`
6. **Receive Points** - Awarded if solution valid and daily cap not reached

### PoW Algorithm

```
Input: seed + walletAddress + nonce + salt
Hash: sha256(input)
Check: hash starts with N leading zeros (difficulty)
```

**Example:**
- Difficulty: 4
- Target: `0000...`
- Client tries nonces until hash starts with `0000`

---

## 📈 Real-time Dashboard

### WebSocket/SSE Endpoint

Connect to `/api/mining/websocket` for real-time updates:
- Miners online (last 5 minutes)
- Network hashrate estimate
- Recent accepted solutions
- Leaderboard
- Latest Merkle commitment

### Stats Updates

Updates every 2 seconds with:
- Active miner count
- Hashrate estimate (solutions/hour)
- Recent activity feed
- Top 10 leaderboard

---

## 🔗 On-chain Anchoring

### Merkle Commitments

1. **Collect Events** - Gather uncommitted mining events (up to 100)
2. **Build Merkle Tree** - Create tree from events
3. **Generate Proofs** - Create Merkle proofs for each event
4. **Commit to Solana** - Store Merkle root on-chain
5. **Update Events** - Link events to commitment with proofs

### Receipt Verification

Users can verify their mining receipts:
```typescript
import { verifyMiningReceipt } from '@/lib/merkle';

const isValid = verifyMiningReceipt(
  event,
  proof,
  merkleRoot
);
```

---

## 🎯 Tier Benefits

| Tier | Deposit | Daily Cap | Priority | Badge |
|------|---------|-----------|----------|-------|
| Bronze | 0-999 JDH | 1,000 pts | Standard | 🥉 |
| Silver | 1K-9.9K JDH | 5,000 pts | Medium | 🥈 |
| Gold | 10K-99.9K JDH | 25,000 pts | High | 🥇 |
| Platinum | 100K+ JDH | 100,000 pts | Highest | 💎 |

**Note:** Tiers affect daily caps, priority, and badges only. **No PoW bypass** - all users must solve puzzles.

---

## 🔧 Configuration

### Entry Fee Cap
Set when initializing vault (e.g., 10 JDH max)

### Difficulty
- **Mobile:** 4 leading zeros (easier for battery)
- **Desktop:** 6 leading zeros (more secure)

### Daily Reset
Points reset at midnight UTC

### Withdrawal Cooldown
24 hours between withdrawals

---

## 📝 API Reference

### POST /api/mining/challenge

**Request:**
```json
{
  "walletAddress": "string",
  "userAgent": "string"
}
```

**Response:**
```json
{
  "challengeId": "string",
  "seed": "string",
  "salt": "string",
  "difficulty": 4,
  "expiresAt": 1234567890
}
```

### POST /api/mining/verify

**Request:**
```json
{
  "challengeId": "string",
  "walletAddress": "string",
  "nonce": "string",
  "solution": "string"
}
```

**Response:**
```json
{
  "success": true,
  "points": 10,
  "totalPoints": 150,
  "dailyCap": 1000
}
```

### GET /api/mining/stats

**Response:**
```json
{
  "minersOnline": 42,
  "hashrateEstimate": 5000,
  "leaderboard": [...],
  "recentAccepted": [...]
}
```

---

## 🐛 Troubleshooting

### Challenge Expired
- Challenges expire after 1 minute
- Request a new challenge if expired

### Daily Cap Reached
- Check your tier's daily cap
- Points reset at midnight UTC

### Withdrawal Cooldown
- Must wait 24 hours between withdrawals
- Check `last_withdrawal_at` timestamp

### Rate Limit
- Max 1 challenge per 10 seconds
- Wait before requesting new challenge

---

## 🔮 Future Enhancements

- [ ] Redis for challenge storage (scalability)
- [ ] WebSocket server (separate from Vercel)
- [ ] Mobile app optimization
- [ ] Mining pool rewards distribution
- [ ] Advanced anti-bot ML detection
- [ ] Multi-chain support

---

## 📄 License

Part of JDH Chain ecosystem.




