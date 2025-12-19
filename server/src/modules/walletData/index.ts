import { getRpcProvider } from '../rpc/index.js';
import { getIndexerProvider } from '../indexer/index.js';
import { getTokenMetadata, getMultipleTokenMetadata } from '../metadata/index.js';
import { getPrices } from '../pricing/index.js';
import { getSwapQuoteData as getSwapQuoteFromModule, buildSwapTx as buildSwapTxFromModule } from '../swap/index.js';
import { getNotificationProvider } from '../notify/index.js';
import { cache } from '../cache/index.js';
import { logger } from '../common/logger.js';
import type {
  Portfolio,
  TokenBalance,
  TransactionHistory,
  TokenMetadata,
  Price,
  PricesResponse,
  SwapQuote,
  SwapBuildParams,
  SwapTransaction,
  Chain,
  PaginationParams,
} from '../../types/index.js';

export async function getPortfolio(address: string, chain: Chain = 'solana'): Promise<Portfolio> {
  const cacheKey = `portfolio:${chain}:${address}`;
  const cached = await cache.get<Portfolio>(cacheKey);
  if (cached) return cached;

  const rpc = getRpcProvider(chain);
  const [nativeBalance, tokenBalances] = await Promise.all([
    rpc.getBalance(address),
    rpc.getTokenBalances(address),
  ]);

  // Get metadata for all tokens
  const mints = tokenBalances.map((t) => t.mint);
  const metadataMap = await getMultipleTokenMetadata(mints, chain);

  // Get prices
  const allMints = ['native', ...mints];
  const prices = await getPrices(allMints, chain);

  const priceMap = new Map(prices.map((p) => [p.symbolOrMint, p.priceUsd]));

  const nativePrice = priceMap.get(nativeIdentifier) || 0;
  const nativeBalanceNum = Number(nativeBalance) / 1e9; // SOL has 9 decimals
  const nativeBalanceUsd = nativeBalanceNum * nativePrice;

  const tokens: TokenBalance[] = [];
  let totalBalanceUsd = nativeBalanceUsd;

  for (const tokenBalance of tokenBalances) {
    const metadata = metadataMap.get(tokenBalance.mint);
    const price = priceMap.get(tokenBalance.mint) || 0;
    const balanceNum = Number(tokenBalance.amount) / Math.pow(10, tokenBalance.decimals);
    const balanceUsd = balanceNum * price;
    totalBalanceUsd += balanceUsd;

    tokens.push({
      mintOrContract: tokenBalance.mint,
      symbol: metadata?.symbol || 'UNKNOWN',
      name: metadata?.name || 'Unknown Token',
      decimals: tokenBalance.decimals,
      balance: tokenBalance.amount,
      balanceUsd,
      logoURI: metadata?.logoURI,
      verified: metadata?.verified || false,
    });
  }

  const portfolio: Portfolio = {
    address,
    chain,
    totalBalanceUsd,
    tokens,
    nativeBalance,
    nativeBalanceUsd,
  };

  await cache.set(cacheKey, portfolio, { ttl: 30 });
  return portfolio;
}

export async function getTokenBalances(address: string, chain: Chain = 'solana'): Promise<TokenBalance[]> {
  const portfolio = await getPortfolio(address, chain);
  return portfolio.tokens;
}

export async function getHistory(
  address: string,
  chain: Chain = 'solana',
  params: PaginationParams = {}
): Promise<TransactionHistory> {
  const { limit = 100, cursor } = params;
  const indexer = getIndexerProvider(chain);
  return indexer.getHistory(address, limit, cursor);
}

export async function getTokenMeta(
  mintOrContract: string,
  chain: Chain = 'solana'
): Promise<TokenMetadata | null> {
  return getTokenMetadata(mintOrContract, chain);
}

export async function getPricesData(
  symbolsOrMints: string[],
  chain: Chain = 'solana',
  fiat = 'usd'
): Promise<PricesResponse> {
  const prices = await getPrices(symbolsOrMints, chain, fiat);
  return {
    prices,
    fiat,
    timestamp: Date.now(),
  };
}

export async function getSwapQuoteData(
  inputMint: string,
  outputMint: string,
  amount: string,
  chain: Chain = 'solana',
  slippageBps = 50
): Promise<SwapQuote> {
  return getSwapQuoteFromModule(inputMint, outputMint, amount, chain, slippageBps);
}

export async function buildSwapTx(
  params: SwapBuildParams,
  chain: Chain = 'solana'
): Promise<SwapTransaction> {
  return buildSwapTxFromModule(params, chain);
}

export async function subscribeAddress(
  address: string,
  chain: Chain = 'solana'
): Promise<string> {
  const provider = getNotificationProvider();
  return provider.subscribeAddress(address, chain);
}

export async function handleWebhook(provider: string, payload: unknown): Promise<void> {
  if (provider === 'helius') {
    const notificationProvider = getNotificationProvider();
    await notificationProvider.handleWebhook(payload);
  } else {
    throw new Error(`Unknown webhook provider: ${provider}`);
  }
}

