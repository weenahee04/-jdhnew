import React from 'react';
import { Home, BarChart2, Repeat, Wallet, Settings, Clock, Award, User, LogOut, HelpCircle } from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onLogout: () => void;
  currentUser?: { displayName?: string; email?: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, currentUser }) => {
  const mainNav = [
    { id: NavTab.HOME, label: 'ภาพรวม (Overview)', icon: Home },
    { id: NavTab.MARKET, label: 'ตลาด (Market)', icon: BarChart2 },
    { id: NavTab.SWAP, label: 'แลกเปลี่ยน (Swap)', icon: Repeat },
    { id: NavTab.WALLET, label: 'กระเป๋า (Portfolio)', icon: Wallet },
    { id: NavTab.HISTORY, label: 'ประวัติ (History)', icon: Clock },
  ];

  const secondaryNav = [
    { id: NavTab.REWARDS, label: 'รางวัล (Rewards)', icon: Award },
    { id: NavTab.SETTINGS, label: 'ตั้งค่า (Settings)', icon: Settings },
    { id: NavTab.HELP, label: 'ช่วยเหลือ (Help)', icon: HelpCircle },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-zinc-950 border-r border-white/5 p-6 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10 px-2">
         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            J
         </div>
         <span className="font-bold text-2xl tracking-tight text-white">jdh.</span>
      </div>

      {/* Main Nav */}
      <div className="space-y-1 mb-8">
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-2 mb-2">Menu</p>
        {mainNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === item.id 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Secondary Nav */}
      <div className="space-y-1">
         <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-2 mb-2">System</p>
         {secondaryNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === item.id 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 cursor-pointer hover:bg-zinc-800 transition-colors">
           <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <User size={18} />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-emerald-500 truncate">Verified Lvl 2</p>
           </div>
           <button onClick={onLogout} className="text-zinc-500 hover:text-red-400 transition-colors">
              <LogOut size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};