import { getRpcProvider } from '../../rpc/index.js';
import { logger } from '../../common/logger.js';
import { cache } from '../../cache/index.js';
import type { IndexerProvider } from '../interfaces.js';
import type { Transaction, TransactionHistory } from '../../../types/index.js';

export class SolanaRpcIndexerProvider implements IndexerProvider {
  chain = 'solana' as const;

  async getHistory(address: string, limit = 100, cursor?: string): Promise<TransactionHistory> {
    const cacheKey = `history:solana:${address}:${limit}:${cursor || 'latest'}`;
    const cached = await cache.get<TransactionHistory>(cacheKey);
    if (cached) return cached;

    try {
      const rpc = getRpcProvider('solana');
      const signatures = await rpc.getSignaturesForAddress(address, limit, cursor);

      const transactions: Transaction[] = [];
      for (const sig of signatures.slice(0, limit)) {
        if (sig.err) continue;

        try {
          const txData = await rpc.getTransaction(sig.signature);
          if (!txData) continue;

          // Parse transaction (simplified)
          const transaction: Transaction = {
            signature: sig.signature,
            timestamp: Date.now(), // RPC doesn't provide timestamp directly
            type: 'other',
            from: address,
            to: '',
            amount: '0',
            token: {
              mintOrContract: '',
              symbol: 'SOL',
              decimals: 9,
            },
            fee: '0',
            status: sig.err ? 'failed' : 'success',
            metadata: txData,
          };

          transactions.push(transaction);
        } catch (error) {
          logger.debug('Failed to parse transaction', { signature: sig.signature, error });
        }
      }

      const result: TransactionHistory = {
        transactions,
        cursor: transactions.length > 0 ? transactions[transactions.length - 1].signature : undefined,
        hasMore: signatures.length === limit,
      };

      await cache.set(cacheKey, result, { ttl: 30 });
      return result;
    } catch (error) {
      logger.error('RPC indexer error', error);
      throw error;
    }
  }

  async getTransaction(signature: string): Promise<Transaction | null> {
    const cacheKey = `tx:solana:${signature}`;
    const cached = await cache.get<Transaction>(cacheKey);
    if (cached) return cached;

    try {
      const rpc = getRpcProvider('solana');
      const txData = await rpc.getTransaction(signature);

      if (!txData) return null;

      const transaction: Transaction = {
        signature,
        timestamp: Date.now(),
        type: 'other',
        from: '',
        to: '',
        amount: '0',
        token: {
          mintOrContract: '',
          symbol: 'SOL',
          decimals: 9,
        },
        fee: '0',
        status: 'success',
        metadata: txData,
      };

      await cache.set(cacheKey, transaction, { ttl: 3600 });
      return transaction;
    } catch (error) {
      logger.error('RPC transaction fetch error', error);
      return null;
    }
  }
}

