import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, X, FileText, Lock, Eye, EyeOff } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onAccept, onDecline }) => {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-emerald-500" size={24} />
            <h2 className="text-2xl font-bold text-white">ข้อกำหนดและเงื่อนไข</h2>
          </div>

          <div className="space-y-4 text-sm text-zinc-300 mb-6 max-h-[400px] overflow-y-auto pr-2">
            <div>
              <h3 className="font-bold text-white mb-2">1. การยอมรับข้อกำหนด</h3>
              <p className="leading-relaxed">
                โดยการใช้งาน JDH Wallet คุณยอมรับข้อกำหนดและเงื่อนไขทั้งหมดที่ระบุไว้ในเอกสารนี้
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">2. ความรับผิดชอบ</h3>
              <p className="leading-relaxed">
                คุณเป็นผู้รับผิดชอบในการรักษาความปลอดภัยของ seed phrase และ private key ของคุณ
                JDH Wallet ไม่สามารถกู้คืน wallet ที่สูญหายได้
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">3. การใช้งาน</h3>
              <p className="leading-relaxed">
                คุณตกลงที่จะใช้บริการนี้ตามกฎหมายที่เกี่ยวข้อง และไม่ใช้เพื่อวัตถุประสงค์ที่ผิดกฎหมาย
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">4. นโยบายความเป็นส่วนตัว</h3>
              <p className="leading-relaxed">
                ข้อมูลส่วนตัวของคุณจะถูกเก็บรักษาอย่างปลอดภัย เราไม่เก็บ seed phrase หรือ private key ของคุณ
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">5. การเปลี่ยนแปลง</h3>
              <p className="leading-relaxed">
                เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดนี้ได้ทุกเมื่อ โดยจะแจ้งให้ทราบล่วงหน้า
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-zinc-950 rounded-xl mb-6">
            <input
              type="checkbox"
              id="accept-terms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="accept-terms" className="text-sm text-zinc-300 cursor-pointer">
              ฉันได้อ่านและยอมรับ <span className="text-emerald-400 font-medium">ข้อกำหนดและเงื่อนไข</span> และ <span className="text-emerald-400 font-medium">นโยบายความเป็นส่วนตัว</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={onAccept}
              disabled={!accepted}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
            >
              ยอมรับ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SecurityWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type: 'seed' | 'import';
}

export const SecurityWarningModal: React.FC<SecurityWarningModalProps> = ({ isOpen, onConfirm, onCancel, type }) => {
  console.log('SecurityWarningModal render, isOpen:', isOpen, 'type:', type);
  if (!isOpen) return null;

  const seedWarnings = [
    "ห้ามแคปหน้าจอหรือบันทึกภาพ seed phrase",
    "ห้ามส่ง seed phrase ทางอีเมล, ข้อความ, หรือแชท",
    "เก็บ seed phrase ไว้ในที่ปลอดภัยเท่านั้น",
    "หากสูญหาย seed phrase คุณจะไม่สามารถกู้คืน wallet ได้",
    "อย่าให้ใครเห็น seed phrase ของคุณ"
  ];

  const importWarnings = [
    "ตรวจสอบให้แน่ใจว่าเป็น seed phrase ของคุณเอง",
    "อย่าใส่ seed phrase ในที่สาธารณะหรือคอมพิวเตอร์สาธารณะ",
    "ตรวจสอบว่าไม่มีใครมองเห็นหน้าจอของคุณ",
    "ใช้ keyboard ที่ปลอดภัย (ไม่ใช่ virtual keyboard)",
    "หลัง import สำเร็จ ให้ลบ seed phrase ออกจากหน้าจอทันที"
  ];

  const warnings = type === 'seed' ? seedWarnings : importWarnings;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {type === 'seed' ? 'คำเตือนความปลอดภัย' : 'คำเตือนก่อน Import'}
            </h2>
          </div>

          <div className="space-y-3 mb-6">
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-200 leading-relaxed">{warning}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors"
            >
              ฉันเข้าใจแล้ว
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tips = [
    {
      icon: Shield,
      title: "เก็บ Seed Phrase ไว้ในที่ปลอดภัย",
      desc: "เก็บ seed phrase ไว้ในที่ปลอดภัยและห้ามแชร์กับใคร"
    },
    {
      icon: Lock,
      title: "ตรวจสอบ Address ก่อนส่ง",
      desc: "ตรวจสอบ address ปลายทางให้แน่ใจก่อนส่ง transaction"
    },
    {
      icon: AlertTriangle,
      title: "ระวัง Phishing",
      desc: "อย่าคลิกลิงก์ที่น่าสงสัยหรือให้ seed phrase กับใคร"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">🎉 ยินดีต้อนรับสู่ JDH Wallet</h2>
            <p className="text-zinc-400">กระเป๋าเงินของคุณพร้อมใช้งานแล้ว</p>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-bold text-white mb-3">💡 Security Tips</h3>
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl">
                <tip.icon className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-white mb-1">{tip.title}</p>
                  <p className="text-xs text-zinc-400">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors"
          >
            เริ่มใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
};

