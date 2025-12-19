import { fetch } from 'undici';
import { getEnv } from '../../../config/env.js';
import { logger } from '../../common/logger.js';
import { withRetry, withTimeout } from '../../common/index.js';
import { cache } from '../../cache/index.js';
import type { IndexerProvider } from '../interfaces.js';
import type { Transaction, TransactionHistory } from '../../../types/index.js';

const HELIUS_API = 'https://api.helius.xyz/v0';

export class HeliusIndexerProvider implements IndexerProvider {
  chain = 'solana' as const;
  private apiKey: string | null = null;

  constructor() {
    const env = getEnv();
    this.apiKey = env.HELIUS_API_KEY || null;
  }

  async getHistory(address: string, limit = 100, cursor?: string): Promise<TransactionHistory> {
    if (!this.apiKey) {
      throw new Error('Helius API key not configured');
    }

    const cacheKey = `history:solana:${address}:${limit}:${cursor || 'latest'}`;
    const cached = await cache.get<TransactionHistory>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${HELIUS_API}/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}${cursor ? `&before=${cursor}` : ''}`;

      const data = await withRetry(
        () =>
          withTimeout(
            fetch(url).then((res) => {
              if (!res.ok) {
                throw new Error(`Helius API error: ${res.status}`);
              }
              return res.json();
            }),
            15000,
            'Helius API timeout'
          ),
        { maxAttempts: 3 }
      );

      const transactions: Transaction[] = (data || []).map((tx: any) => ({
        signature: tx.signature,
        timestamp: tx.timestamp * 1000,
        type: this.parseTransactionType(tx),
        from: tx.source || '',
        to: tx.destination || '',
        amount: tx.amount?.toString() || '0',
        token: {
          mintOrContract: tx.mint || '',
          symbol: tx.tokenSymbol || 'SOL',
          decimals: tx.decimals || 9,
        },
        fee: tx.fee?.toString() || '0',
        status: tx.status === 'success' ? 'success' : 'failed',
        metadata: tx,
      }));

      const result: TransactionHistory = {
        transactions,
        cursor: transactions.length > 0 ? transactions[transactions.length - 1].signature : undefined,
        hasMore: transactions.length === limit,
      };

      await cache.set(cacheKey, result, { ttl: 30 });
      return result;
    } catch (error) {
      logger.error('Helius indexer error', error);
      throw error;
    }
  }

  async getTransaction(signature: string): Promise<Transaction | null> {
    if (!this.apiKey) {
      throw new Error('Helius API key not configured');
    }

    const cacheKey = `tx:solana:${signature}`;
    const cached = await cache.get<Transaction>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${HELIUS_API}/transactions/?api-key=${this.apiKey}`;
      const data = await withRetry(
        () =>
          withTimeout(
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transactions: [signature] }),
            }).then((res) => {
              if (!res.ok) {
                throw new Error(`Helius API error: ${res.status}`);
              }
              return res.json();
            }),
            10000,
            'Helius API timeout'
          ),
        { maxAttempts: 3 }
      );

      if (!data || data.length === 0) return null;

      const tx = data[0];
      const transaction: Transaction = {
        signature: tx.signature,
        timestamp: tx.timestamp * 1000,
        type: this.parseTransactionType(tx),
        from: tx.source || '',
        to: tx.destination || '',
        amount: tx.amount?.toString() || '0',
        token: {
          mintOrContract: tx.mint || '',
          symbol: tx.tokenSymbol || 'SOL',
          decimals: tx.decimals || 9,
        },
        fee: tx.fee?.toString() || '0',
        status: tx.status === 'success' ? 'success' : 'failed',
        metadata: tx,
      };

      await cache.set(cacheKey, transaction, { ttl: 3600 });
      return transaction;
    } catch (error) {
      logger.error('Helius transaction fetch error', error);
      return null;
    }
  }

  private parseTransactionType(tx: any): 'send' | 'receive' | 'swap' | 'other' {
    if (tx.type === 'SWAP') return 'swap';
    if (tx.type === 'TRANSFER' && tx.nativeTransfers) {
      return tx.nativeTransfers[0]?.amount > 0 ? 'receive' : 'send';
    }
    return 'other';
  }
}

