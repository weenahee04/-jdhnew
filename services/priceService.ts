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

// BNB Chain token price fetching
// WARP token on BNB Chain: 0x5218B89C38Fa966493Cd380E0cB4906342A01a6C
export interface BNBTokenPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  contractAddress: string;
}

// Fetch BNB Chain token price from DEXScreener API
export const getBNBTokenPrice = async (contractAddress: string): Promise<BNBTokenPrice | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // DEXScreener API for BNB Chain tokens
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`DEXScreener API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // DEXScreener returns array of pairs, get the first one with price
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      const price = parseFloat(pair.priceUsd || '0');
      const priceChange24h = parseFloat(pair.priceChange?.h24 || '0');
      
      return {
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        name: pair.baseToken?.name || 'Unknown Token',
        price,
        priceChange24h,
        contractAddress,
      };
    }
    
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('BNB token price fetch timeout');
    } else {
      console.warn('BNB token price fetch error:', error.message || error);
    }
    return null;
  }
};

// Fetch WARP token price specifically
export const getWARPPrice = async (): Promise<BNBTokenPrice | null> => {
  const WARP_CONTRACT = '0x5218B89C38Fa966493Cd380E0cB4906342A01a6C';
  return getBNBTokenPrice(WARP_CONTRACT);
};

