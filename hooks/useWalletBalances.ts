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
  const [previousTokenMints, setPreviousTokenMints] = useState<Set<string>>(new Set());
  const [newTokens, setNewTokens] = useState<TokenBalance[]>([]);

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
      
      // Detect new tokens by comparing with previous token mints
      const currentTokenMints = new Set(tokens.map(t => t.mint));
      const newTokenMints = new Set<string>();
      
      // Find tokens that are new (not in previousTokenMints)
      const detectedNewTokens: TokenBalance[] = [];
      tokens.forEach(token => {
        if (!previousTokenMints.has(token.mint) && token.uiAmount > 0) {
          newTokenMints.add(token.mint);
          detectedNewTokens.push(token);
        }
      });
      
      // Update new tokens if any were detected
      if (detectedNewTokens.length > 0) {
        setNewTokens(detectedNewTokens);
        console.log('🆕 New tokens detected:', detectedNewTokens.map(t => t.mint));
      }
      
      // Update previous token mints for next comparison
      setPreviousTokenMints(currentTokenMints);
      setTokenBalances(tokens);

      // Fetch prices for all tokens
      const allMints = [TOKEN_MINTS.SOL, ...tokens.map(t => t.mint)];
      const priceData = await getTokenPrices(allMints);
      setPrices(priceData);

      // Build coins array
      const coinsList: Coin[] = [];

      // Add SOL - use fallback price if API fails
      const solPrice = priceData[TOKEN_MINTS.SOL];
      const fallbackSolPrice = 150; // Fallback to ~$150 USD if price fetch fails
      if (sol > 0) {
        const effectiveSolPrice = solPrice || {
          id: TOKEN_MINTS.SOL,
          symbol: 'SOL',
          name: 'Solana',
          price: fallbackSolPrice,
          priceChange24h: 0,
          decimals: 9,
        };
        const solUsd = sol * effectiveSolPrice.price;
        coinsList.push({
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          price: convertUsdToThb(effectiveSolPrice.price),
          change24h: effectiveSolPrice.priceChange24h,
          balance: sol,
          balanceUsd: solUsd,
          color: '#14F195',
          chartData: [{ value: effectiveSolPrice.price }, { value: effectiveSolPrice.price * 1.01 }, { value: effectiveSolPrice.price * 0.99 }, { value: effectiveSolPrice.price }],
          about: 'Solana is a high-performance blockchain supporting builders around the world.',
        });
      }

      // Add SPL tokens - skip if price not available (non-critical)
      for (const token of tokens) {
        const priceInfo = priceData[token.mint];
        // Only add token if we have price data OR if balance > 0 (show even without price)
        if (token.uiAmount > 0) {
          // Use fallback price if not available
          const effectivePrice = priceInfo?.price || 0;
          const effectiveChange24h = priceInfo?.priceChange24h || 0;
          // Try to get symbol/name from priceInfo, otherwise use mint address short form
          const effectiveSymbol = priceInfo?.symbol || token.mint.slice(0, 4).toUpperCase() + '...';
          const effectiveName = priceInfo?.name || `Token ${token.mint.slice(0, 8)}`;
          
          // Store symbol and name in token balance for new token detection
          token.symbol = effectiveSymbol;
          token.name = effectiveName;
          const tokenUsd = effectivePrice > 0 ? token.uiAmount * effectivePrice : 0;
          coinsList.push({
            id: token.mint,
            symbol: effectiveSymbol,
            name: effectiveName,
            price: convertUsdToThb(effectivePrice),
            change24h: effectiveChange24h,
            balance: token.uiAmount,
            balanceUsd: tokenUsd,
            color: `#${token.mint.slice(0, 6)}`,
            chartData: effectivePrice > 0 
              ? [{ value: effectivePrice }, { value: effectivePrice * 1.01 }, { value: effectivePrice * 0.99 }, { value: effectivePrice }]
              : [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
            about: `${effectiveName} (${effectiveSymbol}) token on Solana.`,
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
    newTokens, // New tokens detected in the last fetch
    clearNewTokens: () => setNewTokens([]), // Function to clear new tokens after notification
  };
};

