// Token metadata service for fetching token information including logos
const SOLANA_TOKEN_LIST_URL = 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';
const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/all';

// Hardcoded metadata for specific tokens not in token lists
// These tokens may not be in Jupiter/Solana token lists but are commonly used
const HARDCODED_TOKEN_METADATA: Record<string, TokenMetadata> = {
  // GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR is JDH Token
  // Name and symbol are hardcoded to ensure correct display
  'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR': {
    address: 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR',
    name: 'JDH Token', // Always use this name
    symbol: 'JDH', // Always use this symbol
    decimals: 9,
    logoURI: undefined, // Will be fetched from GMGN.ai or DEXScreener
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

// Fetch full token metadata from Jupiter API (name, symbol, logo)
const fetchJupiterMetadata = async (mintAddress: string): Promise<{ name?: string; symbol?: string; logoURI?: string; decimals?: number } | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout

    // Try Jupiter API v2 search endpoint
    const response = await fetch(
      `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(mintAddress)}`,
      { 
        signal: controller.signal,
        // Handle network errors gracefully
        mode: 'cors',
      }
    );

    clearTimeout(timeoutId);

    // Handle 401, 403, 404, and network errors gracefully
    if (!response.ok) {
      // Don't log 401/403/404 as they're expected for some tokens
      if (response.status !== 401 && response.status !== 403 && response.status !== 404) {
        // Only log unexpected errors
      }
      return null;
    }

    const data = await response.json();
    
    // Jupiter API returns array of tokens
    if (Array.isArray(data) && data.length > 0) {
      const token = data.find((t: any) => 
        t.address?.toLowerCase() === mintAddress.toLowerCase()
      ) || data[0];

      if (token) {
        return {
          name: token.name,
          symbol: token.symbol,
          logoURI: token.logoURI,
          decimals: token.decimals,
        };
      }
    }
    return null;
  } catch (error: any) {
    // Silently fail for network errors to avoid console spam
    // Only log unexpected errors
    if (error.name !== 'AbortError' && error.name !== 'TypeError') {
      // Suppress network/hostname errors
    }
    return null;
  }
};

