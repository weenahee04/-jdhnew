# 🚀 JDH Chain Solana Program

## 📋 Overview

Solana Program สำหรับ JDH Chain ที่รองรับ:
- ✅ Token Operations (Mint, Transfer, Burn)
- ✅ Staking with APY rewards
- ✅ Governance voting

## 🔧 Setup

### 1. ติดตั้ง Dependencies

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor Framework
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Build Program

```bash
anchor build
```

### 3. Deploy to Devnet

```bash
solana config set --url devnet
anchor deploy
```

## 📁 Project Structure

```
programs/jdh-chain/
  src/
    lib.rs          # Main program
    staking.rs      # Staking logic
    governance.rs   # Governance logic
  Cargo.toml        # Dependencies

clients/
  jdhChainClient.ts # TypeScript client

Anchor.toml         # Anchor config
```

## 🎯 Features

### Token Operations
- `initialize_mint` - Initialize JDH token mint
- `mint_tokens` - Mint new JDH tokens
- `transfer_tokens` - Transfer JDH tokens
- `burn_tokens` - Burn JDH tokens

### Staking
- `initialize_staking_pool` - Create staking pool
- `stake_tokens` - Stake JDH tokens
- `unstake_tokens` - Unstake JDH tokens
- `claim_staking_rewards` - Claim staking rewards

### Governance
- `create_proposal` - Create governance proposal
- `vote_proposal` - Vote on proposal
- `execute_proposal` - Execute passed proposal

## 📝 Next Steps

1. Build และ test program
2. Deploy to devnet
3. Integrate กับ frontend
4. Deploy to mainnet

## ⚠️ Important

- Program ID จะถูก generate เมื่อ deploy
- ต้อง update `JDH_CHAIN_PROGRAM_ID` ใน client หลัง deploy
- Test thoroughly บน devnet ก่อน mainnet




