import React, { useState } from 'react';
import { Wallet, Copy, Check, ExternalLink, Loader2, User, Shield, Globe, Bell, Eye, MessageSquare, ChevronRight, LogOut } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { getWallet } from '../services/authService';

interface SettingsPageProps {
  currentUser: {
    id?: string;
    email?: string;
    displayName?: string;
    walletAddress?: string;
    hasWallet?: boolean;
  } | null;
  publicKey: PublicKey | null;
  wallet: {
    mnemonic?: string;
    publicKey?: string;
  };
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  publicKey,
  wallet,
  onLogout,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  
  const walletAddress = publicKey?.toBase58() || currentUser?.walletAddress || null;
  const hasWallet = currentUser?.hasWallet || false;
  const displayMnemonic = wallet.mnemonic || seedPhrase;

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleLoadSeed = async () => {
    if (!currentUser?.id) return;
    setLoadingSeed(true);
    try {
      const mnemonic = await getWallet(currentUser.id);
      if (mnemonic) {
        setSeedPhrase(mnemonic);
      } else {
        alert('ไม่สามารถโหลด Seed Phrase ได้');
      }
    } catch (error) {
      console.error('Failed to load seed:', error);
      alert('เกิดข้อผิดพลาดในการโหลด Seed Phrase');
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleCopySeed = async () => {
    if (displayMnemonic) {
      try {
        await navigator.clipboard.writeText(displayMnemonic);
        setCopiedSeed(true);
        setTimeout(() => setCopiedSeed(false), 2000);
      } catch (error) {
        console.error('Failed to copy seed:', error);
      }
    }
  };

  const handleViewOnExplorer = () => {
    if (walletAddress) {
      const explorerUrl = `https://solscan.io/account/${walletAddress}`;
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-5 md:space-y-6 pb-24 md:pb-0">
       <h2 className="text-2xl font-bold text-white mb-6">ตั้งค่า (Settings)</h2>
       <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-2xl border border-white/5">
             <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <User size={32} className="text-emerald-400" />
             </div>
             <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</h3>
                <p className="text-emerald-500 text-xs bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-1">Verified Level 2</p>
             </div>
          </div>

          {/* Wallet Information Section */}
          {hasWallet && walletAddress && (
            <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
               <div className="p-4 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                     <Wallet size={20} className="text-emerald-400" />
                     <h3 className="text-white font-bold text-lg">ข้อมูล Wallet</h3>
                  </div>
                  
                  {/* Wallet Address */}
                  <div className="space-y-3">
                     <div>
                        <label className="text-zinc-400 text-xs mb-1 block">Wallet Address</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-white/5 rounded-lg p-3">
                           <code className="text-emerald-400 text-xs sm:text-sm font-mono flex-1 break-all">
                              {walletAddress}
                           </code>
                           <button
                              onClick={handleCopyAddress}
                              className="flex-shrink-0 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                              title="คัดลอก"
                           >
                              {copiedAddress ? (
                                 <Check size={16} className="text-emerald-400" />
                              ) : (
                                 <Copy size={16} className="text-zinc-400" />
                              )}
                           </button>
                        </div>
                     </div>

                     {/* View on Explorer */}
                     <button
                        onClick={handleViewOnExplorer}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg transition-colors text-sm text-zinc-300"
                     >
                        <ExternalLink size={16} />
                        <span>ดูบน Solscan Explorer</span>
                     </button>

                     {/* Seed Phrase Section */}
                     {hasWallet && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                           <label className="text-zinc-400 text-xs mb-2 block">Seed Phrase (12 คำ)</label>
                           {!showSeedPhrase ? (
                              <button
                                 onClick={async () => {
                                    if (window.confirm('⚠️ คำเตือน: Seed Phrase เป็นข้อมูลสำคัญมาก\n\nห้ามแคปหน้าจอ\nห้ามส่งให้ใคร\nเก็บไว้ในที่ปลอดภัยเท่านั้น\n\nคุณต้องการแสดง Seed Phrase หรือไม่?')) {
                                       if (!displayMnemonic) {
                                          await handleLoadSeed();
                                       }
                                       setShowSeedPhrase(true);
                                    }
                                 }}
                                 disabled={loadingSeed}
                                 className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors text-sm text-red-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                 {loadingSeed ? (
                                    <>
                                       <Loader2 size={16} className="animate-spin" />
                                       <span>กำลังโหลด...</span>
                                    </>
                                 ) : (
                                    <span>แสดง Seed Phrase</span>
                                 )}
                              </button>
                           ) : displayMnemonic ? (
                              <div className="space-y-3">
                                 <div className="bg-zinc-950 border border-red-500/20 rounded-lg p-4">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                                       {displayMnemonic && displayMnemonic.split(' ').map((word, index) => (
                                          <div key={index} className="bg-zinc-900 border border-white/5 rounded px-2 py-1 text-xs text-white font-mono">
                                             {index + 1}. {word}
                                          </div>
                                       ))}
                                    </div>
                                    <div className="flex gap-2">
                                       <button
                                          onClick={handleCopySeed}
                                          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors text-sm text-emerald-400"
                                       >
                                          {copiedSeed ? (
                                             <>
                                                <Check size={16} />
                                                <span>คัดลอกแล้ว</span>
                                             </>
                                          ) : (
                                             <>
                                                <Copy size={16} />
                                                <span>คัดลอก Seed Phrase</span>
                                             </>
                                          )}
                                       </button>
                                       <button
                                          onClick={() => setShowSeedPhrase(false)}
                                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg transition-colors text-sm text-zinc-300"
                                       >
                                          ซ่อน
                                       </button>
                                    </div>
                                 </div>
                                 <p className="text-red-400 text-xs text-center">
                                    ⚠️ อย่าแคปหน้าจอหรือส่ง Seed Phrase ให้ใคร
                                 </p>
                              </div>
                           ) : (
                              <div className="text-center py-4 text-zinc-500 text-sm">
                                 ไม่สามารถโหลด Seed Phrase ได้
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Settings Menu */}
          <div className="bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden">
             {[
                { label: 'ความปลอดภัย (Security)', icon: Shield },
                { label: 'ภาษา (Language)', icon: Globe, value: 'ไทย' },
                { label: 'แจ้งเตือน (Notifications)', icon: Bell },
                { label: 'ธีม (Appearance)', icon: Eye, value: 'Dark' },
                { label: 'ติดต่อเรา (Contact Us)', icon: MessageSquare },
             ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                   <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-zinc-400" />
                      <span className="text-zinc-200 text-sm font-medium">{item.label}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      {item.value && <span className="text-zinc-500 text-xs">{item.value}</span>}
                      <ChevronRight size={16} className="text-zinc-600" />
                   </div>
                </div>
             ))}
          </div>

          <button onClick={onLogout} className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
             <LogOut size={16} /> ออกจากระบบ (Log Out)
          </button>
       </div>
    </div>
  );
};




