// Token metadata service for fetching token information including logos
const SOLANA_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';
const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/all';

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

// Fetch token list from Jupiter (more comprehensive)
export const fetchTokenList = async (): Promise<TokenMetadata[]> => {
  try {
    const now = Date.now();
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
    const tokenList = await fetchTokenList();
    const token = tokenList.find(t => t.address.toLowerCase() === mintAddress.toLowerCase());
    
    if (token) {
      return token;
    }

    // If not found, return basic metadata
    return {
      address: mintAddress,
      name: `Token ${mintAddress.slice(0, 8)}`,
      symbol: mintAddress.slice(0, 4).toUpperCase(),
      decimals: 9,
      logoURI: undefined,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
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

    mintAddresses.forEach(mint => {
      const token = tokenList.find(t => t.address.toLowerCase() === mint.toLowerCase());
      if (token) {
        metadataMap[mint] = token;
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
  } catch (error) {
    console.error('Error fetching multiple token metadata:', error);
    // Return fallback metadata
    const metadataMap: Record<string, TokenMetadata> = {};
    mintAddresses.forEach(mint => {
      metadataMap[mint] = {
        address: mint,
        name: `Token ${mint.slice(0, 8)}`,
        symbol: mint.slice(0, 4).toUpperCase(),
        decimals: 9,
        logoURI: undefined,
      };
    });
    return metadataMap;
  }
};

