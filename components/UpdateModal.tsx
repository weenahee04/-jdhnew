import React from 'react';
import { X, CheckCircle, Sparkles, Server, Zap, Shield, Globe } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'feature' | 'improvement' | 'security' | 'api';
  date: string;
}

const updates: UpdateItem[] = [
  {
    id: '1',
    title: 'Backend API Server Integration',
    description: 'เพิ่มระบบ Backend API Server แบบ production-ready พร้อม RPC, Indexer, Metadata, Pricing, Swap และ Webhook support',
    icon: <Server className="w-5 h-5" />,
    category: 'api',
    date: '2024-12-19',
  },
  {
    id: '2',
    title: 'Frontend API Integration',
    description: 'เชื่อมต่อ Frontend กับ Backend API สำหรับ Portfolio, History, Prices, และ Swap พร้อม fallback อัตโนมัติ',
    icon: <Zap className="w-5 h-5" />,
    category: 'feature',
    date: '2024-12-19',
  },
  {
    id: '3',
    title: 'Provider Abstraction Layer',
    description: 'ระบบ Provider Abstraction ที่สามารถเปลี่ยน RPC, Indexer, Pricing providers ได้ง่าย (Helius, CoinGecko, Jupiter)',
    icon: <Globe className="w-5 h-5" />,
    category: 'improvement',
    date: '2024-12-19',
  },
  {
    id: '4',
    title: 'Caching & Performance',
    description: 'เพิ่ม Redis caching layer พร้อม in-memory fallback, TTL-based caching และ cache stampede protection',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'improvement',
    date: '2024-12-19',
  },
  {
    id: '5',
    title: 'Reliability Features',
    description: 'เพิ่ม Retry with exponential backoff, Circuit breaker, Request timeouts และ Rate limiting',
    icon: <Shield className="w-5 h-5" />,
    category: 'security',
    date: '2024-12-19',
  },
  {
    id: '6',
    title: 'Unified WalletData API',
    description: 'สร้าง Unified API interface สำหรับ Portfolio, Balances, History, Metadata, Prices และ Swap',
    icon: <CheckCircle className="w-5 h-5" />,
    category: 'feature',
    date: '2024-12-19',
  },
];

const categoryColors = {
  feature: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  improvement: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  security: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  api: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const categoryLabels = {
  feature: 'Feature',
  improvement: 'Improvement',
  security: 'Security',
  api: 'API',
};

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">อัพเดตล่าสุด</h2>
              <p className="text-sm text-zinc-400">What's New</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-zinc-800/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[update.category]}`}>
                  {update.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{update.title}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${categoryColors[update.category]}`}>
                      {categoryLabels[update.category]}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-2">{update.description}</p>
                  <p className="text-xs text-zinc-500">{update.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              อัพเดตเมื่อ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

