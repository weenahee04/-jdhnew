import { getEnv } from '../../config/env.js';
import { JupiterSwapProvider } from './jupiter.js';
import type { SwapQuote, SwapBuildParams, SwapTransaction, Chain } from '../../types/index.js';

const providers = new Map<Chain, JupiterSwapProvider>();

export function getSwapProvider(chain: Chain = 'solana'): JupiterSwapProvider {
  if (providers.has(chain)) {
    return providers.get(chain)!;
  }

  if (chain === 'solana') {
    const provider = new JupiterSwapProvider();
    providers.set(chain, provider);
    return provider;
  }

  throw new Error(`Unsupported chain for swap: ${chain}`);
}

export async function getSwapQuoteData(
  inputMint: string,
  outputMint: string,
  amount: string,
  chain: Chain = 'solana',
  slippageBps = 50
): Promise<SwapQuote> {
  const env = getEnv();
  if (!env.ENABLE_SWAP) {
    throw new Error('Swap is disabled');
  }

  const provider = getSwapProvider(chain);
  return provider.getQuote(inputMint, outputMint, amount, slippageBps);
}

export async function buildSwapTx(
  params: SwapBuildParams,
  chain: Chain = 'solana'
): Promise<SwapTransaction> {
  const env = getEnv();
  if (!env.ENABLE_SWAP) {
    throw new Error('Swap is disabled');
  }

  const provider = getSwapProvider(chain);
  return provider.buildTransaction(params);
}

