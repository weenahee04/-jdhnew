import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getBalanceSol, getTokenBalances, TokenBalance } from '../services/solanaClient';
import { getTokenPrices, TOKEN_MINTS, TokenPrice, convertUsdToThb } from '../services/priceService';
import { getMultipleTokenMetadata, TokenMetadata } from '../services/tokenMetadata';
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
      // Fetch SOL balance
      const sol = await getBalanceSol(publicKey);
      setSolBalance(sol);

      // Fetch SPL token balances
      const tokens = await getTokenBalances(publicKey);
      
      // Fetch token metadata (name, symbol, logo) for all tokens
      const mintAddresses = tokens.map(t => t.mint);
      const metadata = await getMultipleTokenMetadata(mintAddresses);
      setTokenMetadata(metadata);
      
      // Debug: Log metadata for GkDEVLZP token
      const gkdevlzpMint = 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR';
      if (mintAddresses.includes(gkdevlzpMint)) {
        const gkdevlzpMeta = metadata[gkdevlzpMint];
        console.log('🔍 GkDEVLZP Metadata:', {
          mint: gkdevlzpMint,
          metadata: gkdevlzpMeta,
          hasMetadata: !!gkdevlzpMeta,
          name: gkdevlzpMeta?.name,
          symbol: gkdevlzpMeta?.symbol,
        });
      }
      
      // Enrich tokens with metadata
      const enrichedTokens = tokens.map(token => {
        const meta = metadata[token.mint];
        
        // For JDH token (GkDEVLZP), ALWAYS use hardcoded name and symbol
        if (token.mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
          return {
            ...token,
            symbol: 'JDH', // Always use JDH
            name: 'JDH Token', // Always use JDH Token
          };
        }
        
        // Priority: metadata > token.symbol/name > fallback
        const symbol = meta?.symbol || token.symbol || token.mint.slice(0, 4).toUpperCase();
        const name = meta?.name || token.name || `Token ${token.mint.slice(0, 8)}`;
        
        // Debug for GkDEVLZP
        if (token.mint === gkdevlzpMint) {
          console.log('🔍 GkDEVLZP Enrichment:', {
            mint: token.mint,
            metaSymbol: meta?.symbol,
            metaName: meta?.name,
            tokenSymbol: token.symbol,
            tokenName: token.name,
            finalSymbol: symbol,
            finalName: name,
          });
        }
        
        return {
          ...token,
          symbol,
          name,
        };
      });
      
      // Detect new tokens by comparing with previous token mints
      const currentTokenMints = new Set(tokens.map(t => t.mint));
      const newTokenMints = new Set<string>();
      
      // Find tokens that are new (not in previousTokenMints)
      const detectedNewTokens: TokenBalance[] = [];
      enrichedTokens.forEach(token => {
        if (!previousTokenMints.has(token.mint) && token.uiAmount > 0) {
          newTokenMints.add(token.mint);
          detectedNewTokens.push(token);
        }
      });
      
      // Update new tokens if any were detected
      if (detectedNewTokens.length > 0) {
        setNewTokens(detectedNewTokens);
        console.log('🆕 New tokens detected:', detectedNewTokens.map(t => ({
          mint: t.mint,
          symbol: t.symbol,
          name: t.name,
          amount: t.uiAmount,
        })));
      }
      
      // Update previous token mints for next comparison
      setPreviousTokenMints(currentTokenMints);
      setTokenBalances(enrichedTokens);

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
        const meta = tokenMetadata[token.mint];
        
        // Only add token if we have price data OR if balance > 0 (show even without price)
        if (token.uiAmount > 0) {
          // For JDH token (GkDEVLZP), fetch price from DEXScreener token-pairs API
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
              // Fallback to existing priceInfo
            }
          }
          
          // For JDH token (GkDEVLZP), ALWAYS use hardcoded name and symbol
          let effectiveSymbol: string;
          let effectiveName: string;
          
          if (token.mint === 'GkDEVLZPab6KKmnAKSaHt8M2RCxkj5SZG88FgfGchPyR') {
            effectiveSymbol = 'JDH'; // Always use JDH
            effectiveName = 'JDH Token'; // Always use JDH Token
          } else {
            // Priority: metadata > priceInfo > fallback
            effectiveSymbol = meta?.symbol || priceInfo?.symbol || token.symbol || token.mint.slice(0, 4).toUpperCase();
            effectiveName = meta?.name || priceInfo?.name || token.name || `Token ${token.mint.slice(0, 8)}`;
          }
          
          const logoURI = meta?.logoURI;
          
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
            logoURI: logoURI, // Add logo URI to coin object
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
    newTokens, // New tokens detected in the last fetch (includes metadata: name, symbol, logoURI)
    clearNewTokens: () => setNewTokens([]), // Function to clear new tokens after notification
    tokenMetadata, // Token metadata map (mint address -> metadata)
  };
};

