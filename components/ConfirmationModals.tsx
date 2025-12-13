import React from 'react';
import { AlertTriangle, CheckCircle, X, ExternalLink, Loader2, Copy } from 'lucide-react';

interface SendConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  toAddress: string;
  amount: number;
  symbol: string;
  networkFee?: number;
  totalAmount?: number;
  loading?: boolean;
}

export const SendConfirmationModal: React.FC<SendConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  toAddress,
  amount,
  symbol,
  networkFee = 0.000005, // Default Solana fee
  totalAmount,
  loading = false,
}) => {
  if (!isOpen) return null;

  const finalTotal = totalAmount || (amount + networkFee);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <AlertTriangle className="text-emerald-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">ยืนยันการส่ง</h2>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-zinc-950 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-zinc-400 text-sm">จำนวนเงิน</span>
                <span className="text-white font-bold text-lg">{amount} {symbol}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-zinc-400 text-sm">Network Fee</span>
                <span className="text-zinc-300 text-sm">~{networkFee} SOL</span>
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                <span className="text-zinc-400 text-sm font-medium">รวมทั้งหมด</span>
                <span className="text-emerald-400 font-bold text-lg">{finalTotal.toFixed(6)} {symbol}</span>
              </div>
            </div>

            <div className="bg-zinc-950 rounded-xl p-4 border border-white/5">
              <span className="text-zinc-400 text-sm block mb-2">ส่งไปยัง</span>
              <div className="flex items-center gap-2">
                <code className="text-emerald-400 text-sm font-mono break-all flex-1">
                  {toAddress}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(toAddress)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="คัดลอก"
                >
                  <Copy size={14} className="text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <p className="text-yellow-200 text-xs leading-relaxed">
                กรุณาตรวจสอบ address ปลายทางให้แน่ใจก่อนส่ง transaction นี้ไม่สามารถยกเลิกได้
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                'ยืนยันการส่ง'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SwapConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fromCoin: { symbol: string; name: string };
  toCoin: { symbol: string; name: string };
  amount: number;
  estimatedOutput: number;
  priceImpact: number;
  slippage: number;
  networkFee?: number;
  loading?: boolean;
}

export const SwapConfirmationModal: React.FC<SwapConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  fromCoin,
  toCoin,
  amount,
  estimatedOutput,
  priceImpact,
  slippage,
  networkFee = 0.000005,
  loading = false,
}) => {
  if (!isOpen) return null;

  const isHighImpact = priceImpact > 1;
  const isVeryHighImpact = priceImpact > 3;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <AlertTriangle className="text-emerald-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">ยืนยันการ Swap</h2>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {/* Swap Details */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-zinc-400 text-sm block mb-1">คุณจะส่ง</span>
                  <span className="text-white font-bold text-xl">{amount} {fromCoin.symbol}</span>
                  <span className="text-zinc-500 text-xs block mt-1">{fromCoin.name}</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <X size={20} className="text-emerald-500 rotate-45" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 text-sm block mb-1">คุณจะได้รับ</span>
                  <span className="text-emerald-400 font-bold text-xl">{estimatedOutput.toFixed(6)} {toCoin.symbol}</span>
                  <span className="text-zinc-500 text-xs block mt-1">{toCoin.name}</span>
                </div>
              </div>
            </div>

            {/* Price Impact */}
            <div className={`rounded-xl p-4 border ${
              isVeryHighImpact 
                ? 'bg-red-500/10 border-red-500/30' 
                : isHighImpact 
                ? 'bg-yellow-500/10 border-yellow-500/30' 
                : 'bg-zinc-950 border-white/5'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Price Impact</span>
                <span className={`font-bold ${
                  isVeryHighImpact 
                    ? 'text-red-400' 
                    : isHighImpact 
                    ? 'text-yellow-400' 
                    : 'text-emerald-400'
                }`}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              {isHighImpact && (
                <p className="text-xs text-zinc-400 mt-2">
                  {isVeryHighImpact 
                    ? '⚠️ Price impact สูงมาก อาจได้รับผลตอบแทนน้อยกว่าที่คาดไว้' 
                    : '⚠️ Price impact สูง อาจได้รับผลตอบแทนน้อยกว่าที่คาดไว้'}
                </p>
              )}
            </div>

            {/* Slippage & Fee */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Slippage Tolerance</span>
                <span className="text-white font-medium">{slippage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Network Fee</span>
                <span className="text-zinc-300 text-sm">~{networkFee} SOL</span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <p className="text-yellow-200 text-xs leading-relaxed">
                Transaction นี้ไม่สามารถยกเลิกได้ ตรวจสอบรายละเอียดให้แน่ใจก่อนยืนยัน
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || isVeryHighImpact}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  กำลัง Swap...
                </>
              ) : (
                'ยืนยันการ Swap'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

