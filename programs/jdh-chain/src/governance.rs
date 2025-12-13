use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

// Governance Proposal
#[account]
pub struct Proposal {
    pub id: u64,                    // Proposal ID
    pub title: String,              // Proposal title
    pub description: String,         // Proposal description
    pub proposer: Pubkey,           // Who created the proposal
    pub votes_for: u64,             // Votes in favor
    pub votes_against: u64,         // Votes against
    pub total_votes: u64,          // Total votes
    pub created_at: i64,            // Creation timestamp
    pub voting_ends_at: i64,        // Voting deadline
    pub executed: bool,             // Whether proposal was executed
    pub min_voting_power: u64,      // Minimum voting power required
    pub bump: u8,                   // Bump seed
}

// User Vote
#[account]
pub struct Vote {
    pub user: Pubkey,               // Voter
    pub proposal: Pubkey,           // Proposal being voted on
    pub vote_type: VoteType,        // For or Against
    pub voting_power: u64,           // Amount of JDH used for voting
    pub voted_at: i64,              // Vote timestamp
    pub bump: u8,                   // Bump seed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum VoteType {
    For,
    Against,
}

impl Proposal {
    pub const MAX_TITLE_LEN: usize = 100;
    pub const MAX_DESCRIPTION_LEN: usize = 1000;
    pub const LEN: usize = 8 + 8 + 4 + Proposal::MAX_TITLE_LEN + 4 + Proposal::MAX_DESCRIPTION_LEN 
        + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}

impl Vote {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 8 + 1;
}

// Create Proposal
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    id: u64,
    title: String,
    description: String,
    voting_duration: i64,
    min_voting_power: u64,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    require!(
        title.len() <= Proposal::MAX_TITLE_LEN,
        JdhChainError::TitleTooLong
    );
    require!(
        description.len() <= Proposal::MAX_DESCRIPTION_LEN,
        JdhChainError::DescriptionTooLong
    );

    proposal.id = id;
    proposal.title = title;
    proposal.description = description;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.total_votes = 0;
    proposal.created_at = clock.unix_timestamp;
    proposal.voting_ends_at = clock.unix_timestamp + voting_duration;
    proposal.executed = false;
    proposal.min_voting_power = min_voting_power;
    proposal.bump = ctx.bumps.proposal;

    msg!("Created proposal #{}: {}", id, proposal.title);
    Ok(())
}

// Vote on Proposal
pub fn vote(ctx: Context<Vote>, vote_type: VoteType, voting_power: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote_account = &mut ctx.accounts.vote;
    let clock = Clock::get()?;

    // Check if voting is still open
    require!(
        clock.unix_timestamp < proposal.voting_ends_at,
        JdhChainError::VotingClosed
    );

    // Check if user has already voted
    require!(
        vote_account.voting_power == 0,
        JdhChainError::AlreadyVoted
    );

    // Check user's JDH balance (voting power)
    let user_balance = ctx.accounts.user_token_account.amount;
    require!(
        user_balance >= voting_power,
        JdhChainError::InsufficientVotingPower
    );

    // Record vote
    vote_account.user = ctx.accounts.voter.key();
    vote_account.proposal = proposal.key();
    vote_account.vote_type = vote_type;
    vote_account.voting_power = voting_power;
    vote_account.voted_at = clock.unix_timestamp;
    vote_account.bump = ctx.bumps.vote;

    // Update proposal votes
    match vote_type {
        VoteType::For => proposal.votes_for += voting_power,
        VoteType::Against => proposal.votes_against += voting_power,
    }
    proposal.total_votes += voting_power;

    msg!("Vote recorded: {:?} with {} voting power", vote_type, voting_power);
    Ok(())
}

// Execute Proposal (if passed)
pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // Check if voting has ended
    require!(
        clock.unix_timestamp >= proposal.voting_ends_at,
        JdhChainError::VotingStillOpen
    );

    // Check if already executed
    require!(
        !proposal.executed,
        JdhChainError::ProposalAlreadyExecuted
    );

    // Check if proposal passed (more votes for than against)
    require!(
        proposal.votes_for > proposal.votes_against,
        JdhChainError::ProposalNotPassed
    );

    // Check if minimum voting power was met
    require!(
        proposal.total_votes >= proposal.min_voting_power,
        JdhChainError::InsufficientVotingPower
    );

    proposal.executed = true;

    msg!("Proposal #{} executed successfully", proposal.id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        payer = voter,
        space = Vote::LEN,
        seeds = [b"vote", voter.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub executor: Signer<'info>,
}

#[error_code]
pub enum JdhChainError {
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Voting is closed")]
    VotingClosed,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    #[msg("Voting is still open")]
    VotingStillOpen,
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    #[msg("Proposal did not pass")]
    ProposalNotPassed,
}
