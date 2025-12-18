// Service for fetching cryptocurrency logos
// Supports multiple APIs for better coverage

// CoinGecko API (free, no API key needed for basic usage)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images';

// CryptoCompare API
const CRYPTOCOMPARE_API = 'https://www.cryptocompare.com';

// DEXScreener for BNB Chain tokens
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

// Token symbol to CoinGecko ID mapping
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'WARP': 'warp', // May not exist, will try
};

// Get logo from CoinGecko
export const getCoinGeckoLogo = async (symbol: string): Promise<string | null> => {
  try {
    const coinId = COINGECKO_IDS[symbol.toUpperCase()];
    if (!coinId) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    return data.image?.small || data.image?.large || null;
  } catch (error) {
    console.warn(`Failed to fetch CoinGecko logo for ${symbol}:`, error);
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

// Main function: Get logo for a coin
export const getCoinLogo = async (symbol: string, contractAddress?: string): Promise<string | null> => {
  // For BNB Chain tokens, try DEXScreener first
  if (contractAddress && contractAddress.startsWith('0x')) {
    const dexscreenerLogo = await getDEXScreenerLogo(contractAddress);
    if (dexscreenerLogo) return dexscreenerLogo;
  }

  // Try CoinGecko
  const coingeckoLogo = await getCoinGeckoLogo(symbol);
  if (coingeckoLogo) return coingeckoLogo;

  return null;
};

// Predefined logo URLs for common coins (fallback)
export const PREDEFINED_LOGOS: Record<string, string> = {
  'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  'WARP': 'https://assets.coingecko.com/coins/images/placeholder.png', // Placeholder, will try to fetch
};

// Get logo with fallback
export const getCoinLogoWithFallback = async (symbol: string, contractAddress?: string): Promise<string | null> => {
  // Try to fetch from API
  const logo = await getCoinLogo(symbol, contractAddress);
  if (logo) return logo;

  // Fallback to predefined logos
  return PREDEFINED_LOGOS[symbol.toUpperCase()] || null;
};

