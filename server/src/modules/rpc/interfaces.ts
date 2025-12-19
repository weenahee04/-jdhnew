import { Connection, PublicKey } from '@solana/web3.js';
import type { Chain } from '../../types/index.js';

export interface RpcProvider {
  chain: Chain;
  getConnection(): Connection | null;
  getBalance(address: string): Promise<string>;
  getTokenBalances(address: string): Promise<Array<{
    mint: string;
    amount: string;
    decimals: number;
  }>>;
  getTransaction(signature: string): Promise<unknown>;
  getSignaturesForAddress(address: string, limit?: number, before?: string): Promise<Array<{
    signature: string;
    slot: number;
    err: unknown;
  }>>;
}

