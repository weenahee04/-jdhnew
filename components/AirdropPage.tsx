import React, { useState } from 'react';
import { Gift, CheckCircle, XCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { explorerUrl } from '../services/solanaClient';

// JDH Token Mint Address
const JDH_MINT_ADDRESS = '5FaVDbaQtdZ4dizCqZcmpDscByWfcc1ssvu8snbcemjx';
const AIRDROP_AMOUNT = 10000; // 10000 JDH
const CODE_PREFIX = 'JI-68006751';

interface AirdropPageProps {
  publicKey: string | null;
}

export const AirdropPage: React.FC<AirdropPageProps> = ({ publicKey }) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const validateCode = (inputCode: string): boolean => {
    return inputCode.trim().startsWith(CODE_PREFIX);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCode(value);
    setError(null);
    setSuccess(false);
    setTxSignature(null);
  };

  const handleClaim = async () => {
    if (!publicKey) {
      setError('กรุณาสร้างหรือเชื่อมกระเป๋าก่อน');
      return;
    }

    const trimmedCode = code.trim();
    
    // Validate code format
    if (!trimmedCode) {
      setError('กรุณากรอกโค้ด');
      return;
    }

    if (!validateCode(trimmedCode)) {
      setError(`โค้ดต้องขึ้นต้นด้วย "${CODE_PREFIX}"`);
      return;
    }

    setIsValidating(true);
    setError(null);

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsValidating(false);

    // Check if code was already used (mock - in production, check database)
    // For now, we'll allow multiple claims for testing

    // Start processing airdrop
    setIsProcessing(true);
    setError(null);

    try {
      // Note: In production, this should call a backend API that sends from a dedicated airdrop wallet
      // For now, we'll attempt to send from the user's wallet (they need to have JDH tokens)
      // TODO: Implement backend API endpoint: /api/airdrop/claim
      
      console.log('🚀 Starting airdrop transfer...');
      console.log('To:', publicKey);
      console.log('Amount:', AIRDROP_AMOUNT, 'JDH');
      console.log('Mint:', JDH_MINT_ADDRESS);
      console.log('Code:', trimmedCode);

      // Call backend API to claim airdrop
      const response = await fetch('/api/airdrop/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: trimmedCode,
          walletAddress: publicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim airdrop');
      }

      console.log('✅ Airdrop successful! Signature:', data.signature);
      
      setTxSignature(data.signature);
      setSuccess(true);
      setCode(''); // Clear code after successful claim
    } catch (err: any) {
      console.error('❌ Airdrop error:', err);
      const errorMessage = err.message || 'ไม่สามารถส่ง airdrop ได้';
      setError(errorMessage + ' กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySignature = () => {
    if (txSignature) {
      navigator.clipboard.writeText(txSignature);
    }
  };

  const handleViewOnExplorer = () => {
    if (txSignature) {
      window.open(explorerUrl(txSignature), '_blank');
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-0">
      {/* Header Mobile */}
      <header className="md:hidden flex justify-between items-center py-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">รับ Airdrop</h2>
      </header>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">รับ Airdrop</h1>
        <p className="text-zinc-400">กรอกโค้ดเพื่อรับ 10,000 JDH ฟรี</p>
      </div>

      {/* Main Airdrop Card */}
      <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Icon & Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
              <Gift size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">รับ Airdrop JDH</h2>
            <p className="text-zinc-300 text-sm md:text-base">
              กรอกโค้ดที่ขึ้นต้นด้วย <span className="font-mono text-emerald-400">{CODE_PREFIX}</span> เพื่อรับ <span className="font-bold text-emerald-400">10,000 JDH</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              โค้ด Airdrop
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder={`${CODE_PREFIX}-XXXXX`}
                className="w-full bg-zinc-950 border-2 border-white/10 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 text-lg font-mono"
                disabled={isProcessing || isValidating}
              />
              {code && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validateCode(code) ? (
                    <CheckCircle size={20} className="text-emerald-400" />
                  ) : (
                    <XCircle size={20} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
            {code && !validateCode(code) && (
              <p className="text-red-400 text-xs mt-2">
                โค้ดต้องขึ้นต้นด้วย "{CODE_PREFIX}"
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold mb-1">เกิดข้อผิดพลาด</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && txSignature && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-emerald-400 font-semibold mb-1">รับ Airdrop สำเร็จ!</p>
                  <p className="text-emerald-300 text-sm mb-3">
                    คุณได้รับ {AIRDROP_AMOUNT.toLocaleString()} JDH แล้ว
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySignature}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Copy size={14} />
                      คัดลอก Transaction
                    </button>
                    <span className="text-zinc-500">|</span>
                    <button
                      onClick={handleViewOnExplorer}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <ExternalLink size={14} />
                      ดูบน Explorer
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-2 break-all">
                    {txSignature}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <button
            onClick={handleClaim}
            disabled={!code || !validateCode(code) || isProcessing || isValidating || !publicKey}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all text-lg flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                กำลังตรวจสอบโค้ด...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                กำลังส่ง JDH...
              </>
            ) : success ? (
              <>
                <CheckCircle size={20} />
                รับสำเร็จแล้ว
              </>
            ) : (
              <>
                <Gift size={20} />
                รับ Airdrop
              </>
            )}
          </button>

          {!publicKey && (
            <p className="text-center text-zinc-400 text-sm mt-4">
              กรุณาสร้างหรือเชื่อมกระเป๋าก่อนเพื่อรับ Airdrop
            </p>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">วิธีรับ Airdrop</h3>
        <ol className="space-y-3 text-sm text-zinc-400">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <span>กรอกโค้ด Airdrop ที่ขึ้นต้นด้วย <span className="font-mono text-emerald-400">{CODE_PREFIX}</span></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <span>กดปุ่ม "รับ Airdrop" เพื่อยืนยัน</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <span>ระบบจะส่ง <span className="font-bold text-white">10,000 JDH</span> ไปยังกระเป๋าของคุณอัตโนมัติผ่าน Solana blockchain</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              4
            </span>
            <span>ตรวจสอบ transaction บน Solana Explorer</span>
          </li>
        </ol>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-3">ข้อกำหนดและเงื่อนไข</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>โค้ด Airdrop ใช้ได้ครั้งเดียวต่อ wallet</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>จำนวน JDH ที่ได้รับ: 10,000 JDH</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Transaction จะถูกส่งผ่าน Solana blockchain อัตโนมัติ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>อาจใช้เวลาสักครู่ในการยืนยัน transaction</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

