import React, { useState } from 'react';
import { Language } from '../types';

interface WalletTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTopupSuccess: (amount: number) => void;
  lang?: Language;
}

export const WalletTopupModal: React.FC<WalletTopupModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onTopupSuccess,
  lang = 'ar',
}) => {
  const isEn = lang === 'en';
  const [amount, setAmount] = useState<number>(25000);
  const [method, setMethod] = useState<'bank_card' | 'shamcash' | 'syriatel' | 'haram'>('bank_card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Bank Card Details State
  const [selectedBank, setSelectedBank] = useState<string>('cbs');
  const [cardNumber, setCardNumber] = useState<string>('9860 •••• •••• 4120');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('839');

  if (!isOpen) return null;

  const handleTopup = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onTopupSuccess(amount);
      onClose();
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        dir={isEn ? 'ltr' : 'rtl'}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95"
      >
        <div className="bg-[#f2f3ff] p-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006948] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-bold text-[#131b2e] text-base">
                {isEn ? 'Top Up Digital Barakah Wallet' : 'شحن رصيد محفظة بركة الرقمية'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? 'Available Balance: ' : 'الرصيد المتاح الحالي: '}
                <span className="font-bold text-[#006948] font-mono">
                  {currentBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {isEn ? 'SYP' : 'ل.س'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Quick Amounts */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              {isEn ? 'Select Quick Top-Up Amount:' : 'اختر مبلغ الشحن السريع:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15000, 25000, 50000, 75000, 100000, 150000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    amount === val
                      ? 'border-[#006948] bg-[#f5fff7] text-[#006948] ring-1 ring-[#006948]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {isEn ? 'SYP' : 'ل.س'}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              {isEn ? 'Choose Payment Gateway / Bank Card:' : 'اختر بوابة الدفع أو البطاقة المصرفية:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Syrian Bank Card (PRIMARY) */}
              <button
                type="button"
                onClick={() => setMethod('bank_card')}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  method === 'bank_card'
                    ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#006948] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                </div>
                <div className={isEn ? 'text-left' : 'text-right'}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">
                      {isEn ? 'Syrian Bank Card' : 'بطاقة بنكية مصرفية'}
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      {isEn ? 'Instant' : 'فوري'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {isEn ? 'Commercial, Bemo, Al Baraka, SIIB' : 'التجاري السوري، بيمو، البركة'}
                  </span>
                </div>
              </button>

              {/* ShamCash */}
              <button
                type="button"
                onClick={() => setMethod('shamcash')}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  method === 'shamcash'
                    ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold">
                  ش
                </div>
                <div className={isEn ? 'text-left' : 'text-right'}>
                  <span className="font-bold text-slate-900 block">{isEn ? 'ShamCash App' : 'تطبيق شام كاش'}</span>
                  <span className="text-[10px] text-slate-500 block">{isEn ? 'Instant QR Settlement' : 'تسوية فورية بالكود'}</span>
                </div>
              </button>

              {/* Syriatel Cash / MTN Cash */}
              <button
                type="button"
                onClick={() => setMethod('syriatel')}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  method === 'syriatel'
                    ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">phone_android</span>
                </div>
                <div className={isEn ? 'text-left' : 'text-right'}>
                  <span className="font-bold text-slate-900 block">
                    {isEn ? 'Syriatel / MTN Cash' : 'سيرياتيل / إم تي إن كاش'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{isEn ? 'Mobile GSM Wallet' : 'محفظة الهاتف المحمول'}</span>
                </div>
              </button>

              {/* Al-Haram / Al-Fouad */}
              <button
                type="button"
                onClick={() => setMethod('haram')}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  method === 'haram'
                    ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                </div>
                <div className={isEn ? 'text-left' : 'text-right'}>
                  <span className="font-bold text-slate-900 block">
                    {isEn ? 'Al-Haram / Al-Fouad' : 'حوالة الهرم / الفؤاد'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{isEn ? 'Cash Deposit Voucher' : 'إيداع نقدي عبر الفروع'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Form: Bank Card Details */}
          {method === 'bank_card' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#006948] text-[18px]">verified_user</span>
                  <span>{isEn ? 'Syrian Bank Card Data (E-Payment)' : 'بيانات البطاقة المصرفية السورية (دفع إلكتروني آمن)'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{isEn ? 'Encrypted 256-bit' : 'مشفر وآمن 256-bit'}</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                  {isEn ? 'Select Issuing Syrian Bank:' : 'اختر المصرف المصدِر للبطاقة:'}
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006948]"
                >
                  <option value="cbs">المصرف التجاري السوري (Commercial Bank of Syria)</option>
                  <option value="bemo">بنك بيمو السعودي الفرنسي (Banque Bemo Saudi Fransi)</option>
                  <option value="baraka">بنك البركة سورية (Al Baraka Bank Syria)</option>
                  <option value="siib">بنك سورية الدولي الإسلامي (SIIB)</option>
                  <option value="cham">بنك الشام (Cham Bank)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                  {isEn ? 'Card Number (16 Digits):' : 'رقم البطاقة المصرفية (16 رقم):'}
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-left tracking-wider text-slate-800 focus:outline-none focus:border-[#006948]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                    {isEn ? 'Expiry Date (MM/YY):' : 'تاريخ الانتهاء (شهر/سنة):'}
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-center text-slate-800 focus:outline-none focus:border-[#006948]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                    {isEn ? 'Security Code (CVV2):' : 'رمز الأمان السري (CVV2):'}
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-center text-slate-800 focus:outline-none focus:border-[#006948]"
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'shamcash' && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 flex flex-col gap-2">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-amber-700">qr_code_scanner</span>
                <span>{isEn ? 'Direct Settlement via ShamCash' : 'التحويل المباشر عبر تطبيق شام كاش'}</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                {isEn
                  ? 'Upon clicking Top-Up, open ShamCash and scan our merchant code #BB-9921 for instant reconciliation.'
                  : 'سيتم توجيهك فوراً لتأكيد الخصم المباشر عبر تطبيق شام كاش على الحساب التجاري رقم 99420-BB.'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#f2f3ff] p-4 flex items-center justify-between gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer text-xs"
          >
            {isEn ? 'Cancel' : 'إلغاء'}
          </button>
          <button
            onClick={handleTopup}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>{isEn ? 'Connecting to Syrian Gateway...' : 'جاري الاتصال ببوابة الدفع الوطنية...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>
                  {isEn
                    ? `Confirm Top-Up (${amount.toLocaleString('en-US')} SYP)`
                    : `تأكيد شحن (${amount.toLocaleString('ar-SY')} ل.س)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
