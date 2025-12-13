# 🚀 JDH Chain Solana Program Setup Guide

## 📋 Overview

คู่มือการตั้งค่าและพัฒนา Solana Program สำหรับ JDH Chain

## 🔧 Prerequisites

### 1. ติดตั้ง Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. ติดตั้ง Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### 3. ติดตั้ง Anchor Framework
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 4. ติดตั้ง Node.js Dependencies
```bash
npm install -g @coral-xyz/anchor-cli
```

## 📁 Project Structure

```
programs/
  jdh-chain/
    src/
      lib.rs          # Main program entry point
      staking.rs      # Staking functionality
      governance.rs   # Governance voting
    Cargo.toml        # Rust dependencies
Anchor.toml           # Anchor configuration
```

## 🎯 Features

### 1. Token Operations
- ✅ Initialize JDH Token Mint
- ✅ Mint JDH Tokens
- ✅ Transfer JDH Tokens
- ✅ Burn JDH Tokens

### 2. Staking
- ✅ Initialize Staking Pool
- ✅ Stake JDH Tokens
- ✅ Unstake JDH Tokens
- ✅ Claim Staking Rewards
- ✅ APY-based rewards calculation
- ✅ Lock period support

### 3. Governance
- ✅ Create Proposals
- ✅ Vote on Proposals
- ✅ Execute Proposals
- ✅ Voting power based on JDH balance

## 🚀 Development Commands

### Build Program
```bash
anchor build
```

### Test Program
```bash
anchor test
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
anchor deploy --provider.cluster mainnet-beta
```

## 📝 Next Steps

1. **Build Program**
   ```bash
   anchor build
   ```

2. **Generate TypeScript Types**
   ```bash
   anchor build
   # Types will be generated in target/types/
   ```

3. **Create Frontend Integration**
   - Import generated IDL
   - Create client functions
   - Integrate with existing wallet

4. **Deploy to Devnet**
   ```bash
   solana config set --url devnet
   anchor deploy
   ```

5. **Deploy to Mainnet**
   ```bash
   solana config set --url mainnet-beta
   anchor deploy
   ```

## ⚠️ Important Notes

- **Program ID:** `JDHChaiN111111111111111111111111111111111` (placeholder - will be generated on deploy)
- **Security:** Always audit code before deploying to mainnet
- **Testing:** Test thoroughly on devnet before mainnet deployment
- **Costs:** Deploying to mainnet costs ~2-3 SOL

## 🔗 Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Library](https://spl.solana.com/)



