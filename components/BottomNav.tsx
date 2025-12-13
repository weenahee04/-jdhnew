import React from 'react';
import { Home, BarChart2, Repeat, Wallet, Settings, Lock } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: NavTab.HOME, label: 'หน้าหลัก', icon: Home },
    { id: NavTab.MARKET, label: 'ตลาด', icon: BarChart2 },
    { id: NavTab.SWAP, label: 'Swap', icon: Repeat }, 
    { id: NavTab.WALLET, label: 'กระเป๋า', icon: Wallet },
    { id: NavTab.STAKING, label: 'Staking', icon: Lock },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2 pointer-events-none">
      <div className="glass-nav rounded-3xl border border-white/5 shadow-2xl shadow-black/50 backdrop-blur-xl flex justify-between items-center px-2 py-3 pointer-events-auto max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center w-14 h-12 group"
            >
              <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                  className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`}
                />
              </div>
              
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-emerald-400 mb-1 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};