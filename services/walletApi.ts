// Wallet API Client - Connects frontend to backend API server
import { API_BASE_URL } from '../config';

const WALLET_API_BASE = import.meta.env.VITE_WALLET_API_URL || API_BASE_URL.replace('/api', '') || 'http://localhost:3001';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PortfolioResponse {
  address: string;
  chain: string;
  totalBalanceUsd: number;
  tokens: Array<{
    mintOrContract: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: string;
    balanceUsd: number;
    logoURI?: string;
    verified: boolean;
  }>;
  nativeBalance: string;
  nativeBalanceUsd: number;
}

export interface TransactionHistoryResponse {
  transactions: Array<{
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
  }>;
  cursor?: string;
  hasMore: boolean;
}

export interface TokenMetadataResponse {
  mintOrContract: string;
  chain: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  verified: boolean;
  tags?: string[];
}

export interface PricesResponse {
  prices: Array<{
    symbolOrMint: string;
    chain: string;
    priceUsd: number;
    priceChange24h: number;
    marketCap?: number;
    volume24h?: number;
  }>;
  fiat: string;
  timestamp: number;
}

export interface SwapQuoteResponse {
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

export interface SwapBuildResponse {
  transaction: string;
  swapQuote: SwapQuoteResponse;
}

class WalletApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = WALLET_API_BASE;
    this.apiKey = import.meta.env.VITE_WALLET_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Portfolio
  async getPortfolio(address: string, chain: string = 'solana'): Promise<PortfolioResponse> {
    return this.request<PortfolioResponse>(
      `/v1/portfolio?chain=${chain}&address=${address}`
    );
  }

  // Transaction History
  async getHistory(
    address: string,
    chain: string = 'solana',
    limit?: number,
    cursor?: string
  ): Promise<TransactionHistoryResponse> {
    const params = new URLSearchParams({
      chain,
      address,
    });
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    return this.request<TransactionHistoryResponse>(`/v1/history?${params.toString()}`);
  }

  // Token Metadata
  async getTokenMetadata(mintOrContract: string, chain: string = 'solana'): Promise<TokenMetadataResponse> {
    return this.request<TokenMetadataResponse>(
      `/v1/token/meta?chain=${chain}&id=${encodeURIComponent(mintOrContract)}`
    );
  }

  // Prices
  async getPrices(
    ids: string[],
    chain: string = 'solana',
    fiat: string = 'usd'
  ): Promise<PricesResponse> {
    return this.request<PricesResponse>(
      `/v1/prices?chain=${chain}&ids=${ids.join(',')}&fiat=${fiat}`
    );
  }

  // Swap Quote
  async getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    chain: string = 'solana',
    slippageBps: number = 50
  ): Promise<SwapQuoteResponse> {
    return this.request<SwapQuoteResponse>('/v1/swap/quote', {
      method: 'POST',
      body: JSON.stringify({
        inputMint,
        outputMint,
        amount,
        chain,
        slippageBps,
      }),
    });
  }

  // Build Swap Transaction
  async buildSwapTransaction(
    userPublicKey: string,
    inputMint: string,
    outputMint: string,
    inputAmount: string,
    slippageBps: number,
    quoteResponse: SwapQuoteResponse,
    chain: string = 'solana'
  ): Promise<SwapBuildResponse> {
    return this.request<SwapBuildResponse>('/v1/swap/build', {
      method: 'POST',
      body: JSON.stringify({
        userPublicKey,
        inputMint,
        outputMint,
        inputAmount,
        slippageBps,
        quoteResponse,
        chain,
      }),
    });
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return this.request('/health');
  }
}

export const walletApi = new WalletApiClient();

