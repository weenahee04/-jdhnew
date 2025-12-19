import { fetch } from 'undici';
import { getEnv } from '../../config/env.js';
import { logger } from '../common/logger.js';
import { withRetry, withTimeout } from '../common/index.js';
import type { SwapQuote, SwapBuildParams, SwapTransaction } from '../../types/index.js';

export class JupiterSwapProvider {
  private apiUrl: string;

  constructor() {
    const env = getEnv();
    this.apiUrl = env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps = 50
  ): Promise<SwapQuote> {
    const url = `${this.apiUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;

    const data = await withRetry(
      () =>
        withTimeout(
          fetch(url).then((res) => {
            if (!res.ok) {
              throw new Error(`Jupiter quote API error: ${res.status}`);
            }
            return res.json();
          }),
          10000,
          'Jupiter quote timeout'
        ),
      { maxAttempts: 3 }
    );

    return {
      inputMint,
      outputMint,
      inputAmount: amount,
      outputAmount: data.outAmount || '0',
      priceImpact: data.priceImpactPct || 0,
      route: data,
      fee: data.platformFee
        ? {
            amount: data.platformFee.amount || '0',
            mint: data.platformFee.mint || inputMint,
          }
        : undefined,
    };
  }

  async buildTransaction(params: SwapBuildParams): Promise<SwapTransaction> {
    const { userPublicKey, inputMint, outputMint, inputAmount, slippageBps, quoteResponse } = params;

    const url = `${this.apiUrl}/swap`;
    const body = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    };

    const data = await withRetry(
      () =>
        withTimeout(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).then((res) => {
            if (!res.ok) {
              throw new Error(`Jupiter swap API error: ${res.status}`);
            }
            return res.json();
          }),
          15000,
          'Jupiter swap build timeout'
        ),
      { maxAttempts: 3 }
    );

    return {
      transaction: data.swapTransaction,
      swapQuote: quoteResponse,
    };
  }
}

