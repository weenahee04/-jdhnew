import { getEnv } from '../../config/env.js';
import { HeliusRpcProvider } from './solana/helius.js';
import { SolanaRpcProvider } from './solana/fallback.js';
import type { RpcProvider } from './interfaces.js';
import type { Chain } from '../../types/index.js';

const providers = new Map<Chain, RpcProvider>();

export function getRpcProvider(chain: Chain = 'solana'): RpcProvider {
  if (providers.has(chain)) {
    return providers.get(chain)!;
  }

  let provider: RpcProvider;

  if (chain === 'solana') {
    const env = getEnv();
    // Prefer Helius if available, fallback to public RPC
    if (env.HELIUS_RPC_URL || env.HELIUS_API_KEY) {
      provider = new HeliusRpcProvider();
    } else {
      provider = new SolanaRpcProvider();
    }
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  providers.set(chain, provider);
  return provider;
}

