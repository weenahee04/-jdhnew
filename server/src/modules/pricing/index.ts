import { CoinGeckoPricingProvider } from './coingecko.js';
import { JupiterPricingProvider } from './jupiter.js';
import type { PricingProvider } from './interfaces.js';
import type { Price, Chain } from '../../types/index.js';

const providers: PricingProvider[] = [
  new CoinGeckoPricingProvider(),
  new JupiterPricingProvider(),
];

export async function getPrices(
  symbolsOrMints: string[],
  chain: Chain = 'solana',
  fiat = 'usd'
): Promise<Price[]> {
  // Try providers in order
  for (const provider of providers) {
    try {
      const prices = await provider.getPrices(symbolsOrMints, chain, fiat);
      if (prices.length > 0) {
        return prices;
      }
    } catch (error) {
      // Continue to next provider
      continue;
    }
  }

  return [];
}

export async function getPrice(
  symbolOrMint: string,
  chain: Chain = 'solana',
  fiat = 'usd'
): Promise<Price | null> {
  const prices = await getPrices([symbolOrMint], chain, fiat);
  return prices[0] || null;
}

