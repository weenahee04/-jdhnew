import React, { useState } from 'react';
import { Lock, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight, Zap, Shield } from 'lucide-react';
import { Coin } from '../types';

interface StakingPageProps {
  coins: Coin[];
  publicKey: string | null;
}

interface StakingPool {
  id: string;
  coinSymbol: string;
  coinName: string;
  apy: number;
  minStake: number;
  totalStaked: number;
  stakers: number;
  lockPeriod: string;
  logoURI?: string;
  color: string;
}

const MOCK_STAKING_POOLS: StakingPool[] = [
  {
    id: 'sol-staking',
    coinSymbol: 'SOL',
    coinName: 'Solana',
    apy: 6.5,
    minStake: 1,
    totalStaked: 1250000,
    stakers: 15234,
    lockPeriod: 'Flexible',
    color: '#14F195'
  },
  {
    id: 'jdh-staking',
    coinSymbol: 'JDH',
    coinName: 'JDH Token',
    apy: 12.0,
    minStake: 100,
    totalStaked: 850000,
    stakers: 8234,
    lockPeriod: '30 days',
    color: '#10B981'
  },
  {
    id: 'usdc-staking',
    coinSymbol: 'USDC',
    coinName: 'USD Coin',
    apy: 4.2,
    minStake: 100,
    totalStaked: 2500000,
    stakers: 18945,
    lockPeriod: 'Flexible',
    color: '#2775CA'
  }
];

