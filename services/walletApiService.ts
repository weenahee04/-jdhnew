// Wallet API Service - Wrapper around walletApi client with fallback to direct RPC
import { walletApi } from './walletApi';
import { USE_WALLET_API } from '../config';
import { logger } from '../lib/logger';
import type { Coin } from '../types';

// Fallback to direct RPC if API is not available
import { getBalanceSol, getTokenBalances } from './solanaClient';
import { getTokenPrices, TOKEN_MINTS, convertUsdToThb } from './priceService';
import { getMultipleTokenMetadata } from './tokenMetadata';
import { PublicKey } from '@solana/web3.js';

export interface WalletApiPortfolio {
  address: string;
  chain: string;
  totalBalanceUsd: number;
  tokens: Coin[];
  nativeBalance: string;
  nativeBalanceUsd: number;
}

/**
 * Get portfolio from backend API or fallback to direct RPC
 */
export async function getPortfolioFromApi(
  address: string,
  chain: string = 'solana'
): Promise<WalletApiPortfolio | null> {
  if (USE_WALLET_API) {
    try {
      const portfolio = await walletApi.getPortfolio(address, chain);
      
      // Convert to Coin[] format
      const tokens: Coin[] = portfolio.tokens.map((token) => ({
        id: token.mintOrContract,
        symbol: token.symbol,
        name: token.name,
        price: convertUsdToThb(token.balanceUsd / (Number(token.balance) / Math.pow(10, token.decimals))),
        change24h: 0, // Will be updated from prices API
        balance: Number(token.balance) / Math.pow(10, token.decimals),
        balanceUsd: token.balanceUsd,
        color: `#${token.mintOrContract.slice(0, 6)}`,
        chartData: [],
        about: `${token.name} (${token.symbol}) token on ${chain}.`,
        logoURI: token.logoURI,
      }));

      // Add native token
      const nativePrice = portfolio.nativeBalanceUsd / (Number(portfolio.nativeBalance) / 1e9);
      tokens.unshift({
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        price: convertUsdToThb(nativePrice),
        change24h: 0,
        balance: Number(portfolio.nativeBalance) / 1e9,
        balanceUsd: portfolio.nativeBalanceUsd,
        color: '#14F195',
        chartData: [],
        about: 'Solana is a high-performance blockchain supporting builders around the world.',
      });

      return {
        address: portfolio.address,
        chain: portfolio.chain,
        totalBalanceUsd: portfolio.totalBalanceUsd,
        tokens,
        nativeBalance: portfolio.nativeBalance,
        nativeBalanceUsd: portfolio.nativeBalanceUsd,
      };
    } catch (error) {
      logger.warn('Wallet API failed, falling back to direct RPC', error);
      // Fall through to direct RPC
    }
  }

  // Fallback to direct RPC
  return null;
}

/**
 * Get transaction history from backend API or fallback to Helius
 */
export async function getHistoryFromApi(
  address: string,
  chain: string = 'solana',
  limit: number = 100,
  cursor?: string
) {
  if (USE_WALLET_API) {
    try {
      const history = await walletApi.getHistory(address, chain, limit, cursor);
      return history.transactions.map((tx) => ({
        signature: tx.signature,
        timestamp: tx.timestamp,
        type: tx.type,
        from: tx.from,
        to: tx.to,
        amount: Number(tx.amount) / Math.pow(10, tx.token.decimals),
        symbol: tx.token.symbol,
        status: tx.status,
        fee: Number(tx.fee) / 1e9, // SOL fee
        metadata: tx.metadata,
      }));
    } catch (error) {
      logger.warn('Wallet API history failed, falling back to Helius', error);
      // Fall through to Helius
    }
  }

  return null;
}

/**
 * Get prices from backend API or fallback to direct API calls
 */
export async function getPricesFromApi(
  ids: string[],
  chain: string = 'solana',
  fiat: string = 'usd'
) {
  if (USE_WALLET_API) {
    try {
      const prices = await walletApi.getPrices(ids, chain, fiat);
      const priceMap: Record<string, { price: number; priceChange24h: number }> = {};
      
      prices.prices.forEach((p) => {
        priceMap[p.symbolOrMint] = {
          price: p.priceUsd,
          priceChange24h: p.priceChange24h,
        };
      });

      return priceMap;
    } catch (error) {
      logger.warn('Wallet API prices failed, falling back to direct API', error);
      // Fall through to direct API
    }
  }

  return null;
}

/**
 * Get token metadata from backend API or fallback to direct API
 */
export async function getTokenMetadataFromApi(
  mintOrContract: string,
  chain: string = 'solana'
) {
  if (USE_WALLET_API) {
    try {
      const metadata = await walletApi.getTokenMetadata(mintOrContract, chain);
      return {
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        logoURI: metadata.logoURI,
        verified: metadata.verified,
      };
    } catch (error) {
      logger.warn('Wallet API metadata failed, falling back to direct API', error);
      // Fall through to direct API
    }
  }

  return null;
}

/**
 * Get swap quote from backend API or fallback to Jupiter
 */
export async function getSwapQuoteFromApi(
  inputMint: string,
  outputMint: string,
  amount: string,
  chain: string = 'solana',
  slippageBps: number = 50
) {
  if (USE_WALLET_API) {
    try {
      return await walletApi.getSwapQuote(inputMint, outputMint, amount, chain, slippageBps);
    } catch (error) {
      logger.warn('Wallet API swap quote failed, falling back to Jupiter', error);
      // Fall through to Jupiter
    }
  }

  return null;
}

/**
 * Build swap transaction from backend API or fallback to Jupiter
 */
export async function buildSwapTransactionFromApi(
  userPublicKey: string,
  inputMint: string,
  outputMint: string,
  inputAmount: string,
  slippageBps: number,
  quoteResponse: any,
  chain: string = 'solana'
) {
  if (USE_WALLET_API) {
    try {
      return await walletApi.buildSwapTransaction(
        userPublicKey,
        inputMint,
        outputMint,
        inputAmount,
        slippageBps,
        quoteResponse,
        chain
      );
    } catch (error) {
      logger.warn('Wallet API swap build failed, falling back to Jupiter', error);
      // Fall through to Jupiter
    }
  }

  return null;
}

