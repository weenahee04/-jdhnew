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
  // JDH Token - Primary address (from Jupiter)
  JDH: 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR',
  // JDH Token - Secondary address (from DEXScreener)
  JDH_ALT: '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx',
};

export const getTokenPrices = async (mints: string[]): Promise<Record<string, TokenPrice>> => {
  try {
    // Filter out invalid mints (like extremely long SOL addresses)
    const validMints = mints.filter(mint => {
      // SOL address should be 44 characters, other tokens should be valid base58
      if (mint.length > 100) {
        console.warn(`Skipping invalid mint address (too long): ${mint.slice(0, 20)}...`);
        return false;
      }
      return true;
    });

    if (validMints.length === 0) {
      return {};
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout
    
    const response = await fetch(`${JUPITER_PRICE_API}/price?ids=${validMints.join(',')}`, {
      signal: controller.signal,
      mode: 'cors', // Handle CORS gracefully
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Don't throw - return empty object to allow app to continue
      // Silently handle network errors
      return {};
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
    // Silently fail for network errors to avoid console spam
    // Only log unexpected errors
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
      // Suppress network/hostname errors
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

// Fetch JDH token price from DEXScreener token-pairs API
export const getJDHPrice = async (): Promise<TokenPrice | null> => {
  try {
    const JDH_MINT = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/solana/${JDH_MINT}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Data is an array of pairs, get the first one (usually the most liquid)
    if (Array.isArray(data) && data.length > 0) {
      const pair = data[0];
      const baseToken = pair.baseToken;
      
      return {
        id: JDH_MINT,
        symbol: baseToken?.symbol || 'JDH',
        name: baseToken?.name || 'JDH Token',
        price: parseFloat(pair.priceUsd || 0),
        priceChange24h: pair.priceChange?.h24 || 0,
        decimals: 9,
      };
    }
    return null;
  } catch (error) {
    // Silently fail for network errors
    return null;
  }
};

