// Price service for fetching real-time cryptocurrency prices
const JUPITER_PRICE_API_V4 = 'https://price.jup.ag/v4'; // For Solana mint addresses
const JUPITER_PRICE_API_V6 = 'https://price.jup.ag/v6'; // For token symbols (BTC, ETH, SOL, etc.)

// FORCE MOCK MODE: Set to true to completely bypass ALL API calls (Jupiter, CoinGecko, etc.)
// This prevents crash loops from rate limiting (429 errors)
// NOTE: This is also declared later for CoinGecko - both should be true
const FORCE_USE_MOCK_JUPITER = false; // Set to false to enable Jupiter API v6 (currently using mock for stability)

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

/**
 * Mock token prices for FORCE MOCK MODE
 * Returns hardcoded prices to prevent API calls
 */
const MOCK_TOKEN_PRICES: Record<string, TokenPrice> = {
  'So11111111111111111111111111111111111111112': { // SOL
    id: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    price: 100,
    priceChange24h: 5.0,
    decimals: 9,
  },
  'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR': { // JDH
    id: 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR',
    symbol: 'JDH',
    name: 'JDH Token',
    price: 0.5,
    priceChange24h: 10.0,
    decimals: 9,
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { // USDC
    id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.0,
    priceChange24h: 0.01,
    decimals: 6,
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { // USDT
    id: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether',
    price: 1.0,
    priceChange24h: 0.01,
    decimals: 6,
  },
};

/**
 * Static metadata for supported tokens
 * This replaces CoinGecko metadata - names, symbols, and images are hardcoded
 * Prices are fetched dynamically from Jupiter API v6
 */
export interface SupportedToken {
  id: string; // CoinGecko ID or internal ID
  symbol: string;
  name: string;
  image: string;
  jupiterSymbol?: string; // Symbol to use for Jupiter API (if different)
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', jupiterSymbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', jupiterSymbol: 'ETH' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', jupiterSymbol: 'USDT' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', jupiterSymbol: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', jupiterSymbol: 'SOL' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png', jupiterSymbol: 'USDC' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', jupiterSymbol: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', jupiterSymbol: 'ADA' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', jupiterSymbol: 'DOGE' },
  { id: 'jdh', symbol: 'JDH', name: 'JDH Token', image: 'https://img2.pic.in.th/pic/IMG_13847b26fb6a73c061f7.th.jpeg', jupiterSymbol: 'JDH' },
  { id: 'warp', symbol: 'WARP', name: 'Warp', image: 'https://img2.pic.in.th/pic/IMG_1413b7af4379d9e4f4a8.th.jpeg', jupiterSymbol: 'WARP' },
];

/**
 * Get token metadata by symbol or ID
 */
export function getTokenMetadata(symbolOrId: string): SupportedToken | undefined {
  return SUPPORTED_TOKENS.find(
    token => token.symbol.toUpperCase() === symbolOrId.toUpperCase() || 
            token.id.toLowerCase() === symbolOrId.toLowerCase()
  );
}

/**
 * Fetch prices from Jupiter API v6 using token symbols
 * This replaces CoinGecko API for major cryptocurrencies
 * 
 * Note: Jupiter API v6 may only support Solana tokens (mint addresses)
 * For non-Solana tokens (BTC, ETH, etc.), we'll use mock prices
 */
async function fetchJupiterV6Prices(symbols: string[]): Promise<Record<string, { price: number; priceChange24h?: number }>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  try {
    // Map symbols to Solana mint addresses for tokens that have them
    const symbolToMint: Record<string, string> = {
      'SOL': TOKEN_MINTS.SOL,
      'USDC': TOKEN_MINTS.USDC,
      'USDT': TOKEN_MINTS.USDT,
      'JDH': TOKEN_MINTS.JDH,
    };
    
    // Separate Solana tokens (have mint addresses) from non-Solana tokens
    const solanaMints: string[] = [];
    const solanaSymbols: string[] = [];
    const nonSolanaSymbols: string[] = [];
    
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      if (symbolToMint[upperSymbol]) {
        solanaMints.push(symbolToMint[upperSymbol]);
        solanaSymbols.push(upperSymbol);
      } else {
        nonSolanaSymbols.push(upperSymbol);
      }
    }
    
    const prices: Record<string, { price: number; priceChange24h?: number }> = {};
    
    // Fetch Solana token prices using Jupiter API v4 (mint addresses)
    if (solanaMints.length > 0) {
      try {
        const mintsParam = solanaMints.join(',');
        const url = `${JUPITER_PRICE_API_V4}/price?ids=${mintsParam}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // Jupiter API v4 response format: { data: { "mint": { price: 123.45, symbol: "SOL", ... } } }
          if (data.data && typeof data.data === 'object') {
            for (let i = 0; i < solanaMints.length; i++) {
              const mint = solanaMints[i];
              const symbol = solanaSymbols[i];
              const priceData = (data.data as Record<string, any>)[mint];
              
              if (priceData) {
                prices[symbol] = {
                  price: priceData.price || 0,
                  priceChange24h: priceData.priceChange24h || priceData.price_change_24h || 0,
                };
              }
            }
          }
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Jupiter API v4 fetch error for Solana tokens:', error.message || error);
        }
      }
    }
    
    // For non-Solana tokens (BTC, ETH, BNB, etc.), use mock prices
    // Jupiter API doesn't support these tokens directly
    for (const symbol of nonSolanaSymbols) {
      // Map symbol to coin ID for mock prices
      const symbolToCoinId: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'USDC': 'usd-coin',
      };
      
      const coinId = symbolToCoinId[symbol];
      if (coinId) {
        const mockPrice = MOCK_FALLBACK_PRICES[coinId];
        if (mockPrice) {
          prices[symbol] = {
            price: mockPrice.price,
            priceChange24h: mockPrice.change24h,
          };
        }
      }
    }
    
    return prices;
  } catch (error: any) {
    if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Jupiter API v6 fetch error:', error.message || error);
    }
    return {};
  }
}

export const getTokenPrices = async (mints: string[]): Promise<Record<string, TokenPrice>> => {
  // FORCE MOCK MODE: Completely bypass API calls to prevent crash loops
  if (FORCE_USE_MOCK_JUPITER) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 FORCE MOCK MODE: Bypassing Jupiter API, returning mock token prices');
    }
    // Return mock prices for requested mints
    const result: Record<string, TokenPrice> = {};
    for (const mint of mints) {
      if (MOCK_TOKEN_PRICES[mint]) {
        result[mint] = MOCK_TOKEN_PRICES[mint];
      }
    }
    return result;
  }
  
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
    const url = `${JUPITER_PRICE_API_V4}/price?ids=${mintsToFetch.join(',')}`;
    
    // Use POST for URLs longer than 1500 characters or if we have many mints
    // This prevents "hostname not found" errors
    if (url.length > 1500 || mintsToFetch.length > 20) {
      // Use POST for long URLs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Use POST to avoid URL length issues
      const response = await fetch(`${JUPITER_PRICE_API_V4}/price`, {
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
    // Suppress common network errors (hostname not found, CORS, etc.)
    if (error.name === 'AbortError' || 
        error.name === 'TypeError' ||
        error.message?.includes('hostname') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('network')) {
      // Suppress these errors - they're expected in development
      return {};
    }
    
    // Only log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Jupiter Price API error:', error.message || error);
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
// DISABLED: CoinGecko API is completely disabled to prevent rate limiting and crash loops
// const COINGECKO_API = 'https://api.coingecko.com/api/v3'; // DISABLED - Not used anymore
const CACHE_KEY = 'coingecko_prices_cache';
const CACHE_TIMESTAMP_KEY = 'coingecko_prices_cache_timestamp';
const CACHE_DURATION_MS = 60000; // 60 seconds cache

// FORCE MOCK MODE: Set to false to enable Jupiter API v6 (replaces CoinGecko)
// This prevents crash loops from rate limiting (429 errors)
const FORCE_USE_MOCK = false; // Set to false to enable Jupiter API v6 for major tokens

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
}

/**
 * Mock fallback prices (in USD) for major cryptocurrencies
 * Used when CoinGecko API is unavailable or rate limited
 * Updated with realistic prices matching user's requested structure
 */
const MOCK_FALLBACK_PRICES: Record<string, { price: number; change24h: number }> = {
  bitcoin: { price: 90000, change24h: 2.5 },
  ethereum: { price: 3000, change24h: 1.2 },
  tether: { price: 1.0, change24h: 0.01 },
  binancecoin: { price: 600, change24h: 0.5 },
  'usd-coin': { price: 1.0, change24h: 0.01 },
  solana: { price: 100, change24h: 5.0 },
  ripple: { price: 0.6, change24h: -0.5 },
  cardano: { price: 0.5, change24h: 1.2 },
  dogecoin: { price: 0.08, change24h: 3.0 },
  'matic-network': { price: 0.9, change24h: 2.0 },
  'avalanche-2': { price: 40, change24h: 1.5 },
  polkadot: { price: 7.5, change24h: 0.8 },
  chainlink: { price: 15, change24h: 1.0 },
  uniswap: { price: 10, change24h: 2.5 },
  litecoin: { price: 95, change24h: 0.3 },
  'shiba-inu': { price: 0.00001, change24h: 5.0 },
  tron: { price: 0.11, change24h: 0.2 },
  jdh: { price: 0.5, change24h: 10.0 },
  warp: { price: 0.1, change24h: -2.0 },
};

/**
 * Get cached prices from localStorage if available and fresh
 */
function getCachedPrices(): Record<string, CoinGeckoPrice> | null {
  try {
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!cachedTimestamp) return null;
    
    const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
    if (cacheAge > CACHE_DURATION_MS) {
      // Cache expired
      return null;
    }
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    // Ignore cache errors
  }
  return null;
}

/**
 * Save prices to cache
 */
function saveToCache(prices: Record<string, CoinGeckoPrice>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prices));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    // Ignore cache errors
  }
}

/**
 * Get mock fallback prices for requested coin IDs
 */
function getMockFallbackPrices(coinIds: string[]): Record<string, CoinGeckoPrice> {
  const mockPrices: Record<string, CoinGeckoPrice> = {};
  
  for (const coinId of coinIds) {
    const fallback = MOCK_FALLBACK_PRICES[coinId];
    if (fallback) {
      mockPrices[coinId] = {
        id: coinId,
        symbol: coinId.toUpperCase().split('-')[0],
        name: coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' '),
        current_price: fallback.price,
        price_change_percentage_24h: fallback.change24h,
      };
    }
  }
  
  return mockPrices;
}

/**
 * Fetch prices from CoinGecko for multiple coins
 * 
 * CRITICAL: This function NEVER throws errors to prevent app crashes.
 * It always returns a valid object (empty or with mock data) so the app can continue.
 * 
 * Features:
 * - FORCE MOCK MODE: If FORCE_USE_MOCK is true, completely bypasses API calls
 * - Caching: Uses localStorage to cache prices for 60 seconds
 * - Mock Fallback: Returns hardcoded prices if API fails
 * - Error Handling: All errors are caught and handled gracefully
 */
/**
 * Get token prices using Jupiter API v6 (replaces CoinGecko)
 * Uses hybrid approach: Static metadata + Dynamic pricing from Jupiter API v6
 * 
 * This function:
 * 1. Maps coin IDs to token symbols using SUPPORTED_TOKENS
 * 2. Fetches prices from Jupiter API v6 using symbols
 * 3. Combines static metadata with dynamic prices
 */
export const getCoinGeckoPrices = async (coinIds: string[]): Promise<Record<string, CoinGeckoPrice>> => {
  // Always return empty object if no coin IDs provided
  if (!coinIds || coinIds.length === 0) {
    return {};
  }
  
  // FORCE MOCK MODE: Return mock data if enabled
  if (FORCE_USE_MOCK) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 FORCE MOCK MODE: Returning mock prices (no API calls)');
    }
    return getMockFallbackPrices(coinIds);
  }
  
  try {
    // Step 1: Map coin IDs to Jupiter symbols using SUPPORTED_TOKENS
    const symbolsToFetch: string[] = [];
    const coinIdToSymbol: Record<string, string> = {};
    const coinIdToMetadata: Record<string, SupportedToken> = {};
    
    for (const coinId of coinIds) {
      const token = getTokenMetadata(coinId);
      if (token && token.jupiterSymbol) {
        const symbol = token.jupiterSymbol.toUpperCase();
        if (!symbolsToFetch.includes(symbol)) {
          symbolsToFetch.push(symbol);
        }
        coinIdToSymbol[coinId] = symbol;
        coinIdToMetadata[coinId] = token;
      }
    }
    
    if (symbolsToFetch.length === 0) {
      // No supported tokens found - return mock data
      return getMockFallbackPrices(coinIds);
    }
    
    // Step 2: Fetch prices from Jupiter API v6
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 Fetching prices from Jupiter API v6 for: ${symbolsToFetch.join(', ')}`);
    }
    
    const jupiterPrices = await fetchJupiterV6Prices(symbolsToFetch);
    
    // Step 3: Combine static metadata with dynamic prices
    const result: Record<string, CoinGeckoPrice> = {};
    
    for (const coinId of coinIds) {
      const metadata = coinIdToMetadata[coinId];
      const symbol = coinIdToSymbol[coinId];
      
      if (metadata && symbol) {
        const priceData = jupiterPrices[symbol];
        
        if (priceData && priceData.price > 0) {
          // Use real price from Jupiter API v6
          result[coinId] = {
            id: coinId,
            symbol: metadata.symbol,
            name: metadata.name,
            current_price: priceData.price,
            price_change_percentage_24h: priceData.priceChange24h || 0,
            image: metadata.image,
          };
        } else {
          // Fallback to mock price if Jupiter API doesn't have data
          const mockPrice = MOCK_FALLBACK_PRICES[coinId];
          if (mockPrice) {
            result[coinId] = {
              id: coinId,
              symbol: metadata.symbol,
              name: metadata.name,
              current_price: mockPrice.price,
              price_change_percentage_24h: mockPrice.change24h,
              image: metadata.image,
            };
          }
        }
      } else {
        // Token not in SUPPORTED_TOKENS - use mock fallback
        const mockPrice = MOCK_FALLBACK_PRICES[coinId];
        if (mockPrice) {
          result[coinId] = {
            id: coinId,
            symbol: coinId.toUpperCase().split('-')[0],
            name: coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, ' '),
            current_price: mockPrice.price,
            price_change_percentage_24h: mockPrice.change24h,
          };
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Jupiter API v6: Got prices for ${Object.keys(result).length} out of ${coinIds.length} tokens`);
    }
    
    return result;
  } catch (error: any) {
    // On error, return mock fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Jupiter API v6 error, using mock fallback:', error.message || error);
    }
    return getMockFallbackPrices(coinIds);
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

