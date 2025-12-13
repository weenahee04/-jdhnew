// @ts-ignore - Vite injects these
const BASE = (typeof process !== 'undefined' && process.env?.JUPITER_BASE_URL) || 'https://quote-api.jup.ag';

export interface JupiterQuote {
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  priceImpactPct: number;
  contextSlot: number;
  timeTaken: number;
  routePlan: any[];
}

export const getQuote = async (params: {
  inputMint: string;
  outputMint: string;
  amount: number; // in smallest unit
  slippageBps?: number;
}): Promise<JupiterQuote> => {
  const url = new URL(`${BASE}/v6/quote`);
  url.searchParams.set('inputMint', params.inputMint);
  url.searchParams.set('outputMint', params.outputMint);
  url.searchParams.set('amount', params.amount.toString());
  url.searchParams.set('slippageBps', String(params.slippageBps ?? 100));
  url.searchParams.set('onlyDirectRoutes', 'true');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch quote');
  return res.json();
};

export interface JupiterSwapResponse {
  swapTransaction: string;
}

export const getSwapTransaction = async (body: {
  userPublicKey: string;
  quoteResponse: JupiterQuote;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  dynamicSlippage?: boolean;
}): Promise<JupiterSwapResponse> => {
  const res = await fetch(`${BASE}/v6/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
      wrapAndUnwrapSol: body.wrapAndUnwrapSol ?? true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
    }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch swap transaction: ${error}`);
  }
  return res.json();
};

