import { useState, useEffect } from 'react';
import { Coin } from '../types';
import { getWARPPrice, convertUsdToThb, getTokenPrices, TOKEN_MINTS, getJDHPrice, getCoinGeckoPrices } from '../services/priceService';
import { getCoinLogoWithFallback, PREDEFINED_LOGOS, getJDHFromDEXScreenerPairs } from '../services/coinLogoService';

// Hook to fetch real prices and logos for mock coins (like WARP)
export const useMockCoinPrices = (mockCoins: Coin[]): Coin[] => {
  const [coinsWithPrices, setCoinsWithPrices] = useState<Coin[]>(mockCoins);

  useEffect(() => {
    const updatePricesAndLogos = async () => {
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
        }
      });

      // Fetch SOL price from Jupiter API
      const solIndex = updatedCoins.findIndex(coin => coin.symbol === 'SOL');
      if (solIndex !== -1) {
        try {
          const solPriceData = await getTokenPrices([TOKEN_MINTS.SOL]);
          const solData = solPriceData[TOKEN_MINTS.SOL];
          
          if (solData && solData.price > 0) {
            const priceTHB = convertUsdToThb(solData.price);
            const change24h = solData.priceChange24h || 0;
            
            // Generate chart data based on real price
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
          }
        } catch (error) {
          console.warn('Failed to fetch SOL price, using fallback:', error);
        }
      }

      // Fetch real prices from CoinGecko for all major coins
      let coinGeckoPrices: Record<string, any> = {};
      if (coinGeckoIds.length > 0) {
        try {
          coinGeckoPrices = await getCoinGeckoPrices(coinGeckoIds);
        } catch (error) {
          console.warn('Failed to fetch CoinGecko prices:', error);
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
          
          updatedCoins[index] = {
            ...updatedCoins[index],
            price: priceTHB,
            change24h: change24h,
            chartData,
            // Update logo if CoinGecko provides one
            logoURI: priceData.image || updatedCoins[index].logoURI,
          };
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
            const WARP_CONTRACT = '0x5218B89C38Fa966493Cd380E0cB4906342A01a6C';
            logoURI = await getCoinLogoWithFallback(coin.symbol, WARP_CONTRACT);
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
          console.warn(`Failed to fetch logo for ${coin.symbol}:`, error);
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
            
            // Update WARP coin with real price
            updatedCoins[warpIndex] = {
              ...updatedCoins[warpIndex],
              price: priceTHB,
              change24h: change24h,
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
          console.warn('Failed to fetch WARP price, using fallback:', error);
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
          
          // Fetch from DEXScreener token-pairs API (better data for price)
          const jdhData = await getJDHFromDEXScreenerPairs(JDH_MINT);
          
          if (jdhData) {
            const priceTHB = jdhData.price ? convertUsdToThb(jdhData.price) : updatedCoins[jdhIndex].price;
            const change24h = jdhData.priceChange24h || 0;
            
            // Update JDH coin with real price and logo (prefer GMGN logo if available)
            updatedCoins[jdhIndex] = {
              ...updatedCoins[jdhIndex],
              price: priceTHB,
              change24h: change24h,
              logoURI: jdhLogoURI || jdhData.logoURI || updatedCoins[jdhIndex].logoURI,
              // Update chart data based on real price
              chartData: jdhData.price ? [
                { value: jdhData.price * 0.98 },
                { value: jdhData.price * 1.01 },
                { value: jdhData.price * 0.99 },
                { value: jdhData.price },
                { value: jdhData.price * 1.02 },
                { value: jdhData.price * 0.97 },
                { value: jdhData.price },
              ] : updatedCoins[jdhIndex].chartData,
            };
          } else {
            // Fallback to Jupiter Price API
            const priceData = await getTokenPrices([JDH_MINT]);
            const jdhPriceData = priceData[JDH_MINT];
            
            if (jdhPriceData && jdhPriceData.price > 0) {
              const priceTHB = convertUsdToThb(jdhPriceData.price);
              const change24h = jdhPriceData.priceChange24h || 0;
              
              updatedCoins[jdhIndex] = {
                ...updatedCoins[jdhIndex],
                price: priceTHB,
                change24h: change24h,
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
            }
          }
        } catch (error) {
          console.warn('Failed to fetch JDH price, using fallback:', error);
          // Keep the fallback price if fetch fails
        }
      }

      setCoinsWithPrices(updatedCoins);
    };

    updatePricesAndLogos();
    
    // Refresh price every 30 seconds
    const interval = setInterval(updatePricesAndLogos, 30000);
    
    return () => clearInterval(interval);
  }, [mockCoins]);

  return coinsWithPrices;
};


