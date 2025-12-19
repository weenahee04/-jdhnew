import type { Transaction, TransactionHistory, Chain } from '../../types/index.js';

export interface IndexerProvider {
  chain: Chain;
  getHistory(address: string, limit?: number, cursor?: string): Promise<TransactionHistory>;
  getTransaction(signature: string): Promise<Transaction | null>;
}

