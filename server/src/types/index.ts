// Common types for the wallet API

export type Chain = 'solana' | 'ethereum' | 'polygon' | 'bsc';

export interface TokenBalance {
  mintOrContract: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // BigInt as string
  balanceUsd: number;
  logoURI?: string;
  verified: boolean;
}

export interface Portfolio {
  address: string;
  chain: Chain;
  totalBalanceUsd: number;
  tokens: TokenBalance[];
  nativeBalance: string;
  nativeBalanceUsd: number;
}

export interface Transaction {
  signature: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'other';
  from: string;
  to: string;
  amount: string;
  token: {
    mintOrContract: string;
    symbol: string;
    decimals: number;
  };
  fee: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, unknown>;
}

export interface TransactionHistory {
  transactions: Transaction[];
  cursor?: string;
  hasMore: boolean;
}

export interface TokenMetadata {
  mintOrContract: string;
  chain: Chain;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  verified: boolean;
  tags?: string[];
}

export interface Price {
  symbolOrMint: string;
  chain: Chain;
  priceUsd: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
}

export interface PricesResponse {
  prices: Price[];
  fiat: string;
  timestamp: number;
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  route: unknown;
  fee?: {
    amount: string;
    mint: string;
  };
}

export interface SwapBuildParams {
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  slippageBps: number;
  quoteResponse: SwapQuote;
}

export interface SwapTransaction {
  transaction: string; // Base64 encoded unsigned transaction
  swapQuote: SwapQuote;
}

export interface WebhookPayload {
  type: string;
  data: unknown;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

