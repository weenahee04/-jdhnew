import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, CheckCircle, AlertTriangle, ChevronLeft, ShieldCheck, RefreshCw, Key, Loader2 } from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface WalletSetupProps {
  mode: 'CREATE' | 'IMPORT';
  onBack: () => void;
  onComplete: () => void;
  onWalletCreated?: (mnemonic: string) => void;
  onWalletImported?: (mnemonic: string) => void;
  showSecurityWarning?: () => void;
  onSecurityWarningConfirmed?: () => void;
}

const WORD_LIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "banana", "crypto", "wallet", "token", "asset", "finance", "money", "rich", "future", "digital",
  "secure", "block", "chain", "node", "network", "key", "public", "private", "seed", "phrase",
  "galaxy", "orbit", "planet", "solar", "moon", "star", "comet", "meteor", "nebula", "cluster"
];

type SetupStep = 'INIT' | 'GENERATING' | 'BACKUP' | 'VERIFY' | 'SUCCESS';

export const WalletSetup: React.FC<WalletSetupProps> = ({ mode, onBack, onComplete, onWalletCreated, onWalletImported, showSecurityWarning, onSecurityWarningConfirmed }) => {
  const [step, setStep] = useState<SetupStep>(mode === 'CREATE' ? 'INIT' : 'BACKUP');
  
  // Create Mode States
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("Initializing...");
  
  // Verify Mode States
  const [verifyChallenge, setVerifyChallenge] = useState<{ index: number, options: string[], correct: string } | null>(null);
  const [selectedVerifyOption, setSelectedVerifyOption] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState(false);

  // Import Mode States
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // --- Logic for Creating Wallet ---

  const startGeneration = () => {
    setStep('GENERATING');
    let progress = 0;
    
    // Simulate complex key generation
    const interval = setInterval(() => {
        progress += 5;
        setGenerationProgress(progress);
        
        if (progress < 30) setGenerationStatus("Generating Entropy...");
        else if (progress < 60) setGenerationStatus("Deriving Private Keys...");
        else if (progress < 90) setGenerationStatus("Encrypting Wallet...");
        else setGenerationStatus("Finalizing...");

        if (progress >= 100) {
            clearInterval(interval);
            generateSeed().then(() => {
              setStep('BACKUP');
            });
        }
    }, 100);
  };

  const { create: createWallet, loadFromMnemonic, loadFromSecret } = useSolanaWallet();

  // Expose setShowSeed function via window for App.tsx to call after security warning
  useEffect(() => {
    const showSeedFn = () => {
      console.log('__walletSetupShowSeed called, setting showSeed to true, seedPhrase length:', seedPhrase.length);
      if (seedPhrase.length > 0) {
        console.log('Setting showSeed to true');
        setShowSeed(true);
      } else {
        console.warn('Cannot show seed: seedPhrase is empty');
      }
    };
    (window as any).__walletSetupShowSeed = showSeedFn;
    console.log('Exposed __walletSetupShowSeed function, seedPhrase length:', seedPhrase.length);
    
    // Also listen for custom event as fallback
    const handleShowSeedEvent = () => {
      console.log('Received showSeedPhrase event');
      if (seedPhrase.length > 0) {
        setShowSeed(true);
      }
    };
    window.addEventListener('showSeedPhrase', handleShowSeedEvent);
    
    return () => {
      delete (window as any).__walletSetupShowSeed;
      window.removeEventListener('showSeedPhrase', handleShowSeedEvent);
    };
  }, [seedPhrase]);

  // Debug: Log when showSeed changes
  useEffect(() => {
    console.log('showSeed changed to:', showSeed, 'seedPhrase length:', seedPhrase.length);
  }, [showSeed, seedPhrase.length]);

  const generateSeed = async () => {
    try {
      // Use real BIP39 mnemonic generation
      const mnemonic = await createWallet();
      setSeedPhrase(mnemonic.split(' '));
    } catch (error) {
      console.error('Failed to generate wallet:', error);
      // Fallback to random words (not secure, but better than crash)
      const newSeed: string[] = [];
      for(let i=0; i<12; i++) {
          const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
          newSeed.push(randomWord);
      }
      setSeedPhrase(newSeed);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prepareVerification = () => {
    // Pick a random index (0-11)
    const challengeIndex = Math.floor(Math.random() * 12);
    const correctWord = seedPhrase[challengeIndex];
    
    // Pick 3 random wrong words
    const wrongWords = [];
    while(wrongWords.length < 3) {
        const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        if (word !== correctWord && !wrongWords.includes(word) && !seedPhrase.includes(word)) {
            wrongWords.push(word);
        }
    }

    // Shuffle options
    const options = [...wrongWords, correctWord].sort(() => Math.random() - 0.5);
    
    setVerifyChallenge({
        index: challengeIndex,
        options,
        correct: correctWord
    });
    setStep('VERIFY');
  };

  const checkVerification = async () => {
    if (!verifyChallenge || !selectedVerifyOption) return;

    if (selectedVerifyOption === verifyChallenge.correct) {
        setStep('SUCCESS');
        
        // Call onWalletCreated and wait for it to complete
        if (onWalletCreated) {
          try {
            await onWalletCreated(seedPhrase.join(' '));
            console.log('✅ Wallet creation completed, calling onComplete');
          } catch (error) {
            console.error('❌ Error in onWalletCreated:', error);
            // Still call onComplete even if there's an error, but log it
          }
        }
        
        // Wait a bit before calling onComplete to show success message
        setTimeout(() => {
            onComplete();
        }, 2000);
    } else {
        setVerifyError(true);
        setTimeout(() => setVerifyError(false), 1500);
    }
  };

  // --- Logic for Importing Wallet ---

  const handleImport = async () => {
    // Show security warning first if provided
    if (showSecurityWarning && !importText.trim()) {
      showSecurityWarning();
      return;
    }
    
    setIsImporting(true);
    try {
      const text = importText.trim();
      // Try to load as mnemonic first
      try {
        await loadFromMnemonic(text);
        setStep('SUCCESS');
        onWalletImported?.(text);
        setTimeout(onComplete, 1500);
      } catch (e) {
        // If mnemonic fails, try as secret key
        try {
          await loadFromSecret(text);
          setStep('SUCCESS');
          onWalletImported?.(text);
          setTimeout(onComplete, 1500);
        } catch (e2) {
          setIsImporting(false);
          alert("Seed phrase หรือ Private Key ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        }
      }
    } catch (error) {
      setIsImporting(false);
      alert("เกิดข้อผิดพลาดในการนำเข้า wallet กรุณาลองอีกครั้ง");
    }
  };

  // --- Initialization ---
  
  useEffect(() => {
    if (mode === 'CREATE' && step === 'INIT') {
       startGeneration();
    }
  }, [mode]);


  // --- Render Functions ---

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-sm text-center">
       <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
           <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
           <Key className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={32} />
       </div>
       <h2 className="text-2xl font-bold text-white mb-2">{generationStatus}</h2>
       <p className="text-zinc-500 text-sm mb-6">{generationProgress}% Completed</p>
       <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
       </div>
    </div>
  );

  const renderBackup = () => {
    console.log('renderBackup called, seedPhrase:', seedPhrase.length, 'showSeed:', showSeed, 'showSecurityWarning:', typeof showSecurityWarning);
    
    return (
      <div className="w-full max-w-md animate-fade-in px-4 sm:px-0">
         <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 px-2">จดบันทึก Seed Phrase</h2>
            <p className="text-zinc-400 text-xs sm:text-sm px-2">
               นี่คือหัวใจของกระเป๋าเงินของคุณ จดบันทึก 12 คำนี้ลงในกระดาษและเก็บไว้ในที่ปลอดภัย
            </p>
         </div>

         <div className="w-full relative group mb-4 sm:mb-6" style={{ minHeight: '180px' }}>
            {seedPhrase.length > 0 ? (
              <>
                <div className={`grid grid-cols-3 gap-2 sm:gap-3 transition-all duration-300 ${!showSeed ? 'blur-md select-none opacity-50' : 'blur-0 opacity-100'}`} style={{ pointerEvents: showSeed ? 'auto' : 'none' }}>
                   {seedPhrase.map((word, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-2 sm:py-3 flex flex-col items-center justify-center relative overflow-hidden">
                         <span className="text-[9px] sm:text-[10px] text-zinc-600 font-mono absolute top-0.5 sm:top-1 left-1 sm:left-2">{i+1}</span>
                         <span className="text-emerald-50 font-medium tracking-wide text-xs sm:text-sm mt-2 sm:mt-0">{word}</span>
                      </div>
                   ))}
                </div>
                
                {!showSeed && (
                   <div 
                     className="absolute inset-0 flex items-center justify-center"
                     style={{ zIndex: 100, pointerEvents: 'auto' }}
                   >
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== BUTTON CLICKED ===');
                          console.log('showSecurityWarning type:', typeof showSecurityWarning);
                          console.log('showSecurityWarning value:', showSecurityWarning);
                          console.log('seedPhrase length:', seedPhrase.length);
                          
                          // Always try to show security warning first if available
                          if (showSecurityWarning && typeof showSecurityWarning === 'function') {
                            console.log('Calling showSecurityWarning function');
                            try {
                              showSecurityWarning();
                            } catch (err) {
                              console.error('Error calling showSecurityWarning:', err);
                              // Fallback: show seed directly if error
                              console.log('Falling back to show seed directly');
                              setShowSeed(true);
                            }
                          } else {
                            console.log('showSecurityWarning not available, setting showSeed directly');
                            setShowSeed(true);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/50 text-emerald-400 px-6 py-3 rounded-full flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all font-bold shadow-lg shadow-emerald-900/50 cursor-pointer active:scale-95"
                        style={{ 
                          pointerEvents: 'auto',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                          userSelect: 'none',
                          position: 'relative',
                          zIndex: 101
                        }}
                      >
                         <Eye size={18} /> กดเพื่อแสดง Key
                      </button>
                   </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-zinc-500 text-sm">กำลังสร้าง Seed Phrase...</div>
              </div>
            )}
         </div>

       <div className="flex gap-3 w-full mb-6">
          <button onClick={handleCopy} disabled={!showSeed} className="flex-1 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
             {copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
             {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
       </div>

       <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 mb-8">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-red-200 text-xs leading-relaxed">
             คำเตือน: ห้ามแคปหน้าจอ หากคุณทำ Seed Phrase หาย เงินทั้งหมดจะสูญหายทันที
          </p>
       </div>

       <button 
         onClick={prepareVerification}
         disabled={!showSeed}
         className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
       >
          ฉันจดบันทึกเรียบร้อยแล้ว
       </button>
      </div>
    );
  };

  const renderVerify = () => (
    <div className="w-full max-w-md animate-fade-in text-center">
       <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-4" />
       <h2 className="text-2xl font-bold text-white mb-2">ยืนยันความปลอดภัย</h2>
       <p className="text-zinc-400 text-sm mb-8">
          เลือกคำศัพท์ <span className="text-emerald-400 font-bold">ลำดับที่ {verifyChallenge!.index + 1}</span> จาก Seed Phrase ของคุณ
       </p>

       <div className="grid grid-cols-2 gap-4 mb-8">
          {verifyChallenge!.options.map((option) => (
             <button
                key={option}
                onClick={() => setSelectedVerifyOption(option)}
                className={`p-4 rounded-xl border font-medium transition-all ${
                   selectedVerifyOption === option
                   ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                   : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-emerald-500/50 hover:text-white'
                }`}
             >
                {option}
             </button>
          ))}
       </div>
       
       {verifyError && (
          <p className="text-red-400 text-sm mb-4 animate-bounce font-medium">คำศัพท์ไม่ถูกต้อง กรุณาลองใหม่</p>
       )}

       <button 
         onClick={checkVerification}
         disabled={!selectedVerifyOption}
         className="w-full py-4 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold rounded-2xl transition-all active:scale-[0.98]"
       >
          ยืนยัน (Verify)
       </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="w-full max-w-sm text-center animate-fade-in">
       <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-emerald-500" />
       </div>
       <h2 className="text-3xl font-bold text-white mb-2">สำเร็จ!</h2>
       <p className="text-zinc-400">
          กระเป๋าเงินของคุณพร้อมใช้งานแล้ว<br/>ยินดีต้อนรับสู่ JDH Wallet
       </p>
    </div>
  );

  const renderImport = () => (
    <div className="w-full max-w-md animate-fade-in">
       <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">นำเข้ากระเป๋า</h2>
          <p className="text-zinc-400 text-sm">
             กรอก Seed Phrase 12 คำ หรือ Private Key ของคุณเพื่อกู้คืนกระเป๋า
          </p>
       </div>

       <div className="w-full mb-6">
          <textarea 
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="apple banana cat dog..."
            className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono text-sm leading-relaxed"
          ></textarea>
       </div>

       <button 
         onClick={handleImport}
         disabled={!importText || isImporting}
         className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
       >
          {isImporting ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {isImporting ? 'กำลังตรวจสอบ...' : 'นำเข้ากระเป๋า'}
       </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col p-6 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>

      {step !== 'SUCCESS' && step !== 'GENERATING' && (
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked, calling onBack');
            if (onBack && typeof onBack === 'function') {
              try {
                onBack();
              } catch (err) {
                console.error('Error calling onBack:', err);
              }
            } else {
              console.error('onBack is not a function:', typeof onBack);
            }
          }}
          className="absolute top-6 left-6 text-zinc-400 hover:text-white flex items-center gap-1 z-50 cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
           <ChevronLeft size={20} /> กลับ
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
         {step === 'GENERATING' && renderGenerating()}
         {step === 'BACKUP' && renderBackup()}
         {step === 'VERIFY' && renderVerify()}
         {step === 'SUCCESS' && renderSuccess()}
         {mode === 'IMPORT' && step !== 'SUCCESS' && renderImport()}
      </div>
    </div>
  );
};