// Fetch full token metadata from DEXScreener token-pairs API (better for Solana tokens)
const fetchDEXScreenerPairsMetadata = async (mintAddress: string): Promise<{ name?: string; symbol?: string; logoURI?: string } | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/solana/${mintAddress}`,
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
        name: baseToken?.name,
        symbol: baseToken?.symbol,
        logoURI: baseToken?.logoURI,
      };
    }
    return null;
  } catch (error) {
    // Silently fail for network errors
    return null;
  }
};

// Fetch full token metadata from DEXScreener (name, symbol, logo) - legacy API
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
    // Silently fail for network errors
    return null;
  }
};

// Fetch token logo from GMGN.ai (for JDH token)
// Try multiple methods to get the logo
const fetchGMGNLogo = async (mintAddress: string): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Method 1: Try GMGN.ai API endpoints
    const apiEndpoints = [
      `https://gmgn.ai/api/sol/token/${mintAddress}`,
      `https://api.gmgn.ai/sol/token/${mintAddress}`,
      `https://gmgn.ai/api/v1/sol/token/${mintAddress}`,
      `https://gmgn.ai/api/sol/token/solscan_${mintAddress}`,
    ];

    for (const apiUrl of apiEndpoints) {
      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const token = data.data || data.token || data.result || data;
          if (token) {
            const logoURI = token.logo || token.logo_uri || token.logoURI || token.image || token.image_url;
            if (logoURI) {
              return logoURI;
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    // Method 2: Try CORS proxy to fetch HTML page
    try {
      const pageUrl = `https://gmgn.ai/sol/token/solscan_${mintAddress}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`;
      
      const proxyResponse = await fetch(proxyUrl, {
        signal: controller.signal,
      });
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        const html = proxyData.contents;
        
        // Try to find logo in various ways
        // Look for img tags with token logo
        const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
        for (const match of imgMatches) {
          const src = match[1];
          if (src && (src.includes('logo') || src.includes('token') || src.match(/\.(png|jpg|jpeg|svg|webp)/i))) {
            // Make sure it's a full URL
            if (src.startsWith('http')) {
              return src;
            } else if (src.startsWith('//')) {
              return `https:${src}`;
            } else if (src.startsWith('/')) {
              return `https://gmgn.ai${src}`;
            }
          }
        }
        
        // Try JSON-LD
        const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
          try {
            const jsonData = JSON.parse(jsonLdMatch[1]);
            if (jsonData.image || jsonData.logo) {
              return jsonData.image || jsonData.logo;
            }
          } catch (e) {
            // Continue
          }
        }
        
        // Try to find in meta tags
        const metaImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (metaImageMatch && metaImageMatch[1]) {
          return metaImageMatch[1];
        }
      }
    } catch (error) {
      // Continue to fallback
    }

    // Method 3: Try direct image URL pattern (common patterns)
    // GMGN might use a CDN or specific URL pattern
    const directUrlPatterns = [
      `https://gmgn.ai/api/sol/token/${mintAddress}/logo`,
      `https://api.gmgn.ai/sol/token/${mintAddress}/logo`,
      `https://gmgn.ai/images/tokens/${mintAddress}.png`,
      `https://gmgn.ai/images/tokens/${mintAddress}.jpg`,
    ];
    
    for (const url of directUrlPatterns) {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'HEAD', // Just check if it exists
        });
        if (response.ok) {
          return url;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Fetch token metadata from GMGN.ai (for JDH token) - legacy function
const fetchGMGNMetadata = async (mintAddress: string): Promise<{ name?: string; symbol?: string; logoURI?: string } | null> => {
  try {
    const logoURI = await fetchGMGNLogo(mintAddress);
    if (logoURI) {
      return { logoURI };
    }
    return null;
  } catch (error) {
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
    // ALWAYS check hardcoded metadata first - this is critical for JDH token
    const hardcoded = HARDCODED_TOKEN_METADATA[mintAddress];
    if (hardcoded) {
      // For JDH token (GkDEVLZP), try multiple sources for logo
      if (mintAddress === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
        // Try GMGN.ai first (user requested)
        let logoURI: string | undefined;
        
        const gmgnLogo = await fetchGMGNLogo(mintAddress);
        if (gmgnLogo) {
          logoURI = gmgnLogo;
        } else {
          // Fallback to DEXScreener token-pairs API
          const dexscreenerPairsData = await fetchDEXScreenerPairsMetadata(mintAddress);
          if (dexscreenerPairsData?.logoURI) {
            logoURI = dexscreenerPairsData.logoURI;
          } else {
            // Try Jupiter API as last resort
            const jupiterData = await fetchJupiterMetadata(mintAddress);
            if (jupiterData?.logoURI) {
              logoURI = jupiterData.logoURI;
            }
          }
        }
        
        return {
          ...hardcoded,
          // ALWAYS keep hardcoded name and symbol - these are correct
          name: hardcoded.name, // "JDH Token" - never override
          symbol: hardcoded.symbol, // "JDH" - never override
          logoURI: logoURI, // Use logo from any source
          decimals: hardcoded.decimals,
        };
      }
      
      // For other hardcoded tokens, try Jupiter API for logo
      // BUT keep hardcoded name and symbol (don't override)
      const jupiterData = await fetchJupiterMetadata(mintAddress);
      if (jupiterData?.logoURI) {
        return {
          ...hardcoded,
          // Keep hardcoded name and symbol - these are correct
          name: hardcoded.name,
          symbol: hardcoded.symbol,
          logoURI: jupiterData.logoURI,
        };
      }
      // Try DEXScreener as fallback for logo
      if (!hardcoded.logoURI) {
        const logoURI = await fetchDEXScreenerLogo(mintAddress);
        if (logoURI) {
          return { ...hardcoded, logoURI };
        }
      }
      // Return hardcoded metadata as-is (name and symbol are already correct)
      return hardcoded;
    }

    const tokenList = await fetchTokenList();
    const token = tokenList.find(t => t.address.toLowerCase() === mintAddress.toLowerCase());
    
    if (token) {
      // If token found but no logo, try Jupiter API first, then DEXScreener
      if (!token.logoURI) {
        const jupiterData = await fetchJupiterMetadata(mintAddress);
        if (jupiterData?.logoURI) {
          return { ...token, logoURI: jupiterData.logoURI };
        }
        const logoURI = await fetchDEXScreenerLogo(mintAddress);
        if (logoURI) {
          return { ...token, logoURI };
        }
      }
      return token;
    }

    // If not found in token list, try Jupiter API first
    const jupiterData = await fetchJupiterMetadata(mintAddress);
    if (jupiterData) {
      return {
        address: mintAddress,
        name: jupiterData.name || `Token ${mintAddress.slice(0, 8)}`,
        symbol: jupiterData.symbol || mintAddress.slice(0, 4).toUpperCase(),
        decimals: jupiterData.decimals || 9,
        logoURI: jupiterData.logoURI || undefined,
      };
    }
    
    // Fallback to DEXScreener
    const dexscreenerData = await fetchDEXScreenerMetadata(mintAddress);
    if (dexscreenerData) {
      return {
        address: mintAddress,
        name: dexscreenerData.name || `Token ${mintAddress.slice(0, 8)}`,
        symbol: dexscreenerData.symbol || mintAddress.slice(0, 4).toUpperCase(),
        decimals: 9,
        logoURI: dexscreenerData.logoURI || undefined,
      };
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
      // ALWAYS check hardcoded metadata first - this is critical for JDH token
      const hardcoded = HARDCODED_TOKEN_METADATA[mint];
      if (hardcoded) {
        // For JDH token (GkDEVLZP), try GMGN.ai first for logo (user requested)
        if (mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
          // Try GMGN.ai first (user requested this source) - mainly for logo
          const gmgnLogo = await fetchGMGNLogo(mint);
          if (gmgnLogo) {
            metadataMap[mint] = {
              ...hardcoded,
              // ALWAYS keep hardcoded name and symbol - these are correct
              name: hardcoded.name, // "JDH Token" - never override
              symbol: hardcoded.symbol, // "JDH" - never override
              logoURI: gmgnLogo, // Use GMGN logo
              decimals: hardcoded.decimals,
            };
            return;
          }
          
          // Fallback to DEXScreener token-pairs API for logo
          const dexscreenerPairsData = await fetchDEXScreenerPairsMetadata(mint);
          if (dexscreenerPairsData?.logoURI) {
            metadataMap[mint] = {
              ...hardcoded,
              // ALWAYS keep hardcoded name and symbol - these are correct
              name: hardcoded.name, // "JDH Token"
              symbol: hardcoded.symbol, // "JDH"
              logoURI: dexscreenerPairsData.logoURI,
              decimals: hardcoded.decimals,
            };
            return;
          }
          
          // If no logo found, still return hardcoded metadata with correct name/symbol
          metadataMap[mint] = hardcoded;
          return;
        }
        
        // For other hardcoded tokens, try Jupiter API for logo
        const jupiterData = await fetchJupiterMetadata(mint);
        
        // Use hardcoded name and symbol, but try to get logo from Jupiter
        metadataMap[mint] = {
          ...hardcoded,
          // ALWAYS keep hardcoded name and symbol - these are correct
          name: hardcoded.name,
          symbol: hardcoded.symbol,
          // Only update logoURI if we get it from Jupiter
          logoURI: jupiterData?.logoURI || hardcoded.logoURI,
          decimals: jupiterData?.decimals || hardcoded.decimals,
        };
        
        // If still no logo, try DEXScreener as fallback
        if (!metadataMap[mint].logoURI) {
          const logoURI = await fetchDEXScreenerLogo(mint);
          if (logoURI) {
            metadataMap[mint].logoURI = logoURI;
          }
        }
        return;
      }

      const token = tokenList.find(t => t.address.toLowerCase() === mint.toLowerCase());
      if (token) {
        // If token found but no logo, try Jupiter API first, then DEXScreener
        if (!token.logoURI) {
          const jupiterData = await fetchJupiterMetadata(mint);
          if (jupiterData?.logoURI) {
            metadataMap[mint] = { ...token, logoURI: jupiterData.logoURI };
            return;
          }
          const logoURI = await fetchDEXScreenerLogo(mint);
          if (logoURI) {
            metadataMap[mint] = { ...token, logoURI };
            return;
          }
        }
        metadataMap[mint] = token;
      } else {
        // Try Jupiter API first (most reliable for Solana tokens)
        let jupiterData = await fetchJupiterMetadata(mint);
        
        // If Jupiter doesn't have it, try DEXScreener
        if (!jupiterData) {
          jupiterData = await fetchDEXScreenerMetadata(mint);
        }
        
        metadataMap[mint] = {
          address: mint,
          name: jupiterData?.name || `Token ${mint.slice(0, 8)}`,
          symbol: jupiterData?.symbol || mint.slice(0, 4).toUpperCase(),
          decimals: jupiterData?.decimals || 9,
          logoURI: jupiterData?.logoURI || undefined,
        };
      }
    }));

    return metadataMap;
  } catch (error) {
    console.error('Error fetching multiple token metadata:', error);
    // Return fallback metadata with hardcoded check - ALWAYS check hardcoded first
    const metadataMap: Record<string, TokenMetadata> = {};
    mintAddresses.forEach(mint => {
      // ALWAYS check hardcoded metadata first, even in error case
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

