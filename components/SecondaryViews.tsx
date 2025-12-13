import React from 'react';
import { X, Bell, Info, ChevronRight, CreditCard, ExternalLink, HelpCircle, MessageCircle, FileText, CheckCircle, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { Notification, BannerData, FAQ, Transaction } from '../types';

// --- Notification Center ---
interface NotificationsProps {
  notifications: Notification[];
  onClose: () => void;
}
export const NotificationCenter: React.FC<NotificationsProps> = ({ notifications, onClose }) => (
  <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
     <div className="w-full max-w-sm bg-zinc-900 h-full border-l border-white/10 p-5 overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="text-emerald-500" size={20} /> การแจ้งเตือน
           </h2>
           <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white transition-colors">
              <X size={18} />
           </button>
        </div>
        <div className="space-y-3">
           {notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-2xl border ${n.read ? 'bg-zinc-900 border-white/5' : 'bg-zinc-800/50 border-emerald-500/30'} transition-all`}>
                 <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                       n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                       n.type === 'alert' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>{n.type.toUpperCase()}</span>
                    <span className="text-[10px] text-zinc-500">{n.time}</span>
                 </div>
                 <h4 className="text-white font-medium text-sm mt-1">{n.title}</h4>
                 <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{n.message}</p>
              </div>
           ))}
        </div>
     </div>
  </div>
);

// --- Announcement Center ---
interface AnnouncementsProps {
  banners: BannerData[];
  onClose: () => void;
}
export const AnnouncementCenter: React.FC<AnnouncementsProps> = ({ banners, onClose }) => (
  <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col animate-fade-in">
     <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-zinc-900/80 backdrop-blur-xl sticky top-0">
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white"><X size={20} /></button>
        <h2 className="text-lg font-bold text-white">ข่าวสารและประกาศ</h2>
     </div>
     <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {banners.map(b => (
           <div key={b.id} className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="h-48 overflow-hidden relative">
                 <img src={b.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={b.title} />
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                 <div className="absolute bottom-4 left-4">
                    <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">NEWS</span>
                 </div>
              </div>
              <div className="p-5">
                 <h3 className="text-xl font-bold text-white mb-2">{b.title}</h3>
                 <p className="text-zinc-400 text-sm leading-relaxed">{b.content || b.subtitle}</p>
              </div>
           </div>
        ))}
     </div>
  </div>
);

// --- Buy Crypto Modal ---
interface BuyCryptoProps {
  onClose: () => void;
}
export const BuyCryptoModal: React.FC<BuyCryptoProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
     <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-white/10 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-white mb-6">ซื้อคริปโทฯ (Buy Crypto)</h2>
        
        <div className="space-y-4">
           <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
              <label className="text-xs text-zinc-500 block mb-2">จ่ายด้วย (Pay with)</label>
              <div className="flex justify-between items-center">
                 <input type="number" placeholder="5,000" className="bg-transparent text-2xl font-bold text-white outline-none w-2/3" />
                 <span className="text-white font-medium bg-zinc-700 px-3 py-1 rounded-lg">THB</span>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              {['Credit Card', 'Bank Transfer', 'TrueMoney', 'PromptPay'].map((method, i) => (
                 <button key={method} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'}`}>
                    <CreditCard size={20} />
                    <span className="text-xs font-medium">{method}</span>
                 </button>
              ))}
           </div>
           
           <div className="bg-blue-500/10 p-4 rounded-xl flex gap-3 items-start">
              <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-200 text-xs">การชำระเงินผ่านบัตรเครดิตอาจมีค่าธรรมเนียมเพิ่มเติม 2-3% จากผู้ให้บริการ</p>
           </div>

           <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">
              ดำเนินการต่อ
           </button>
        </div>
     </div>
  </div>
);

