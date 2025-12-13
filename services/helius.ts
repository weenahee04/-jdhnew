// @ts-ignore - Vite injects these
const HELIUS_API_KEY = (typeof process !== 'undefined' && process.env?.HELIUS_API_KEY) || '';
const BASE_URL = HELIUS_API_KEY 
  ? `https://api.helius.xyz/v0`
  : 'https://api.mainnet-beta.solana.com';

import { connection } from './solanaClient';
import { PublicKey } from '@solana/web3.js';

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: 'TRANSFER' | 'SWAP' | 'NFT_SALE' | 'UNKNOWN';
  source: string;
  destination?: string;
  amount: number;
  token?: string;
  symbol?: string;
  fee: number;
  status: 'SUCCESS' | 'FAILED';
}

export const getTransactionHistory = async (address: string, limit: number = 20): Promise<HeliusTransaction[]> => {
  if (!HELIUS_API_KEY) {
    // Fallback to Solana RPC
    return getTransactionHistoryRPC(address, limit);
  }

  try {
    const response = await fetch(`${BASE_URL}/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    
    const data = await response.json();
    return parseHeliusTransactions(data);
  } catch (error) {
    console.error('Helius API error, falling back to RPC:', error);
    return getTransactionHistoryRPC(address, limit);
  }
};

const getTransactionHistoryRPC = async (address: string, limit: number): Promise<HeliusTransaction[]> => {
  try {
    const pubkey = new PublicKey(address);
    
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
    
    const txs: HeliusTransaction[] = [];
    for (const sigInfo of signatures.slice(0, 10)) { // Limit to 10 for performance
      try {
        const tx = await connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });
        
        if (tx && tx.meta) {
          const parsed = parseTransaction(tx, address);
          if (parsed) txs.push(parsed);
        }
      } catch (e) {
        // Skip failed parsing
      }
    }
    
    return txs;
  } catch (error) {
    console.error('RPC transaction history error:', error);
    return [];
  }
};

const parseHeliusTransactions = (data: any[]): HeliusTransaction[] => {
  return data.map((tx: any) => ({
    signature: tx.signature,
    timestamp: tx.timestamp || Date.now() / 1000,
    type: tx.type || 'UNKNOWN',
    source: tx.source || '',
    destination: tx.destination || '',
    amount: tx.nativeTransfers?.[0]?.amount || 0,
    token: tx.tokenTransfers?.[0]?.mint,
    symbol: tx.tokenTransfers?.[0]?.symbol || 'SOL',
    fee: tx.fee || 0,
    status: tx.meta?.err ? 'FAILED' : 'SUCCESS',
  }));
};

const parseTransaction = async (tx: any, address: string): Promise<HeliusTransaction | null> => {
  if (!tx.transaction || !tx.meta) return null;

  const signature = tx.transaction.signatures[0];
  const fee = tx.meta.fee || 0;
  const status = tx.meta.err ? 'FAILED' : 'SUCCESS';
  
  // Parse transfers
  const preBalances = tx.meta.preBalances || [];
  const postBalances = tx.meta.postBalances || [];
  const accountKeys = tx.transaction.message.accountKeys || [];
  
  let amount = 0;
  let type: 'TRANSFER' | 'SWAP' | 'NFT_SALE' | 'UNKNOWN' = 'UNKNOWN';
  let destination = '';

  // Check for SOL transfers
  for (let i = 0; i < accountKeys.length; i++) {
    const key = accountKeys[i];
    const preBalance = preBalances[i] || 0;
    const postBalance = postBalances[i] || 0;
    const diff = postBalance - preBalance;

    if (key === address && diff < 0) {
      // Sent from this address
      amount = Math.abs(diff);
      type = 'TRANSFER';
      // Find recipient (account with positive balance change)
      for (let j = 0; j < accountKeys.length; j++) {
        if (j !== i && (postBalances[j] || 0) > (preBalances[j] || 0)) {
          destination = accountKeys[j];
          break;
        }
      }
      break;
    } else if (key === address && diff > 0) {
      // Received to this address
      amount = diff;
      type = 'TRANSFER';
      // Find sender
      for (let j = 0; j < accountKeys.length; j++) {
        if (j !== i && (preBalances[j] || 0) > (postBalances[j] || 0)) {
          destination = accountKeys[j];
          break;
        }
      }
      break;
    }
  }

  return {
    signature,
    timestamp: Date.now() / 1000,
    type,
    source: address,
    destination,
    amount: amount / 1e9, // Convert lamports to SOL
    symbol: 'SOL',
    fee: fee / 1e9,
    status,
  };
};

