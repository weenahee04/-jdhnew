import { fetch } from 'undici';
import { logger } from '../../common/logger.js';
import { withRetry, withTimeout } from '../../common/index.js';
import { cache } from '../../cache/index.js';
import type { MetadataProvider } from '../interfaces.js';
import type { TokenMetadata } from '../../../types/index.js';

const JUPITER_TOKEN_LIST_URL = 'https://token.jup.ag/all';
const JUPITER_SEARCH_URL = 'https://token.jup.ag/search';

export class JupiterMetadataProvider implements MetadataProvider {
  chain = 'solana' as const;
  private tokenList: Map<string, TokenMetadata> | null = null;

  async getTokenMetadata(mint: string): Promise<TokenMetadata | null> {
    const cached = await cache.get<TokenMetadata>(`metadata:solana:${mint}`);
    if (cached) return cached;

    try {
      // Try search endpoint first
      const searchResult = await withRetry(
        () =>
          withTimeout(
            fetch(`${JUPITER_SEARCH_URL}?query=${mint}`).then((res) => res.json()),
            5000,
            'Jupiter search timeout'
          ),
        { maxAttempts: 2 }
      );

      if (Array.isArray(searchResult) && searchResult.length > 0) {
        const token = searchResult[0];
        const metadata: TokenMetadata = {
          mintOrContract: mint,
          chain: 'solana',
          symbol: token.symbol || 'UNKNOWN',
          name: token.name || 'Unknown Token',
          decimals: token.decimals || 9,
          logoURI: token.logoURI,
          verified: token.verified || false,
          tags: token.tags,
        };

        await cache.set(`metadata:solana:${mint}`, metadata, { ttl: 86400 }); // 24h
        return metadata;
      }

      // Fallback to token list
      const list = await this.getTokenList();
      const token = list.get(mint);
      if (token) {
        await cache.set(`metadata:solana:${mint}`, token, { ttl: 86400 });
        return token;
      }

      return null;
    } catch (error) {
      logger.error('Jupiter metadata fetch error', error);
      return null;
    }
  }

  async getMultipleTokenMetadata(mints: string[]): Promise<Map<string, TokenMetadata>> {
    const result = new Map<string, TokenMetadata>();
    const uncached: string[] = [];

    // Check cache first
    for (const mint of mints) {
      const cached = await cache.get<TokenMetadata>(`metadata:solana:${mint}`);
      if (cached) {
        result.set(mint, cached);
      } else {
        uncached.push(mint);
      }
    }

    if (uncached.length === 0) return result;

    // Fetch uncached tokens
    const list = await this.getTokenList();
    for (const mint of uncached) {
      const token = list.get(mint);
      if (token) {
        result.set(mint, token);
        await cache.set(`metadata:solana:${mint}`, token, { ttl: 86400 });
      }
    }

    return result;
  }

  private async getTokenList(): Promise<Map<string, TokenMetadata>> {
    if (this.tokenList) return this.tokenList;

    const cached = await cache.get<Map<string, TokenMetadata>>('jupiter:token-list');
    if (cached) {
      this.tokenList = cached;
      return cached;
    }

    try {
      const response = await withRetry(
        () =>
          withTimeout(
            fetch(JUPITER_TOKEN_LIST_URL).then((res) => res.json()),
            10000,
            'Jupiter token list timeout'
          ),
        { maxAttempts: 3 }
      );

      const list = new Map<string, TokenMetadata>();
      if (Array.isArray(response)) {
        for (const token of response) {
          list.set(token.address, {
            mintOrContract: token.address,
            chain: 'solana',
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logoURI: token.logoURI,
            verified: token.verified || false,
            tags: token.tags,
          });
        }
      }

      this.tokenList = list;
      await cache.set('jupiter:token-list', list, { ttl: 3600 }); // 1 hour
      return list;
    } catch (error) {
      logger.error('Failed to fetch Jupiter token list', error);
      return new Map();
    }
  }
}

