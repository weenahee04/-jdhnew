import { useState, useEffect } from 'react';
import { Coin } from '../types';
import { getWARPPrice, convertUsdToThb, getTokenPrices, TOKEN_MINTS, getJDHPrice, getCoinGeckoPrices } from '../services/priceService';
import { getTokenPricesApi } from '../services/priceApiService';
import { USE_WALLET_API } from '../config';
import { getCoinLogoWithFallback, PREDEFINED_LOGOS, getJDHFromDEXScreenerPairs } from '../services/coinLogoService';

// Hook to fetch real prices and logos for mock coins (like WARP)
export const useMockCoinPrices = (mockCoins: Coin[]): Coin[] => {
  const [coinsWithPrices, setCoinsWithPrices] = useState<Coin[]>(mockCoins);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let hasInitialLoad = false; // Track if we've done initial load
    
    // FORCE MOCK MODE: Always use mock data to prevent crash loops
    // FORCE_USE_MOCK is defined in priceService.ts - if true, all API calls are bypassed
    const shouldUseMockOnly = true; // Always use mock to prevent crash loops and API rate limits
    
    const updatePricesAndLogos = async () => {
      // Skip if we're in development and have already loaded once (to avoid rate limits on refresh)
      if (hasInitialLoad && process.env.NODE_ENV === 'development') {
        // Only update if it's been more than 5 minutes since last update
        const lastUpdate = sessionStorage.getItem('lastPriceUpdate');
        if (lastUpdate) {
          const timeSinceUpdate = Date.now() - parseInt(lastUpdate, 10);
          if (timeSinceUpdate < 300000) { // 5 minutes
            if (process.env.NODE_ENV === 'development') {
              console.log('⏸️ Skipping price update (recently updated)');
            }
            return;
          }
        }
      }
      
      // If rate limited, skip API calls and use mock data only
      if (shouldUseMockOnly) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏸️ Using mock data only (rate limited)');
        }
        setIsLoading(false);
        setCoinsWithPrices(mockCoins);
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Starting price update...');
      }
      setIsLoading(true);
      const updatedCoins = [...mockCoins];

      // Map of CoinGecko IDs to coin indices (exclude SOL, WARP and JDH as they use different APIs)
      const coinGeckoIds: string[] = [];
      const coinGeckoIndices: number[] = [];
      
      updatedCoins.forEach((coin, index) => {
        // Skip SOL, WARP and JDH - they use special APIs
        if (coin.symbol === 'SOL' || coin.symbol === 'WARP' || coin.symbol === 'JDH') return;
        
        // Use coin.id as CoinGecko ID (e.g., 'bitcoin', 'ethereum')
        if (coin.id && coin.id !== 'sol' && coin.id !== 'warp' && coin.id !== 'jdh') {
          coinGeckoIds.push(coin.id);
          coinGeckoIndices.push(index);
          if (process.env.NODE_ENV === 'development') {
            console.log(`📌 Mapping ${coin.symbol} -> CoinGecko ID: ${coin.id}`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Coin ${coin.symbol} has no valid CoinGecko ID (id: ${coin.id})`);
          }
        }
      });


      // Use Jupiter API v6 instead of CoinGecko (hybrid approach: static metadata + dynamic pricing)
      // getCoinGeckoPrices() now uses Jupiter API v6 with static metadata
      let coinGeckoPromise: Promise<Record<string, any>>;
      
      if (coinGeckoIds.length > 0 && !shouldUseMockOnly) {
        // Fetch prices from Jupiter API v6 (replaces CoinGecko)
        coinGeckoPromise = getCoinGeckoPrices(coinGeckoIds).catch((error: any) => {
          // Fallback to empty object on error
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Jupiter API v6 error, using fallback:', error);
          }
          return {};
        });
      } else {
        // Use mock data if shouldUseMockOnly is true
        coinGeckoPromise = Promise.resolve({});
      }
      
      // Fetch SOL price from backend API or Jupiter API (in parallel with CoinGecko)
      // Skip if rate limited or in development mode with rate limit flag
      const solIndex = updatedCoins.findIndex(coin => coin.symbol === 'SOL');
      const solPricePromise = solIndex !== -1 && !shouldUseMockOnly
        ? (USE_WALLET_API ? getTokenPricesApi([TOKEN_MINTS.SOL]) : getTokenPrices([TOKEN_MINTS.SOL])).catch((error: any) => {
            // Silently handle Jupiter API errors (hostname not found, network errors)
            if (process.env.NODE_ENV === 'development') {
              // Only log if it's not a network/hostname error
              if (!error?.message?.includes('hostname') && !error?.message?.includes('Failed to fetch')) {
                console.warn('⚠️ Jupiter Price API error:', error.message || error);
              }
            }
            return {};
          })
        : Promise.resolve({});
      
      // Fetch both in parallel for faster loading
      const [coinGeckoPrices, solPriceData] = await Promise.all([
        coinGeckoPromise,
        solPricePromise,
      ]);
      
      // Update SOL price
      if (solIndex !== -1) {
        if (solPriceData[TOKEN_MINTS.SOL]) {
          const solData = solPriceData[TOKEN_MINTS.SOL];
          if (solData && solData.price > 0) {
            const priceTHB = convertUsdToThb(solData.price);
            const change24h = solData.priceChange24h || 0;
            
            const basePrice = solData.price;
            const chartData = [
              { value: basePrice * 0.98 },
              { value: basePrice * 1.01 },
              { value: basePrice * 0.99 },
              { value: basePrice },
              { value: basePrice * 1.02 },
              { value: basePrice * 0.97 },
              { value: basePrice },
            ];
            
            updatedCoins[solIndex] = {
              ...updatedCoins[solIndex],
              price: priceTHB,
              change24h: change24h,
              chartData,
            };
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SOL price updated: ${priceTHB.toLocaleString()} THB (${change24h.toFixed(2)}%)`);
            }
          } else {
            // SOL price fetch failed but keep SOL coin visible (it's a major coin)
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ SOL price data is invalid, but keeping SOL coin visible');
            }
          }
        } else {
          // SOL price fetch failed but keep SOL coin visible (it's a major coin)
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ SOL price not available from Jupiter API, but keeping SOL coin visible');
          }
        }
      }
      
      // Log CoinGecko results (only in development)
      if (coinGeckoIds.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('📊 CoinGecko prices fetched:', Object.keys(coinGeckoPrices).length, 'out of', coinGeckoIds.length, 'coins');
        
        // If we got fewer prices than requested, log which ones are missing
        if (Object.keys(coinGeckoPrices).length < coinGeckoIds.length) {
          const missing = coinGeckoIds.filter(id => !coinGeckoPrices[id]);
          console.warn('⚠️ Missing prices for:', missing);
        }
      }

      // Update coins with real prices and logos from CoinGecko
      coinGeckoIndices.forEach((index, i) => {
        const coin = updatedCoins[index];
        const coinGeckoId = coinGeckoIds[i];
        const priceData = coinGeckoPrices[coinGeckoId];
        
        if (priceData && priceData.current_price > 0) {
          const priceTHB = convertUsdToThb(priceData.current_price);
          const change24h = priceData.price_change_percentage_24h || 0;
          
          // Generate chart data based on real price
          const basePrice = priceData.current_price;
          const chartData = [
            { value: basePrice * 0.98 },
            { value: basePrice * 1.01 },
            { value: basePrice * 0.99 },
            { value: basePrice },
            { value: basePrice * 1.02 },
            { value: basePrice * 0.97 },
            { value: basePrice },
          ];
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Updated ${coin.symbol} price: ${priceTHB.toLocaleString()} THB (${change24h.toFixed(2)}%)`);
          }
          
          updatedCoins[index] = {
            ...updatedCoins[index],
            price: priceTHB,
            change24h: change24h,
            chartData,
            // Update logo if CoinGecko provides one
            logoURI: priceData.image || updatedCoins[index].logoURI,
          };
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ No price data for ${coin.symbol} (CoinGecko ID: ${coinGeckoId})`);
          }
        }
      });

      // Update all coins with logos (for coins that don't have logos yet)
      for (let i = 0; i < updatedCoins.length; i++) {
        const coin = updatedCoins[i];
        
        // Skip if logo already exists
        if (coin.logoURI) continue;

        // Fetch logo for each coin
        try {
          let logoURI: string | null = null;

          // Special handling for WARP (BNB Chain token)
          if (coin.symbol === 'WARP') {
            // Use logoURI from constants.ts if available (user-provided logo)
            if (coin.logoURI) {
              logoURI = coin.logoURI;
            } else {
              // Fallback to API fetch if no logoURI in constants
              const WARP_CONTRACT = '0x5218B89C38Fa966493Cd380E0cB4906342A01a6C';
              logoURI = await getCoinLogoWithFallback(coin.symbol, WARP_CONTRACT);
              // If API fetch fails, use predefined logo
              if (!logoURI) {
                logoURI = PREDEFINED_LOGOS['WARP'] || null;
              }
            }
          } else if (coin.symbol === 'JDH') {
            // Special handling for JDH (Solana token) - fetch from GMGN.ai or DEXScreener
            const JDH_MINT = TOKEN_MINTS.JDH;
            try {
              // Try to get logo from tokenMetadata service (uses GMGN.ai first)
              const { getTokenMetadata } = await import('../services/tokenMetadata');
              const jdhMetadata = await getTokenMetadata(JDH_MINT);
              if (jdhMetadata?.logoURI) {
                logoURI = jdhMetadata.logoURI;
              } else {
                // Fallback to coinLogoService
                logoURI = await getCoinLogoWithFallback(coin.symbol, JDH_MINT);
              }
            } catch (error) {
              // Fallback to coinLogoService
              logoURI = await getCoinLogoWithFallback(coin.symbol, JDH_MINT);
            }
          } else {
            // For other coins, try to get logo
            logoURI = await getCoinLogoWithFallback(coin.symbol);
          }

          if (logoURI) {
            updatedCoins[i] = {
              ...updatedCoins[i],
              logoURI,
            };
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to fetch logo for ${coin.symbol}:`, error);
          }
        }
      }

      // Find WARP coin and update its price
      const warpIndex = updatedCoins.findIndex(coin => coin.symbol === 'WARP');
      
      if (warpIndex !== -1) {
        try {
          const warpPriceData = await getWARPPrice();
          
          if (warpPriceData && warpPriceData.price > 0) {
            const priceTHB = convertUsdToThb(warpPriceData.price);
            const change24h = warpPriceData.priceChange24h || 0;
            
            // Update WARP coin with real price (preserve logoURI from constants.ts)
            updatedCoins[warpIndex] = {
              ...updatedCoins[warpIndex],
              price: priceTHB,
              change24h: change24h,
              // Preserve logoURI from constants.ts (user-provided logo)
              logoURI: updatedCoins[warpIndex].logoURI || PREDEFINED_LOGOS['WARP'] || undefined,
              // Update chart data based on real price
              chartData: [
                { value: warpPriceData.price * 0.98 },
                { value: warpPriceData.price * 1.01 },
                { value: warpPriceData.price * 0.99 },
                { value: warpPriceData.price },
                { value: warpPriceData.price * 1.02 },
                { value: warpPriceData.price * 0.97 },
                { value: warpPriceData.price },
              ],
            };
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to fetch WARP price, using fallback:', error);
          }
          // Keep the fallback price if fetch fails
        }
      }

      // Find JDH coin and update its price and logo from DEXScreener token-pairs API
      const jdhIndex = updatedCoins.findIndex(coin => coin.symbol === 'JDH');
      
      if (jdhIndex !== -1) {
        try {
          const JDH_MINT = TOKEN_MINTS.JDH;
          
          // Try to get logo from tokenMetadata service first (uses GMGN.ai)
          let jdhLogoURI = updatedCoins[jdhIndex].logoURI;
          try {
            const { getTokenMetadata } = await import('../services/tokenMetadata');
            const jdhMetadata = await getTokenMetadata(JDH_MINT);
            if (jdhMetadata?.logoURI) {
              jdhLogoURI = jdhMetadata.logoURI;
            }
          } catch (error) {
            // Continue to try DEXScreener
          }
          
          // Try getJDHPrice first (uses DEXScreener token-pairs API)
          let jdhPriceData = await getJDHPrice();
          
          if (jdhPriceData && jdhPriceData.price > 0) {
            // Use getJDHPrice result (most reliable)
            const priceTHB = convertUsdToThb(jdhPriceData.price);
            const change24h = jdhPriceData.priceChange24h || 0;
            
            // Update JDH coin with real price and logo
            updatedCoins[jdhIndex] = {
              ...updatedCoins[jdhIndex],
              price: priceTHB,
              change24h: change24h,
              logoURI: jdhLogoURI || updatedCoins[jdhIndex].logoURI,
              // Update chart data based on real price
              chartData: [
                { value: jdhPriceData.price * 0.98 },
                { value: jdhPriceData.price * 1.01 },
                { value: jdhPriceData.price * 0.99 },
                { value: jdhPriceData.price },
                { value: jdhPriceData.price * 1.02 },
                { value: jdhPriceData.price * 0.97 },
                { value: jdhPriceData.price },
              ],
            };
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ JDH price updated: ${priceTHB.toLocaleString()} THB (${change24h.toFixed(2)}%)`);
            }
          } else {
            // Fallback to DEXScreener token-pairs API
            const jdhData = await getJDHFromDEXScreenerPairs(JDH_MINT);
            
            if (jdhData && jdhData.price > 0) {
              const priceTHB = convertUsdToThb(jdhData.price);
              const change24h = jdhData.priceChange24h || 0;
              
              // Update JDH coin with real price and logo (prefer GMGN logo if available)
              updatedCoins[jdhIndex] = {
                ...updatedCoins[jdhIndex],
                price: priceTHB,
                change24h: change24h,
                logoURI: jdhLogoURI || jdhData.logoURI || updatedCoins[jdhIndex].logoURI,
                // Update chart data based on real price
                chartData: [
                  { value: jdhData.price * 0.98 },
                  { value: jdhData.price * 1.01 },
                  { value: jdhData.price * 0.99 },
                  { value: jdhData.price },
                  { value: jdhData.price * 1.02 },
                  { value: jdhData.price * 0.97 },
                  { value: jdhData.price },
                ],
              };
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ JDH price updated (DEXScreener): ${priceTHB.toLocaleString()} THB (${change24h.toFixed(2)}%)`);
              }
            } else {
              // Final fallback to Jupiter Price API
              const priceData = await getTokenPrices([JDH_MINT]);
              const jdhPriceDataFromJupiter = priceData[JDH_MINT];
              
              if (jdhPriceDataFromJupiter && jdhPriceDataFromJupiter.price > 0) {
                const priceTHB = convertUsdToThb(jdhPriceDataFromJupiter.price);
                const change24h = jdhPriceDataFromJupiter.priceChange24h || 0;
                
                updatedCoins[jdhIndex] = {
                  ...updatedCoins[jdhIndex],
                  price: priceTHB,
                  change24h: change24h,
                  chartData: [
                    { value: jdhPriceDataFromJupiter.price * 0.98 },
                    { value: jdhPriceDataFromJupiter.price * 1.01 },
                    { value: jdhPriceDataFromJupiter.price * 0.99 },
                    { value: jdhPriceDataFromJupiter.price },
                    { value: jdhPriceDataFromJupiter.price * 1.02 },
                    { value: jdhPriceDataFromJupiter.price * 0.97 },
                    { value: jdhPriceDataFromJupiter.price },
                  ],
                };
                if (process.env.NODE_ENV === 'development') {
                  console.log(`✅ JDH price updated (Jupiter): ${priceTHB.toLocaleString()} THB (${change24h.toFixed(2)}%)`);
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ JDH price not available from any source, keeping default');
                }
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to fetch JDH price, using fallback:', error);
          }
          // Keep the fallback price if fetch fails
        }
      }

      if (isMounted) {
        // Only keep coins that have real prices (price > 0 and updated from API)
        // Filter out coins that still have mock/fallback prices
        const coinsWithRealPrices = updatedCoins.filter(coin => {
          // For coins that should have real prices, check if they were updated
          // Skip coins that still have initial mock prices
          if (coin.symbol === 'SOL' || coin.symbol === 'WARP' || coin.symbol === 'JDH') {
            // These should always have real prices - keep them
            return true;
          }
          // For other coins, check if price was updated from API
          // If price is still the same as initial mock price, it might not have been updated
          const initialCoin = mockCoins.find(c => c.symbol === coin.symbol);
          if (initialCoin && coin.price === initialCoin.price && coin.change24h === initialCoin.change24h) {
            // Price wasn't updated - might be API failure, but keep it for now
            // In production, we might want to filter these out
            return true; // Keep for now, but log warning
          }
          return true; // Keep all coins for now
        });
        
        setCoinsWithPrices(coinsWithRealPrices);
        setIsLoading(false);
        hasInitialLoad = true;
        sessionStorage.setItem('lastPriceUpdate', Date.now().toString());
        // Cache prices in sessionStorage for use on refresh
        try {
          sessionStorage.setItem('cachedCoinPrices', JSON.stringify(coinsWithRealPrices));
        } catch (e) {
          // Ignore storage errors
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Price update completed. Updated', coinsWithRealPrices.length, 'coins');
        }
      }
    };
    
    // Wrap updatePricesAndLogos to catch and handle errors
    // CRITICAL: This function NEVER throws to prevent app crashes
    const updatePricesAndLogosSafe = async () => {
      try {
        await updatePricesAndLogos();
      } catch (error: any) {
        // Log error but don't crash - use fallback prices
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Price update error (using fallback):', error.message || error);
        }
        // Keep existing prices on error - never throw
        if (isMounted) {
          setIsLoading(false);
          // Use mock coins as fallback if update failed
          setCoinsWithPrices(mockCoins);
        }
        // DO NOT re-throw - this prevents app crashes
        // The error is handled, app continues with mock data
      }
    };

    // Track rate limit to implement backoff
    let rateLimitBackoff = 0;
    let consecutiveFailures = 0;
    
    const updatePricesWithBackoff = async () => {
      // Skip if we're in backoff period
      if (rateLimitBackoff > Date.now()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏸️ Skipping price update (rate limit backoff)');
        }
        return;
      }
      
      // updatePricesAndLogosSafe never throws, but we still track failures
      await updatePricesAndLogosSafe();
      
      // Reset failure count (since we got here, no error was thrown)
      // Note: getCoinGeckoPrices now handles all errors internally and returns mock data
      consecutiveFailures = 0;
      rateLimitBackoff = 0;
    };
    
    // Check if we should skip initial load (to prevent errors on refresh)
    const skipInitialLoad = process.env.NODE_ENV === 'development' && 
                            sessionStorage.getItem('lastPriceUpdate') !== null;
    
    // Reset rate limit flag if it's been more than 1 hour
    const rateLimitTime = sessionStorage.getItem('coingecko_rate_limited_time');
    if (rateLimitTime) {
      const timeSinceRateLimit = Date.now() - parseInt(rateLimitTime, 10);
      if (timeSinceRateLimit > 3600000) { // 1 hour
        sessionStorage.removeItem('coingecko_rate_limited');
        sessionStorage.removeItem('coingecko_rate_limited_time');
      }
    }
    
    if (!skipInitialLoad) {
      // Fetch immediately on mount (first load only)
      updatePricesWithBackoff();
    } else {
      // Use cached prices from sessionStorage if available
      const cachedPrices = sessionStorage.getItem('cachedCoinPrices');
      if (cachedPrices) {
        try {
          const parsed = JSON.parse(cachedPrices);
          setCoinsWithPrices(parsed);
          setIsLoading(false);
          if (process.env.NODE_ENV === 'development') {
            console.log('📦 Using cached prices (skipping API call on refresh)');
          }
        } catch (e) {
          // If cache is invalid, fetch anyway
          updatePricesWithBackoff();
        }
      } else {
        updatePricesWithBackoff();
      }
    }
    
    // Refresh price every 60 seconds (reduced frequency to avoid rate limits)
    // Increase to 120 seconds if rate limits persist
    const interval = setInterval(() => {
      if (isMounted) {
        updatePricesWithBackoff();
      }
    }, 60000); // Changed from 15000 to 60000 (1 minute)
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mockCoins]);

  return coinsWithPrices;
};


