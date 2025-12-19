import { getVerifiedToken } from './solana/verified.js';
import { JupiterMetadataProvider } from './solana/jupiter.js';
import { cache } from '../cache/index.js';
import type { MetadataProvider } from './interfaces.js';
import type { TokenMetadata, Chain } from '../../types/index.js';

const providers = new Map<Chain, MetadataProvider>();

export function getMetadataProvider(chain: Chain = 'solana'): MetadataProvider {
  if (providers.has(chain)) {
    return providers.get(chain)!;
  }

  let provider: MetadataProvider;

  if (chain === 'solana') {
    provider = new JupiterMetadataProvider();
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  providers.set(chain, provider);
  return provider;
}

export async function getTokenMetadata(
  mintOrContract: string,
  chain: Chain = 'solana'
): Promise<TokenMetadata | null> {
  // Check verified tokens first
  const verified = getVerifiedToken(chain, mintOrContract);
  if (verified) {
    return verified;
  }

  // Check cache
  const cached = await cache.get<TokenMetadata>(`metadata:${chain}:${mintOrContract}`);
  if (cached) return cached;

  // Fetch from provider
  const provider = getMetadataProvider(chain);
  const metadata = await provider.getTokenMetadata(mintOrContract);

  if (metadata) {
    await cache.set(`metadata:${chain}:${mintOrContract}`, metadata, { ttl: 86400 }); // 24h
  }

  return metadata;
}

export async function getMultipleTokenMetadata(
  mintsOrContracts: string[],
  chain: Chain = 'solana'
): Promise<Map<string, TokenMetadata>> {
  const result = new Map<string, TokenMetadata>();
  const uncached: string[] = [];

  // Check verified tokens and cache first
  for (const mint of mintsOrContracts) {
    const verified = getVerifiedToken(chain, mint);
    if (verified) {
      result.set(mint, verified);
      continue;
    }

    const cached = await cache.get<TokenMetadata>(`metadata:${chain}:${mint}`);
    if (cached) {
      result.set(mint, cached);
    } else {
      uncached.push(mint);
    }
  }

  if (uncached.length === 0) return result;

  // Fetch uncached from provider
  const provider = getMetadataProvider(chain);
  const fetched = await provider.getMultipleTokenMetadata(uncached);

  for (const [mint, metadata] of fetched) {
    result.set(mint, metadata);
    await cache.set(`metadata:${chain}:${mint}`, metadata, { ttl: 86400 });
  }

  return result;
}

