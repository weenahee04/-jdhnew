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

// Main function: Get token metadata
export async function getTokenMeta(mint: string): Promise<TokenMeta> {
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

