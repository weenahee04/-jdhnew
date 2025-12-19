import { fetch } from 'undici';
import { logger } from '../common/logger.js';
import { withRetry, withTimeout } from '../common/index.js';
import { cache } from '../cache/index.js';
import type { PricingProvider } from './interfaces.js';
import type { Price, Chain } from '../../types/index.js';

const JUPITER_PRICE_API = 'https://price.jup.ag/v4';

export class JupiterPricingProvider implements PricingProvider {
  async getPrices(symbolsOrMints: string[], chain: Chain, fiat = 'usd'): Promise<Price[]> {
    if (chain !== 'solana') {
      return [];
    }

    const prices: Price[] = [];
    const validMints = symbolsOrMints.filter((m) => m.length >= 32 && m.length <= 44);

    if (validMints.length === 0) return prices;

    // Check cache
    const cacheKey = `prices:jupiter:${validMints.join(',')}`;
    const cached = await cache.get<Price[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${JUPITER_PRICE_API}/price?ids=${validMints.join(',')}`;
      
      // Use POST if URL is too long
      const usePost = url.length > 1500 || validMints.length > 20;

      const data = await withRetry(
        () =>
          withTimeout(
            (usePost
              ? fetch(`${JUPITER_PRICE_API}/price`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: validMints }),
                })
              : fetch(url)
            ).then((res) => {
              if (!res.ok) {
                throw new Error(`Jupiter API error: ${res.status}`);
              }
              return res.json();
            }),
            10000,
            'Jupiter API timeout'
          ),
        { maxAttempts: 3 }
      );

      if (data.data) {
        for (const [mint, priceData] of Object.entries(data.data) as [string, any][]) {
          prices.push({
            symbolOrMint: mint,
            chain,
            priceUsd: priceData.price || 0,
            priceChange24h: priceData.priceChange24h || 0,
          });
        }
      }

      // Cache for 30 seconds
      await cache.set(cacheKey, prices, { ttl: 30 });
      return prices;
    } catch (error) {
      logger.error('Jupiter pricing error', error);
      return prices;
    }
  }

  async getPrice(symbolOrMint: string, chain: Chain, fiat = 'usd'): Promise<Price | null> {
    const prices = await this.getPrices([symbolOrMint], chain, fiat);
    return prices[0] || null;
  }
}

