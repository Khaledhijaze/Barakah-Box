import React, { useState } from 'react';
import { AccountType, AppScreen, SyrianGovernorate, Language } from '../types';
import { LOGO_URL } from '../data/mockData';
import { SYRIAN_GOVERNORATES } from '../data/geographyData';
import { t } from '../data/translations';

interface NavbarProps {
  currentAccount: AccountType;
  onChangeAccount: (acc: AccountType) => void;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  walletBalance: number;
  onOpenTopup: () => void;
  detectedLocation: { gov_ar: string; gov_en: string; dist_ar: string; dist_en: string } | null;
  isGpsLoading: boolean;
  onAutoDetectLocation: () => void;
  lang: Language;
  onToggleLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAccount,
  onChangeAccount,
  currentScreen,
  onNavigate,
  walletBalance,
  onOpenTopup,
  detectedLocation,
  isGpsLoading,
  onAutoDetectLocation,
  lang,
  onToggleLanguage,
}) => {
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const isEn = lang === 'en';
  const tr = t[lang];

  return (
    <header
      dir={isEn ? 'ltr' : 'rtl'}
      className="fixed top-0 w-full z-50 bg-[#faf8ff]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-b border-slate-200/80"
    >
      {/* Top Primary Bar */}
      <div className="h-18 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & National Scope */}
        <div
          onClick={() => onChangeAccount('consumer')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <img
            src={LOGO_URL}
            alt="Barakah Box Logo"
            className="h-10 w-auto object-contain drop-shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#006948] tracking-tight leading-tight">
              {tr.appName}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">
              {tr.nationalTag}
            </span>
          </div>
        </div>

        {/* ROLE-BASED NAVIGATION: Consumer, Merchant, and Admin shown for clarity in this Remix */}
        <div className="flex items-center bg-[#eaedff] p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => onChangeAccount('consumer')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentAccount === 'consumer'
                ? 'bg-[#006948] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            <span className="hidden sm:inline">{tr.rescuerLabel}</span>
          </button>

          <button
            onClick={() => onChangeAccount('merchant')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentAccount === 'merchant'
                ? 'bg-[#006948] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">store</span>
            <span className="hidden sm:inline">{tr.partnerLabel}</span>
          </button>

          <button
            onClick={() => onChangeAccount('admin')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentAccount === 'admin'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">admin_panel_settings</span>
            <span className="hidden sm:inline">{isEn ? 'Admin' : 'الإدارة'}</span>
          </button>

          {/* Active indicator only when Driver Portal is engaged */}
          {currentAccount === 'driver' && (
            <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs ml-1">
              <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
              <span>{isEn ? 'Captain' : 'الكابتن'}</span>
              <button
                onClick={() => onChangeAccount('consumer')}
                title={isEn ? 'Return to Rescuer Portal' : 'العودة لبوابة المنقذ'}
                className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer ml-1"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Location Display (Auto-Detected) */}
        <div className="relative hidden md:block">
          <button
            onClick={onAutoDetectLocation}
            disabled={isGpsLoading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition-all cursor-pointer disabled:opacity-70"
          >
            <span className={`material-symbols-outlined text-[#006948] text-[18px] ${isGpsLoading ? 'animate-spin' : ''}`}>
              {isGpsLoading ? 'refresh' : 'my_location'}
            </span>
            <span>
              {isGpsLoading ? tr.gpsLocating : detectedLocation ? (
                `${isEn ? detectedLocation.gov_en : detectedLocation.gov_ar} - ${isEn ? detectedLocation.dist_en : detectedLocation.dist_ar}`
              ) : isEn ? 'Detecting Location...' : 'تحديد الموقع...'}
            </span>
          </button>
        </div>

        {/* Right Action Icons: Language Switcher, Wallet, Notifications, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* BILINGUAL LANGUAGE SWITCHER TOGGLE */}
          <button
            onClick={onToggleLanguage}
            title={isEn ? 'التبديل إلى العربية' : 'Switch to English'}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#006948]">translate</span>
            <span>{tr.langToggle}</span>
          </button>

          {/* Wallet Balance Chip */}
          <div className="flex items-center gap-1.5 bg-[#00855d] text-white px-3 py-1 rounded-full shadow-sm text-xs font-semibold">
            <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
            <span className="whitespace-nowrap font-bold tracking-tight">
              {walletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
            </span>
            <button
              onClick={onOpenTopup}
              title={isEn ? 'Top up wallet' : 'شحن رصيد المحفظة'}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#00855d] hover:bg-slate-100 transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-200/70 transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fea619] animate-pulse"></span>
            </button>

            {showNotificationMenu && (
              <div
                className={`absolute top-full mt-2 ${
                  isEn ? 'right-0' : 'left-0 sm:right-auto'
                } w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    {isEn ? 'Live Syrian Alerts' : 'التنبيهات المباشرة في سوريا'}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {isEn ? 'Active' : 'نشط'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-950 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700 mt-0.5">verified</span>
                    <div>
                      <p className="font-bold">{isEn ? 'Order Confirmed & Ready!' : 'طلبك مؤكد وجاهز للاستلام!'}</p>
                      <span className="text-[11px] text-emerald-700">
                        {isEn ? 'Shamsin Bakery - Mazzeh' : 'مخبز وشمسين للشامي (المزة)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>

      {/* Sub-Bar for Quick Access to Impact screen & Captain Access Entry */}
      <div className="bg-white/90 border-t border-slate-200/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5 no-scrollbar text-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('impact-report')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                currentScreen === 'impact-report' ? 'bg-[#006948] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">eco</span>
              <span>{isEn ? 'Environmental Impact & Rewards' : 'تقرير الأثر البيئي ومكافآت الإنجاز'}</span>
            </button>

            {/* Subtle Driver Access Entry */}
            <button
              onClick={() => onChangeAccount('driver')}
              className="text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-700">two_wheeler</span>
              <span>{isEn ? 'Become a Driver / Captain' : 'انضم ككابتن توصيل'}</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 font-semibold">
            <span className="material-symbols-outlined text-[15px] text-[#006948]">verified</span>
            <span>{tr.nationalTag}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
