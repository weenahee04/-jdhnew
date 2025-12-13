// TypeScript Client for JDH Chain Solana Program
// Note: This client requires @coral-xyz/anchor package
// Install: npm install @coral-xyz/anchor
// After building the program, import IDL from target/types/jdh_chain.ts

import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// IDL will be generated after building the program
// import { IDL } from '../target/types/jdh_chain';

// Program ID (will be updated after deployment)
export const JDH_CHAIN_PROGRAM_ID = new PublicKey('JDHChaiN11111111111111111111111111111111111');

export interface JdhChainClientConfig {
  connection: Connection;
  wallet: Wallet;
  programId?: PublicKey;
}

export class JdhChainClient {
  private program: Program | null = null;
  private connection: Connection;
  private wallet: Wallet;

  constructor(config: JdhChainClientConfig) {
    this.connection = config.connection;
    this.wallet = config.wallet;
    
    // Note: Program will be initialized after IDL is generated
    // Uncomment after running: anchor build
    /*
    const provider = new AnchorProvider(
      config.connection,
      config.wallet,
      { commitment: 'confirmed' }
    );

    this.program = new Program(
      IDL as any,
      config.programId || JDH_CHAIN_PROGRAM_ID,
      provider
    );
    */
  }

  // Initialize program after IDL is generated
  initializeProgram(IDL: any) {
    const provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );

    this.program = new Program(
      IDL,
      JDH_CHAIN_PROGRAM_ID,
      provider
    );
  }

  // ========== Token Operations ==========

  /**
   * Mint JDH Tokens
   */
  async mintTokens(
    mint: PublicKey,
    to: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> {
    const amountRaw = Math.floor(amount * Math.pow(10, decimals));
    const toTokenAccount = await getAssociatedTokenAddress(mint, to);

    if (!this.program) throw new Error('Program not initialized. Call initializeProgram() first.');
    
    const tx = await this.program.methods
      .mintTokens(new BN(amountRaw))
      .accounts({
        mint,
        to: toTokenAccount,
        mintAuthority: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Transfer JDH Tokens
   */
  async transferTokens(
    from: PublicKey,
    to: PublicKey,
    mint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> {
    const amountRaw = Math.floor(amount * Math.pow(10, decimals));
    const fromTokenAccount = await getAssociatedTokenAddress(mint, from);
    const toTokenAccount = await getAssociatedTokenAddress(mint, to);

    const tx = await this.program.methods
      .transferTokens(new BN(amountRaw))
      .accounts({
        from: fromTokenAccount,
        to: toTokenAccount,
        authority: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Burn JDH Tokens
   */
  async burnTokens(
    mint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> {
    const amountRaw = Math.floor(amount * Math.pow(10, decimals));
    const fromTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .burnTokens(new BN(amountRaw))
      .accounts({
        mint,
        from: fromTokenAccount,
        authority: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // ========== Staking Operations ==========

  /**
   * Initialize Staking Pool
   */
  async initializeStakingPool(
    mint: PublicKey,
    apy: number, // e.g., 12.0 for 12%
    minStake: number,
    lockPeriod: number // in seconds
  ): Promise<string> {
    const apyBasisPoints = Math.floor(apy * 100); // Convert to basis points
    const minStakeRaw = Math.floor(minStake * Math.pow(10, 9)); // Assuming 9 decimals

    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking-pool'), mint.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeStakingPool(
        apyBasisPoints,
        new BN(minStakeRaw),
        new BN(lockPeriod)
      )
      .accounts({
        pool: poolPda,
        mint,
        poolAuthority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Stake JDH Tokens
   */
  async stakeTokens(
    pool: PublicKey,
    mint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> {
    const amountRaw = Math.floor(amount * Math.pow(10, decimals));
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking-pool'), mint.toBuffer()],
      this.program.programId
    );

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user-stake'),
        this.wallet.publicKey.toBuffer(),
        poolPda.toBuffer(),
      ],
      this.program.programId
    );

    // Get pool token account (need to derive or pass)
    const poolTokenAccount = await getAssociatedTokenAddress(
      mint,
      poolPda,
      true
    );

    const tx = await this.program.methods
      .stakeTokens(new BN(amountRaw))
      .accounts({
        pool: poolPda,
        userStake: userStakePda,
        userTokenAccount,
        poolTokenAccount,
        user: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Unstake JDH Tokens
   */
  async unstakeTokens(
    pool: PublicKey,
    mint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> {
    const amountRaw = Math.floor(amount * Math.pow(10, decimals));
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking-pool'), mint.toBuffer()],
      this.program.programId
    );

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user-stake'),
        this.wallet.publicKey.toBuffer(),
        poolPda.toBuffer(),
      ],
      this.program.programId
    );

    const poolTokenAccount = await getAssociatedTokenAddress(
      mint,
      poolPda,
      true
    );

    // Get rewards vault (need to derive or pass)
    const rewardsVault = await getAssociatedTokenAddress(
      mint,
      poolPda,
      true
    );

    const tx = await this.program.methods
      .unstakeTokens(new BN(amountRaw))
      .accounts({
        pool: poolPda,
        userStake: userStakePda,
        userTokenAccount,
        poolTokenAccount,
        rewardsVault,
        poolAuthority: poolPda,
        user: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim Staking Rewards
   */
  async claimStakingRewards(
    pool: PublicKey,
    mint: PublicKey
  ): Promise<string> {
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking-pool'), mint.toBuffer()],
      this.program.programId
    );

    const [userStakePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('user-stake'),
        this.wallet.publicKey.toBuffer(),
        poolPda.toBuffer(),
      ],
      this.program.programId
    );

    const rewardsVault = await getAssociatedTokenAddress(
      mint,
      poolPda,
      true
    );

    const tx = await this.program.methods
      .claimStakingRewards()
      .accounts({
        pool: poolPda,
        userStake: userStakePda,
        userTokenAccount,
        rewardsVault,
        poolAuthority: poolPda,
        user: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // ========== Governance Operations ==========

  /**
   * Create Governance Proposal
   */
  async createProposal(
    id: number,
    title: string,
    description: string,
    votingDuration: number, // in seconds
    minVotingPower: number
  ): Promise<string> {
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('proposal'),
        Buffer.from(id.toString().padStart(8, '0')),
      ],
      this.program.programId
    );

    const minVotingPowerRaw = Math.floor(minVotingPower * Math.pow(10, 9));

    const tx = await this.program.methods
      .createProposal(
        id,
        title,
        description,
        new BN(votingDuration),
        new BN(minVotingPowerRaw)
      )
      .accounts({
        proposal: proposalPda,
        proposer: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Vote on Proposal
   */
  async voteProposal(
    proposal: PublicKey,
    mint: PublicKey,
    voteType: 'For' | 'Against',
    votingPower: number,
    decimals: number = 9
  ): Promise<string> {
    const votingPowerRaw = Math.floor(votingPower * Math.pow(10, decimals));
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const [votePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('vote'),
        this.wallet.publicKey.toBuffer(),
        proposal.toBuffer(),
      ],
      this.program.programId
    );

    const voteTypeEnum = voteType === 'For' ? { for: {} } : { against: {} };

    const tx = await this.program.methods
      .voteProposal(voteTypeEnum, new BN(votingPowerRaw))
      .accounts({
        proposal,
        vote: votePda,
        userTokenAccount,
        voter: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Execute Proposal
   */
  async executeProposal(proposal: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .executeProposal()
      .accounts({
        proposal,
        executor: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }
}

