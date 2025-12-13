import React, { useState } from 'react';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Shield,
      title: "ความปลอดภัยสูงสุด",
      desc: "มาตรฐานความปลอดภัยระดับโลก เก็บรักษาทรัพย์สินของคุณด้วยเทคโนโลยี MPC ล่าสุด"
    },
    {
      icon: Zap,
      title: "รวดเร็ว ทันใจ",
      desc: "โอน รับ แลกเปลี่ยน ได้ในเสี้ยววินาที รองรับทุกเชนหลักทั่วโลก"
    },
    {
      icon: Globe,
      title: "เข้าถึงง่าย ทุกที่",
      desc: "จัดการพอร์ตการลงทุนของคุณได้ทุกที่ทุกเวลา ด้วยดีไซน์ที่เข้าใจง่ายสำหรับคนไทย"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>

      <div className="w-full flex justify-end relative z-10">
        <button onClick={onComplete} className="text-zinc-500 hover:text-white text-sm font-medium">ข้าม (Skip)</button>
      </div>

      <div className="flex flex-col items-center max-w-sm text-center relative z-10 mt-10">
        <div className="w-64 h-64 mb-10 relative flex items-center justify-center">
            {/* Animated Circles */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="w-32 h-32 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] rotate-3 transition-all duration-500 transform hover:scale-110">
               {React.createElement(steps[step].icon, { size: 64, className: "text-white" })}
            </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4 animate-fade-in">{steps[step].title}</h2>
        <p className="text-zinc-400 leading-relaxed animate-fade-in">{steps[step].desc}</p>
      </div>

      <div className="w-full max-w-sm relative z-10 mb-8">
         <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`}></div>
            ))}
         </div>

         <button onClick={handleNext} className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            {step === steps.length - 1 ? 'เริ่มต้นใช้งาน' : 'ถัดไป'} <ArrowRight size={20} />
         </button>
      </div>
    </div>
  );
};