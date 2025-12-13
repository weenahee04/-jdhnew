import React from 'react';
import { X, AlertCircle } from 'lucide-react';

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
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">
            <AlertCircle size={40} className="text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            API Service Payment
          </h2>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 sm:p-6 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-200 text-sm sm:text-base">
            <p>Solana Chain API payment required to use send/receive services</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

