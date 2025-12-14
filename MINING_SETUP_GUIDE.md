# 🚀 JDH Mining System - Setup Guide

## 📋 Quick Start

### 1. Database Setup

Run the SQL script in Supabase:
```sql
-- Execute supabase_mining_setup.sql
```

This creates:
- `mining_points` - Daily points tracking
- `mining_audit_logs` - Full audit trail
- `mining_sessions` - Active sessions
- `merkle_commitments` - On-chain commitments
- `mining_events` - Events for Merkle tree

### 2. Environment Variables

Add to Vercel:
```
MINING_COMMITMENT_KEYPAIR=<base58-encoded-keypair-for-commits>
```

Generate keypair:
```bash
solana-keygen new --outfile mining-commitment.json
# Then base58 encode the secret key
```

### 3. Deploy Solana Program

```bash
anchor build
anchor deploy
```

### 4. Initialize Mining Vault

Call `initialize_mining_vault` with:
- `entry_fee_cap`: Maximum entry fee (e.g., 10 JDH)

### 5. Access Mining Page

Navigate to Mining tab in the app sidebar.

---

## 🔧 Configuration

### Entry Fee Cap
Set when initializing vault (recommended: 1-10 JDH)

### Difficulty Settings
- Mobile: 4 leading zeros
- Desktop: 6 leading zeros

### Daily Caps
- Bronze: 1,000 points/day
- Silver: 5,000 points/day
- Gold: 25,000 points/day
- Platinum: 100,000 points/day

### Withdrawal Cooldown
24 hours between withdrawals

---

## 📊 Monitoring

### Real-time Stats
- Connect to `/api/mining/websocket` (SSE)
- Updates every 2 seconds

### Database Queries

**Active Miners:**
```sql
SELECT DISTINCT wallet_address 
FROM mining_audit_logs 
WHERE action = 'solution_accepted' 
AND created_at > NOW() - INTERVAL '5 minutes';
```

**Daily Points:**
```sql
SELECT wallet_address, points 
FROM mining_points 
WHERE date = CURRENT_DATE 
ORDER BY points DESC;
```

**Hashrate Estimate:**
```sql
SELECT COUNT(*) * 12 as solutions_per_hour
FROM mining_audit_logs
WHERE action = 'solution_accepted'
AND created_at > NOW() - INTERVAL '5 minutes';
```

---

## 🔐 Security Checklist

- [ ] Rate limiting enabled (1 challenge per 10 seconds)
- [ ] Challenge expiry set (1 minute)
- [ ] Daily caps enforced
- [ ] Withdrawal cooldown enforced (24 hours)
- [ ] Audit logging enabled
- [ ] Merkle commitments scheduled (every 100 events or hourly)
- [ ] Entry fee cap set appropriately

---

## 🐛 Troubleshooting

### Challenges Not Generating
- Check rate limits in `mining_audit_logs`
- Verify Supabase connection
- Check challenge expiry times

### Solutions Not Verifying
- Verify challenge hasn't expired
- Check difficulty requirement
- Ensure solution hash is correct

### Daily Cap Issues
- Check user tier from on-chain deposit
- Verify daily reset (midnight UTC)
- Check `mining_points` table

---

## 📈 Performance

### Expected Hashrates
- Mobile: ~100-500 H/s
- Desktop: ~1,000-10,000 H/s
- Network: Varies by active miners

### Scaling
- Use Redis for challenge storage (production)
- Deploy WebSocket server separately
- Consider CDN for static assets

---

## 🔮 Next Steps

1. Deploy to production
2. Monitor performance
3. Adjust difficulty if needed
4. Set up Merkle commitment schedule
5. Configure entry fee distribution

---

**Ready to mine!** 🎉