export const StakingPage: React.FC<StakingPageProps> = ({ coins, publicKey }) => {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [myStakes, setMyStakes] = useState<Array<{ poolId: string; amount: number; apy: number; earned: number }>>([
    { poolId: 'sol-staking', amount: 50, apy: 6.5, earned: 3.25 },
    { poolId: 'jdh-staking', amount: 500, apy: 12.0, earned: 60 }
  ]);

  const totalStaked = myStakes.reduce((sum, stake) => sum + stake.amount, 0);
  const totalEarned = myStakes.reduce((sum, stake) => sum + stake.earned, 0);

  const handleStake = (pool: StakingPool) => {
    setSelectedPool(pool);
    setShowStakeModal(true);
  };

  const handleConfirmStake = () => {
    if (!selectedPool || !stakeAmount) return;
    
    // Mock stake action
    const amount = parseFloat(stakeAmount);
    const existingStake = myStakes.find(s => s.poolId === selectedPool.id);
    
    if (existingStake) {
      setMyStakes(myStakes.map(s => 
        s.poolId === selectedPool.id 
          ? { ...s, amount: s.amount + amount }
          : s
      ));
    } else {
      setMyStakes([...myStakes, {
        poolId: selectedPool.id,
        amount,
        apy: selectedPool.apy,
        earned: 0
      }]);
    }
    
    setShowStakeModal(false);
    setStakeAmount('');
    setSelectedPool(null);
  };

  const handleUnstake = (poolId: string) => {
    setMyStakes(myStakes.filter(s => s.poolId !== poolId));
  };

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-0">
      {/* Header Mobile */}
      <header className="md:hidden flex justify-between items-center py-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Staking</h2>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Staking</h1>
        <p className="text-zinc-400">Earn passive income by staking your cryptocurrencies</p>
      </div>

      {/* My Staking Summary */}
      {publicKey && myStakes.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Lock size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">My Staking</h3>
                <p className="text-sm text-emerald-200/80">Active staking positions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Total Staked</p>
                <p className="text-2xl font-bold text-white">{totalStaked.toLocaleString()}</p>
                <p className="text-xs text-emerald-400 mt-1">Across {myStakes.length} pools</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-400">{totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-zinc-400 mt-1">Lifetime rewards</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Avg. APY</p>
                <p className="text-2xl font-bold text-white">
                  {(myStakes.reduce((sum, s) => sum + s.apy, 0) / myStakes.length).toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-400 mt-1">Weighted average</p>
              </div>
            </div>

            {/* My Active Stakes */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold mb-3">Active Positions</h4>
              {myStakes.map((stake) => {
                const pool = MOCK_STAKING_POOLS.find(p => p.id === stake.poolId);
                if (!pool) return null;
                
                return (
                  <div key={stake.poolId} className="bg-zinc-900/70 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: pool.color + '20', border: `2px solid ${pool.color}40` }}
                      >
                        {pool.coinSymbol[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{pool.coinSymbol}</p>
                        <p className="text-xs text-zinc-400">{pool.coinName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{stake.amount.toLocaleString()} {pool.coinSymbol}</p>
                      <p className="text-xs text-emerald-400">{stake.apy}% APY</p>
                    </div>
                    <button
                      onClick={() => handleUnstake(stake.poolId)}
                      className="ml-4 px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Unstake
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Available Pools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Available Staking Pools</h3>
          <span className="text-sm text-zinc-400">({MOCK_STAKING_POOLS.length} pools)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_STAKING_POOLS.map((pool) => {
            const isStaked = myStakes.some(s => s.poolId === pool.id);
            
            return (
              <div
                key={pool.id}
                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: pool.color + '20', border: `2px solid ${pool.color}40` }}
                    >
                      {pool.coinSymbol[0]}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{pool.coinSymbol}</h4>
                      <p className="text-xs text-zinc-400">{pool.coinName}</p>
                    </div>
                  </div>
                  {isStaked && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">APY</span>
                    <span className="text-2xl font-bold text-emerald-400">{pool.apy}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Min. Stake</span>
                    <span className="text-white">{pool.minStake} {pool.coinSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Lock Period</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock size={14} />
                      {pool.lockPeriod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Total Staked</span>
                    <span className="text-white">{pool.totalStaked.toLocaleString()} {pool.coinSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Stakers</span>
                    <span className="text-white">{pool.stakers.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStake(pool)}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    isStaked
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400'
                  }`}
                >
                  {isStaked ? 'Stake More' : 'Stake Now'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">How Staking Works</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <Zap size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Stake your tokens to earn passive income with competitive APY rates</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Your staked tokens are secured by smart contracts</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Rewards are automatically calculated and can be claimed anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Some pools have lock periods, while others offer flexible unstaking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stake Modal */}
      {showStakeModal && selectedPool && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-emerald-500/30 w-full max-w-md rounded-2xl p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => {
                setShowStakeModal(false);
                setSelectedPool(null);
                setStakeAmount('');
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <AlertCircle size={24} className="rotate-45" />
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                <Lock size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Stake {selectedPool.coinSymbol}</h2>
              <p className="text-zinc-400 text-sm">Earn {selectedPool.apy}% APY</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount to Stake</label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder={`Min: ${selectedPool.minStake} ${selectedPool.coinSymbol}`}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => {
                      // Mock: Set to max available balance
                      const coin = coins.find(c => c.symbol === selectedPool.coinSymbol);
                      if (coin) {
                        setStakeAmount(coin.balance.toString());
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Available: {coins.find(c => c.symbol === selectedPool.coinSymbol)?.balance.toLocaleString() || 0} {selectedPool.coinSymbol}
                </p>
              </div>

              <div className="bg-zinc-950/50 border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">APY</span>
                  <span className="text-white font-semibold">{selectedPool.apy}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Lock Period</span>
                  <span className="text-white">{selectedPool.lockPeriod}</span>
                </div>
                {stakeAmount && parseFloat(stakeAmount) > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="text-zinc-400">Estimated Annual Reward</span>
                    <span className="text-emerald-400 font-semibold">
                      {(parseFloat(stakeAmount) * selectedPool.apy / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedPool.coinSymbol}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStakeModal(false);
                  setSelectedPool(null);
                  setStakeAmount('');
                }}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStake}
                disabled={!stakeAmount || parseFloat(stakeAmount) < selectedPool.minStake}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
              >
                Confirm Stake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

