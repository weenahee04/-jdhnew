use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Staking Pool Account
#[account]
pub struct StakingPool {
    pub mint: Pubkey,           // JDH Token mint
    pub total_staked: u64,      // Total staked amount
    pub apy: u16,               // APY in basis points (e.g., 1200 = 12%)
    pub min_stake: u64,         // Minimum stake amount
    pub lock_period: i64,       // Lock period in seconds
    pub pool_authority: Pubkey,  // Pool authority
    pub bump: u8,               // Bump seed
}

// User Staking Account
#[account]
pub struct UserStake {
    pub user: Pubkey,           // User wallet
    pub pool: Pubkey,           // Staking pool
    pub amount: u64,             // Staked amount
    pub staked_at: i64,         // Timestamp when staked
    pub lock_until: i64,        // Timestamp when lock expires
    pub rewards_earned: u64,    // Total rewards earned
    pub bump: u8,               // Bump seed
}

impl StakingPool {
    pub const LEN: usize = 8 + 32 + 8 + 2 + 8 + 8 + 32 + 1;
}

impl UserStake {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

// Stake JDH Tokens
pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let user_stake = &mut ctx.accounts.user_stake;

    // Check minimum stake
    require!(
        amount >= pool.min_stake,
        JdhChainError::InsufficientStakeAmount
    );

    // Transfer tokens to staking pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update user stake
    let clock = Clock::get()?;
    if user_stake.amount == 0 {
        // First time staking
        user_stake.user = ctx.accounts.user.key();
        user_stake.pool = pool.key();
        user_stake.staked_at = clock.unix_timestamp;
        user_stake.lock_until = clock.unix_timestamp + pool.lock_period;
    } else {
        // Additional stake
        user_stake.lock_until = clock.unix_timestamp + pool.lock_period;
    }

    user_stake.amount += amount;
    pool.total_staked += amount;

    msg!("Staked {} JDH tokens", amount);
    Ok(())
}

// Unstake JDH Tokens
pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let user_stake = &mut ctx.accounts.user_stake;

    // Check if user has enough staked
    require!(
        user_stake.amount >= amount,
        JdhChainError::InsufficientStakedAmount
    );

    // Check lock period
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= user_stake.lock_until,
        JdhChainError::LockPeriodNotExpired
    );

    // Calculate and distribute rewards
    let rewards = calculate_rewards(user_stake, pool, &clock)?;
    
    if rewards > 0 {
        // Transfer rewards
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.rewards_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                &[&[
                    b"pool-authority",
                    pool.key().as_ref(),
                    &[pool.bump],
                ]],
            ),
            rewards,
        )?;

        user_stake.rewards_earned += rewards;
    }

    // Transfer staked tokens back
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&[
                b"pool-authority",
                pool.key().as_ref(),
                &[pool.bump],
            ]],
        ),
        amount,
    )?;

    user_stake.amount -= amount;
    pool.total_staked -= amount;

    msg!("Unstaked {} JDH tokens, earned {} rewards", amount, rewards);
    Ok(())
}

// Claim Rewards
pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let pool = &ctx.accounts.pool;
    let user_stake = &mut ctx.accounts.user_stake;

    let clock = Clock::get()?;
    let rewards = calculate_rewards(user_stake, pool, &clock)?;

    require!(rewards > 0, JdhChainError::NoRewardsAvailable);

    // Transfer rewards
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.rewards_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[&[
                b"pool-authority",
                pool.key().as_ref(),
                &[pool.bump],
            ]],
        ),
        rewards,
    )?;

    user_stake.rewards_earned += rewards;
    user_stake.staked_at = clock.unix_timestamp; // Reset for next period

    msg!("Claimed {} JDH rewards", rewards);
    Ok(())
}

// Calculate rewards based on APY and time staked
fn calculate_rewards(
    user_stake: &UserStake,
    pool: &StakingPool,
    clock: &Clock,
) -> Result<u64> {
    let time_staked = clock.unix_timestamp - user_stake.staked_at;
    let seconds_per_year = 365 * 24 * 60 * 60;
    
    // Calculate: amount * (APY / 10000) * (time_staked / seconds_per_year)
    let apy_decimal = pool.apy as u128;
    let amount = user_stake.amount as u128;
    let time = time_staked as u128;
    let seconds = seconds_per_year as u128;
    
    let rewards = (amount * apy_decimal * time) / (10000 * seconds);
    
    Ok(rewards as u64)
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        init_if_needed,
        payer = user,
        space = UserStake::LEN,
        seeds = [b"user-stake", user.key().as_ref(), pool.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [b"user-stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"staking-pool", pool.mint.as_ref()],
        bump = pool.bump
    )]
    pub pool_authority: Account<'info, StakingPool>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [b"user-stake", user.key().as_ref(), pool.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"staking-pool", pool.mint.as_ref()],
        bump = pool.bump
    )]
    pub pool_authority: Account<'info, StakingPool>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum JdhChainError {
    #[msg("Insufficient stake amount")]
    InsufficientStakeAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
    #[msg("Lock period has not expired")]
    LockPeriodNotExpired,
    #[msg("No rewards available")]
    NoRewardsAvailable,
}
