import React, { useState, useEffect } from 'react';
import { X, ArrowDown, Search, QrCode, Copy, Loader2, CheckCircle } from 'lucide-react';
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

export const ActionModal: React.FC<ActionModalProps> = ({ type, onClose, coins, onSend, onSwap, receiveAddress, sending = false, sendError, walletPublicKey }) => {
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<Coin>(coins[0]);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [txResult, setTxResult] = useState<{ signature?: string; explorer?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
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
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (type) {
        setStatus('IDLE');
        setAmount('');
        setToAddress('');
        setSwapAmount('');
        setTxResult(null);
        setQuote(null);
        setFromCoin(coins.find(c => c.symbol === 'SOL') || coins[0]);
        setToCoin(coins.find(c => c.symbol === 'USDC') || coins[1] || coins[0]);
    }
  }, [type, coins]);

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
  };

  const handleSendConfirm = async () => {
    if (!onSend) return;
    setShowSendConfirm(false);
    setStatus('PROCESSING');
    try {
      // Pass mint address for SPL tokens (coin.id should be mint address for tokens)
      const mintAddress = selectedCoin.symbol === 'SOL' ? undefined : selectedCoin.id;
      const result = await onSend({ 
        to: toAddress, 
        amount: Number(amount), 
        symbol: selectedCoin.symbol,
        mintAddress: mintAddress
      });
      if (result) setTxResult(result);
      setStatus('SUCCESS');
    } catch (e: any) {
      setStatus('IDLE');
      // Show error message
      alert(e?.message || 'การโอนล้มเหลว');
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
            <h2 className="text-2xl font-bold text-white mb-6">โอนเหรียญ (Send)</h2>
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">เลือกเหรียญ</label>
                  <div className="bg-zinc-800/50 p-3 rounded-xl flex items-center justify-between border border-white/10">
                     <div className="flex items-center gap-2">
                        <img src={`https://ui-avatars.com/api/?name=${selectedCoin.symbol}&background=random`} className="w-6 h-6 rounded-full" alt="" />
                        <span className="font-medium text-white">{selectedCoin.symbol}</span>
                     </div>
                     <ArrowDown size={16} className="text-zinc-500" />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">ที่อยู่ผู้รับ (Address)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="วาง Address ที่นี่"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600"
                    />
                    <button className="absolute right-3 top-3 text-emerald-400">
                       <QrCode size={20} />
                    </button>
                  </div>
               </div>
               <div>
                  <label className="text-xs text-zinc-500 mb-1 block">จำนวน (Amount)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                  <div className="text-right mt-1 text-xs text-zinc-500">Available: {selectedCoin.balance} {selectedCoin.symbol}</div>
               </div>
               {sendError && <p className="text-red-400 text-xs">{sendError}</p>}
               <button
                 onClick={handleAction}
                 disabled={!amount || !toAddress || sending}
                 className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-4 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
               >
                  ยืนยันการโอน
               </button>
            </div>
          </>
        );
      case 'receive':
        // For SPL tokens, we need to show the Associated Token Address
        // For SOL, we show the wallet address directly
        const displayAddress = selectedCoin.symbol === 'SOL' 
          ? receiveAddress 
          : receiveAddress; // For now, show wallet address (user needs to create ATA on recipient side)
        
        return (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-white mb-2">รับเหรียญ (Receive)</h2>
            <p className="text-zinc-400 text-sm mb-6">สแกน QR Code เพื่อรับเงิน</p>
            
            <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg shadow-white/5">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${displayAddress || selectedCoin.symbol + '-wallet-address'}`} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
            </div>
            
            <div className="bg-zinc-800/50 p-3 rounded-xl w-full flex items-center justify-between border border-white/10 mb-4 cursor-pointer hover:bg-zinc-800 transition-colors group">
               <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs text-zinc-400 font-mono truncate group-hover:text-white transition-colors">
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
                 className="text-emerald-400 flex-shrink-0"
               >
                 {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
               </button>
            </div>

            <div className="text-xs text-zinc-500 max-w-[280px] mb-4 space-y-2">
               <p className="font-medium text-zinc-400">
                  ✅ ที่อยู่นี้สามารถรับได้:
               </p>
               <ul className="text-zinc-500 text-[11px] space-y-1 list-disc list-inside ml-2">
                  <li>SOL (Solana native token)</li>
                  <li>SPL tokens ทั้งหมด (USDC, USDT, JDH, และอื่นๆ)</li>
               </ul>
               <p className="text-emerald-400/80 text-[10px] mt-2">
                  💡 ระบบจะสร้าง Associated Token Account อัตโนมัติเมื่อมีการส่ง SPL token มา
               </p>
               <p className="text-red-400/80 text-[10px] mt-2 border-t border-white/5 pt-2">
                  ⚠️ อย่าส่งเหรียญจาก blockchain อื่น (Bitcoin, Ethereum, BSC) มายังที่อยู่นี้ เพราะจะสูญหายถาวร
               </p>
            </div>
            
            <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
               แชร์ QR Code
            </button>
          </div>
        );
      case 'swap':
        return (
          <>
             <h2 className="text-2xl font-bold text-white mb-6">แลกเปลี่ยน (Swap)</h2>
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
         <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button onClick={handleClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
               <X size={24} />
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