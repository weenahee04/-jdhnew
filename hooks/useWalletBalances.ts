import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getBalanceSol, getTokenBalances, TokenBalance } from '../services/solanaClient';
import { getTokenPrices, TOKEN_MINTS, TokenPrice, convertUsdToThb } from '../services/priceService';
import { Coin } from '../types';

export const useWalletBalances = (publicKey: PublicKey | null) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(0);
      setTokenBalances([]);
      setCoins([]);
      setTotalBalanceUSD(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch SOL balance
      const sol = await getBalanceSol(publicKey);
      setSolBalance(sol);

      // Fetch SPL token balances
      const tokens = await getTokenBalances(publicKey);
      setTokenBalances(tokens);

      // Fetch prices for all tokens
      const allMints = [TOKEN_MINTS.SOL, ...tokens.map(t => t.mint)];
      const priceData = await getTokenPrices(allMints);
      setPrices(priceData);

      // Build coins array
      const coinsList: Coin[] = [];

      // Add SOL
      const solPrice = priceData[TOKEN_MINTS.SOL];
      if (solPrice && sol > 0) {
        const solUsd = sol * solPrice.price;
        coinsList.push({
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          price: convertUsdToThb(solPrice.price),
          change24h: solPrice.priceChange24h,
          balance: sol,
          balanceUsd: solUsd,
          color: '#14F195',
          chartData: [{ value: solPrice.price }, { value: solPrice.price * 1.01 }, { value: solPrice.price * 0.99 }, { value: solPrice.price }],
          about: 'Solana is a high-performance blockchain supporting builders around the world.',
        });
      }

      // Add SPL tokens
      for (const token of tokens) {
        const priceInfo = priceData[token.mint];
        if (priceInfo && token.uiAmount > 0) {
          const tokenUsd = token.uiAmount * priceInfo.price;
          coinsList.push({
            id: token.mint,
            symbol: priceInfo.symbol,
            name: priceInfo.name,
            price: convertUsdToThb(priceInfo.price),
            change24h: priceInfo.priceChange24h,
            balance: token.uiAmount,
            balanceUsd: tokenUsd,
            color: `#${token.mint.slice(0, 6)}`,
            chartData: [{ value: priceInfo.price }, { value: priceInfo.price * 1.01 }, { value: priceInfo.price * 0.99 }, { value: priceInfo.price }],
            about: `${priceInfo.name} (${priceInfo.symbol}) token on Solana.`,
          });
        }
      }

      setCoins(coinsList);

      // Calculate total balance
      const total = coinsList.reduce((sum, coin) => sum + coin.balanceUsd, 0);
      setTotalBalanceUSD(total);
    } catch (err: any) {
      console.error('Balance fetch error:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Auto-refresh balances
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
      // Refresh every 30 seconds
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [publicKey, fetchBalances]);

  return {
    solBalance,
    tokenBalances,
    coins,
    totalBalanceUSD,
    totalBalanceTHB: convertUsdToThb(totalBalanceUSD),
    loading,
    error,
    prices,
    refresh: fetchBalances,
  };
};

