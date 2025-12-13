use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub mod staking;
pub mod governance;
pub mod mining;

pub use staking::*;
pub use governance::*;
pub use mining::*;

declare_id!("JDHChaiN11111111111111111111111111111111111");

#[program]
pub mod jdh_chain {
    use super::*;

    // ========== Token Operations ==========

    // Initialize JDH Token Mint
    pub fn initialize_mint(_ctx: Context<InitializeMint>, decimals: u8) -> Result<()> {
        msg!("Initializing JDH Token Mint with {} decimals", decimals);
        Ok(())
    }

    // Mint JDH Tokens
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        msg!("Minting {} JDH tokens", amount);
        
        let seeds = &[
            b"mint-authority",
            ctx.accounts.mint.key().as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        Ok(())
    }

    // Transfer JDH Tokens
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        msg!("Transferring {} JDH tokens", amount);
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    // Burn JDH Tokens
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        msg!("Burning {} JDH tokens", amount);
        
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    // ========== Staking Operations ==========

    // Initialize Staking Pool
    pub fn initialize_staking_pool(
        ctx: Context<InitializeStakingPool>,
        apy: u16,
        min_stake: u64,
        lock_period: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.mint = ctx.accounts.mint.key();
        pool.total_staked = 0;
        pool.apy = apy;
        pool.min_stake = min_stake;
        pool.lock_period = lock_period;
        pool.pool_authority = ctx.accounts.pool_authority.key();
        pool.bump = ctx.bumps.pool;

        msg!("Initialized staking pool with {}% APY", apy as f64 / 100.0);
        Ok(())
    }

    // Stake JDH Tokens
    pub fn stake_tokens(ctx: Context<Stake>, amount: u64) -> Result<()> {
        staking::stake(ctx, amount)
    }

    // Unstake JDH Tokens
    pub fn unstake_tokens(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        staking::unstake(ctx, amount)
    }

    // Claim Staking Rewards
    pub fn claim_staking_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        staking::claim_rewards(ctx)
    }

    // ========== Governance Operations ==========

    // Create Governance Proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        id: u64,
        title: String,
        description: String,
        voting_duration: i64,
        min_voting_power: u64,
    ) -> Result<()> {
        governance::create_proposal(ctx, id, title, description, voting_duration, min_voting_power)
    }

    // Vote on Proposal
    pub fn vote_proposal(ctx: Context<Vote>, vote_type: VoteType, voting_power: u64) -> Result<()> {
        governance::vote(ctx, vote_type, voting_power)
    }

    // Execute Proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        governance::execute_proposal(ctx)
    }

    // ========== Mining Operations ==========

    // Initialize Mining Vault
    pub fn initialize_mining_vault(
        ctx: Context<InitializeVault>,
        entry_fee_cap: u64,
    ) -> Result<()> {
        mining::initialize_vault(ctx, entry_fee_cap)
    }

    // Deposit JDH into Mining Vault
    pub fn deposit_mining(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        mining::deposit(ctx, amount)
    }

    // Withdraw JDH from Mining Vault
    pub fn withdraw_mining(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        mining::withdraw(ctx, amount)
    }

    // Pay Entry Fee for Mining Session
    pub fn pay_mining_entry_fee(ctx: Context<PayEntryFee>, fee: u64) -> Result<()> {
        mining::pay_entry_fee(ctx, fee)
    }
}

// ========== Token Account Structs ==========

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ========== Staking Account Structs ==========

#[derive(Accounts)]
pub struct InitializeStakingPool<'info> {
    #[account(
        init,
        payer = pool_authority,
        space = StakingPool::LEN,
        seeds = [b"staking-pool", mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, StakingPool>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub pool_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Re-export staking, governance, and mining structs
pub use staking::{Stake, Unstake, ClaimRewards, StakingPool, UserStake, JdhChainError as StakingError};
pub use governance::{CreateProposal, Vote, ExecuteProposal, Proposal, Vote as VoteAccount, VoteType, JdhChainError as GovernanceError};
pub use mining::{InitializeVault, Deposit, Withdraw, PayEntryFee, MiningVault, UserMiningDeposit, MiningTier, MiningError};
