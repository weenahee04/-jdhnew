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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">JDH Mining</h1>
          <p className="text-zinc-400">Bonded Proof of Work Puzzle Mining</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Mining Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mining Control */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Mining Control</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isMining ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                  <span className="text-sm text-zinc-400">
                    {isMining ? 'Mining...' : 'Idle'}
                  </span>
                </div>
              </div>

              {!isMining ? (
                <button
                  onClick={startMining}
                  disabled={!publicKey}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Mining
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Solutions Found:</span>
                    <span className="text-white font-bold">{solutionsFound}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Hashrate:</span>
                    <span className="text-white font-bold">{hashrate.toLocaleString()} H/s</span>
                  </div>
                  {challenge && (
                    <div className="text-sm text-zinc-500">
                      Difficulty: {challenge.difficulty} leading zeros
                    </div>
                  )}
                  <button
                    onClick={stopMining}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Stop Mining
                  </button>
                </div>
              )}
            </div>

            {/* Real-time Feed */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-4">Recent Solutions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats?.recentAccepted.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">
                      {item.wallet_address.slice(0, 8)}...{item.wallet_address.slice(-6)}
                    </span>
                    <span className="text-emerald-400">+{item.points_awarded} points</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Global Stats */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-4">Global Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-zinc-400">Miners Online</span>
                  </div>
                  <span className="text-white font-bold">{stats?.minersOnline || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-zinc-400">Network Hashrate</span>
                  </div>
                  <span className="text-white font-bold">
                    {stats?.hashrateEstimate.toLocaleString() || 0} sol/hr
                  </span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Points</span>
                  <span className="text-white font-bold">{userPoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tier</span>
                  <span className="text-white font-bold">{userTier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Deposit</span>
                  <span className="text-white font-bold">{depositAmount.toLocaleString()} JDH</span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard</h3>
              <div className="space-y-2">
                {stats?.leaderboard.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">#{idx + 1}</span>
                    <span className="text-zinc-300">
                      {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}
                    </span>
                    <span className="text-emerald-400 font-bold">{item.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Commitment */}
            {stats?.latestCommitment && (
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-xl font-bold text-white mb-4">Latest Commitment</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-400">Root:</span>
                    <div className="text-zinc-300 font-mono text-xs break-all">
                      {stats.latestCommitment.merkle_root.slice(0, 16)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">TX:</span>
                    <a
                      href={`https://solscan.io/tx/${stats.latestCommitment.transaction_signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline block truncate"
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
    </div>
  );
};



