import { Connection, PublicKey } from '@solana/web3.js';
import { getEnv } from '../../../config/env.js';
import { logger } from '../../common/logger.js';
import { withRetry, withTimeout } from '../../common/index.js';
import type { RpcProvider } from '../interfaces.js';

export class HeliusRpcProvider implements RpcProvider {
  chain = 'solana' as const;
  private connection: Connection | null = null;

  constructor() {
    const env = getEnv();
    if (env.HELIUS_RPC_URL) {
      try {
        this.connection = new Connection(env.HELIUS_RPC_URL, 'confirmed');
        logger.info('Helius RPC provider initialized');
      } catch (error) {
        logger.error('Failed to initialize Helius RPC', error);
      }
    }
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  async getBalance(address: string): Promise<string> {
    if (!this.connection) {
      throw new Error('Helius RPC not configured');
    }

    return withRetry(
      () =>
        withTimeout(
          this.connection!.getBalance(new PublicKey(address)).then((balance) => balance.toString()),
          10000,
          'Balance fetch timeout'
        ),
      {
        maxAttempts: 3,
        retryable: (error) => !error.message.includes('Invalid public key'),
      }
    );
  }

  async getTokenBalances(address: string): Promise<Array<{ mint: string; amount: string; decimals: number }>> {
    if (!this.connection) {
      throw new Error('Helius RPC not configured');
    }

    return withRetry(
      async () => {
        const pubkey = new PublicKey(address);
        const tokenAccounts = await withTimeout(
          this.connection!.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }),
          15000,
          'Token balances fetch timeout'
        );

        return tokenAccounts.value.map((account) => {
          const parsed = account.account.data.parsed.info;
          return {
            mint: parsed.mint,
            amount: parsed.tokenAmount.amount,
            decimals: parsed.tokenAmount.decimals,
          };
        });
      },
      { maxAttempts: 3 }
    );
  }

  async getTransaction(signature: string): Promise<unknown> {
    if (!this.connection) {
      throw new Error('Helius RPC not configured');
    }

    return withRetry(
      () =>
        withTimeout(
          this.connection!.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 }),
          10000,
          'Transaction fetch timeout'
        ),
      { maxAttempts: 3 }
    );
  }

  async getSignaturesForAddress(
    address: string,
    limit = 1000,
    before?: string
  ): Promise<Array<{ signature: string; slot: number; err: unknown }>> {
    if (!this.connection) {
      throw new Error('Helius RPC not configured');
    }

    return withRetry(
      () =>
        withTimeout(
          this.connection!.getSignaturesForAddress(new PublicKey(address), { limit, before }),
          15000,
          'Signatures fetch timeout'
        ),
      { maxAttempts: 3 }
    );
  }
}

