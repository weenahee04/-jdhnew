import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, ScanLine } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: 'send' | 'receive' | 'swap' | 'scan') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    { label: 'โอน', id: 'send', icon: ArrowUpRight },
    { label: 'รับ', id: 'receive', icon: ArrowDownLeft },
    { label: 'แลกเปลี่ยน', id: 'swap', icon: RefreshCcw },
    { label: 'สแกน', id: 'scan', icon: ScanLine },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-3 my-8">
      {actions.map((action) => (
        <button 
          key={action.id} 
          onClick={() => onAction(action.id)}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 group-active:scale-95 transition-all duration-300 flex items-center justify-center shadow-lg group-hover:shadow-emerald-900/10">
            <action.icon size={22} className="text-white group-hover:text-emerald-400 transition-colors" />
          </div>
          <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">{action.label}</span>
        </button>
      ))}
    </div>
  );
};