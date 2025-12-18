import React, { useState, useEffect, useRef, ErrorInfo } from 'react';
import { X, ArrowDown, Search, QrCode, Copy, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { Coin } from '../types';
import Confetti from 'react-confetti';
import { SendConfirmationModal, SwapConfirmationModal } from './ConfirmationModals';
import { getQuote } from '../services/jupiter';

interface ActionModalProps {
  type: 'send' | 'receive' | 'swap' | null;
  onClose: () => void;
  coins: Coin[];
  onSend?: (params: { to: string; amount: number; symbol: string; mintAddress?: string }) => Promise<{ signature?: string; explorer?: string } | void>;
  onSwap?: (params: { fromMint: string; toMint: string; amount: number; slippage?: number }) => Promise<{ signature?: string; explorer?: string } | void>;
  receiveAddress?: string;
  sending?: boolean;
  sendError?: string | null;
  walletPublicKey?: string;
}

// Internal component - actual modal implementation
const ActionModalContent: React.FC<ActionModalProps> = ({ type, onClose, coins, onSend, onSwap, receiveAddress, sending = false, sendError, walletPublicKey }) => {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<Coin>(coins[0]);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [txResult, setTxResult] = useState<{ signature?: string; explorer?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  
  // Confirmation modals
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  
  // Swap states
  const [fromCoin, setFromCoin] = useState<Coin>(coins.find(c => c.symbol === 'SOL') || coins[0]);
  const [toCoin, setToCoin] = useState<Coin>(coins.find(c => c.symbol === 'USDC') || coins[1] || coins[0]);
  const [swapAmount, setSwapAmount] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<{ outAmount: string; priceImpact: number; rawOutAmount?: string } | null>(null);
  const [swapping, setSwapping] = useState(false);
  
  // Filter coins that can actually be sent (SOL and SPL tokens on Solana)
  // Exclude mock coins like BTC, ETH that aren't on Solana
  const sendableCoins = React.useMemo(() => {
    return coins.filter(coin => {
      // Include SOL
      if (coin.symbol === 'SOL') return true;
      // Include SPL tokens (have mint address in coin.id and balance > 0)
      if (coin.id && coin.id !== 'sol' && coin.id.length > 20) {
        return true;
      }
      // Include JDH and WARP (mock coins but can be sent)
      if (coin.symbol === 'JDH' || coin.symbol === 'WARP') return true;
      return false;
    });
  }, [coins]);

  // Close coin selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (coinSelectorRef.current && !coinSelectorRef.current.contains(event.target as Node)) {
        setShowCoinSelector(false);
      }
    };

    if (showCoinSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCoinSelector]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (type) {
        setStatus('IDLE');
        setAmount('');
        setToAddress('');
        setSwapAmount('');
        setTxResult(null);
        setQuote(null);
        setErrorMessage(null); // Clear error when modal opens
        setFromCoin(coins.find(c => c.symbol === 'SOL') || coins[0]);
        setToCoin(coins.find(c => c.symbol === 'USDC') || coins[1] || coins[0]);
        
        // Set selectedCoin to first sendable coin (prefer SOL)
        if (type === 'send') {
          const solCoin = sendableCoins.find(c => c.symbol === 'SOL');
          const firstSendable = solCoin || sendableCoins.find(c => c.balance > 0) || sendableCoins[0];
          if (firstSendable) {
            setSelectedCoin(firstSendable);
          }
        }
    }
  }, [type, coins, sendableCoins]);

  // Fetch swap quote
  useEffect(() => {
    if (type === 'swap' && swapAmount && Number(swapAmount) > 0 && fromCoin && toCoin) {
      const fetchQuote = async () => {
        setQuoteLoading(true);
        try {
          // Using static import
          const fromMint = fromCoin.symbol === 'SOL' 
            ? 'So11111111111111111111111111111111111111112' 
            : fromCoin.id; // Use coin id as mint for now
          const toMint = toCoin.symbol === 'SOL'
            ? 'So11111111111111111111111111111111111111112'
            : toCoin.id;
            
          // Convert amount to smallest unit based on token decimals
          // SOL has 9 decimals, most SPL tokens have 6-9 decimals
          // In production, fetch decimals from on-chain metadata
          const inputDecimals = fromCoin.symbol === 'SOL' ? 9 : 6; // Default to 6 for SPL tokens
          const outputDecimals = toCoin.symbol === 'SOL' ? 9 : 6; // Default to 6 for SPL tokens
          const amountRaw = Math.floor(Number(swapAmount) * (10 ** inputDecimals));
          
          const quoteResult = await getQuote({
            inputMint: fromMint,
            outputMint: toMint,
            amount: amountRaw,
            slippageBps: 100,
          });
          
          // Jupiter returns outAmount in the smallest unit of the output token
          const rawOutAmount = quoteResult.outAmount; // Raw amount from Jupiter (string)
          const formattedOutAmount = (Number(rawOutAmount) / (10 ** outputDecimals)).toFixed(6);
          setQuote({
            outAmount: formattedOutAmount,
            priceImpact: quoteResult.priceImpactPct || 0,
            rawOutAmount: rawOutAmount, // Store raw for potential future use
          });
        } catch (e) {
          console.error('Quote error:', e);
          setQuote(null);
        } finally {
          setQuoteLoading(false);
        }
      };
      
      const timeout = setTimeout(fetchQuote, 500);
      return () => clearTimeout(timeout);
    } else {
      setQuote(null);
    }
  }, [type, swapAmount, fromCoin, toCoin]);

  if (!type) return null;

  const handleAction = async () => {
    try {
      if (type === 'send' && onSend) {
        // Show confirmation modal first
        setShowSendConfirm(true);
        return;
      }
      
      if (type === 'swap' && onSwap) {
        // Show confirmation modal first
        setShowSwapConfirm(true);
        return;
      }
      
      setStatus('PROCESSING');
      setTimeout(() => {
          setStatus('SUCCESS');
      }, 1200);
    } catch (e: any) {
      console.error('❌ handleAction error:', e);
      setErrorMessage(e?.message || 'เกิดข้อผิดพลาด');
      setStatus('IDLE');
    }
  };

  const handleSendConfirm = async () => {
    if (!onSend) return;
    
    // Validate inputs
    if (!toAddress || toAddress.trim().length === 0) {
      alert('กรุณากรอกที่อยู่ผู้รับ');
      return;
    }
    
    if (!amount || Number(amount) <= 0) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }
    
    // Validate address format
    try {
      // Try to validate as Solana address
      const { PublicKey } = await import('@solana/web3.js');
      new PublicKey(toAddress.trim());
    } catch (e) {
      alert('ที่อยู่ไม่ถูกต้อง กรุณาตรวจสอบ Solana address');
      return;
    }
    
    // Validate amount doesn't exceed balance
    if (Number(amount) > selectedCoin.balance) {
      alert(`ยอดเงินไม่พอ (Available: ${selectedCoin.balance} ${selectedCoin.symbol})`);
      return;
    }
    
    setShowSendConfirm(false);
    setStatus('PROCESSING');
    setErrorMessage(null); // Clear previous error
    
    try {
      // Pass mint address for SPL tokens (coin.id should be mint address for tokens)
      const mintAddress = selectedCoin.symbol === 'SOL' ? undefined : selectedCoin.id;
      
      // Validate mint address for tokens
      if (selectedCoin.symbol !== 'SOL' && !mintAddress) {
        const error = `ไม่พบที่อยู่เหรียญ (Mint Address) สำหรับ ${selectedCoin.symbol}`;
        setErrorMessage(error);
        setStatus('IDLE');
        alert(error);
        return;
      }
      
      console.log('📤 Sending transaction:', {
        symbol: selectedCoin.symbol,
        mintAddress,
        to: toAddress.trim(),
        amount: Number(amount),
      });
      
      // Call onSend and catch any errors
      let result;
      try {
        result = await onSend({ 
          to: toAddress.trim(), 
          amount: Number(amount), 
          symbol: selectedCoin.symbol,
          mintAddress: mintAddress
        });
      } catch (sendError: any) {
        console.error('❌ onSend error caught:', sendError);
        // Re-throw to be caught by outer catch
        throw sendError;
      }
      
      if (result) {
        setTxResult(result);
        setStatus('SUCCESS');
        setErrorMessage(null);
        // Show success message
        console.log('✅ Transaction successful:', result);
      } else {
        // If no result but no error, assume success
        setStatus('SUCCESS');
        setErrorMessage(null);
      }
    } catch (e: any) {
      setStatus('IDLE');
      setShowSendConfirm(false); // Close confirmation modal on error
      
      // Extract error message
      let errorMsg = 'การโอนล้มเหลว';
      
      if (e?.message) {
        errorMsg = e.message;
      } else if (typeof e === 'string') {
        errorMsg = e;
      } else if (e?.toString) {
        errorMsg = e.toString();
      }
      
      // Set error message state
      setErrorMessage(errorMsg);
      
      // Show user-friendly error message
      alert(errorMsg);
      console.error('❌ Send error:', e);
      
      // Log full error for debugging
      console.error('Full error details:', {
        error: e,
        errorName: e?.name,
        errorStack: e?.stack,
        coin: selectedCoin,
        toAddress: toAddress.trim(),
        amount: Number(amount),
      });
      
      // Prevent error from bubbling up
      e.preventDefault?.();
      e.stopPropagation?.();
    }
  };

  const handleSwapConfirm = async () => {
    if (!onSwap) return;
    setShowSwapConfirm(false);
    setSwapping(true);
    setStatus('PROCESSING');
    try {
      // Get mint addresses (SOL is native, others need mint address)
      const fromMint = fromCoin.symbol === 'SOL' 
        ? 'So11111111111111111111111111111111111111112' 
        : fromCoin.id; // Use coin id as mint for now
      const toMint = toCoin.symbol === 'SOL'
        ? 'So11111111111111111111111111111111111111112'
        : toCoin.id;
        
      const result = await onSwap({
        fromMint,
        toMint,
        amount: Number(swapAmount),
        slippage: 100, // 1% slippage
      });
      if (result) setTxResult(result);
      setStatus('SUCCESS');
    } catch (e: any) {
      console.error('Swap error:', e);
      setStatus('IDLE');
      alert(e.message || 'Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  const handleClose = () => {
      onClose();
      // Delay reset to avoid UI jumping while closing
      setTimeout(() => setStatus('IDLE'), 300);
  };

  if (status === 'PROCESSING') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">กำลังทำรายการ...</h3>
                <p className="text-zinc-500 text-sm">กรุณาอย่าปิดหน้าต่างนี้</p>
            </div>
        </div>
      );
  }

  if (status === 'SUCCESS') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <Confetti numberOfPieces={200} recycle={false} />
            <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl"></div>
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-10 animate-bounce">
                    <CheckCircle size={40} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 z-10">ทำรายการสำเร็จ!</h3>
                <p className="text-zinc-400 text-sm mb-6 z-10">
                    {type === 'send' ? `โอน ${amount} ${selectedCoin.symbol} เรียบร้อยแล้ว` : 
                     type === 'swap' ? 'แลกเปลี่ยนเหรียญเรียบร้อยแล้ว' : 'ดำเนินการเสร็จสิ้น'}
                </p>
                {txResult?.explorer && (
                  <a href={txResult.explorer} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs underline mb-4 z-10">
                    เปิดใน Explorer
                  </a>
                )}
                <button onClick={handleClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors z-10">
                    ปิดหน้าต่าง
                </button>
            </div>
        </div>
      );
  }

  const renderContent = () => {
    switch (type) {
      case 'send':
        return (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">โอนเหรียญ (Send)</h2>
            <div className="space-y-3 sm:space-y-4">
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">เลือกเหรียญ</label>
                  <div className="relative" ref={coinSelectorRef}>
                    <button
                      onClick={() => setShowCoinSelector(!showCoinSelector)}
                      className="w-full bg-zinc-800/50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-between border border-white/10 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {selectedCoin.logoURI ? (
                          <img src={selectedCoin.logoURI} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" alt={selectedCoin.symbol} />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: selectedCoin.color }}>
                            {selectedCoin.symbol[0]}
                          </div>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-white text-sm sm:text-base">{selectedCoin.symbol}</span>
                          {selectedCoin.balance > 0 && (
                            <span className="text-xs text-zinc-400">Balance: {selectedCoin.balance.toFixed(4)}</span>
                          )}
                        </div>
                      </div>
                      <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showCoinSelector ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Coin Selector Dropdown */}
                    {showCoinSelector && (
                      <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg sm:rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                        {sendableCoins.length === 0 ? (
                          <div className="p-4 text-center text-zinc-400 text-sm">ไม่มีเหรียญที่สามารถโอนได้</div>
                        ) : (
                          sendableCoins.map((coin) => (
                            <button
                              key={coin.id}
                              onClick={() => {
                                setSelectedCoin(coin);
                                setShowCoinSelector(false);
                                setAmount(''); // Reset amount when changing coin
                              }}
                              className={`w-full p-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors ${
                                selectedCoin.id === coin.id ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                              }`}
                            >
                              {coin.logoURI ? (
                                <img src={coin.logoURI} className="w-8 h-8 rounded-full" alt={coin.symbol} />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: coin.color }}>
                                  {coin.symbol[0]}
                                </div>
                              )}
                              <div className="flex-1 text-left">
                                <div className="font-medium text-white">{coin.symbol}</div>
                                <div className="text-xs text-zinc-400">{coin.name}</div>
                              </div>
                              {coin.balance > 0 && (
                                <div className="text-right">
                                  <div className="text-sm font-medium text-white">{coin.balance.toFixed(4)}</div>
                                  <div className="text-xs text-zinc-400">{coin.symbol}</div>
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
               </div>
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">ที่อยู่ผู้รับ (Address)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        setToAddress(value);
                        // Address validation will be done on submit
                      }}
                      placeholder="วาง Solana Address ที่นี่ (44 characters)"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-white text-sm sm:text-base focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600 font-mono"
                    />
                    <button 
                      className="absolute right-2.5 sm:right-3 top-2.5 sm:top-3 text-emerald-400 hover:text-emerald-300 transition-colors"
                      title="Scan QR Code"
                    >
                       <QrCode size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  {toAddress && toAddress.length > 0 && toAddress.length !== 44 && (
                    <p className="text-xs text-yellow-400 mt-1">⚠️ Solana address ควรมี 44 ตัวอักษร</p>
                  )}
               </div>
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">จำนวน (Amount)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-white text-base sm:text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                  <div className="text-right mt-1 text-xs text-zinc-500">Available: {selectedCoin.balance} {selectedCoin.symbol}</div>
               </div>
               {sendError && <p className="text-red-400 text-xs">{sendError}</p>}
               <button
                 onClick={handleAction}
                 disabled={!amount || !toAddress || sending}
                 className="w-full py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-4 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  ยืนยันการโอน
               </button>
            </div>
          </>
        );
      case 'receive':
        // For all Solana tokens (SOL and SPL tokens like JDH), we show the wallet address
        // Solana will automatically create Associated Token Account (ATA) when tokens are sent
        const displayAddress = receiveAddress;
        const isJDH = selectedCoin.symbol === 'JDH';
        
        return (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">รับเหรียญ (Receive)</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6 px-2">
              {isJDH ? 'รับ JDH Token' : 'สแกน QR Code เพื่อรับเงิน'}
            </p>
            
            <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg shadow-white/5">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${displayAddress || selectedCoin.symbol + '-wallet-address'}`} alt="QR Code" className="w-40 h-40 sm:w-48 sm:h-48 mix-blend-multiply" />
            </div>
            
            <div className="bg-zinc-800/50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl w-full flex items-center justify-between border border-white/10 mb-3 sm:mb-4 cursor-pointer hover:bg-zinc-800 transition-colors group">
               <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  <span className="text-[10px] sm:text-xs text-zinc-400 font-mono truncate group-hover:text-white transition-colors">
                    {displayAddress || 'กรุณาสร้างกระเป๋าก่อน'}
                  </span>
               </div>
               <button
                 onClick={() => {
                   if (!displayAddress) return;
                   navigator.clipboard.writeText(displayAddress);
                   setCopied(true);
                   setTimeout(() => setCopied(false), 1500);
                 }}
                 className="text-emerald-400 flex-shrink-0 ml-2"
               >
                 {copied ? <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-400" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
               </button>
            </div>

            <div className="text-xs text-zinc-500 max-w-[280px] mb-3 sm:mb-4 space-y-2 px-2">
               {isJDH ? (
                 <>
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 sm:p-3 rounded-lg mb-2">
                      <p className="font-medium text-emerald-400 text-xs mb-1">
                         ✅ รับ JDH Token ได้เลย!
                      </p>
                      <p className="text-zinc-400 text-[10px] sm:text-[11px] leading-relaxed">
                         ส่ง JDH token มาที่ address นี้ได้เลย ระบบจะสร้าง Associated Token Account อัตโนมัติเมื่อมีการส่ง token มา
                      </p>
                   </div>
                   <p className="text-emerald-400/80 text-[9px] sm:text-[10px]">
                      💡 ไม่ต้องทำอะไรเพิ่มเติม แค่ส่ง JDH token มา address นี้
                   </p>
                </>
               ) : (
                 <>
                   <p className="font-medium text-zinc-400 text-xs">
                      ✅ ที่อยู่นี้สามารถรับได้:
                   </p>
                   <ul className="text-zinc-500 text-[10px] sm:text-[11px] space-y-1 list-disc list-inside ml-2">
                      <li>SOL (Solana native token)</li>
                      <li>SPL tokens ทั้งหมด (USDC, USDT, JDH, และอื่นๆ)</li>
                   </ul>
                   <p className="text-emerald-400/80 text-[9px] sm:text-[10px] mt-2">
                      💡 ระบบจะสร้าง Associated Token Account อัตโนมัติเมื่อมีการส่ง SPL token มา
                   </p>
                </>
               )}
               <p className="text-red-400/80 text-[9px] sm:text-[10px] mt-2 border-t border-white/5 pt-2">
                  ⚠️ อย่าส่งเหรียญจาก blockchain อื่น (Bitcoin, Ethereum, BSC) มายังที่อยู่นี้ เพราะจะสูญหายถาวร
               </p>
            </div>
            
            <button className="w-full py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm sm:text-base rounded-lg sm:rounded-xl transition-colors">
               แชร์ QR Code
            </button>
          </div>
        );
      case 'swap':
        return (
          <>
             <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">แลกเปลี่ยน (Swap)</h2>
             <div className="relative space-y-2">
                {/* From */}
                <div className="bg-zinc-800/30 p-4 rounded-2xl border border-white/5">
                   <div className="flex justify-between mb-2">
                      <span className="text-xs text-zinc-400">จาก (From)</span>
                      <span className="text-xs text-zinc-400">Balance: {fromCoin?.balance || 0}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <input 
                        type="number" 
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        placeholder="0" 
                        className="bg-transparent text-3xl font-bold text-white w-1/2 focus:outline-none placeholder:text-zinc-700" 
                      />
                      <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full hover:bg-zinc-700 border border-white/10">
                         <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: fromCoin?.color || '#666' }}>
                            {fromCoin?.symbol[0] || '?'}
                         </div>
                         <span className="text-white font-medium">{fromCoin?.symbol || 'SOL'}</span>
                         <ArrowDown size={14} className="text-zinc-500" />
                      </button>
                   </div>
                </div>

                {/* Swap Icon */}
                <button
                  onClick={() => {
                    const temp = fromCoin;
                    setFromCoin(toCoin);
                    setToCoin(temp);
                    setSwapAmount('');
                    setQuote(null);
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-900 border border-emerald-500/30 rounded-full flex items-center justify-center z-10 shadow-lg hover:bg-zinc-800 hover:scale-110 transition-all"
                >
                   <ArrowDown size={20} className="text-emerald-400" />
                </button>

                {/* To */}
                <div className="bg-zinc-800/30 p-4 rounded-2xl border border-white/5 pt-6">
                   <div className="flex justify-between mb-2">
                      <span className="text-xs text-zinc-400">ไปยัง (To)</span>
                      <span className="text-xs text-zinc-400">Balance: {toCoin?.balance || 0}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="w-1/2">
                        {quoteLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-emerald-400" />
                            <span className="text-emerald-400 text-lg">กำลังคำนวณ...</span>
                          </div>
                        ) : quote ? (
                          <div>
                            <p className="text-3xl font-bold text-emerald-400">{quote.outAmount}</p>
                            {quote.priceImpact > 0.5 && (
                              <p className="text-xs text-yellow-400 mt-1">Price Impact: {quote.priceImpact.toFixed(2)}%</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-3xl font-bold text-emerald-400">0</p>
                        )}
                      </div>
                      <button className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full hover:bg-zinc-700 border border-white/10">
                         <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: toCoin?.color || '#666' }}>
                            {toCoin?.symbol[0] || '?'}
                         </div>
                         <span className="text-white font-medium">{toCoin?.symbol || 'USDC'}</span>
                         <ArrowDown size={14} className="text-zinc-500" />
                      </button>
                   </div>
                </div>
             </div>
             
             <button 
               onClick={handleAction} 
               disabled={!swapAmount || Number(swapAmount) <= 0 || swapping || !quote}
               className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-6 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
             >
               {swapping ? (
                 <>
                   <Loader2 size={20} className="animate-spin" />
                   กำลังดำเนินการ Swap...
                 </>
               ) : (
                 'ดำเนินการ Swap'
               )}
             </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
         <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={handleClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-zinc-500 hover:text-white transition-colors z-10">
               <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            {renderContent()}
         </div>
      </div>

      {/* Confirmation Modals */}
      <SendConfirmationModal
        isOpen={showSendConfirm}
        onConfirm={handleSendConfirm}
        onCancel={() => setShowSendConfirm(false)}
        toAddress={toAddress}
        amount={Number(amount)}
        symbol={selectedCoin.symbol}
        loading={sending}
      />
      <SwapConfirmationModal
        isOpen={showSwapConfirm}
        onConfirm={handleSwapConfirm}
        onCancel={() => setShowSwapConfirm(false)}
        fromCoin={{ symbol: fromCoin.symbol, name: fromCoin.name }}
        toCoin={{ symbol: toCoin.symbol, name: toCoin.name }}
        amount={Number(swapAmount)}
        estimatedOutput={quote ? Number(quote.outAmount) : 0}
        priceImpact={quote?.priceImpact || 0}
        slippage={1}
        loading={swapping}
      />
    </>
  );
};

// Error Boundary for ActionModal
class ActionModalErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ActionModalErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/20 w-full max-w-sm rounded-3xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h3>
            <p className="text-red-400 text-sm mb-4">{this.state.error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl"
              >
                ลองใหม่
              </button>
              <button
                onClick={this.props.onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper with error boundary
export const ActionModal: React.FC<ActionModalProps> = (props) => {
  return (
    <ActionModalErrorBoundary onClose={props.onClose}>
      <ActionModalContent {...props} />
    </ActionModalErrorBoundary>
  );
};