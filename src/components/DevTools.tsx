import React, { useState } from 'react';
import { Language, AccountType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface DevToolsProps {
  onSeedData: () => void;
  onTopupWallet: (amount: number) => void;
  onSimulateLifecycle: () => void;
  onResetDatabase: () => void;
  lang: Language;
}

export const DevTools: React.FC<DevToolsProps> = ({
  onSeedData,
  onTopupWallet,
  onSimulateLifecycle,
  onResetDatabase,
  lang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEn = lang === 'en';

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[60] w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer group"
        title="Admin / Developer Tools"
      >
        <span className={`material-symbols-outlined text-[30px] transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? 'close' : 'terminal'}
        </span>
        <span className="absolute -top-2 -right-1 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          DEV
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            className="fixed bottom-24 left-6 z-[60] w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="bg-indigo-600 p-4 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">construction</span>
                {isEn ? 'System Testing Suite' : 'نظام الاختبار التشغيلي'}
              </h3>
              <p className="text-[10px] text-indigo-100 mt-1 opacity-80">
                {isEn ? 'E2E Lifecycle Simulation & Mock Data' : 'محاكاة دورة حياة الطلب والبيانات التجريبية'}
              </p>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Seed Data Button */}
              <button
                onClick={() => {
                  onSeedData();
                  setIsOpen(false);
                }}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left flex items-center gap-3 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">database</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isEn ? 'Seed Mock Data' : 'إدخال بيانات ومحلات وهمية'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isEn ? 'Stores, Boxes & Locations' : 'إضافة متاجر وصناديق تجريبية'}
                  </span>
                </div>
              </button>

              {/* Wallet Boost Button */}
              <button
                onClick={() => {
                  onTopupWallet(100000);
                  setIsOpen(false);
                }}
                className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left flex items-center gap-3 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isEn ? 'Boost Wallet (+100k)' : 'إضافة رصيد تجريبي (+100 ألف)'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isEn ? 'Test Purchases & Withdrawals' : 'اختبار عمليات الشراء والسحب'}
                  </span>
                </div>
              </button>

              {/* Simulate Lifecycle Button */}
              <button
                onClick={() => {
                  onSimulateLifecycle();
                  setIsOpen(false);
                }}
                className="w-full p-3 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl text-left flex items-center gap-3 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">published_with_changes</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isEn ? 'Simulate Order Lifecycle' : 'بدء محاكاة دورة حياة الطلب'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isEn ? 'Booking -> PIN -> Partner -> Success' : 'حجز، توليد رمز، قبول المتجر وتسليم'}
                  </span>
                </div>
              </button>

              {/* Reset Database Button */}
              <button
                onClick={() => {
                  if (confirm(isEn ? 'Are you sure you want to reset all data?' : 'هل أنت متأكد من مسح كافة البيانات التجريبية وإعادة الضبط؟')) {
                    onResetDatabase();
                    setIsOpen(false);
                  }
                }}
                className="w-full p-3 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-2xl text-left flex items-center gap-3 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isEn ? 'Reset Test Environment' : 'إعادة ضبط بيئة الاختبار'}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {isEn ? 'Clear all orders & mock data' : 'مسح العمليات التجريبية والبدء من جديد'}
                  </span>
                </div>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Barakah Box v2.4 Beta Testing
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
