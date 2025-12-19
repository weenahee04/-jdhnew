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
    if (!mints || mints.length === 0) {
      return {};
    }

    // First, remove duplicates from the input array
    const uniqueMints = Array.from(new Set(mints));
    
    // Filter out invalid mints (like extremely long SOL addresses)
    const validMints = uniqueMints.filter(mint => {
      // Validate mint address format
      // Solana addresses are base58 encoded and should be 32-44 characters
      if (!mint || typeof mint !== 'string') {
        return false;
      }
      
      // Check length - Solana addresses should be 32-44 characters
      if (mint.length < 32 || mint.length > 44) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Skipping invalid mint address (wrong length ${mint.length}): ${mint.slice(0, 20)}...`);
        }
        return false;
      }
      
      // Check for duplicate/repeated addresses (common bug)
      // If address appears multiple times in the string, it's likely corrupted
      const firstPart = mint.slice(0, 44);
      if (mint.length > 44 && mint.includes(firstPart + firstPart)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Skipping corrupted mint address (duplicated): ${mint.slice(0, 20)}...`);
        }
        return false;
      }
      
      return true;
    });

    if (validMints.length === 0) {
      return {};
    }

    // Remove duplicates again after validation (just to be safe)
    const deduplicatedMints = Array.from(new Set(validMints));
    
    // Limit number of mints to prevent URL from being too long
    // Max URL length is typically 2048 characters, but we'll use 1500 to be safe
    // Each mint is ~44 chars + comma = ~45 chars
    // So max ~30 mints per request for GET, unlimited for POST
    const maxMints = 30;
    const mintsToFetch = deduplicatedMints.slice(0, maxMints);
    
    // Build URL and check length - use POST if URL would be too long
    const url = `${JUPITER_PRICE_API}/price?ids=${mintsToFetch.join(',')}`;
    
    // Use POST for URLs longer than 1500 characters or if we have many mints
    // This prevents "hostname not found" errors
    if (url.length > 1500 || mintsToFetch.length > 20) {
      // Use POST for long URLs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Use POST to avoid URL length issues
      const response = await fetch(`${JUPITER_PRICE_API}/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: mintsToFetch }),
        signal: controller.signal,
        mode: 'cors',
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 POST request to Jupiter API with ${mintsToFetch.length} mints`);
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
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
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 GET request to Jupiter API: ${mintsToFetch.length} mints, URL length: ${url.length}`);
    }
    
    const response = await fetch(url, {
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

// CoinGecko API for major cryptocurrencies
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
}

// Fetch prices from CoinGecko for multiple coins
export const getCoinGeckoPrices = async (coinIds: string[]): Promise<Record<string, CoinGeckoPrice>> => {
  try {
    if (coinIds.length === 0) return {};
    
    // CoinGecko allows up to 250 coins per request
    const ids = coinIds.slice(0, 250).join(',');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Use /coins/markets endpoint which provides price and 24h change
    const url = `${COINGECKO_API}/coins/markets?ids=${ids}&vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Fetching CoinGecko prices from:', url.substring(0, 100) + '...');
    }
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ CoinGecko API error ${response.status}:`, errorText.substring(0, 200));
      return {};
    }
    
    const marketData = await response.json();
    const prices: Record<string, CoinGeckoPrice> = {};
    
    // CoinGecko returns array of coin objects
    if (Array.isArray(marketData)) {
      console.log(`✅ CoinGecko returned ${marketData.length} coins`);
      for (const coin of marketData) {
        if (coin.id && coin.current_price !== undefined) {
          prices[coin.id] = {
            id: coin.id,
            symbol: coin.symbol?.toUpperCase() || '',
            name: coin.name || '',
            current_price: coin.current_price || 0,
            price_change_percentage_24h: coin.price_change_percentage_24h || 0,
            image: coin.image,
          };
          if (process.env.NODE_ENV === 'development') {
            console.log(`  ✓ ${coin.symbol?.toUpperCase()}: $${coin.current_price} (${coin.price_change_percentage_24h?.toFixed(2)}%)`);
          }
        }
      }
    } else {
      console.warn('⚠️ CoinGecko returned non-array data:', typeof marketData);
    }
    
    return prices;
  } catch (error: any) {
    // Log errors in development for debugging
    if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
      console.warn('CoinGecko price fetch error:', error.message || error);
    }
    return {};
  }
};

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

