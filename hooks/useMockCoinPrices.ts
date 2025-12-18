import { useState, useEffect } from 'react';
import { Coin } from '../types';
import { getWARPPrice, convertUsdToThb } from '../services/priceService';
import { getCoinLogoWithFallback, PREDEFINED_LOGOS } from '../services/coinLogoService';

// Hook to fetch real prices and logos for mock coins (like WARP)
export const useMockCoinPrices = (mockCoins: Coin[]): Coin[] => {
  const [coinsWithPrices, setCoinsWithPrices] = useState<Coin[]>(mockCoins);

  useEffect(() => {
    const updatePricesAndLogos = async () => {
      const updatedCoins = [...mockCoins];

      // Update all coins with logos
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

      setCoinsWithPrices(updatedCoins);
    };

    updatePricesAndLogos();
    
    // Refresh price every 30 seconds
    const interval = setInterval(updatePricesAndLogos, 30000);
    
    return () => clearInterval(interval);
  }, [mockCoins]);

  return coinsWithPrices;
};


