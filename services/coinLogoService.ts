// Service for fetching cryptocurrency logos
// Supports multiple APIs for better coverage

// FORCE MOCK MODE: ALWAYS TRUE - CoinGecko API is completely disabled
// This prevents crash loops from rate limiting (429 errors)
const FORCE_USE_MOCK = true; // PERMANENTLY DISABLED - CoinGecko API will never be called

// CoinGecko API (DISABLED - not used anymore)
const COINGECKO_API = 'https://api.coingecko.com/api/v3'; // Not used - API is disabled
const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images'; // CDN URLs still work for static images

// CryptoCompare API
const CRYPTOCOMPARE_API = 'https://www.cryptocompare.com';

// DEXScreener for BNB Chain tokens
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';
// DEXScreener token-pairs API for Solana tokens (better data)
const DEXSCREENER_TOKEN_PAIRS_API = 'https://api.dexscreener.com/token-pairs/v1/solana';

// Token symbol to CoinGecko ID mapping
// Note: Only include tokens that exist in CoinGecko to avoid 404 errors
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  // WARP and JDH don't exist in CoinGecko - skip to avoid 404 errors
  // They will be fetched from DEXScreener/Jupiter instead
};

// Get logo from CoinGecko
// Note: CoinGecko has CORS restrictions and rate limits (429)
// This function will fail silently and return null to avoid console errors
export const getCoinGeckoLogo = async (symbol: string): Promise<string | null> => {
  // FORCE MOCK MODE: Completely bypass API calls to prevent crash loops
  if (FORCE_USE_MOCK) {
    // Return null - logos are not critical, app can work without them
    return null;
  }
  
  try {
    const coinId = COINGECKO_IDS[symbol.toUpperCase()];
    if (!coinId) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      { 
        signal: controller.signal,
        // Don't throw on CORS errors, just return null
        mode: 'cors',
      }
    );

    clearTimeout(timeoutId);

    // Handle rate limiting and CORS gracefully
    if (!response.ok) {
      // Don't log 429 (rate limit) or CORS errors to avoid console spam
      if (response.status !== 429 && response.status !== 0) {
        // Only log non-rate-limit errors
      }
      return null;
    }

    const data = await response.json();
    return data.image?.small || data.image?.large || null;
  } catch (error: any) {
    // Silently fail for CORS/network errors to avoid console spam
    // Only log unexpected errors
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
      // Suppress CORS and network errors
    }
    return null;
  }
};

// Get logo from DEXScreener (for BNB Chain tokens like WARP)
export const getDEXScreenerLogo = async (contractAddress: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${DEXSCREENER_API}/${contractAddress}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      return pair.baseToken?.logoURI || null;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch DEXScreener logo for ${contractAddress}:`, error);
    return null;
  }
};

// Get logo URL directly from CoinGecko CDN (faster, no API call)
export const getCoinGeckoCDNLogo = (symbol: string, size: 'small' | 'large' = 'small'): string | null => {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()];
  if (!coinId) return null;

  // Try to construct CDN URL (may not always work)
  // Format: https://assets.coingecko.com/coins/images/{id}/{size}.png
  // But we need the actual image ID, so this is a fallback
  return null;
};

// Get logo from DEXScreener for Solana tokens
export const getDEXScreenerLogoSolana = async (mintAddress: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${DEXSCREENER_API}/${mintAddress}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      return pair.baseToken?.logoURI || null;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch DEXScreener logo for Solana token ${mintAddress}:`, error);
    return null;
  }
};

// Main function: Get logo for a coin
export const getCoinLogo = async (symbol: string, contractAddress?: string, mintAddress?: string): Promise<string | null> => {
  // For BNB Chain tokens (0x...), try DEXScreener first
  if (contractAddress && contractAddress.startsWith('0x')) {
    const dexscreenerLogo = await getDEXScreenerLogo(contractAddress);
    if (dexscreenerLogo) return dexscreenerLogo;
  }

  // For Solana tokens (mint address), try DEXScreener
  if (mintAddress && !mintAddress.startsWith('0x')) {
    const dexscreenerLogoSolana = await getDEXScreenerLogoSolana(mintAddress);
    if (dexscreenerLogoSolana) return dexscreenerLogoSolana;
  }

  // Try CoinGecko
  const coingeckoLogo = await getCoinGeckoLogo(symbol);
  if (coingeckoLogo) return coingeckoLogo;

  return null;
};

// Predefined logo URLs for common coins (fallback)
// Note: Don't use placeholder.png as it returns 404
export const PREDEFINED_LOGOS: Record<string, string> = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'WARP': 'https://img2.pic.in.th/pic/IMG_1413b7af4379d9e4f4a8.th.jpeg',
  // JDH will be fetched from DEXScreener/Jupiter, no placeholder
};

// Get logo with fallback
export const getCoinLogoWithFallback = async (symbol: string, contractAddress?: string, mintAddress?: string): Promise<string | null> => {
  // Try to fetch from API
  const logo = await getCoinLogo(symbol, contractAddress, mintAddress);
  if (logo) return logo;

  // Fallback to predefined logos
  return PREDEFINED_LOGOS[symbol.toUpperCase()] || null;
};

// Get JDH token logo specifically
export const getJDHLogo = async (): Promise<string | null> => {
  const JDH_MINT = '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx';
  // Try DEXScreener first (most reliable for Solana tokens)
  const dexscreenerLogo = await getDEXScreenerLogoSolana(JDH_MINT);
  if (dexscreenerLogo) return dexscreenerLogo;
  
  // Try CoinGecko as fallback
  const coingeckoLogo = await getCoinGeckoLogo('JDH');
  if (coingeckoLogo) return coingeckoLogo;
  
  return null;
};

// Get JDH token data from DEXScreener token-pairs API (includes logo, price, etc.)
export const getJDHFromDEXScreenerPairs = async (mintAddress: string): Promise<{ name: string; symbol: string; logoURI: string; price: number; priceChange24h: number } | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${mintAddress}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      return {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        logoURI: pair.baseToken.logoURI,
        price: parseFloat(pair.priceUsd || 0),
        priceChange24h: pair.priceChange?.h24 || 0,
      };
    }
    return null;
  } catch (error) {
    // Suppress network errors
    return null;
  }
};

