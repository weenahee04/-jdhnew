import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Users, TrendingUp, Award, Shield, Clock, CheckCircle } from 'lucide-react';

interface MiningPageProps {
  publicKey: string | null;
  wallet: any;
}

interface Challenge {
  challengeId: string;
  seed: string;
  salt: string;
  difficulty: number;
  expiresAt: number;
}

interface MiningStats {
  minersOnline: number;
  hashrateEstimate: number;
  recentAccepted: Array<{
    wallet_address: string;
    created_at: string;
    points_awarded: number;
  }>;
  leaderboard: Array<{
    wallet_address: string;
    points: number;
  }>;
  latestCommitment: {
    merkle_root: string;
    transaction_signature: string;
    committed_at: string;
  } | null;
}

export const MiningPage: React.FC<MiningPageProps> = ({ publicKey, wallet }) => {
  const [isMining, setIsMining] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userTier, setUserTier] = useState<'Bronze' | 'Silver' | 'Gold' | 'Platinum'>('Bronze');
  const [depositAmount, setDepositAmount] = useState(0);
  const [solutionsFound, setSolutionsFound] = useState(0);
  const [hashrate, setHashrate] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to real-time stats
  useEffect(() => {
    const eventSource = new EventSource('/api/mining/websocket');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Load user stats on mount
  useEffect(() => {
    if (!publicKey) return;

    const loadUserStats = async () => {
      try {
        // Get today's points
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/mining/stats?wallet=${publicKey}`);
        const data = await response.json();
        
        if (data.userPoints) {
          setUserPoints(data.userPoints);
        }
        if (data.userTier) {
          setUserTier(data.userTier);
        }
        if (data.depositAmount) {
          setDepositAmount(data.depositAmount);
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    loadUserStats();
  }, [publicKey]);

  // Start mining session
  const startMining = async () => {
    if (!publicKey) {
      alert('กรุณาเชื่อมต่อกระเป๋าก่อน');
      return;
    }

    try {
      // Request challenge
      const response = await fetch('/api/mining/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get challenge');
      }

      const challengeData = await response.json();
      setChallenge(challengeData);
      setIsMining(true);
      setSolutionsFound(0);

      // Start Web Worker for PoW solving
      startPoWWorker(challengeData);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Start PoW solving in Web Worker
  const startPoWWorker = (challengeData: Challenge) => {
    if (typeof Worker === 'undefined') {
      // Fallback to main thread if Web Workers not supported
      solvePoWMainThread(challengeData);
      return;
    }

    // Create Web Worker
    const workerCode = `
      async function solvePoW(seed, walletAddress, salt, difficulty) {
        const targetPrefix = '0'.repeat(difficulty);
        let nonce = 0;
        const startTime = Date.now();
        let hashesPerSecond = 0;
        let lastReportTime = startTime;

        while (true) {
          const hashInput = seed + walletAddress + nonce.toString() + salt;
          const encoder = new TextEncoder();
          const data = encoder.encode(hashInput);
          
          try {
            const buffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(buffer));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            if (hash.startsWith(targetPrefix)) {
              self.postMessage({ 
                success: true, 
                nonce: nonce.toString(), 
                solution: hash,
                hashesPerSecond 
              });
              return;
            }
            
            nonce++;
            
            // Report progress every 500ms
            const now = Date.now();
            if (now - lastReportTime >= 500) {
              const elapsed = (now - startTime) / 1000;
              hashesPerSecond = Math.round(nonce / elapsed);
              self.postMessage({ 
                progress: true, 
                hashesPerSecond,
                nonce 
              });
              lastReportTime = now;
            }
          } catch (error) {
            self.postMessage({ error: error.message });
            return;
          }
        }
      }

      self.onmessage = function(e) {
        const { seed, walletAddress, salt, difficulty } = e.data;
        solvePoW(seed, walletAddress, salt, difficulty);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.success) {
        submitSolution(challengeData.challengeId, e.data.nonce, e.data.solution);
        worker.terminate();
        workerRef.current = null;
      } else if (e.data.progress) {
        setHashrate(e.data.hashesPerSecond);
      }
    };

    worker.postMessage({
      seed: challengeData.seed,
      walletAddress: publicKey,
      salt: challengeData.salt,
      difficulty: challengeData.difficulty,
    });
  };

  // Fallback PoW solving on main thread
  const solvePoWMainThread = async (challengeData: Challenge) => {
    const { seed, salt, difficulty } = challengeData;
    const targetPrefix = '0'.repeat(difficulty);
    let nonce = 0;
    const startTime = Date.now();

    while (isMining) {
      const hashInput = seed + publicKey + nonce.toString() + salt;
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      
      const buffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(buffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hash.startsWith(targetPrefix)) {
        submitSolution(challengeData.challengeId, nonce.toString(), hash);
        break;
      }

      nonce++;
      if (nonce % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        setHashrate(Math.round(nonce / elapsed));
      }
    }
  };

  // Submit solution
  const submitSolution = async (challengeId: string, nonce: string, solution: string) => {
    try {
      const response = await fetch('/api/mining/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          walletAddress: publicKey,
          nonce,
          solution,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSolutionsFound(prev => prev + 1);
        setUserPoints(result.totalPoints);
        
        // Request new challenge immediately
        if (isMining) {
          setTimeout(() => startMining(), 1000);
        }
      } else {
        alert(`Solution rejected: ${result.error}`);
        setIsMining(false);
      }
    } catch (error: any) {
      alert(`Error submitting solution: ${error.message}`);
      setIsMining(false);
    }
  };

  // Stop mining
  const stopMining = () => {
    setIsMining(false);
    setChallenge(null);
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'from-purple-600/20 to-pink-600/20 border-purple-500/30';
      case 'Gold': return 'from-yellow-600/20 to-orange-600/20 border-yellow-500/30';
      case 'Silver': return 'from-zinc-600/20 to-gray-600/20 border-zinc-500/30';
      default: return 'from-amber-600/20 to-orange-600/20 border-amber-500/30';
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-0">
      {/* Header Mobile */}
      <header className="md:hidden flex justify-between items-center py-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Mining</h2>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">JDH Mining</h1>
        <p className="text-zinc-400">Bonded Proof of Work Puzzle Mining</p>
      </div>

      {/* User Stats Summary */}
      {publicKey && (
        <div className={`bg-gradient-to-br ${getTierColor(userTier)} border rounded-3xl p-6 md:p-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Activity size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Mining Stats</h3>
                <p className="text-sm text-emerald-200/80">Current tier: {userTier}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Total Points</p>
                <p className="text-2xl font-bold text-white">{userPoints.toLocaleString()}</p>
                <p className="text-xs text-emerald-400 mt-1">Lifetime earned</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Tier</p>
                <p className="text-2xl font-bold text-emerald-400">{userTier}</p>
                <p className="text-xs text-zinc-400 mt-1">Current level</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                <p className="text-zinc-400 text-sm mb-1">Deposit</p>
                <p className="text-2xl font-bold text-white">{depositAmount.toLocaleString()}</p>
                <p className="text-xs text-zinc-400 mt-1">JDH tokens</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Mining Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mining Control */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Zap size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mining Control</h2>
                  <p className="text-xs text-zinc-400">Start solving PoW puzzles</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-full border border-white/5">
                <div className={`w-2 h-2 rounded-full ${isMining ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-xs text-zinc-400 font-medium">
                  {isMining ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>

            {!isMining ? (
              <button
                onClick={startMining}
                disabled={!publicKey}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                Start Mining
              </button>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm mb-1">Solutions Found</p>
                    <p className="text-2xl font-bold text-emerald-400">{solutionsFound}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm mb-1">Hashrate</p>
                    <p className="text-2xl font-bold text-white">{hashrate.toLocaleString()} H/s</p>
                  </div>
                </div>
                {challenge && (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Difficulty</span>
                      <span className="text-white font-semibold">{challenge.difficulty} leading zeros</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={stopMining}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-4 px-6 rounded-xl transition-all border border-red-500/20"
                >
                  Stop Mining
                </button>
              </div>
            )}
          </div>

          {/* Real-time Feed */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Recent Solutions</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {stats?.recentAccepted && stats.recentAccepted.length > 0 ? (
                stats.recentAccepted.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-zinc-300 text-sm font-mono">
                        {item.wallet_address.slice(0, 8)}...{item.wallet_address.slice(-6)}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-semibold">+{item.points_awarded} pts</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">No recent solutions yet</div>
              )}
            </div>
          </div>
          </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Global Stats */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Global Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-zinc-400 text-sm">Miners Online</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.minersOnline || 0}</p>
                <p className="text-xs text-zinc-500 mt-1">Active in last 5 min</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-zinc-400 text-sm">Network Hashrate</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.hashrateEstimate.toLocaleString() || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Solutions per hour</p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {stats?.leaderboard && stats.leaderboard.length > 0 ? (
                stats.leaderboard.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-lg hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        idx === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30' :
                        idx === 2 ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30' :
                        'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-zinc-300 text-sm font-mono">
                        {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold">{item.points.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">No leaderboard data yet</div>
              )}
            </div>
          </div>

          {/* Latest Commitment */}
          {stats?.latestCommitment && (
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={20} className="text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Latest Commitment</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs mb-2">Merkle Root</p>
                  <div className="text-zinc-300 font-mono text-xs break-all bg-zinc-950/50 p-2 rounded border border-white/5">
                    {stats.latestCommitment.merkle_root.slice(0, 24)}...
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs mb-2">Transaction</p>
                  <a
                    href={`https://solscan.io/tx/${stats.latestCommitment.transaction_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-mono text-xs break-all block truncate"
                  >
                    {stats.latestCommitment.transaction_signature.slice(0, 16)}...
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



