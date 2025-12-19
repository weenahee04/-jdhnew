import { fetch } from 'undici';
import { logger } from '../common/logger.js';
import { withRetry, withTimeout } from '../common/index.js';
import { cache } from '../cache/index.js';
import type { PricingProvider } from './interfaces.js';
import type { Price, Chain } from '../../types/index.js';
import { getEnv } from '../../config/env.js';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map Solana mints to CoinGecko IDs
const MINT_TO_COINGECKO_ID: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'solana',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
};

// Also support 'native' identifier for native tokens
const NATIVE_IDENTIFIERS: Record<string, string> = {
  'native': 'solana', // For Solana native token
};

export class CoinGeckoPricingProvider implements PricingProvider {
  async getPrices(symbolsOrMints: string[], chain: Chain, fiat = 'usd'): Promise<Price[]> {
    if (chain !== 'solana') {
      return [];
    }

    const prices: Price[] = [];
    const coinIds: string[] = [];
    const mintToSymbol = new Map<string, string>();

    // Map mints to CoinGecko IDs
    for (const mint of symbolsOrMints) {
      const coinId = MINT_TO_COINGECKO_ID[mint] || NATIVE_IDENTIFIERS[mint];
      if (coinId) {
        coinIds.push(coinId);
        mintToSymbol.set(mint, coinId);
      }
    }

    if (coinIds.length === 0) return prices;

    // Check cache first
    const cacheKey = `prices:coingecko:${coinIds.join(',')}:${fiat}`;
    const cached = await cache.get<Price[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const env = getEnv();
      const apiKey = env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${env.COINGECKO_API_KEY}` : '';
      const url = `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${fiat}&include_24hr_change=true${apiKey}`;

      const data = await withRetry(
        () =>
          withTimeout(
            fetch(url).then((res) => {
              if (!res.ok) {
                throw new Error(`CoinGecko API error: ${res.status}`);
              }
              return res.json();
            }),
            10000,
            'CoinGecko API timeout'
          ),
        { maxAttempts: 3 }
      );

      for (const [mint, coinId] of mintToSymbol) {
        const coinData = data[coinId];
        if (coinData) {
          prices.push({
            symbolOrMint: mint,
            chain,
            priceUsd: coinData[fiat] || 0,
            priceChange24h: coinData[`${fiat}_24h_change`] || 0,
          });
        }
      }

      // Cache for 60 seconds
      await cache.set(cacheKey, prices, { ttl: 60 });
      return prices;
    } catch (error) {
      logger.error('CoinGecko pricing error', error);
      return prices;
    }
  }

  async getPrice(symbolOrMint: string, chain: Chain, fiat = 'usd'): Promise<Price | null> {
    const prices = await this.getPrices([symbolOrMint], chain, fiat);
    return prices[0] || null;
  }
}

