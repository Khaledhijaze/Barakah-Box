import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../data/translations';
import { motion, AnimatePresence } from 'motion/react';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  role: 'rescuer' | 'partner' | 'captain' | 'admin';
  onPayoutSuccess: (amount: number, method: string) => void;
  lang?: Language;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  role,
  onPayoutSuccess,
  lang = 'ar',
}) => {
  const tr = t[lang];
  const isEn = lang === 'en';

  const [amount, setAmount] = useState<number>(Math.min(currentBalance, 25000));
  const [method, setMethod] = useState<'cham_cash' | 'bank'>('cham_cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const dailyLimit = role === 'partner' ? 500000 : role === 'captain' ? 75000 : 25000;

  const handleRequest = () => {
    if (amount <= 0 || amount > currentBalance) return;
    if (!accountNumber || !securityCode) return;

    setIsProcessing(true);
    // Simulated Atomic Server-Side Operation with Fraud Logs
    setTimeout(() => {
      onPayoutSuccess(amount, method);
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-[#006948] p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[32px] text-[#85f8c4]">account_balance_wallet</span>
            </div>
            <h2 className="text-xl font-bold">{tr.payoutModalTitle}</h2>
            <p className="text-xs text-white/70 mt-1">{tr.payoutModalSub}</p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Balance Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  {isEn ? 'Available Balance' : 'الرصيد المتاح حالياً'}
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {currentBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                  {tr.payoutDailyLimit}
                </span>
                <span className="text-xs font-bold text-[#006948] font-mono">
                  {dailyLimit.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">{tr.withdrawAmountLabel}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={Math.min(currentBalance, dailyLimit)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {tr.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">{tr.payoutMethodLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMethod('cham_cash')}
                    className={`px-3 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                      method === 'cham_cash'
                        ? 'bg-[#006948]/5 border-[#006948] text-[#006948]'
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
                    {tr.payoutMethodChamCash}
                  </button>
                  <button
                    onClick={() => setMethod('bank')}
                    className={`px-3 py-2.5 rounded-xl border-2 text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                      method === 'bank'
                        ? 'bg-[#006948]/5 border-[#006948] text-[#006948]'
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                    {tr.payoutMethodBank}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">{tr.accountNumberLabel}</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={method === 'cham_cash' ? '09xx xxx xxx' : 'xxxx-xxxx-xxxx-xxxx'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">{tr.otpLabel}</label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 tracking-widest focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] outline-none transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-[18px]">
                    lock
                  </span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">verified_user</span>
              <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                {tr.payoutSecurityNotice}
              </p>
            </div>

            <button
              onClick={handleRequest}
              disabled={isProcessing || !accountNumber || !securityCode || amount <= 0 || amount > currentBalance}
              className="w-full bg-[#006948] hover:bg-[#00855d] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#006948]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{isEn ? 'Processing Security Verification...' : 'جاري التحقق الأمني الرقمي...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">security</span>
                  <span>{tr.requestPayoutBtn}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
