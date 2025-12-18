/**
 * Token Metadata Resolver for Solana SPL Tokens
 * 
 * Strategy:
 * 1. Try Jupiter Tokens API v2
 * 2. Fallback to Metaplex Token Metadata
 * 3. Return Unknown Token if all fail
 */

import { PublicKey, Connection } from '@solana/web3.js';
import bs58 from 'bs58';

// Types
export type TokenMetaSource = 'jupiter' | 'metaplex' | 'unknown';

export interface TokenMeta {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  source: TokenMetaSource;
}

// Cache implementation
interface CacheEntry {
  data: TokenMeta;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const cache = new Map<string, CacheEntry>();

// Get RPC connection (reuse from solanaClient if available)
const getConnection = (): Connection => {
  // Try to get from environment or use default
  const rpcUrl = typeof process !== 'undefined' && process.env?.HELIUS_RPC_URL
    ? process.env.HELIUS_RPC_URL
    : typeof process !== 'undefined' && process.env?.SOLANA_RPC_URL
    ? process.env.SOLANA_RPC_URL
    : 'https://api.mainnet-beta.solana.com';
  
  return new Connection(rpcUrl, 'confirmed');
};

// Validate mint address
function validateMint(mint: string): boolean {
  try {
    // Check if it's a valid base58 string
    const decoded = bs58.decode(mint);
    // Solana public keys are 32 bytes
    if (decoded.length !== 32) {
      return false;
    }
    // Try to create PublicKey to validate
    new PublicKey(mint);
    return true;
  } catch {
    return false;
  }
}

// Step A: Fetch from Jupiter Tokens API v2
async function fetchFromJupiter(mint: string): Promise<TokenMeta | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(mint)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Jupiter API returns array of tokens
    if (Array.isArray(data) && data.length > 0) {
      const token = data.find((t: any) => 
        t.address?.toLowerCase() === mint.toLowerCase()
      ) || data[0];

      if (token) {
        return {
          mint: token.address || mint,
          name: token.name || 'Unknown Token',
          symbol: token.symbol || 'UNKNOWN',
          decimals: token.decimals || 9,
          logoURI: token.logoURI,
          source: 'jupiter',
        };
      }
    }

    return null;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.warn('Jupiter API fetch error:', error.message);
    }
    return null;
  }
}

// Step B: Fetch from Metaplex Token Metadata
async function fetchFromMetaplex(mint: string): Promise<TokenMeta | null> {
  try {
    const connection = getConnection();
    const mintPubkey = new PublicKey(mint);

    // Get mint info to get decimals
    let decimals = 9;
    try {
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
      if (mintInfo.value) {
        const parsed = mintInfo.value.data as any;
        decimals = parsed?.parsed?.info?.decimals || 9;
      }
    } catch (e) {
      // Continue with default decimals
    }

    // Try to fetch Metaplex metadata
    // Metaplex Token Metadata Program ID
    const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    
    // Derive metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPubkey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    try {
      const metadataAccount = await connection.getAccountInfo(metadataPDA);
      if (!metadataAccount) {
        // Try alternative: fetch from common metadata endpoints
        const metadataUri = await fetchMetadataUri(mint);
        if (metadataUri) {
          try {
            const metadataResponse = await fetch(metadataUri, {
              signal: AbortSignal.timeout(5000),
            });
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              return {
                mint,
                name: metadata.name || 'Unknown Token',
                symbol: metadata.symbol || 'UNKNOWN',
                decimals,
                logoURI: metadata.image || metadata.logoURI,
                source: 'metaplex',
              };
            }
          } catch (e) {
            // Continue to fallback
          }
        }
        return null;
      }

      // Parse Metaplex metadata account (simplified version)
      // Full parsing would require @metaplex-foundation/mpl-token-metadata
      // For now, we'll try to extract basic info from the account data
      const accountData = metadataAccount.data;
      
      // Try to find URI in the account data (simplified - real parsing is more complex)
      // This is a basic attempt - full implementation would properly deserialize the account
      
      // Try alternative: fetch from common metadata endpoints
      const metadataUri = await fetchMetadataUri(mint);
      if (metadataUri) {
        try {
          const metadataResponse = await fetch(metadataUri, {
            signal: AbortSignal.timeout(5000),
          });
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            return {
              mint,
              name: metadata.name || 'Unknown Token',
              symbol: metadata.symbol || 'UNKNOWN',
              decimals,
              logoURI: metadata.image || metadata.logoURI,
              source: 'metaplex',
            };
          }
        } catch (e) {
          // Continue to fallback
        }
      }

      // Return basic info if we have decimals but no metadata
      return {
        mint,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals,
        logoURI: undefined,
        source: 'metaplex',
      };
    } catch (error) {
      // Metadata account not found or parsing failed
      return null;
    }
  } catch (error: any) {
    console.warn('Metaplex fetch error:', error.message);
    return null;
  }
}

