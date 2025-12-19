import type { Price, Chain } from '../../types/index.js';

export interface PricingProvider {
  getPrices(symbolsOrMints: string[], chain: Chain, fiat?: string): Promise<Price[]>;
  getPrice(symbolOrMint: string, chain: Chain, fiat?: string): Promise<Price | null>;
}

