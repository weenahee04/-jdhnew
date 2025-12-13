use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Mining Vault Account
#[account]
pub struct MiningVault {
    pub mint: Pubkey,                    // JDH Token mint
    pub total_deposited: u64,            // Total deposited amount
    pub pool_authority: Pubkey,           // Pool authority (receives entry fees)
    pub entry_fee_cap: u64,              // Maximum entry fee (in lamports)
    pub bump: u8,                        // Bump seed
}

// User Mining Deposit Account
#[account]
pub struct UserMiningDeposit {
    pub user: Pubkey,                    // User wallet
    pub deposit_amount: u64,             // Deposited JDH amount
    pub tier: MiningTier,                // Mining tier based on deposit
    pub deposited_at: i64,                // Timestamp when deposited
    pub last_withdrawal_at: i64,         // Last withdrawal timestamp (for cooldown)
    pub total_entry_fees_paid: u64,      // Total entry fees paid
    pub daily_points_earned: u64,        // Points earned today
    pub daily_points_cap: u64,           // Daily points cap based on tier
    pub last_daily_reset: i64,           // Last daily reset timestamp
    pub bump: u8,                        // Bump seed
}

// Mining Tier Enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MiningTier {
    Bronze,    // 0-999 JDH deposit
    Silver,    // 1000-9999 JDH deposit
    Gold,      // 10000-99999 JDH deposit
    Platinum, // 100000+ JDH deposit
}

impl MiningTier {
    pub fn from_deposit(amount: u64) -> Self {
        match amount {
            a if a >= 100_000 => MiningTier::Platinum,
            a if a >= 10_000 => MiningTier::Gold,
            a if a >= 1_000 => MiningTier::Silver,
            _ => MiningTier::Bronze,
        }
    }

    pub fn daily_cap(&self) -> u64 {
        match self {
            MiningTier::Bronze => 1000,      // 1000 points/day
            MiningTier::Silver => 5000,      // 5000 points/day
            MiningTier::Gold => 25000,      // 25000 points/day
            MiningTier::Platinum => 100000,  // 100000 points/day
        }
    }
}

impl MiningVault {
    pub const LEN: usize = 8 + 32 + 8 + 32 + 8 + 1;
}

impl UserMiningDeposit {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 1;
}

// Initialize Mining Vault
pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    entry_fee_cap: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.mint = ctx.accounts.mint.key();
    vault.total_deposited = 0;
    vault.pool_authority = ctx.accounts.pool_authority.key();
    vault.entry_fee_cap = entry_fee_cap;
    vault.bump = ctx.bumps.vault;

    msg!("Initialized Mining Vault with entry fee cap: {}", entry_fee_cap);
    Ok(())
}

// Deposit JDH into Mining Vault
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user_deposit = &mut ctx.accounts.user_deposit;
    let clock = Clock::get()?;

    // Transfer tokens to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update or create user deposit
    if user_deposit.deposit_amount == 0 {
        // First deposit - account was just initialized
        user_deposit.user = ctx.accounts.user.key();
        user_deposit.deposited_at = clock.unix_timestamp;
        user_deposit.last_withdrawal_at = 0;
        user_deposit.total_entry_fees_paid = 0;
        user_deposit.daily_points_earned = 0;
        user_deposit.last_daily_reset = clock.unix_timestamp;
        user_deposit.bump = ctx.bumps.user_deposit;
    }

    user_deposit.deposit_amount += amount;
    
    // Update tier based on total deposit
    user_deposit.tier = MiningTier::from_deposit(user_deposit.deposit_amount);
    user_deposit.daily_points_cap = user_deposit.tier.daily_cap();

    vault.total_deposited += amount;

    msg!("Deposited {} JDH, new tier: {:?}", amount, user_deposit.tier);
    Ok(())
}

// Withdraw JDH from Mining Vault (with cooldown)
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user_deposit = &mut ctx.accounts.user_deposit;
    let clock = Clock::get()?;

    // Check if user has enough deposit
    require!(
        user_deposit.deposit_amount >= amount,
        MiningError::InsufficientDeposit
    );

    // Check cooldown (24 hours)
    const WITHDRAWAL_COOLDOWN: i64 = 24 * 60 * 60; // 24 hours in seconds
    require!(
        clock.unix_timestamp >= user_deposit.last_withdrawal_at + WITHDRAWAL_COOLDOWN,
        MiningError::WithdrawalCooldown
    );

    // Transfer tokens back to user
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: vault.to_account_info(),
            },
            &[&[
                b"mining-vault",
                vault.mint.as_ref(),
                &[vault.bump],
            ]],
        ),
        amount,
    )?;

    user_deposit.deposit_amount -= amount;
    user_deposit.last_withdrawal_at = clock.unix_timestamp;

    // Update tier if deposit changed
    user_deposit.tier = MiningTier::from_deposit(user_deposit.deposit_amount);
    user_deposit.daily_points_cap = user_deposit.tier.daily_cap();

    vault.total_deposited -= amount;

    msg!("Withdrew {} JDH", amount);
    Ok(())
}

// Pay Entry Fee (called when starting mining session)
pub fn pay_entry_fee(ctx: Context<PayEntryFee>, fee: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let user_deposit = &mut ctx.accounts.user_deposit;

    // Check entry fee cap
    require!(
        fee <= vault.entry_fee_cap,
        MiningError::EntryFeeExceedsCap
    );

    // Transfer entry fee to pool authority
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        fee,
    )?;

    user_deposit.total_entry_fees_paid += fee;

    msg!("Paid entry fee: {} JDH", fee);
    Ok(())
}

// Account Structs

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = pool_authority,
        space = MiningVault::LEN,
        seeds = [b"mining-vault", mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, MiningVault>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub pool_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, MiningVault>,
    #[account(
        init_if_needed,
        payer = user,
        space = UserMiningDeposit::LEN,
        seeds = [b"user-mining-deposit", user.key().as_ref()],
        bump
    )]
    pub user_deposit: Account<'info, UserMiningDeposit>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_account.owner == vault.key())]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, MiningVault>,
    #[account(
        mut,
        has_one = user,
        seeds = [b"user-mining-deposit", user.key().as_ref()],
        bump
    )]
    pub user_deposit: Account<'info, UserMiningDeposit>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = vault_token_account.owner == vault.key())]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PayEntryFee<'info> {
    #[account(mut)]
    pub vault: Account<'info, MiningVault>,
    #[account(
        mut,
        has_one = user,
        seeds = [b"user-mining-deposit", user.key().as_ref()],
        bump
    )]
    pub user_deposit: Account<'info, UserMiningDeposit>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = user_token_account.owner == user.key())]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = pool_token_account.owner == vault.pool_authority)]
    pub pool_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// Error Codes
#[error_code]
pub enum MiningError {
    #[msg("Insufficient deposit amount")]
    InsufficientDeposit,
    #[msg("Withdrawal cooldown not expired")]
    WithdrawalCooldown,
    #[msg("Entry fee exceeds cap")]
    EntryFeeExceedsCap,
}



