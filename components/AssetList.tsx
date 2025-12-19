import React from 'react';
import { Coin } from '../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ArrowRight, Star } from 'lucide-react';

interface AssetListProps {
  coins: Coin[];
  compact?: boolean;
  onSelectCoin?: (coin: Coin) => void;
  onToggleFavorite?: (symbol: string) => void;
  favoriteCoins?: Set<string>;
}

export const AssetList: React.FC<AssetListProps> = ({ coins, compact = false, onSelectCoin, onToggleFavorite, favoriteCoins = new Set() }) => {
  return (
    <div className={`flex flex-col gap-3 ${!compact ? 'pb-24 md:pb-0' : ''}`}>
      <div className="flex justify-between items-end px-1 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-medium text-white tracking-tight">สินทรัพย์ <span className="text-zinc-500 text-sm font-light">(Assets)</span></h3>
          <span className="text-sm text-emerald-400 font-semibold">
            ({coins.length} {coins.length === 1 ? 'coin' : 'coins'})
          </span>
        </div>
        {!compact && (
          <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors">
            ดูทั้งหมด <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {coins.map((coin) => {
          const isFavorite = favoriteCoins.has(coin.symbol);
          return (
          <div 
            key={coin.id} 
            className="group bg-zinc-900/40 hover:bg-zinc-800/60 active:bg-zinc-800 backdrop-blur-sm transition-all duration-200 rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-emerald-500/20 cursor-pointer relative"
          >
            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(coin.symbol);
                }}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  size={16} 
                  className={isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'} 
                />
              </button>
            )}
            
            <div 
              onClick={() => onSelectCoin?.(coin)}
              className="flex items-center justify-between w-full"
            >
            {/* Icon & Name */}
            <div className="flex items-center gap-4 w-[40%] md:w-[30%]">
              <div className="relative">
                 {coin.logoURI ? (
                   <img 
                     src={coin.logoURI} 
                     className="w-10 h-10 rounded-full object-cover shadow-lg ring-1 ring-white/10" 
                     alt={coin.symbol}
                     onLoad={() => {
                       if (coin.symbol === 'JDH') {
                         console.log('✅ JDH Logo loaded successfully:', coin.logoURI);
                       }
                     }}
                     onError={(e) => {
                       // Fallback to colored circle if logo fails to load
                       console.error('❌ JDH Logo failed to load:', coin.logoURI, e);
                       const target = e.target as HTMLImageElement;
                       target.style.display = 'none';
                       const fallback = target.nextElementSibling as HTMLElement;
                       if (fallback) fallback.style.display = 'flex';
                     }}
                   />
                 ) : (
                   coin.symbol === 'JDH' && console.warn('⚠️ JDH coin has no logoURI:', coin)
                 )}
                 <div 
                   className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-1 ring-white/10 ${coin.logoURI ? 'hidden' : ''}`}
                   style={{ backgroundColor: coin.color }}
                 >
                   {coin.symbol[0]}
                 </div>
                 <div className="absolute inset-0 rounded-full blur-md opacity-20" style={{ backgroundColor: coin.color }}></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-white leading-tight">{coin.symbol}</span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{coin.name}</span>
              </div>
            </div>

            {/* Mini Chart - Hidden on very small screens if compact */}
            <div className="hidden sm:block w-[25%] h-8 opacity-70 group-hover:opacity-100 transition-opacity min-w-[60px]">
               {coin.chartData && coin.chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={coin.chartData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={coin.change24h >= 0 ? '#10b981' : '#ef4444'} 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <div className="text-zinc-600 text-xs">-</div>
                 </div>
               )}
            </div>

            {/* Price & Balance */}
            <div className="text-right w-[40%] md:w-[30%]">
              <p className="font-bold text-white tracking-tight">฿{coin.price.toLocaleString()}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${coin.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                </span>
              </div>
            </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};