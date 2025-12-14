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
  latestBlock: {
    block_height: number;
    block_hash: string;
    mined_at: string;
    block_reward: number;
    transaction_count: number;
    block_time_seconds: number | null;
  } | null;
  totalBlocks: number;
  mempoolSize: number;
  latestCommitment?: {
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
  const [dailyPoints, setDailyPoints] = useState(0);
  const [dailyCap, setDailyCap] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [miningTime, setMiningTime] = useState(0);
  const [currentNonce, setCurrentNonce] = useState(0);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [hashAttempts, setHashAttempts] = useState(0);
  const [hashHistory, setHashHistory] = useState<Array<{ nonce: number; hash: string; time: number }>>([]);
  const [lastSolutionTime, setLastSolutionTime] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const miningStartTimeRef = useRef<number | null>(null);
  const statsRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hashHistoryRef = useRef<Array<{ nonce: number; hash: string; time: number }>>([]);

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

  // Load user stats on mount and refresh periodically
  const loadUserStats = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/mining/stats?wallet=${publicKey}`);
      const data = await response.json();
      
      if (data.userPoints !== undefined) {
        setUserPoints(data.userPoints);
      }
      if (data.userTier) {
        setUserTier(data.userTier);
      }
      if (data.depositAmount !== undefined) {
        setDepositAmount(data.depositAmount);
      }
      if (data.dailyPoints !== undefined) {
        setDailyPoints(data.dailyPoints);
      }
      if (data.dailyCap !== undefined) {
        setDailyCap(data.dailyCap);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  useEffect(() => {
    loadUserStats();
    
    // Auto-refresh stats every 5 seconds
    statsRefreshIntervalRef.current = setInterval(loadUserStats, 5000);
    
    return () => {
      if (statsRefreshIntervalRef.current) {
        clearInterval(statsRefreshIntervalRef.current);
      }
    };
  }, [publicKey]);

  // Start mining session
  const startMining = async () => {
    if (!publicKey) {
      setError('กรุณาเชื่อมต่อกระเป๋าก่อน');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Check if daily cap reached
    if (dailyPoints >= dailyCap) {
      setError(`Daily cap reached (${dailyCap} points). Please try again tomorrow.`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMiningTime(0);
    miningStartTimeRef.current = Date.now();

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get challenge');
      }

      const challengeData = await response.json();
      setChallenge(challengeData);
      setIsMining(true);
      setIsLoading(false);
      setSolutionsFound(0);
      setPointsEarned(0);
      setHashAttempts(0);
      setCurrentNonce(0);
      setCurrentHash(null);
      setHashHistory([]);
      hashHistoryRef.current = [];
      setLastSolutionTime(null);

      // Start Web Worker for PoW solving
      startPoWWorker(challengeData);

      // Start mining timer
      const timer = setInterval(() => {
        if (miningStartTimeRef.current) {
          setMiningTime(Math.floor((Date.now() - miningStartTimeRef.current) / 1000));
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } catch (error: any) {
      setIsLoading(false);
      setError(error.message || 'Failed to start mining');
      setTimeout(() => setError(null), 5000);
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
        let lastHashReportTime = startTime;

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
                hashesPerSecond,
                hashAttempts: nonce + 1
              });
              return;
            }
            
            // Report hash every 100ms for real-time display
            const now = Date.now();
            if (now - lastHashReportTime >= 100) {
              self.postMessage({ 
                hashUpdate: true,
                nonce: nonce,
                hash: hash,
                hashAttempts: nonce + 1
              });
              lastHashReportTime = now;
            }
            
            nonce++;
            
            // Report progress every 500ms
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
        setCurrentHash(e.data.solution);
        setHashAttempts(e.data.hashAttempts || 0);
        setLastSolutionTime(Date.now());
        // Add to hash history
        const newHashEntry = {
          nonce: parseInt(e.data.nonce),
          hash: e.data.solution,
          time: Date.now()
        };
        setHashHistory(prev => [newHashEntry, ...prev].slice(0, 20)); // Keep last 20
        hashHistoryRef.current = [newHashEntry, ...hashHistoryRef.current].slice(0, 20);
        
        submitSolution(challengeData.challengeId, e.data.nonce, e.data.solution);
        worker.terminate();
        workerRef.current = null;
      } else if (e.data.hashUpdate) {
        // Real-time hash updates
        setCurrentNonce(e.data.nonce);
        setCurrentHash(e.data.hash);
        setHashAttempts(e.data.hashAttempts || 0);
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
  const submitSolution = async (challengeId: string, nonce: string, solution: string, retryCount = 0) => {
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

      // Check if response is ok and is JSON
      let result;
      try {
        const text = await response.text();
        try {
          result = JSON.parse(text);
        } catch (jsonError) {
          // If not JSON, it's probably an HTML error page
          throw new Error(`Server error: ${text.substring(0, 200).replace(/\s+/g, ' ')}`);
        }
      } catch (parseError: any) {
        throw new Error(parseError.message || 'Failed to parse server response');
      }

      if (result && result.success) {
        setSolutionsFound(prev => prev + 1);
        setUserPoints(result.totalPoints || userPoints);
        setDailyPoints(result.dailyPoints || dailyPoints);
        setPointsEarned(prev => prev + (result.points || 10));
        
        // Show success animation
        setSuccessMessage(`+${result.points || 10} points!`);
        setTimeout(() => setSuccessMessage(null), 2000);
        
        // Reload stats
        loadUserStats();
        
        // Check if daily cap reached
        if (result.dailyCap && result.totalPoints >= result.dailyCap) {
          setIsMining(false);
          setError(`Daily cap reached (${result.dailyCap} points). Great job!`);
          setTimeout(() => setError(null), 5000);
          return;
        }
        
        // Request new challenge immediately
        if (isMining) {
          setTimeout(() => {
            if (isMining) {
              startMining();
            }
          }, 1000);
        }
      } else {
        if (result.error?.includes('Daily cap')) {
          setIsMining(false);
          setError(result.error);
          setTimeout(() => setError(null), 5000);
        } else if (retryCount < 2) {
          // Retry on error
          setTimeout(() => submitSolution(challengeId, nonce, solution, retryCount + 1), 2000);
        } else {
          setError(`Solution rejected: ${result.error}`);
          setIsMining(false);
          setTimeout(() => setError(null), 5000);
        }
      }
    } catch (error: any) {
      if (retryCount < 2) {
        // Retry on network error
        setTimeout(() => submitSolution(challengeId, nonce, solution, retryCount + 1), 2000);
      } else {
        setError(`Error submitting solution: ${error.message}`);
        setIsMining(false);
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  // Stop mining
  const stopMining = () => {
    setIsMining(false);
    setChallenge(null);
    setMiningTime(0);
    setCurrentHash(null);
    setCurrentNonce(0);
    setHashAttempts(0);
    miningStartTimeRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    // Reload stats after stopping
    loadUserStats();
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
      case 'Platinum': return 'from-purple-600/20 via-pink-600/20 to-purple-600/20 border-purple-500/30';
      case 'Gold': return 'from-yellow-600/20 via-amber-600/20 to-yellow-600/20 border-yellow-500/30';
      case 'Silver': return 'from-zinc-600/20 via-gray-600/20 to-zinc-600/20 border-zinc-500/30';
      default: return 'from-emerald-600/20 via-teal-600/20 to-emerald-600/20 border-emerald-500/30';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '💎';
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      default: return '🥉';
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

      {/* Error Toast */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 animate-slide-down">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* User Stats Summary */}
      {publicKey && (
        <div className={`bg-gradient-to-br ${getTierColor(userTier)} border rounded-3xl p-6 md:p-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <span className="text-2xl">{getTierIcon(userTier)}</span>
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
                <p className="text-zinc-400 text-sm mb-1">Daily Progress</p>
                <p className="text-2xl font-bold text-white">{dailyPoints.toLocaleString()} / {dailyCap.toLocaleString()}</p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((dailyPoints / dailyCap) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{dailyCap - dailyPoints} points remaining</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Mining Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mining Control */}
          <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                    <Zap size={22} className="text-emerald-400" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Mining Control</h2>
                    <p className="text-xs text-zinc-400">Start solving PoW puzzles</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isMining 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-zinc-800/50 border-white/5'
                }`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${isMining ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-zinc-500'}`} />
                  <span className={`text-xs font-medium ${isMining ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {isMining ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>

            {!isMining ? (
              <button
                onClick={startMining}
                disabled={!publicKey || isLoading || dailyPoints >= dailyCap}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} className="fill-current" />
                    <span>{dailyPoints >= dailyCap ? 'Daily Cap Reached' : 'Start Mining'}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-6">
                {/* Success Animation */}
                {successMessage && (
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="text-emerald-400" size={20} />
                      <span className="text-emerald-400 font-bold text-lg">{successMessage}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-zinc-400 text-sm mb-2">Solutions Found</p>
                      <p className="text-3xl font-bold text-emerald-400">{solutionsFound}</p>
                      <p className="text-xs text-emerald-400/70 mt-1">Successfully solved</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-zinc-400 text-sm mb-2">Hashrate</p>
                      <p className="text-3xl font-bold text-yellow-400">{hashrate.toLocaleString()}</p>
                      <p className="text-xs text-yellow-400/70 mt-1">Hashes per second</p>
                    </div>
                  </div>
                </div>

                {/* Mining Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm mb-1">Points Earned</p>
                    <p className="text-2xl font-bold text-white">{pointsEarned}</p>
                    <p className="text-xs text-zinc-400 mt-1">This session</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                    <p className="text-zinc-400 text-sm mb-1">Mining Time</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.floor(miningTime / 60)}:{(miningTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">MM:SS</p>
                  </div>
                </div>

                {/* Daily Progress */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-zinc-400 text-sm">Daily Progress</p>
                    <p className="text-emerald-400 text-sm font-semibold">
                      {dailyPoints} / {dailyCap}
                    </p>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.min((dailyPoints / dailyCap) * 100, 100)}%` }}
                    >
                      {dailyPoints > 0 && (
                        <span className="text-xs font-bold text-black">
                          {Math.round((dailyPoints / dailyCap) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {dailyCap - dailyPoints > 0 
                      ? `${dailyCap - dailyPoints} points remaining today` 
                      : 'Daily cap reached! 🎉'}
                  </p>
                </div>

                {/* Real-time Hash Report */}
                <div className="bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Hash Report (Real-time)</h3>
                  </div>
                  
                  {/* Current Hash Display */}
                  {currentHash && (
                    <div className="mb-4 p-4 bg-zinc-950/50 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-400">Current Hash Attempt</span>
                        <span className="text-xs text-emerald-400">Nonce: {currentNonce.toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-sm break-all text-emerald-300 mb-2">
                        {currentHash}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>Attempts: {hashAttempts.toLocaleString()}</span>
                        <span>•</span>
                        <span>Status: {currentHash.startsWith('0'.repeat(challenge?.difficulty || 0)) ? 
                          <span className="text-emerald-400">✓ Valid Solution!</span> : 
                          <span className="text-yellow-400">✗ Invalid</span>
                        }</span>
                      </div>
                    </div>
                  )}

                  {/* Hash History */}
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    <div className="text-xs text-zinc-400 mb-2">Recent Hash Attempts</div>
                    {hashHistory.length > 0 ? (
                      hashHistory.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-zinc-950/30 border border-white/5 rounded-lg hover:border-emerald-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-emerald-400 font-semibold">Solution #{hashHistory.length - idx}</span>
                            <span className="text-xs text-zinc-500">Nonce: {entry.nonce.toLocaleString()}</span>
                          </div>
                          <div className="font-mono text-xs break-all text-emerald-200/80">
                            {entry.hash}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs text-zinc-500">
                              {new Date(entry.time).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-zinc-500 text-sm">
                        No hashes yet. Start mining to see real-time hash attempts...
                      </div>
                    )}
                  </div>
                </div>
                {challenge && (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-zinc-400" />
                      <span className="text-zinc-400 text-sm">Difficulty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{challenge.difficulty}</span>
                      <span className="text-zinc-500 text-xs">leading zeros</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={stopMining}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-4 px-6 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
                >
                  <Activity size={18} />
                  Stop Mining
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Real-time Feed */}
          <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Activity size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Recent Solutions</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {stats?.recentAccepted && stats.recentAccepted.length > 0 ? (
                stats.recentAccepted.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-lg hover:border-emerald-500/40 hover:from-emerald-500/10 hover:to-teal-500/10 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center border border-emerald-500/40 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                        <CheckCircle size={14} className="text-emerald-400" fill="currentColor" />
                      </div>
                      <span className="text-zinc-300 text-sm font-mono group-hover:text-white transition-colors">
                        {item.wallet_address.slice(0, 8)}...{item.wallet_address.slice(-6)}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">+{item.points_awarded} pts</span>
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
          <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Global Stats</h3>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-zinc-400 text-sm">Miners Online</span>
                </div>
                <p className="text-3xl font-bold text-blue-400">{stats?.minersOnline || 0}</p>
                <p className="text-xs text-blue-400/70 mt-1">Active in last 5 min</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/40 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
                  <span className="text-zinc-400 text-sm">Network Hashrate</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">
                  {stats?.hashrateEstimate.toLocaleString() || 0}
                </p>
                <p className="text-xs text-yellow-400/70 mt-1">Solutions per hour</p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Award size={18} className="text-purple-400" fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-white">Leaderboard</h3>
            </div>
            <div className="space-y-2 relative z-10">
              {stats?.leaderboard && stats.leaderboard.length > 0 ? (
                stats.leaderboard.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    idx === 0 
                      ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 hover:border-yellow-500/50 shadow-lg shadow-yellow-500/10' 
                      : idx === 1
                      ? 'bg-gradient-to-r from-zinc-500/10 to-gray-500/10 border border-zinc-400/30 hover:border-zinc-400/50'
                      : idx === 2
                      ? 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-600/30 hover:border-amber-600/50'
                      : 'bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-2 border-yellow-300' :
                        idx === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white border-2 border-zinc-400' :
                        idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-2 border-amber-600' :
                        'bg-zinc-800/70 text-zinc-400 border border-white/10'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-zinc-300 text-sm font-mono">
                        {item.wallet_address.slice(0, 6)}...{item.wallet_address.slice(-4)}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      idx === 0 ? 'text-yellow-400' : 
                      idx === 1 ? 'text-zinc-300' :
                      idx === 2 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>{item.points.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">No leaderboard data yet</div>
              )}
            </div>
          </div>

          {/* Latest Commitment */}
          {stats?.latestCommitment && (
            <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
              <div className="flex items-center gap-3 mb-4 mt-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Shield size={18} className="text-emerald-400" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-white">Latest Commitment</h3>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs mb-2 flex items-center gap-1">
                    <Shield size={12} />
                    Merkle Root
                  </p>
                  <div className="text-emerald-300 font-mono text-xs break-all bg-zinc-950/70 p-3 rounded-lg border border-emerald-500/10">
                    {stats.latestCommitment.merkle_root.slice(0, 24)}...
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs mb-2 flex items-center gap-1">
                    <Clock size={12} />
                    Transaction
                  </p>
                  <a
                    href={`https://solscan.io/tx/${stats.latestCommitment.transaction_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs break-all block truncate bg-zinc-950/70 p-3 rounded-lg border border-blue-500/10 hover:border-blue-500/30 transition-colors"
                  >
                    {stats.latestCommitment.transaction_signature.slice(0, 16)}...
                  </a>
                  <p className="text-zinc-500 text-xs mt-2">
                    {new Date(stats.latestCommitment.committed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Block */}
          {stats?.latestBlock && (
            <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
              <div className="flex items-center gap-3 mb-4 mt-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Activity size={18} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Latest Block</h3>
                <div className="ml-auto bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  <span className="text-emerald-400 text-xs font-semibold">#{stats.latestBlock.block_height}</span>
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-zinc-400 text-xs mb-2 flex items-center gap-1">
                    <Activity size={12} />
                    Block Hash
                  </p>
                  <div className="text-emerald-300 font-mono text-xs break-all bg-zinc-950/70 p-3 rounded-lg border border-emerald-500/10">
                    {stats.latestBlock.block_hash.slice(0, 32)}...
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-zinc-400 text-xs mb-1">Transactions</p>
                    <p className="text-blue-400 font-bold text-lg">{stats.latestBlock.transaction_count}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-zinc-400 text-xs mb-1">Reward</p>
                    <p className="text-yellow-400 font-bold text-lg">{stats.latestBlock.block_reward}</p>
                  </div>
                </div>
                {stats.latestBlock.block_time_seconds && (
                  <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl p-3">
                    <p className="text-zinc-400 text-xs mb-1">Block Time</p>
                    <p className="text-purple-400 font-semibold">{stats.latestBlock.block_time_seconds}s</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/5 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">
                    {new Date(stats.latestBlock.mined_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Pool (Mempool) */}
          <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                <Clock size={18} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Transaction Pool</h3>
              <div className="ml-auto bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
                <span className="text-orange-400 text-xs font-semibold">{stats?.mempoolSize || 0} pending</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/20 rounded-xl p-4">
                <p className="text-orange-400 text-sm">
                  {stats?.mempoolSize || 0} transaction{stats?.mempoolSize !== 1 ? 's' : ''} waiting to be included in the next block
                </p>
                <p className="text-zinc-500 text-xs mt-2">
                  Transactions are batched into blocks when committed
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="bg-gradient-to-br from-zinc-900/40 to-zinc-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
            <div className="flex items-center gap-3 mb-4 mt-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Blockchain Info</h3>
            </div>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg">
                <span className="text-zinc-400 text-sm">Total Blocks</span>
                <span className="text-blue-400 font-bold">{stats?.totalBlocks || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg">
                <span className="text-zinc-400 text-sm">Network Hashrate</span>
                <span className="text-purple-400 font-bold">{stats?.hashrateEstimate.toLocaleString() || 0}/hr</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-500/5 to-red-500/5 border border-pink-500/20 rounded-lg">
                <span className="text-zinc-400 text-sm">Active Miners</span>
                <span className="text-pink-400 font-bold">{stats?.minersOnline || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




