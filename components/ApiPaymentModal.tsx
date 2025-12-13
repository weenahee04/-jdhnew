import React from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';

interface ApiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ApiPaymentModal: React.FC<ApiPaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-emerald-500/30 w-full max-w-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 relative shadow-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
            <CreditCard size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            ชำระค่าบริการ API
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            เพื่อใช้งานฟีเจอร์ Send Token
          </p>
        </div>

        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 text-sm">แพ็กเกจ API</span>
            <span className="text-white font-semibold">Premium Plan</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 text-sm">ราคา</span>
              <span className="text-2xl font-bold text-emerald-400">1,200 USDT</span>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-zinc-300 text-sm">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-white">1,200 USDT</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-yellow-200 text-xs sm:text-sm">
            <p className="font-semibold mb-1">หมายเหตุ:</p>
            <p>นี่เป็น mockup สำหรับการทดสอบเท่านั้น ไม่มีการชำระเงินจริง</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            ชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
};

