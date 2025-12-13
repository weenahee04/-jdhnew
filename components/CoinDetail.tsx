import React, { useState } from 'react';
import { Coin, Transaction } from '../types';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCcw, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { TransactionDetailModal } from './SecondaryViews';

interface CoinDetailProps {
  coin: Coin;
  onBack: () => void;
  transactions: Transaction[];
  onAction: (type: 'send' | 'receive' | 'swap') => void;
}

export const CoinDetail: React.FC<CoinDetailProps> = ({ coin, onBack, transactions, onAction }) => {
  // Filter transactions for this coin
  const coinTxs = transactions.filter(tx => tx.coinSymbol === coin.symbol);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 md:pb-0 animate-fade-in">
       {/* Header */}
       <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-20 px-4 py-4 flex items-center justify-between border-b border-white/5">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-colors text-white">
             <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
             <span className="font-bold text-white text-lg">{coin.name}</span>
             <span className={`text-xs font-medium ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
             </span>
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
       </div>

       <div className="p-5 max-w-4xl mx-auto space-y-6">
          {/* Price & Chart Card */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-zinc-500 text-sm mb-1">ราคาปัจจุบัน</p>
                   <h2 className="text-4xl font-bold text-white tracking-tight">฿{coin.price.toLocaleString()}</h2>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-1 ring-white/10" style={{ backgroundColor: coin.color }}>
                   {coin.symbol[0]}
                </div>
             </div>

             <div className="h-64 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={coin.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} 
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`฿${value.toLocaleString()}`, 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={coin.change24h >= 0 ? '#10b981' : '#ef4444'} 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: 'white' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             
             {/* Timeframe Selector (Mock) */}
             <div className="flex justify-between mt-4 bg-zinc-950/50 p-1 rounded-xl">
                {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map((tf, i) => (
                   <button key={tf} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${i === 1 ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {tf}
                   </button>
                ))}
             </div>
          </div>

          {/* User Balance */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
             <div>
                <p className="text-zinc-400 text-xs mb-1">ยอดคงเหลือของคุณ</p>
                <p className="text-xl font-bold text-white">{coin.balance} {coin.symbol}</p>
                <p className="text-zinc-500 text-sm">≈ ฿{(coin.price * coin.balance).toLocaleString()}</p>
             </div>
             <div className="flex gap-2">
                <button onClick={() => onAction('send')} className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
                   <ArrowUpRight size={20} className="text-white" />
                </button>
                <button onClick={() => onAction('receive')} className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors">
                   <ArrowDownLeft size={20} className="text-emerald-400" />
                </button>
                <button onClick={() => onAction('swap')} className="p-3 bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20">
                   <RefreshCcw size={20} className="text-black" />
                </button>
             </div>
          </div>

          {/* About */}
          <div className="space-y-2">
             <h3 className="text-white font-bold flex items-center gap-2"><Info size={16} className="text-emerald-500" /> เกี่ยวกับ {coin.name}</h3>
             <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                {coin.about || `${coin.name} is a cryptocurrency operating on its own blockchain.`}
             </p>
          </div>

          {/* History */}
          <div>
             <h3 className="text-white font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> ประวัติการทำรายการ</h3>
             {coinTxs.length > 0 ? (
                <div className="space-y-3">
                   {coinTxs.map(tx => (
                      <div key={tx.id} onClick={() => setSelectedTx(tx)} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center border border-white/5 cursor-pointer hover:bg-zinc-800/50 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                               tx.type === 'receive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                               {tx.type === 'receive' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                               <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                               <p className="text-zinc-500 text-xs">{tx.date}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-sm font-bold ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                               {tx.type === 'receive' ? '+' : '-'}{tx.amount} {coin.symbol}
                            </p>
                            <p className="text-xs text-zinc-500">{tx.status}</p>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-8 text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-white/5 border-dashed">
                   ไม่มีประวัติรายการ
                </div>
             )}
          </div>
       </div>

       {/* Transaction Detail Modal */}
       <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
};