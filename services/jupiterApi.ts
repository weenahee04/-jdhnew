// Jupiter Swap Service with backend API integration
import { getQuote, getSwapTransaction } from './jupiter';
import { getSwapQuoteFromApi, buildSwapTransactionFromApi } from './walletApiService';
import { USE_WALLET_API } from '../config';
import { PublicKey } from '@solana/web3.js';

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  platformFee?: {
    amount?: string;
    feeBps?: number;
  };
  priceImpactPct: number;
  contextSlot?: number;
  timeTaken?: number;
  routePlan: any;
}

export interface SwapParams {
  userPublicKey: PublicKey;
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}

/**
 * Get swap quote - tries backend API first, falls back to Jupiter
 */
export async function getSwapQuoteApi(params: SwapParams): Promise<JupiterQuote> {
  if (USE_WALLET_API) {
    try {
      const quote = await getSwapQuoteFromApi(
        params.inputMint,
        params.outputMint,
        params.amount,
        'solana',
        params.slippageBps || 50
      );
      
      if (quote) {
        // Convert to JupiterQuote format
        return {
          inputMint: quote.inputMint || params.inputMint,
          inAmount: quote.inputAmount || params.amount,
          outputMint: quote.outputMint || params.outputMint,
          outAmount: quote.outputAmount || '0',
          otherAmountThreshold: quote.outputAmount || '0',
          swapMode: 'ExactIn' as const,
          slippageBps: params.slippageBps || 50,
          priceImpactPct: quote.priceImpact || 0,
          contextSlot: 0,
          timeTaken: 0,
          routePlan: quote.route || [],
        };
      }
    } catch (error) {
      console.warn('Backend API swap quote failed, using Jupiter directly', error);
    }
  }

  // Fallback to direct Jupiter API
  return getQuote({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: Number(params.amount),
    slippageBps: params.slippageBps || 50,
  });
}

/**
 * Build swap transaction - tries backend API first, falls back to Jupiter
 */
export async function buildSwapTransactionApi(
  userPublicKey: PublicKey,
  quote: JupiterQuote
): Promise<{ swapTransaction: string }> {
  if (USE_WALLET_API) {
    try {
      const tx = await buildSwapTransactionFromApi(
        userPublicKey.toString(),
        quote.inputMint,
        quote.outputMint,
        quote.inAmount,
        quote.slippageBps,
        {
          inputMint: quote.inputMint,
          outputMint: quote.outputMint,
          inputAmount: quote.inAmount,
          outputAmount: quote.outAmount,
          priceImpact: quote.priceImpactPct,
          route: quote.routePlan,
        },
        'solana'
      );

      if (tx && tx.transaction) {
        return { swapTransaction: tx.transaction };
      }
    } catch (error) {
      console.warn('Backend API swap build failed, using Jupiter directly', error);
    }
  }

  // Fallback to direct Jupiter API
  return getSwapTransaction({
    userPublicKey: userPublicKey.toString(),
    quoteResponse: quote,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    dynamicSlippage: true,
  });
}

