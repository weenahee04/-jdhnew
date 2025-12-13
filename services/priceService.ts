// Price service for fetching real-time cryptocurrency prices
const JUPITER_PRICE_API = 'https://price.jup.ag/v4';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  decimals?: number;
}

// Common Solana token mint addresses
export const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  // JDH Token (from DEXScreener)
  JDH: '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx',
};

export const getTokenPrices = async (mints: string[]): Promise<Record<string, TokenPrice>> => {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${JUPITER_PRICE_API}/price?ids=${mints.join(',')}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Price API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const prices: Record<string, TokenPrice> = {};
    
    for (const [mint, priceData] of Object.entries(data.data || {})) {
      const p = priceData as any;
      prices[mint] = {
        id: mint,
        symbol: p.symbol || 'UNKNOWN',
        name: p.name || 'Unknown Token',
        price: p.price || 0,
        priceChange24h: p.priceChange24h || 0,
        decimals: p.decimals || 9,
      };
    }
    
    return prices;
  } catch (error: any) {
    // Log error but don't throw - return empty object to allow app to continue
    if (error.name === 'AbortError') {
      console.warn('Price fetch timeout - using fallback values');
    } else {
      console.warn('Price fetch error (non-critical):', error.message || error);
    }
    // Return empty object - calling code should handle missing prices gracefully
    return {};
  }
};

export const getSOLPrice = async (): Promise<number> => {
  try {
    const prices = await getTokenPrices([TOKEN_MINTS.SOL]);
    return prices[TOKEN_MINTS.SOL]?.price || 0;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('SOL price fetch error:', error);
    }
    // Fallback to approximate price
    return 150; // ~$150 USD
  }
};

// Convert USD to THB (approximate)
const USD_TO_THB = 34.5;

export const convertUsdToThb = (usd: number) => usd * USD_TO_THB;

