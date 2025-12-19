// Hook that uses backend API for wallet balances
import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getPortfolioFromApi } from '../services/walletApiService';
import { getBalanceSol, getTokenBalances, TokenBalance } from '../services/solanaClient';
import { getTokenPrices, TOKEN_MINTS, TokenPrice, convertUsdToThb } from '../services/priceService';
import { getMultipleTokenMetadata, TokenMetadata } from '../services/tokenMetadata';
import { USE_WALLET_API } from '../config';
import { Coin } from '../types';

export const useWalletBalancesApi = (publicKey: PublicKey | null) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
  const [previousTokenMints, setPreviousTokenMints] = useState<Set<string>>(new Set());
  const [newTokens, setNewTokens] = useState<TokenBalance[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

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
      // Try backend API first if enabled
      if (USE_WALLET_API) {
        const portfolio = await getPortfolioFromApi(publicKey.toString(), 'solana');
        if (portfolio) {
          // Use portfolio data from API
          const solCoin = portfolio.tokens.find(c => c.symbol === 'SOL');
          setSolBalance(solCoin?.balance || 0);
          setCoins(portfolio.tokens);
          setTotalBalanceUSD(portfolio.totalBalanceUsd);
          
          // Convert to token balances format
          const balances: TokenBalance[] = portfolio.tokens
            .filter(c => c.symbol !== 'SOL')
            .map(c => ({
              mint: c.id,
              symbol: c.symbol,
              name: c.name,
              uiAmount: c.balance,
              amount: (c.balance * Math.pow(10, 9)).toString(), // Approximate
            }));
          setTokenBalances(balances);
          setLoading(false);
          return;
        }
      }

      // Fallback to direct RPC (existing logic)
      const sol = await getBalanceSol(publicKey);
      setSolBalance(sol);

      const tokens = await getTokenBalances(publicKey);
      const mintAddresses = tokens.map(t => t.mint);
      const metadata = await getMultipleTokenMetadata(mintAddresses);
      setTokenMetadata(metadata);

      const enrichedTokens = tokens.map(token => {
        const meta = metadata[token.mint];
        if (token.mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
          return {
            ...token,
            symbol: 'JDH',
            name: 'JDH Token',
          };
        }
        const symbol = meta?.symbol || token.symbol || token.mint.slice(0, 4).toUpperCase();
        const name = meta?.name || token.name || `Token ${token.mint.slice(0, 8)}`;
        return { ...token, symbol, name };
      });

      const currentTokenMints = new Set(tokens.map(t => t.mint));
      const detectedNewTokens: TokenBalance[] = [];
      enrichedTokens.forEach(token => {
        if (!previousTokenMints.has(token.mint) && token.uiAmount > 0) {
          detectedNewTokens.push(token);
        }
      });

      if (detectedNewTokens.length > 0) {
        setNewTokens(detectedNewTokens);
      }

      setPreviousTokenMints(currentTokenMints);
      setTokenBalances(enrichedTokens);

      const allMints = [TOKEN_MINTS.SOL, ...tokens.map(t => t.mint)];
      const uniqueMints = Array.from(new Set(allMints));
      const priceData = await getTokenPrices(uniqueMints);
      setPrices(priceData);

      const coinsList: Coin[] = [];
      const solPrice = priceData[TOKEN_MINTS.SOL];
      
      if (sol > 0) {
        if (!solPrice && process.env.NODE_ENV === 'production') {
          // Skip in production if no price
        } else {
          const effectiveSolPrice = solPrice || {
            id: TOKEN_MINTS.SOL,
            symbol: 'SOL',
            name: 'Solana',
            price: 150,
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
      }

      for (const token of tokens) {
        const priceInfo = priceData[token.mint];
        const meta = tokenMetadata[token.mint];
        
        if (token.uiAmount > 0) {
          let effectivePrice = priceInfo?.price || 0;
          let effectiveChange24h = priceInfo?.priceChange24h || 0;
          
          if (token.mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
            try {
              const { getJDHPrice } = await import('../services/priceService');
              const jdhPriceData = await getJDHPrice();
              if (jdhPriceData && jdhPriceData.price > 0) {
                effectivePrice = jdhPriceData.price;
                effectiveChange24h = jdhPriceData.priceChange24h || 0;
              }
            } catch (error) {
              // Fallback
            }
          }
          
          let effectiveSymbol: string;
          let effectiveName: string;
          let logoURI: string | undefined;
          
          if (token.mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
            effectiveSymbol = 'JDH';
            effectiveName = 'JDH Token';
            logoURI = meta?.logoURI;
            
            if (!logoURI) {
              try {
                const { getTokenMetadata } = await import('../services/tokenMetadata');
                const jdhMetadata = await getTokenMetadata(token.mint);
                logoURI = jdhMetadata?.logoURI;
              } catch (error) {
                // Silently fail
              }
            }
          } else {
            effectiveSymbol = meta?.symbol || priceInfo?.symbol || token.symbol || token.mint.slice(0, 4).toUpperCase();
            effectiveName = meta?.name || priceInfo?.name || token.name || `Token ${token.mint.slice(0, 8)}`;
            logoURI = meta?.logoURI;
          }
          
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
            logoURI: logoURI,
          });
        }
      }

      setCoins(coinsList);
      const total = coinsList.reduce((sum, coin) => sum + coin.balanceUsd, 0);
      setTotalBalanceUSD(total);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Balance fetch error:', err);
      }
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
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
    newTokens,
    clearNewTokens: () => setNewTokens([]),
    tokenMetadata,
  };
};

