import React, { useState, useEffect } from 'react';
import { NavTab, Coin, AppView, Transaction, Notification } from './types';
import { MOCK_COINS, BANNERS, MOCK_TRANSACTIONS, MOCK_NOTIFICATIONS, FAQS } from './constants';
import { AssetList } from './components/AssetList';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { QuickActions } from './components/QuickActions';
import { ActionModal } from './components/ActionModals';
import { Onboarding } from './components/Onboarding';
import { WalletSetup } from './components/WalletSetup';
import { CoinDetail } from './components/CoinDetail';
import { NotificationCenter, AnnouncementCenter, BuyCryptoModal, HelpCenter, TransactionDetailModal, LogoutModal } from './components/SecondaryViews';
import { SettingsPage } from './components/SettingsPage';
import { ApiPaymentModal } from './components/ApiPaymentModal';
import { TermsModal, SecurityWarningModal, WelcomeModal } from './components/SecurityModals';
import { Eye, EyeOff, Bell, User, Sparkles, Wallet, Settings, ArrowRight, Shield, Globe, Award, ChevronRight, ChevronLeft, LogOut, MessageSquare, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { getMarketInsight } from './services/geminiService';
import { useSolanaWallet } from './hooks/useSolanaWallet';
import { useWalletBalances } from './hooks/useWalletBalances';
import { registerUser, loginUser, getCurrentUser, setCurrentUser, updateUserWallet, updateUserDisplayName, logoutUser as authLogout, saveWallet, getWallet } from './services/authService';
import { USE_BACKEND_API } from './config';
import { getTransactionHistory } from './services/helius';
import { getQuote, getSwapTransaction } from './services/jupiter';
import { connection, explorerUrl } from './services/solanaClient';
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

// --- Animated Background Component ---
const AnimatedBackground = ({ intensity = 'high', theme = 'emerald' }: { intensity?: 'high' | 'low', theme?: 'blue' | 'emerald' }) => {
  // Define colors based on theme
  const colors = theme === 'emerald' ? {
    grid: 'rgba(16, 185, 129, 0.15)', // Emerald-500
    blob1: 'bg-emerald-600/20',
    blob2: 'bg-teal-600/20',
    blob3: 'bg-green-500/10',
    scanline: 'from-transparent via-emerald-400/5 to-transparent'
  } : {
    grid: 'rgba(59, 130, 246, 0.15)', // Blue-500
    blob1: 'bg-blue-600/20',
    blob2: 'bg-indigo-600/20',
    blob3: 'bg-cyan-500/10',
    scanline: 'from-transparent via-blue-400/5 to-transparent'
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      {/* Deep Space Base */}
      <div className="absolute inset-0 bg-[#050505]"></div>
      
      {/* Animated Grid */}
      <div 
        className={`absolute inset-0 ${intensity === 'high' ? 'opacity-20' : 'opacity-10'}`}
        style={{
          backgroundImage: `linear-gradient(${colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${colors.grid} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) scale(2.5)',
          transformOrigin: 'top center',
          animation: 'grid-scroll 15s linear infinite',
        }}
      ></div>

      {/* Floating Glowing Orbs (Blobs) */}
      <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] ${colors.blob1} rounded-full blur-[100px] animate-blob mix-blend-screen ${intensity === 'low' && 'opacity-50'}`}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] ${colors.blob2} rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-screen ${intensity === 'low' && 'opacity-50'}`}></div>
      {intensity === 'high' && (
         <div className={`absolute top-[40%] left-[40%] w-[300px] h-[300px] ${colors.blob3} rounded-full blur-[80px] animate-blob animation-delay-4000 mix-blend-screen`}></div>
      )}

      {/* Scanline Effect */}
      {intensity === 'high' && (
        <div className={`absolute inset-0 bg-gradient-to-b ${colors.scanline} h-[20%] animate-scanline pointer-events-none`}></div>
      )}

      {/* CSS Styles for Animations */}
      <style>{`
        @keyframes grid-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes scanline {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }
        .animate-blob {
          animation: blob 15s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('LANDING');
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);
  
  // Feature State
  const [showBalance, setShowBalance] = useState(true);
  const [marketInsight, setMarketInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Modals & Overlays
  const [activeModal, setActiveModal] = useState<'send' | 'receive' | 'swap' | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null); // For Coin Detail View
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showBuyCrypto, setShowBuyCrypto] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  
  // New Missing Modals State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showApiPaymentModal, setShowApiPaymentModal] = useState(false);
  const [pendingSendAction, setPendingSendAction] = useState<(() => void) | null>(null);
  
  // Security Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [securityWarningType, setSecurityWarningType] = useState<'seed' | 'import'>('seed');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [walletSetupShowSeed, setWalletSetupShowSeed] = useState<(() => void) | null>(null);
  
  // Auth State
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Wallet (Solana) - MUST be declared first before any hooks that use publicKey
  const {
    wallet,
    publicKey,
    loadFromMnemonic,
    transferSol,
    transferToken,
    signAndSendVersioned,
    loading: walletLoading,
    error: walletError,
    reset: resetWallet
  } = useSolanaWallet();

  // Real wallet balances - uses publicKey from useSolanaWallet
  const {
    coins: walletCoins,
    totalBalanceTHB,
    totalBalanceUSD,
    loading: balancesLoading,
    error: balancesError,
    refresh: refreshBalances,
    newTokens,
    clearNewTokens,
  } = useWalletBalances(publicKey);

  // Use real coins if wallet is connected, otherwise use mock
  const displayCoins = publicKey && walletCoins.length > 0 ? walletCoins : MOCK_COINS;

  // Fetch transaction history
  useEffect(() => {
    if (publicKey && currentView === 'APP') {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          // Using static import
          const heliusTxs = await getTransactionHistory(publicKey, 20);
          
          // Convert to Transaction format
          const converted: Transaction[] = heliusTxs.map((tx, idx) => ({
            id: tx.signature,
            type: tx.type === 'TRANSFER' ? (tx.destination === publicKey ? 'receive' : 'send') : 'swap',
            coinSymbol: tx.symbol || 'SOL',
            amount: tx.amount,
            amountTHB: tx.amount * 34.5, // Mock conversion rate
            date: new Date(tx.timestamp * 1000).toLocaleString('th-TH', { 
              day: 'numeric', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: tx.status === 'SUCCESS' ? 'completed' : 'failed',
          }));
          
          setTransactionHistory(converted);
        } catch (error) {
          console.error('Failed to fetch transaction history:', error);
          setTransactionHistory(MOCK_TRANSACTIONS); // Fallback to mock
        } finally {
          setLoadingHistory(false);
        }
      };
      
      fetchHistory();
    }
  }, [publicKey, currentView]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    const insight = await getMarketInsight(displayCoins);
    setMarketInsight(insight);
    setLoadingInsight(false);
  };

  useEffect(() => {
    if (activeTab === NavTab.MARKET && !marketInsight && currentView === 'APP') {
       fetchInsight();
    }
  }, [activeTab, currentView]);

  // Debug: Log when showSecurityWarning changes
  useEffect(() => {
    console.log('🔔 showSecurityWarning state changed to:', showSecurityWarning, 'type:', securityWarningType);
  }, [showSecurityWarning, securityWarningType]);

  // Check if user is logged in on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
      if (user.hasWallet && user.walletAddress) {
        // Try to load wallet
        const loadWallet = async () => {
          let storedMnemonic: string | null = null;
          
          if (USE_BACKEND_API) {
            // Load from backend API
            storedMnemonic = await getWallet(user.id);
          } else {
            // Load from localStorage
            storedMnemonic = localStorage.getItem(`jdh_wallet_${user.id}`);
          }
          
          if (storedMnemonic) {
            try {
              await loadFromMnemonic(storedMnemonic);
              // Wallet loaded successfully, go to APP
              setCurrentView('APP');
            } catch (error) {
              console.error('Failed to load wallet:', error);
              // If wallet load fails but user has wallet flag, don't go to WALLET_CREATE
              // This is an error state - wallet data exists but can't be loaded
              // Stay on current view, user can try to login again
            }
          } else {
            // Wallet should exist but not found
            // Don't go to WALLET_CREATE if user already has wallet flag set
            // This is an error state - wallet data is missing
            console.error('Wallet not found for user:', user.id, 'but hasWallet flag is true');
            // Stay on current view, user needs to login again or contact support
          }
        };
        
        loadWallet();
      } else {
        // User doesn't have wallet, stay on landing or go to wallet creation
        if (currentView === 'LANDING') {
          // Don't auto-navigate, let user choose
        }
      }
    }
  }, []);

  // --- View Handlers ---
  const handleAuthComplete = async (email?: string, password?: string) => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (currentView === 'AUTH_REGISTER') {
        // Registration
        if (!email || !password) {
          setAuthError('กรุณากรอกอีเมลและรหัสผ่าน');
          setAuthLoading(false);
          return;
        }

        const result = await registerUser(email, password);
        if (result.success && result.user) {
          setCurrentUserState(result.user);
          setCurrentUser(result.user);
          
          // Show Terms & Conditions before creating wallet
          if (!termsAccepted) {
            setShowTermsModal(true);
          } else {
            setCurrentView('WALLET_CREATE');
          }
        } else {
          console.error('Registration failed:', result);
          setAuthError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
      } else {
        // Login
        if (!email || !password) {
          setAuthError('กรุณากรอกอีเมลและรหัสผ่าน');
          setAuthLoading(false);
          return;
        }

        const result = await loginUser(email, password);
        if (result.success && result.user) {
          setCurrentUserState(result.user);
          setCurrentUser(result.user);
          
          // Check if user has wallet
          console.log('🔍 Login - User wallet check:', {
            hasWallet: result.user.hasWallet,
            walletAddress: result.user.walletAddress,
            userId: result.user.id
          });
          
          if (result.user.hasWallet && result.user.walletAddress) {
            // Try to load wallet
            try {
              let storedMnemonic: string | null = null;
              
              if (USE_BACKEND_API) {
                // Load from backend API (decrypted)
                console.log('🔍 Loading wallet from backend API for user:', result.user.id);
                storedMnemonic = await getWallet(result.user.id);
                console.log('🔍 Backend wallet result:', storedMnemonic ? 'Found' : 'Not found');
              } else {
                // Load from localStorage
                console.log('🔍 Loading wallet from localStorage for user:', result.user.id);
                storedMnemonic = localStorage.getItem(`jdh_wallet_${result.user.id}`);
                console.log('🔍 LocalStorage wallet result:', storedMnemonic ? 'Found' : 'Not found');
              }
              
              if (storedMnemonic) {
                console.log('🔍 Loading wallet from mnemonic...');
                await loadFromMnemonic(storedMnemonic);
                console.log('✅ Wallet loaded successfully, going to APP');
                // Wallet loaded successfully, go to APP
                setCurrentView('APP');
              } else {
                // Wallet should exist but not found - this is an error state
                console.error('❌ Wallet not found for user:', result.user.id, 'but hasWallet flag is true');
                setAuthError('ไม่พบ wallet ของคุณ กรุณาติดต่อผู้ดูแลระบบ');
                // Don't go to WALLET_CREATE if user already has wallet flag set
                // Instead, show error and let user retry
              }
            } catch (error) {
              console.error('❌ Failed to load wallet:', error);
              setAuthError('ไม่สามารถโหลด wallet ได้ กรุณาลองอีกครั้ง');
              // Don't go to WALLET_CREATE on error - user already has wallet
            }
          } else {
            // User doesn't have wallet flag set, but check if wallet exists in database
            console.log('🔍 User hasWallet is false, checking if wallet exists in database...');
            try {
              // Double-check: Try to get wallet from database even if hasWallet is false
              let storedMnemonic: string | null = null;
              
              if (USE_BACKEND_API) {
                storedMnemonic = await getWallet(result.user.id);
                console.log('🔍 Double-check wallet from database:', storedMnemonic ? 'Found!' : 'Not found');
              } else {
                storedMnemonic = localStorage.getItem(`jdh_wallet_${result.user.id}`);
                console.log('🔍 Double-check wallet from localStorage:', storedMnemonic ? 'Found!' : 'Not found');
              }
              
              if (storedMnemonic) {
                // Wallet exists! Load it and update hasWallet flag
                console.log('✅ Wallet found in database but hasWallet flag was false - loading wallet...');
                await loadFromMnemonic(storedMnemonic);
                
                // Wait a bit for wallet state to update
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Get wallet public key after loading (wallet.publicKey is a string)
                const walletPublicKey = wallet.publicKey || publicKey?.toBase58();
                
                console.log('🔍 Wallet loaded, publicKey:', walletPublicKey);
                
                if (walletPublicKey) {
                  // Update hasWallet flag in database
                  const updated = await updateUserWallet(result.user.email, walletPublicKey);
                  if (updated) {
                    console.log('✅ Updated hasWallet flag in database');
                  } else {
                    console.error('❌ Failed to update hasWallet flag');
                  }
                  
                  // Update current user state
                  const updatedUser = {
                    ...result.user,
                    hasWallet: true,
                    walletAddress: walletPublicKey,
                  };
                  setCurrentUserState(updatedUser);
                  setCurrentUser(updatedUser);
                  
                  // Go to APP
                  setCurrentView('APP');
                } else {
                  console.error('❌ Wallet loaded but publicKey is null');
                  setAuthError('ไม่สามารถโหลด wallet ได้ กรุณาลองอีกครั้ง');
                }
              } else {
                // Really no wallet, go to create/import
                console.log('🔍 No wallet found in database, going to WALLET_CREATE');
                setCurrentView('WALLET_CREATE');
              }
            } catch (error) {
              console.error('❌ Error checking wallet:', error);
              // If error checking, assume no wallet and go to create
              setCurrentView('WALLET_CREATE');
            }
          }
        } else {
          setAuthError(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    setCurrentView('WALLET_CREATE');
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setCurrentView('AUTH_REGISTER');
  };

  const handleWalletComplete = () => {
    // Only navigate to APP if wallet was successfully created/saved
    // handleWalletCreated should have already saved the wallet
    console.log('🔍 handleWalletComplete called, navigating to APP');
    setCurrentView('APP');
  };

  const handleWalletCreated = async (mnemonic: string) => {
    console.log('🔍 handleWalletCreated called with mnemonic:', mnemonic ? 'Present' : 'Missing');
    console.log('🔍 Current user:', currentUser ? { id: currentUser.id, email: currentUser.email } : 'null');
    
    try {
      // Load wallet from mnemonic
      const keypair = await loadFromMnemonic(mnemonic);
      console.log('✅ Wallet loaded from mnemonic, keypair:', keypair ? 'Present' : 'Missing');
      
      // Wait longer for wallet state to update (React state update is async)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get wallet public key - try multiple sources
      let walletPublicKey: string | null = null;
      
      // Method 1: From keypair directly (most reliable)
      if (keypair && keypair.publicKey) {
        walletPublicKey = keypair.publicKey.toBase58();
        console.log('🔍 Got publicKey from keypair:', walletPublicKey);
      }
      
      // Method 2: From wallet state
      if (!walletPublicKey && wallet.publicKey) {
        walletPublicKey = wallet.publicKey;
        console.log('🔍 Got publicKey from wallet state:', walletPublicKey);
      }
      
      // Method 3: From publicKey hook
      if (!walletPublicKey && publicKey) {
        walletPublicKey = publicKey.toBase58();
        console.log('🔍 Got publicKey from publicKey hook:', walletPublicKey);
      }
      
      // Method 4: Derive from mnemonic directly
      if (!walletPublicKey) {
        try {
          const { mnemonicToKeypair, getPublicKeyBase58 } = await import('./services/solanaClient');
          const kp = mnemonicToKeypair(mnemonic);
          walletPublicKey = getPublicKeyBase58(kp);
          console.log('🔍 Got publicKey by deriving from mnemonic:', walletPublicKey);
        } catch (error) {
          console.error('❌ Failed to derive publicKey from mnemonic:', error);
        }
      }
      
      console.log('🔍 Final wallet public key:', walletPublicKey);
      console.log('🔍 Wallet state check:', {
        hasCurrentUser: !!currentUser,
        hasWalletPublicKey: !!walletPublicKey,
        walletState: { hasPublicKey: !!wallet.publicKey, publicKey: wallet.publicKey },
        publicKeyHook: publicKey ? publicKey.toBase58() : null
      });
      
      // Save wallet to user account
      if (currentUser && walletPublicKey) {
        console.log('🔍 Saving wallet to database...');
        
        // Update user wallet address and hasWallet flag FIRST
        console.log('🔍 Step 1: Updating user wallet address...');
        const walletUpdated = await updateUserWallet(currentUser.email, walletPublicKey);
        
        if (!walletUpdated) {
          console.error('❌ Failed to update user wallet address');
          setAuthError('ไม่สามารถอัพเดทข้อมูล wallet ได้ กรุณาลองอีกครั้ง');
          return;
        }
        console.log('✅ User wallet address updated');
        
        // Store mnemonic (encrypted in backend, plain in localStorage for demo)
        try {
          if (USE_BACKEND_API) {
            // Save to backend API (encrypted)
            console.log('🔍 Step 2: Saving wallet mnemonic to backend...');
            const saved = await saveWallet(currentUser.id, mnemonic, walletPublicKey);
            if (!saved) {
              console.error('❌ Failed to save wallet to backend');
              setAuthError('ไม่สามารถบันทึก wallet ได้ กรุณาลองอีกครั้ง');
              return;
            } else {
              console.log('✅ Wallet saved successfully to backend');
            }
          } else {
            // Save to localStorage (for demo only)
            localStorage.setItem(`jdh_wallet_${currentUser.id}`, mnemonic);
            console.log('✅ Wallet saved to localStorage');
          }
        } catch (error) {
          console.error('❌ Failed to save wallet:', error);
          setAuthError('ไม่สามารถบันทึก wallet ได้ กรุณาลองอีกครั้ง');
          return;
        }
        
        // Update current user state to reflect wallet creation
        const updatedUser = getCurrentUser();
        if (updatedUser) {
          const newUserState = {
            ...updatedUser,
            hasWallet: true,
            walletAddress: walletPublicKey,
          };
          setCurrentUserState(newUserState);
          setCurrentUser(newUserState);
          console.log('✅ User state updated with wallet info');
        }
      } else {
        console.error('❌ Cannot save wallet: currentUser or walletPublicKey is missing', {
          hasCurrentUser: !!currentUser,
          hasWalletPublicKey: !!walletPublicKey,
          walletState: { hasPublicKey: !!wallet.publicKey, publicKey: wallet.publicKey },
          publicKeyHook: publicKey ? publicKey.toBase58() : null
        });
        setAuthError('ไม่สามารถบันทึก wallet ได้: ไม่พบ public key กรุณาลองอีกครั้ง');
        return;
      }
      
      // Show welcome modal after wallet creation
      console.log('✅ Wallet creation completed successfully');
      
      // Verify wallet was saved by checking database
      if (USE_BACKEND_API && currentUser) {
        console.log('🔍 Verifying wallet was saved...');
        try {
          const verifyWallet = await getWallet(currentUser.id);
          if (verifyWallet) {
            console.log('✅ Wallet verification: Wallet found in database');
          } else {
            console.error('❌ Wallet verification: Wallet NOT found in database!');
            setAuthError('Wallet ไม่ถูกบันทึก กรุณาลองอีกครั้ง');
            return;
          }
        } catch (error) {
          console.error('❌ Wallet verification error:', error);
          // Don't block user if verification fails, but log it
        }
      }
      
      setShowWelcomeModal(true);
    } catch (error) {
      console.error('❌ Failed to create wallet:', error);
      setAuthError('ไม่สามารถสร้าง wallet ได้ กรุณาลองอีกครั้ง');
    }
  };

  const handleWalletImported = async (mnemonicOrSecret: string) => {
    // Similar to handleWalletCreated but for imported wallets
    console.log('🔍 handleWalletImported called');
    return handleWalletCreated(mnemonicOrSecret);
  };

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    setCurrentView('APP');
  };

  const handleSendAsset = async ({ to, amount, symbol, mintAddress }: { to: string; amount: number; symbol: string; mintAddress?: string }) => {
    if (!publicKey) throw new Error('กรุณาสร้างหรือเชื่อมกระเป๋าก่อน');
    if (!amount || amount <= 0) throw new Error('จำนวนไม่ถูกต้อง');
    
    // Check if sending SOL or SPL token
    if (symbol === 'SOL') {
      const result = await transferSol(to, amount);
      // Refresh balances after send
      setTimeout(() => refreshBalances(), 2000);
      return result;
    } else {
      // SPL Token transfer
      if (!mintAddress) {
        // Try to find mint address from current coins
        const coin = displayCoins.find(c => c.symbol === symbol);
        if (!coin || !coin.id || coin.id === 'sol') {
          throw new Error('ไม่พบที่อยู่เหรียญ (Mint Address)');
        }
        // Use coin.id as mint address (it should be the mint address for tokens)
        const result = await transferToken(to, coin.id, amount);
        // Refresh balances after send
        setTimeout(() => refreshBalances(), 2000);
        return result;
      } else {
        const result = await transferToken(to, mintAddress, amount);
        // Refresh balances after send
        setTimeout(() => refreshBalances(), 2000);
        return result;
      }
    }
  };

  const handleSwap = async ({ fromMint, toMint, amount, slippage }: { fromMint: string; toMint: string; amount: number; slippage?: number }) => {
    if (!publicKey || !wallet.keypair) throw new Error('กรุณาสร้างหรือเชื่อมกระเป๋าก่อน');
    if (!amount || amount <= 0) throw new Error('จำนวนไม่ถูกต้อง');

    try {
      // Using static imports instead of dynamic

      // Get quote
      const amountLamports = Math.floor(amount * 1e9);
      const quote = await getQuote({
        inputMint: fromMint,
        outputMint: toMint,
        amount: amountLamports,
        slippageBps: slippage || 100,
      });

      // Get swap transaction
      const swapResponse = await getSwapTransaction({
        userPublicKey: publicKey.toBase58(),
        quoteResponse: quote,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
      });

      // Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      transaction.sign([wallet.keypair]);
      
      // Send transaction
      const sig = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: false });
      await connection.confirmTransaction(sig, 'confirmed');
      
      // Refresh balances after swap
      setTimeout(() => refreshBalances(), 2000);
      
      return { signature: sig, explorer: explorerUrl(sig) };
    } catch (error: any) {
      console.error('Swap error:', error);
      throw new Error(error.message || 'Swap failed');
    }
  };

  const handleLogout = () => {
     setShowLogoutConfirm(false);
     authLogout();
     setCurrentUserState(null);
     resetWallet(); // Clear wallet state on logout
     setCurrentView('LANDING');
     setActiveTab(NavTab.HOME);
  };

  // --- Sub-Views ---

  const LandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4 sm:p-6 md:p-8 text-center">
       {/* FORCE EMERALD THEME */}
       <AnimatedBackground intensity="high" theme="emerald" />
       
       <div className="z-10 animate-fade-in flex flex-col items-center relative w-full max-w-lg px-4 sm:px-6">
          {/* Top Pill */}
          <div className="mb-6 sm:mb-8 bg-emerald-900/30 backdrop-blur-md border border-emerald-500/30 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
            <span className="text-emerald-300 text-[10px] sm:text-xs font-medium tracking-wide">Transform your trading</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-thin text-white mb-2 tracking-tighter leading-[0.9] px-2">
            Seamless crypto
          </h1>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-thin text-emerald-100 mb-8 sm:mb-12 tracking-tighter leading-[0.9] px-2">
            experience
          </h1>

          {/* Central Orb Graphic (Green) */}
          <div className="relative w-48 h-32 sm:w-56 sm:h-36 md:w-64 md:h-40 mb-8 sm:mb-12 flex items-center justify-center">
             <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full"></div>
             {/* Lines */}
             <div className="absolute w-[120%] h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 left-1/2 -translate-x-1/2 -rotate-[15deg] opacity-50"></div>
             <div className="absolute w-[120%] h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 left-1/2 -translate-x-1/2 rotate-[15deg] opacity-50"></div>
             
             {/* Icon */}
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.8)] relative z-10">
                <span className="text-emerald-900 font-bold text-lg sm:text-xl">฿</span>
             </div>
             
             {/* Light Cone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-emerald-500/20 blur-sm"></div>
          </div>

          <h2 className="text-xl sm:text-2xl font-medium text-white mb-2 px-2">Free crypto top up</h2>
          <p className="text-zinc-400 max-w-xs mx-auto mb-8 sm:mb-10 text-xs sm:text-sm font-light leading-relaxed px-4">
             Discover a user-friendly platform for trading over 3,000+ assets with zero fees.
          </p>
          
          <div className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4 px-4">
             <button onClick={() => setCurrentView('AUTH_REGISTER')} className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-base sm:text-lg rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98]">
                Open account
             </button>
             <button onClick={() => setCurrentView('AUTH_LOGIN')} className="w-full py-2 text-white/70 hover:text-white font-medium transition-colors text-xs sm:text-sm">
                Login
             </button>
          </div>
       </div>
    </div>
  );

  const AuthScreen = ({ type }: { type: 'login' | 'register' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      await handleAuthComplete(email, password);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
         {/* Use Emerald Theme Background */}
         <AnimatedBackground intensity="high" theme="emerald" />
         
         <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-20">
            <button onClick={() => setCurrentView('LANDING')} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm sm:text-base">
               <ChevronLeft size={18} className="sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Back</span>
            </button>
         </div>

         <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 animate-fade-in shadow-emerald-900/20 mx-4">
            <div className="text-center mb-6 sm:mb-8">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="font-bold text-white text-lg sm:text-xl">J</span>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
               <p className="text-zinc-400 text-xs sm:text-sm font-light px-2">{type === 'login' ? 'Enter your details to access your portfolio' : 'Join the future of intuitive banking'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
               <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 ml-2">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="hello@jdh.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 text-sm sm:text-base" 
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-xs text-zinc-500 ml-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={authLoading}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 text-sm sm:text-base" 
                  />
               </div>
               
               {authError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs sm:text-sm">
                     {authError}
                  </div>
               )}
               
               {type === 'login' && (
                  <div className="flex justify-end">
                     <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400">Forgot Password?</button>
                  </div>
               )}

               <button 
                 type="submit"
                 disabled={authLoading || !email || !password}
                 className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
               >
                  {authLoading ? (
                    <>
                      <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                      <span className="text-xs sm:text-base">{type === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    type === 'login' ? 'Sign In' : 'Sign Up'
                  )}
               </button>
            </form>
            
            <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-zinc-500">
               {type === 'login' ? 'New user?' : 'Already have an account?'}{' '}
               <button onClick={() => {
                 setEmail('');
                 setPassword('');
                 setAuthError(null);
                 setCurrentView(type === 'login' ? 'AUTH_REGISTER' : 'AUTH_LOGIN');
               }} className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                 {type === 'login' ? 'Create account' : 'Log in'}
               </button>
            </div>
         </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header Mobile */}
      <header className="md:hidden flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <User size={16} className="text-emerald-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">jdh.</span>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowNotifications(true)} className="p-2 rounded-full hover:bg-zinc-800 transition-colors relative">
              <Bell size={20} className="text-zinc-300" />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-zinc-950"></span>
            </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
           {/* Balance Card */}
           <div className="relative p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-zinc-900 border border-zinc-800 overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              
              <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Wallet size={12} className="sm:w-[14px] sm:h-[14px]" /> Total Balance
                </span>
                
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter tabular-nums">
                    {showBalance ? `฿${totalBalanceTHB.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••••'}
                  </h2>
                  <button onClick={() => setShowBalance(!showBalance)} className="text-zinc-600 hover:text-emerald-400 transition-colors p-1">
                    <Eye size={18} className="sm:w-5 sm:h-5" />
                    <EyeOff size={18} className="sm:w-5 sm:h-5 hidden" />
                  </button>
                </div>
                
                <p className="text-emerald-500 font-medium text-xs sm:text-sm flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-4 sm:mb-6">
                  {showBalance ? `≈ $${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••'} USD
                  {balancesLoading && <Loader2 size={10} className="sm:w-3 sm:h-3 animate-spin ml-1" />}
                </p>

                {/* Quick Actions (Desktop) */}
                <div className="w-full hidden md:block">
                   <div className="flex gap-4">
                      {[
                        { label: 'Send', icon: ArrowRight, action: () => {
                          setPendingSendAction(() => () => setActiveModal('send'));
                          setShowApiPaymentModal(true);
                        }},
                        { label: 'Receive', icon: ArrowRight, action: () => setActiveModal('receive'), rotate: 'rotate-90' },
                        { label: 'Swap', icon: ArrowRight, action: () => setActiveModal('swap') },
                        { label: 'Buy Crypto', icon: ArrowRight, action: () => setShowBuyCrypto(true), rotate: '-rotate-90' }
                      ].map((btn, i) => (
                         <button key={i} onClick={btn.action} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                             <div className={`w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center ${btn.rotate || '-rotate-45'}`}>
                                <btn.icon size={16} />
                             </div>
                             <span className="text-white font-medium whitespace-nowrap">{btn.label}</span>
                         </button>
                      ))}
                   </div>
                </div>
              </div>
           </div>

           {/* Mobile Quick Actions */}
           <div className="md:hidden">
             <QuickActions
               onSendClick={() => {
                 setPendingSendAction(() => () => setActiveModal('send'));
                 setShowApiPaymentModal(true);
               }}
               onReceiveClick={() => setActiveModal('receive')}
               onSwapClick={() => setActiveModal('swap')}
               onBuyClick={() => setShowBuyCrypto(true)} onAction={(type) => {
                if (type === 'send') setActiveModal('send');
                if (type === 'receive') setActiveModal('receive');
                if (type === 'swap') setActiveModal('swap');
                if (type === 'scan') setShowBuyCrypto(true); // Demo scan functionality
             }} />
           </div>

           {/* Banners */}
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
               {BANNERS.map(banner => (
                 <div key={banner.id} onClick={() => setShowAnnouncements(true)} className="min-w-[280px] md:min-w-[320px] h-36 md:h-40 rounded-2xl relative overflow-hidden snap-center group cursor-pointer border border-zinc-800 hover:border-emerald-500/30 transition-all">
                    <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity grayscale group-hover:grayscale-0 duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 flex flex-col justify-end">
                       <h3 className="font-bold text-lg text-white leading-tight">{banner.title}</h3>
                       <p className="text-xs text-zinc-300 mt-1">{banner.subtitle}</p>
                    </div>
                 </div>
               ))}
           </div>
           
           {/* Desktop Market List */}
           <div className="hidden md:block">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white">Market Overview</h3>
                 {publicKey && (
                   <button 
                     onClick={refreshBalances}
                     disabled={balancesLoading}
                     className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                   >
                     {balancesLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
                   </button>
                 )}
              </div>
               {balancesLoading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 size={24} className="animate-spin text-emerald-400" />
                 </div>
               ) : (
                 <AssetList coins={displayCoins} compact={false} onSelectCoin={setSelectedCoin} />
               )}
           </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* AI Insight */}
           <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 p-3 opacity-10">
                  <Sparkles size={100} className="text-emerald-400" />
               </div>
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Sparkles size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white tracking-wide text-sm">AI Insight</h3>
               </div>
               <p className="text-sm text-zinc-300 leading-relaxed font-light mb-3">
                  {marketInsight || "ตลาดวันนี้มีความผันผวน Bitcoin ยังคงเป็นผู้นำตลาดที่แข็งแกร่ง"}
               </p>
               <button onClick={fetchInsight} className="text-xs text-emerald-400 hover:text-emerald-300 underline">
                 {loadingInsight ? 'Analyzing...' : 'Refresh Analysis'}
               </button>
           </div>

           {/* Mobile Asset List */}
           <div className="md:hidden">
              {balancesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                </div>
              ) : (
                <AssetList coins={displayCoins} onSelectCoin={setSelectedCoin} />
              )}
           </div>

           {/* Recent Transactions */}
           <div className="hidden md:block bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-emerald-400" />
                </div>
              ) : transactionHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  ไม่มีรายการล่าสุด
                </div>
              ) : (
                <div className="space-y-4">
                 {transactionHistory.slice(0, 3).map(tx => (
                   <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className="flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 p-2 rounded-lg transition-colors -mx-2">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'receive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {tx.type === 'receive' ? <ArrowRight className="rotate-90" size={14} /> : <ArrowRight className="-rotate-45" size={14} />}
                         </div>
                         <div>
                            <p className="text-sm font-medium text-white capitalize">{tx.type} {tx.coinSymbol}</p>
                            <p className="text-xs text-zinc-500">{tx.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-medium ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                            {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.coinSymbol}
                         </p>
                         <p className="text-xs text-zinc-500">฿{tx.amountTHB.toLocaleString()}</p>
                      </div>
                   </div>
                 ))}
                 <button onClick={() => setActiveTab(NavTab.HISTORY)} className="w-full text-center text-xs text-zinc-500 hover:text-white mt-2">View All</button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  const renderMarket = () => (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-0">
        <header className="flex justify-between items-center py-2 md:hidden">
            <h2 className="text-2xl font-bold text-white tracking-tight">ตลาด <span className="text-zinc-500 text-lg font-normal">(Market)</span></h2>
        </header>
        <div className="hidden md:block mb-6">
           <h1 className="text-3xl font-bold text-white">Market Trends</h1>
           <p className="text-zinc-400">Real-time cryptocurrency prices and charts</p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['Favorites', 'Top Gainers', 'Top Losers', 'New Listing', 'Metaverse'].map((filter, i) => (
              <button key={filter} className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
                {filter}
              </button>
          ))}
        </div>

        {balancesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <AssetList coins={[...displayCoins].sort((a,b) => b.change24h - a.change24h)} onSelectCoin={setSelectedCoin} />
        )}
    </div>
  );

  const renderWallet = () => (
    <div className="animate-fade-in space-y-4 sm:space-y-5 md:space-y-6 pb-24 md:pb-0">
       <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">พอร์ตการลงทุน <span className="text-zinc-500 text-sm sm:text-base font-normal hidden md:inline">(Portfolio)</span></h2>
          {publicKey && (
            <button 
              onClick={refreshBalances}
              disabled={balancesLoading}
              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 flex items-center gap-1"
            >
              {balancesLoading ? <Loader2 size={12} className="animate-spin" /> : null}
              {balancesLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          )}
       </div>

       {!publicKey ? (
         <div className="text-center py-12 text-zinc-500">
           <p>กรุณาสร้างหรือเชื่อมกระเป๋าก่อนเพื่อดูพอร์ตการลงทุน</p>
         </div>
       ) : balancesLoading ? (
         <div className="flex items-center justify-center py-12">
           <Loader2 size={32} className="animate-spin text-emerald-400" />
         </div>
       ) : balancesError ? (
         <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
           <p className="text-red-400 text-sm">{balancesError}</p>
           <button onClick={refreshBalances} className="text-xs text-red-400 hover:text-red-300 mt-2 underline">
             ลองใหม่
           </button>
         </div>
       ) : (
         <>
           {/* Portfolio Summary */}
           <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="relative z-10">
                 <p className="text-zinc-400 text-xs sm:text-sm mb-2">มูลค่ารวมพอร์ต</p>
                 <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    {showBalance ? `฿${totalBalanceTHB.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••••'}
                 </h2>
                 <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs sm:text-sm font-medium">
                       {showBalance ? `≈ $${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••'} USD
                    </span>
                 </div>
              </div>
           </div>

           {/* Asset Distribution */}
           {walletCoins.length > 0 ? (
             <div className="bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">การกระจายสินทรัพย์</h3>
                <div className="space-y-2.5 sm:space-y-3">
                   {walletCoins.map(coin => {
                      const value = coin.price * coin.balance;
                      const percentage = totalBalanceTHB > 0 ? (value / totalBalanceTHB) * 100 : 0;
                      return (
                         <div key={coin.id} onClick={() => setSelectedCoin(coin)} className="cursor-pointer hover:bg-zinc-800/50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-colors">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                               <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm" style={{ backgroundColor: coin.color }}>
                                     {coin.symbol[0]}
                                  </div>
                                  <div>
                                     <p className="text-white font-medium text-sm sm:text-base">{coin.name}</p>
                                     <p className="text-zinc-500 text-[10px] sm:text-xs">{coin.balance.toFixed(6)} {coin.symbol}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-white font-bold text-sm sm:text-base">฿{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                  <p className="text-zinc-500 text-[10px] sm:text-xs">{percentage.toFixed(1)}%</p>
                               </div>
                            </div>
                            <div className="w-full bg-zinc-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
                               <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: coin.color }}></div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
           ) : (
             <div className="bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
                <p className="text-zinc-500 mb-3 sm:mb-4 text-sm sm:text-base">ยังไม่มีสินทรัพย์ในกระเป๋า</p>
                <button 
                  onClick={() => setActiveModal('receive')}
                  className="px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm sm:text-base rounded-lg sm:rounded-xl"
                >
                  รับเหรียญ
                </button>
             </div>
           )}

           {/* Your Assets */}
           <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                 <h3 className="text-lg sm:text-xl font-bold text-white">สินทรัพย์ของคุณ</h3>
                 <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">ดูทั้งหมด</button>
              </div>
              {walletCoins.length > 0 ? (
                <AssetList coins={walletCoins.filter(c => c.balance > 0)} onSelectCoin={setSelectedCoin} />
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">
                   ไม่มีสินทรัพย์
                </div>
              )}
           </div>
         </>
       )}
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in space-y-4 sm:space-y-5 md:space-y-6 pb-24 md:pb-0">
       <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">ประวัติธุรกรรม <span className="text-zinc-500 text-sm sm:text-base font-normal hidden md:inline">(History)</span></h2>
          {publicKey && (
            <button 
              onClick={async () => {
                setLoadingHistory(true);
                try {
                  // Using static import instead of dynamic
                  const heliusTxs = await getTransactionHistory(publicKey, 20);
                  const converted: Transaction[] = heliusTxs.map((tx) => ({
                    id: tx.signature,
                    type: tx.type === 'TRANSFER' ? (tx.destination === publicKey ? 'receive' : 'send') : 'swap',
                    coinSymbol: tx.symbol || 'SOL',
                    amount: tx.amount,
                    amountTHB: tx.amount * 34.5,
                    date: new Date(tx.timestamp * 1000).toLocaleString('th-TH', { 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }),
                    status: tx.status === 'SUCCESS' ? 'completed' : 'failed',
                  }));
                  setTransactionHistory(converted);
                } catch (error) {
                  console.error('Refresh failed:', error);
                } finally {
                  setLoadingHistory(false);
                }
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              {loadingHistory ? 'กำลังโหลด...' : 'รีเฟรช'}
            </button>
          )}
       </div>

       {loadingHistory ? (
         <div className="flex items-center justify-center py-12">
           <Loader2 size={32} className="animate-spin text-emerald-400" />
         </div>
       ) : transactionHistory.length === 0 ? (
         <div className="text-center py-12 text-zinc-500">
           <p>ไม่มีประวัติธุรกรรม</p>
           {!publicKey && <p className="text-xs mt-2">กรุณาสร้างหรือเชื่อมกระเป๋าก่อน</p>}
         </div>
       ) : (
         <div className="space-y-3">
            {transactionHistory.map((tx) => (
               <div key={tx.id} onClick={() => setSelectedTransaction(tx)} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.type === 'receive' ? 'bg-emerald-500/10 text-emerald-400' : 
                        tx.type === 'send' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                     }`}>
                        {tx.type === 'receive' ? <ArrowRight className="rotate-90" size={20} /> : 
                         tx.type === 'send' ? <ArrowRight className="-rotate-45" size={20} /> : <ArrowRight size={20} />}
                     </div>
                     <div>
                        <h4 className="font-bold text-white capitalize">{tx.type} {tx.coinSymbol}</h4>
                        <p className="text-xs text-zinc-500">{tx.date} • {tx.status}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-bold ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount.toFixed(6)} {tx.coinSymbol}
                     </p>
                     <p className="text-xs text-zinc-500">฿{tx.amountTHB.toLocaleString()}</p>
                  </div>
               </div>
            ))}
         </div>
       )}
    </div>
  );

  const renderRewards = () => (
    <div className="animate-fade-in pb-24 md:pb-0">
       <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
             <Award size={48} className="text-white mx-auto mb-4 drop-shadow-md" />
             <h2 className="text-3xl font-bold text-white mb-2">JDH Rewards</h2>
             <p className="text-emerald-100 mb-6">สะสมคะแนนแลกรับสิทธิพิเศษมากมาย</p>
             <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-white font-bold text-xl border border-white/30">
                <span>💎 1,250 Points</span>
             </div>
          </div>
       </div>

       <h3 className="text-white font-bold mb-4 text-lg">ภารกิจแนะนำ (Missions)</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
             <div key={i} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl">🎁</div>
                <div className="flex-1">
                   <h4 className="text-white font-medium text-sm">ชวนเพื่อนใช้งาน jdh</h4>
                   <p className="text-zinc-500 text-xs mt-1">+500 Points</p>
                </div>
                <button className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-500 hover:text-black transition-colors">ทำภารกิจ</button>
             </div>
          ))}
       </div>
    </div>
  );

  const renderSettings = () => {
    return (
      <SettingsPage
        currentUser={currentUser}
        publicKey={publicKey}
        wallet={wallet}
        onLogout={() => setShowLogoutConfirm(true)}
      />
    );
  };

  // --- Main Render Logic ---

  // Render global modals that need to appear over all views
  const globalModals = (
    <>
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
      />
      <SecurityWarningModal
        isOpen={showSecurityWarning}
        onConfirm={() => {
          console.log('SecurityWarningModal onConfirm called');
          setShowSecurityWarning(false);
          // Trigger show seed via window function with delay to ensure component is ready
          setTimeout(() => {
            console.log('SecurityWarning confirmed, trying to call __walletSetupShowSeed');
            if (typeof (window as any).__walletSetupShowSeed === 'function') {
              console.log('Calling __walletSetupShowSeed');
              try {
                (window as any).__walletSetupShowSeed();
              } catch (err) {
                console.error('Error calling __walletSetupShowSeed:', err);
              }
            } else {
              console.error('__walletSetupShowSeed function not found!');
              // Fallback: try to trigger directly via event
              window.dispatchEvent(new CustomEvent('showSeedPhrase'));
            }
          }, 100);
        }}
        onCancel={() => {
          console.log('SecurityWarningModal onCancel called');
          setShowSecurityWarning(false);
        }}
        type={securityWarningType}
      />
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
      />
    </>
  );

  if (currentView === 'LANDING') {
    return (
      <>
        <LandingPage />
        {globalModals}
      </>
    );
  }
  if (currentView === 'ONBOARDING') {
    return (
      <>
        <Onboarding onComplete={() => setCurrentView('AUTH_REGISTER')} />
        {globalModals}
      </>
    );
  }
  if (currentView === 'AUTH_LOGIN') {
    return (
      <>
        <AuthScreen type="login" />
        {globalModals}
      </>
    );
  }
  if (currentView === 'AUTH_REGISTER') {
    return (
      <>
        <AuthScreen type="register" />
        {globalModals}
      </>
    );
  }
  if (currentView === 'WALLET_CREATE') {
    return (
      <>
        <WalletSetup 
          mode="CREATE" 
          onBack={() => setCurrentView('AUTH_REGISTER')} 
          onComplete={handleWalletComplete} 
          onWalletCreated={handleWalletCreated} 
          showSecurityWarning={() => { 
            console.log('showSecurityWarning called from WalletSetup'); 
            setSecurityWarningType('seed'); 
            setShowSecurityWarning(true); 
            console.log('setShowSecurityWarning(true) called'); 
          }} 
          onSecurityWarningConfirmed={() => { setWalletSetupShowSeed(() => () => {}); }} 
        />
        {globalModals}
      </>
    );
  }
  if (currentView === 'WALLET_IMPORT') {
    return (
      <>
        <WalletSetup 
          mode="IMPORT" 
          onBack={() => setCurrentView('AUTH_REGISTER')} 
          onComplete={handleWalletComplete} 
          onWalletImported={handleWalletImported} 
          showSecurityWarning={() => { 
            setSecurityWarningType('import'); 
            setShowSecurityWarning(true); 
          }} 
          onSecurityWarningConfirmed={() => {}} 
        />
        {globalModals}
      </>
    );
  }
  
  if (selectedCoin) {
    return (
      <>
        <CoinDetail 
          coin={selectedCoin} 
          transactions={MOCK_TRANSACTIONS} 
          onBack={() => setSelectedCoin(null)} 
          onAction={(type) => { setActiveModal(type); }}
        />
        {globalModals}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-prompt selection:bg-emerald-500/30 selection:text-white flex relative overflow-hidden">
      {/* Background Ambient Glow for Main App (Emerald Theme) */}
      <AnimatedBackground intensity="low" theme="emerald" />

      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setShowLogoutConfirm(true)} currentUser={currentUser} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 relative z-10 p-4 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
        {activeTab === NavTab.HOME && renderDashboard()}
        {activeTab === NavTab.MARKET && renderMarket()}
        {activeTab === NavTab.WALLET && renderWallet()}
        {activeTab === NavTab.HISTORY && renderHistory()}
        {activeTab === NavTab.REWARDS && renderRewards()}
        {activeTab === NavTab.SETTINGS && renderSettings()}
        {activeTab === NavTab.HELP && <HelpCenter faqs={FAQS} onClose={() => setActiveTab(NavTab.HOME)} />}
        {activeTab === NavTab.SWAP && (
           <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="p-8 bg-zinc-900 rounded-3xl border border-white/5 text-center">
                  <h3 className="text-white font-bold text-xl mb-2">Swap Feature</h3>
                  <button onClick={() => setActiveModal('swap')} className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl mt-4">Open Swap</button>
              </div>
           </div>
        )}
      </div>
      
      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Overlays */}
      <ActionModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
        coins={displayCoins}
        onSend={handleSendAsset}
        onSwap={handleSwap}
        receiveAddress={wallet.publicKey}
        sending={walletLoading}
        sendError={walletError}
        walletPublicKey={wallet.publicKey}
      />
      {showNotifications && <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} />}
      {showAnnouncements && <AnnouncementCenter banners={BANNERS} onClose={() => setShowAnnouncements(false)} />}
      {showBuyCrypto && <BuyCryptoModal onClose={() => setShowBuyCrypto(false)} />}
      
      {/* New Overlays */}
      <TransactionDetailModal tx={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      <LogoutModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />
      
      {/* API Payment Modal */}
      <ApiPaymentModal
        isOpen={showApiPaymentModal}
        onClose={() => {
          setShowApiPaymentModal(false);
          setPendingSendAction(null);
        }}
        onConfirm={() => {
          if (pendingSendAction) {
            pendingSendAction();
            setPendingSendAction(null);
          }
        }}
      />
      
      {/* Security Modals - Also render here for APP view */}
      {globalModals}
    </div>
  );
};

export default App;