import { useState, useEffect } from 'react';
import { Coin } from '../types';
import { getWARPPrice, convertUsdToThb } from '../services/priceService';

// Hook to fetch real prices for mock coins (like WARP)
export const useMockCoinPrices = (mockCoins: Coin[]): Coin[] => {
  const [coinsWithPrices, setCoinsWithPrices] = useState<Coin[]>(mockCoins);

  useEffect(() => {
    const updatePrices = async () => {
      const updatedCoins = [...mockCoins];

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

    updatePrices();
    
    // Refresh price every 30 seconds
    const interval = setInterval(updatePrices, 30000);
    
    return () => clearInterval(interval);
  }, [mockCoins]);

  return coinsWithPrices;
};