// Helper: Try to fetch metadata URI from common sources
async function fetchMetadataUri(mint: string): Promise<string | null> {
  // Try common metadata endpoints
  const endpoints = [
    `https://api.mainnet-beta.solana.com/api/v0/token-metadata/${mint}`,
    `https://arweave.net/${mint}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { 
        signal: AbortSignal.timeout(5000) 
      });
      if (response.ok) {
        const data = await response.json();
        return data.uri || data.image || null;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// Fetch logo from GMGN.ai (for JDH token)
async function fetchGMGNLogo(mint: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // GMGN.ai API endpoints to try
    const apiEndpoints = [
      `https://gmgn.ai/api/sol/token/${mint}`,
      `https://api.gmgn.ai/sol/token/${mint}`,
      `https://gmgn.ai/api/v1/sol/token/${mint}`,
      `https://gmgn.ai/api/sol/token/solscan_${mint}`,
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

    // If API doesn't work, try to extract from HTML page using CORS proxy
    try {
      const pageUrl = `https://gmgn.ai/sol/token/solscan_${mint}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`;
      
      const proxyResponse = await fetch(proxyUrl, {
        signal: controller.signal,
      });
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        const html = proxyData.contents;
        
        // Try to extract logo URL from HTML
        const imgMatch = html.match(/<img[^>]+src=["']([^"']*logo[^"']*|https?:\/\/[^"']*\.(?:png|jpg|jpeg|svg|webp))[^"']*["']/i);
        if (imgMatch && imgMatch[1]) {
          return imgMatch[1];
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
      }
    } catch (error) {
      // Silently fail
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Fetch logo from DEXScreener token-pairs API (fallback)
async function fetchDEXScreenerLogo(mint: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${mint}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      return data.pairs[0].baseToken?.logoURI || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Hardcoded metadata for specific tokens
const HARDCODED_METADATA: Record<string, TokenMeta> = {
  'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR': {
    mint: 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR',
    name: 'JDH Token',
    symbol: 'JDH',
    decimals: 9,
    logoURI: 'https://img2.pic.in.th/pic/IMG_13847b26fb6a73c061f7.th.jpeg', // User provided logo
    source: 'hardcoded',
  },
  '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx': {
    mint: '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx',
    name: 'JDH Token',
    symbol: 'JDH',
    decimals: 9,
    logoURI: undefined,
    source: 'hardcoded',
  },
};

// Main function: Get token metadata
export async function getTokenMeta(mint: string): Promise<TokenMeta> {
  // ALWAYS check hardcoded metadata first
  const hardcoded = HARDCODED_METADATA[mint];
  if (hardcoded) {
    // Use hardcoded logoURI directly (user provided URL)
    if (hardcoded.logoURI) {
      console.log('✅ JDH Logo from hardcoded (lib):', hardcoded.logoURI);
      return hardcoded;
    }
    
    // If hardcoded logoURI is missing, try to fetch from APIs
    if (mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR' || mint === '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx') {
      const gmgnLogo = await fetchGMGNLogo(mint);
      if (gmgnLogo) {
        return {
          ...hardcoded,
          logoURI: gmgnLogo,
        };
      }
      // Fallback to DEXScreener if GMGN fails
      const logoURI = await fetchDEXScreenerLogo(mint);
      if (logoURI) {
        return {
          ...hardcoded,
          logoURI,
        };
      }
    }
    // Return hardcoded metadata (with or without logo)
    return hardcoded;
  }

  // Validate mint address
  if (!validateMint(mint)) {
    return {
      mint,
      name: 'Invalid Token',
      symbol: 'INVALID',
      decimals: 9,
      logoURI: undefined,
      source: 'unknown',
    };
  }

  // Check cache
  const cached = cache.get(mint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let tokenMeta: TokenMeta | null = null;

  // Step A: Try Jupiter API
  tokenMeta = await fetchFromJupiter(mint);
  if (tokenMeta) {
    cache.set(mint, { data: tokenMeta, timestamp: Date.now() });
    return tokenMeta;
  }

  // Step B: Try Metaplex
  tokenMeta = await fetchFromMetaplex(mint);
  if (tokenMeta) {
    cache.set(mint, { data: tokenMeta, timestamp: Date.now() });
    return tokenMeta;
  }

  // Step C: Return Unknown Token
  tokenMeta = {
    mint,
    name: 'Unknown Token',
    symbol: 'UNKNOWN',
    decimals: 9,
    logoURI: undefined,
    source: 'unknown',
  };

  cache.set(mint, { data: tokenMeta, timestamp: Date.now() });
  return tokenMeta;
}

// Clear cache (useful for testing or manual refresh)
export function clearTokenMetaCache(mint?: string): void {
  if (mint) {
    cache.delete(mint);
  } else {
    cache.clear();
  }
}