// --- Help Center ---
interface HelpCenterProps {
  faqs: FAQ[];
  onClose: () => void;
}
export const HelpCenter: React.FC<HelpCenterProps> = ({ faqs, onClose }) => (
   <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col animate-fade-in">
     <div className="p-4 flex items-center gap-4 border-b border-white/5 bg-zinc-900/80 backdrop-blur-xl sticky top-0">
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white"><X size={20} /></button>
        <h2 className="text-lg font-bold text-white">ศูนย์ช่วยเหลือ (Help Center)</h2>
     </div>
     
     <div className="max-w-3xl mx-auto w-full p-6 space-y-8">
        <div className="bg-gradient-to-r from-emerald-900/40 to-zinc-900 p-6 rounded-3xl border border-emerald-500/20 text-center">
           <HelpCircle size={40} className="text-emerald-400 mx-auto mb-3" />
           <h3 className="text-xl font-bold text-white mb-2">มีปัญหาการใช้งาน?</h3>
           <p className="text-zinc-400 text-sm mb-4">ทีมงาน Support ของเราพร้อมดูแลคุณตลอด 24 ชั่วโมง</p>
           <button className="bg-emerald-500 text-black font-bold px-6 py-2 rounded-full text-sm hover:bg-emerald-400 transition-colors">แชทกับเจ้าหน้าที่</button>
        </div>

        <div>
           <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-zinc-500" /> คำถามที่พบบ่อย (FAQ)</h3>
           <div className="space-y-3">
              {faqs.map(faq => (
                 <div key={faq.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer group">
                    <h4 className="text-white font-medium text-sm mb-2 flex justify-between items-center">
                       {faq.question}
                       <ChevronRight size={16} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                    </h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">{faq.answer}</p>
                 </div>
              ))}
           </div>
        </div>

        <div>
           <h3 className="text-white font-bold mb-4">ช่องทางติดต่ออื่น</h3>
           <div className="grid grid-cols-2 gap-4">
              <a href="#" className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                 <div className="w-10 h-10 rounded-full bg-[#00C300]/20 flex items-center justify-center text-[#00C300]"><MessageCircle size={20} /></div>
                 <span className="text-white text-sm font-medium">Line Official</span>
              </a>
              <a href="#" className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                 <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><ExternalLink size={20} /></div>
                 <span className="text-white text-sm font-medium">Facebook Page</span>
              </a>
           </div>
        </div>
     </div>
   </div>
);

// --- Transaction Detail Modal ---
interface TransactionDetailProps {
   tx: Transaction | null;
   onClose: () => void;
}
export const TransactionDetailModal: React.FC<TransactionDetailProps> = ({ tx, onClose }) => {
   if (!tx) return null;
   
   return (
      <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
         <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-3xl p-0 overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            {/* Header / Ribbon */}
            <div className={`h-24 flex items-center justify-center relative ${
               tx.type === 'receive' ? 'bg-emerald-500/10' : 'bg-zinc-800'
            }`}>
               <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 ${
                  tx.type === 'receive' ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'
               }`}>
                  {tx.type === 'receive' ? <CheckCircle size={32} /> : <Clock size={32} />}
               </div>
               <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="p-6 text-center">
               <h3 className="text-lg font-bold text-white capitalize mb-1">{tx.type === 'receive' ? 'Received Successfully' : 'Sent Successfully'}</h3>
               <p className="text-zinc-500 text-xs mb-6">{tx.date}</p>

               <div className="mb-6">
                  <h2 className={`text-3xl font-bold tracking-tight ${tx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                     {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.coinSymbol}
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">≈ ฿{tx.amountTHB.toLocaleString()}</p>
               </div>

               <div className="space-y-3 bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">สถานะ (Status)</span>
                     <span className="text-emerald-400 font-bold uppercase">{tx.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">Transaction ID</span>
                     <span className="text-zinc-300 font-mono">0x8a...9c2d</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-zinc-500">ค่าธรรมเนียม (Fee)</span>
                     <span className="text-zinc-300">0.0005 ETH</span>
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-white/5">
               <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
                  ดูบน Explorer
               </button>
            </div>
         </div>
      </div>
   );
};

// --- Logout Confirmation Modal ---
interface LogoutModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
}
export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
   if (!isOpen) return null;
   return (
      <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
         <div className="bg-zinc-900 border border-white/10 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <LogOut size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ออกจากระบบ?</h3>
            <p className="text-zinc-400 text-sm mb-6">คุณต้องการออกจากระบบหรือไม่? <br/>ข้อมูลของคุณจะถูกบันทึกไว้อย่างปลอดภัย</p>
            <div className="flex gap-3">
               <button onClick={onClose} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
                  ยกเลิก
               </button>
               <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-900/20">
                  ออกจากระบบ
               </button>
            </div>
         </div>
      </div>
   );
};