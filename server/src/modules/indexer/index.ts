import { getEnv } from '../../config/env.js';
import { HeliusIndexerProvider } from './solana/helius.js';
import { SolanaRpcIndexerProvider } from './solana/fallback.js';
import type { IndexerProvider } from './interfaces.js';
import type { Chain } from '../../types/index.js';

const providers = new Map<Chain, IndexerProvider>();

export function getIndexerProvider(chain: Chain = 'solana'): IndexerProvider {
  if (providers.has(chain)) {
    return providers.get(chain)!;
  }

  let provider: IndexerProvider;

  if (chain === 'solana') {
    const env = getEnv();
    // Prefer Helius if available
    if (env.HELIUS_API_KEY) {
      provider = new HeliusIndexerProvider();
    } else {
      provider = new SolanaRpcIndexerProvider();
    }
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  providers.set(chain, provider);
  return provider;
}

