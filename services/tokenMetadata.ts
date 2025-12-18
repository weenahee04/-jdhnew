// Token metadata service for fetching token information including logos
const SOLANA_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';
const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/all';

// Hardcoded metadata for specific tokens not in token lists
// These tokens may not be in Jupiter/Solana token lists but are commonly used
const HARDCODED_TOKEN_METADATA: Record<string, TokenMetadata> = {
  'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR': {
    address: 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR',
    name: 'OKX Token',
    symbol: 'OKX',
    decimals: 9,
    logoURI: 'https://static.okx.com/cdn/oksupport/okx/logo.png', // OKX official logo
    tags: [],
  },
  '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx': {
    address: '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx',
    name: 'JDH Token',
    symbol: 'JDH',
    decimals: 9,
    logoURI: undefined, // Will be fetched from DEXScreener or Jupiter
    tags: [],
  },
};

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

let cachedTokenList: TokenMetadata[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Fetch logo from DEXScreener for Solana tokens
const fetchDEXScreenerLogo = async (mintAddress: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`,
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
    console.warn(`Failed to fetch DEXScreener logo for ${mintAddress}:`, error);
    return null;
  }
};

// Fetch full token metadata from DEXScreener (name, symbol, logo)
const fetchDEXScreenerMetadata = async (mintAddress: string): Promise<{ name?: string; symbol?: string; logoURI?: string } | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      const baseToken = pair.baseToken;
      return {
        name: baseToken?.name,
        symbol: baseToken?.symbol,
        logoURI: baseToken?.logoURI,
      };
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch DEXScreener metadata for ${mintAddress}:`, error);
    return null;
  }
};

// Fetch token list from Jupiter (more comprehensive)
export const fetchTokenList = async (): Promise<TokenMetadata[]> => {
  const now = Date.now();
  
  try {
    // Use cache if available and not expired
    if (cachedTokenList && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedTokenList;
    }

    const response = await fetch(JUPITER_TOKEN_LIST_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch token list');
    }

    const data = await response.json();
    cachedTokenList = data.map((token: any) => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      logoURI: token.logoURI,
      tags: token.tags || [],
    }));

    lastFetchTime = now;
    return cachedTokenList;
  } catch (error) {
    console.warn('Failed to fetch Jupiter token list, trying Solana token list...', error);
    
    // Fallback to Solana token list
    try {
      const response = await fetch(SOLANA_TOKEN_LIST_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch Solana token list');
      }

      const data = await response.json();
      cachedTokenList = data.tokens.map((token: any) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
        tags: token.tags || [],
      }));

      lastFetchTime = now;
      return cachedTokenList;
    } catch (fallbackError) {
      console.error('Failed to fetch token lists:', fallbackError);
      return [];
    }
  }
};

// Get token metadata by mint address
export const getTokenMetadata = async (mintAddress: string): Promise<TokenMetadata | null> => {
  try {
    // Check hardcoded metadata first
    const hardcoded = HARDCODED_TOKEN_METADATA[mintAddress];
    if (hardcoded) {
      // If logoURI is undefined, try to fetch from DEXScreener (for JDH token)
      if (!hardcoded.logoURI && mintAddress === '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx') {
        const logoURI = await fetchDEXScreenerLogo(mintAddress);
        if (logoURI) {
          return { ...hardcoded, logoURI };
        }
      }
      return hardcoded;
    }

    const tokenList = await fetchTokenList();
    const token = tokenList.find(t => t.address.toLowerCase() === mintAddress.toLowerCase());
    
    if (token) {
      // If token found but no logo, try DEXScreener
      if (!token.logoURI) {
        const logoURI = await fetchDEXScreenerLogo(mintAddress);
        if (logoURI) {
          return { ...token, logoURI };
        }
      }
      return token;
    }

    // If not found, try DEXScreener for logo
    const logoURI = await fetchDEXScreenerLogo(mintAddress);
    
    // If not found, return basic metadata
    return {
      address: mintAddress,
      name: `Token ${mintAddress.slice(0, 8)}`,
      symbol: mintAddress.slice(0, 4).toUpperCase(),
      decimals: 9,
      logoURI: logoURI || undefined,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    // Check hardcoded metadata as fallback
    const hardcoded = HARDCODED_TOKEN_METADATA[mintAddress];
    if (hardcoded) {
      return hardcoded;
    }
    return {
      address: mintAddress,
      name: `Token ${mintAddress.slice(0, 8)}`,
      symbol: mintAddress.slice(0, 4).toUpperCase(),
      decimals: 9,
      logoURI: undefined,
    };
  }
};

// Get multiple token metadata at once
export const getMultipleTokenMetadata = async (mintAddresses: string[]): Promise<Record<string, TokenMetadata>> => {
  try {
    const tokenList = await fetchTokenList();
    const metadataMap: Record<string, TokenMetadata> = {};

    // Fetch all metadata in parallel
    await Promise.all(mintAddresses.map(async (mint) => {
      // Check hardcoded metadata first
      const hardcoded = HARDCODED_TOKEN_METADATA[mint];
      if (hardcoded) {
        // If logoURI is undefined, try to fetch from DEXScreener (for JDH token)
        if (!hardcoded.logoURI && mint === '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx') {
          const logoURI = await fetchDEXScreenerLogo(mint);
          if (logoURI) {
            metadataMap[mint] = { ...hardcoded, logoURI };
            return;
          }
        }
        metadataMap[mint] = hardcoded;
        return;
      }

      const token = tokenList.find(t => t.address.toLowerCase() === mint.toLowerCase());
      if (token) {
        // If token found but no logo, try DEXScreener
        if (!token.logoURI) {
          const logoURI = await fetchDEXScreenerLogo(mint);
          if (logoURI) {
            metadataMap[mint] = { ...token, logoURI };
            return;
          }
        }
        metadataMap[mint] = token;
      } else {
        // Try DEXScreener for full metadata (name, symbol, logo)
        const dexscreenerData = await fetchDEXScreenerMetadata(mint);
        
        metadataMap[mint] = {
          address: mint,
          name: dexscreenerData?.name || `Token ${mint.slice(0, 8)}`,
          symbol: dexscreenerData?.symbol || mint.slice(0, 4).toUpperCase(),
          decimals: 9,
          logoURI: dexscreenerData?.logoURI || undefined,
        };
      }
    }));

    return metadataMap;
  } catch (error) {
    console.error('Error fetching multiple token metadata:', error);
    // Return fallback metadata with hardcoded check
    const metadataMap: Record<string, TokenMetadata> = {};
    mintAddresses.forEach(mint => {
      const hardcoded = HARDCODED_TOKEN_METADATA[mint];
      if (hardcoded) {
        metadataMap[mint] = hardcoded;
      } else {
        metadataMap[mint] = {
          address: mint,
          name: `Token ${mint.slice(0, 8)}`,
          symbol: mint.slice(0, 4).toUpperCase(),
          decimals: 9,
          logoURI: undefined,
        };
      }
    });
    return metadataMap;
  }
};

