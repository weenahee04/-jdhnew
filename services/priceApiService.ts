// Price Service with backend API integration
import { getPricesFromApi } from './walletApiService';
import { getTokenPrices, getCoinGeckoPrices, getWARPPrice, getJDHPrice } from './priceService';
import { USE_WALLET_API } from '../config';
import { logger } from '../lib/logger';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  decimals?: number;
}

/**
 * Get token prices - tries backend API first, falls back to direct APIs
 */
export async function getTokenPricesApi(mints: string[]): Promise<Record<string, TokenPrice>> {
  if (USE_WALLET_API && mints.length > 0) {
    try {
      const prices = await getPricesFromApi(mints, 'solana', 'usd');
      if (prices) {
        // Convert to TokenPrice format
        const result: Record<string, TokenPrice> = {};
        for (const [mint, priceData] of Object.entries(prices)) {
          result[mint] = {
            id: mint,
            symbol: mint.slice(0, 4).toUpperCase(),
            name: 'Token',
            price: priceData.price,
            priceChange24h: priceData.priceChange24h,
            decimals: 9,
          };
        }
        return result;
      }
    } catch (error) {
      logger.warn('Backend API prices failed, using direct APIs', error);
    }
  }

  // Fallback to direct API calls
  return getTokenPrices(mints);
}

/**
 * Get CoinGecko prices - tries backend API first
 */
export async function getCoinGeckoPricesApi(coinIds: string[]): Promise<Record<string, any>> {
  if (USE_WALLET_API && coinIds.length > 0) {
    try {
      // Backend API uses mint addresses, so we need to map coin IDs to mints
      // For now, fallback to direct API for CoinGecko
      // In the future, backend could support CoinGecko IDs directly
    } catch (error) {
      // Fall through
    }
  }

  return getCoinGeckoPrices(coinIds);
}

