/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccountType, AppScreen, SyrianGovernorate, OrderItem, DisputeIncident, CommissionTier, AuditLog, Language, RewardRule } from './types';
import { Navbar } from './components/Navbar';
import { ConsumerPortal } from './components/ConsumerPortal';
import { MerchantPortal } from './components/MerchantPortal';
import { AdminPortal } from './components/AdminPortal';
import { DriverPortal } from './components/DriverPortal';
import { LiveNavigation } from './components/LiveNavigation';
import { ImpactReport } from './components/ImpactReport';
import { WalletTopupModal } from './components/WalletTopupModal';
import { PayoutModal } from './components/PayoutModal';
import { AuthPortal } from './components/AuthPortal';
import { Toast, ToastMessage } from './components/Toast';
import { INITIAL_ORDERS, INITIAL_DISPUTES, INITIAL_COMMISSIONS, INITIAL_AUDIT_LOGS, INITIAL_REWARD_RULES } from './data/mockData';
import { resolveLocationFromCoords } from './data/geographyData';
import { t as translations } from './data/translations';
import { executeSecurePayout } from './db/supabaseClient';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentAccount, setCurrentAccount] = useState<AccountType>('consumer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState<AccountType | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('marketplace-catalog');

  // GLOBAL GPS & AUTO-LOCATION STATE (Unified for Rescuer)
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number;
    lng: number;
    gov_ar: string;
    gov_en: string;
    dist_ar: string;
    dist_en: string;
  } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const handleAutoDetectLocation = () => {
    setIsGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const resolved = resolveLocationFromCoords(pos.coords.latitude, pos.coords.longitude);
          setDetectedLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            ...resolved
          });
          setIsGpsLoading(false);
          showToast(translations[lang].gpsSuccess, 'my_location', 'success');
        },
        () => {
          // Fallback to Damascus Center
          const lat = 33.5138, lng = 36.2765;
          const resolved = resolveLocationFromCoords(lat, lng);
          setDetectedLocation({ lat, lng, ...resolved });
          setIsGpsLoading(false);
          showToast(translations[lang].gpsFailed, 'warning', 'info');
        },
        { timeout: 5000 }
      );
    } else {
      setIsGpsLoading(false);
      showToast(translations[lang].gpsFailed, 'warning', 'error');
    }
  };

  // Auto-detect on mount
  useEffect(() => {
    handleAutoDetectLocation();
  }, []);

  // Sync document root dir and lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  // Shared platform data across Syria
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [disputes, setDisputes] = useState<DisputeIncident[]>(INITIAL_DISPUTES);
  const [commissions, setCommissions] = useState<CommissionTier[]>(INITIAL_COMMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>(INITIAL_REWARD_RULES);

  // Wallets
  const [walletBalance, setWalletBalance] = useState<number>(45000);
  const [merchantWalletBalance, setMerchantWalletBalance] = useState<number>(420000);
  const [driverWalletBalance, setDriverWalletBalance] = useState<number>(18500);

  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const isEn = lang === 'en';

  const showToast = (text: string, icon = 'check_circle', type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, text, icon, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3800);
  };

  const handleToggleLanguage = () => {
    setLang((prev) => {
      const nextLang = prev === 'ar' ? 'en' : 'ar';
      showToast(
        nextLang === 'en' ? 'Switched language to English (LTR)' : 'تم تحويل لغة التطبيق إلى العربية (RTL)',
        'translate',
        'info'
      );
      return nextLang;
    });
  };

  const handleDeductWallet = (amount: number) => {
    setWalletBalance((prev) => Math.max(0, prev - amount));
  };

  const handleTopupSuccess = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    showToast(
      isEn
        ? `Wallet recharged with ${amount.toLocaleString('en-US')} SYP successfully!`
        : `تم شحن المحفظة بمبلغ ${amount.toLocaleString('ar-SY')} ل.س بنجاح!`,
      'verified',
      'success'
    );
  };

  const handleUpdateMerchantWallet = (delta: number) => {
    setMerchantWalletBalance((prev) => prev + delta);
  };

  const handleUpdateDriverWallet = (delta: number) => {
    setDriverWalletBalance((prev) => prev + delta);
  };

  const handleUpdateCommissionRate = (tierId: string, newRate: number) => {
    setCommissions((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, ratePercent: newRate } : t))
    );
  };

  const handleSaveRewardRule = (rule: RewardRule) => {
    setRewardRules((prev) => {
      const exists = prev.find((r) => r.id === rule.id);
      if (exists) {
        return prev.map((r) => (r.id === rule.id ? rule : r));
      }
      return [...prev, rule];
    });
    showToast(isEn ? 'Reward rule saved successfully' : 'تم حفظ قاعدة المكافآت بنجاح', 'verified');
  };

  const handleIssueBonus = (amount: number, reason: string) => {
    setWalletBalance((prev) => prev + amount);
    showToast(
      isEn
        ? `Manual bonus of ${amount.toLocaleString('en-US')} SYP issued: ${reason}`
        : `تم إصدار مكافأة يدوية بقيمة ${amount.toLocaleString('ar-SY')} ل.س: ${reason}`,
      'redeem'
    );
  };

  const handleRefundCustomer = (amount: number) => {
    setWalletBalance((prev) => prev + amount);
    showToast(
      isEn
        ? `Refund amount (${amount.toLocaleString('en-US')} SYP) credited to your wallet`
        : `تم استرداد المبلغ (${amount.toLocaleString('ar-SY')} ل.س) لمحفظتك`,
      'account_balance_wallet'
    );
  };

  const handlePayoutSuccess = async (amount: number, method: string) => {
    const role = currentAccount === 'consumer' ? 'rescuer' : currentAccount;
    const { success, refCode } = await executeSecurePayout(
      'USR-SY-9901',
      role,
      amount,
      method,
      'ChamCash-0933-211445',
      '123456'
    );

    if (success) {
      if (currentAccount === 'consumer') setWalletBalance((prev) => prev - amount);
      else if (currentAccount === 'merchant') setMerchantWalletBalance((prev) => prev - amount);
      else if (currentAccount === 'driver') setDriverWalletBalance((prev) => prev - amount);

      showToast(
        isEn
          ? `Withdrawal of ${amount.toLocaleString()} SYP submitted! Ref: ${refCode}`
          : `تم تقديم طلب سحب مبلغ ${amount.toLocaleString()} ل.س بنجاح. مرجع: ${refCode}`,
        'security',
        'success'
      );
    }
  };

  const handleAccountChange = (acc: AccountType) => {
    // Role Isolation: Force login if not logged in AS that specific role
    if (acc !== 'consumer' && (!isLoggedIn || authRole !== acc)) {
      setCurrentAccount(acc);
      // We don't change screen yet, AuthPortal will be shown by main logic
      return;
    }
    
    setCurrentAccount(acc);
    // Reset secondary screen
    if (acc === 'consumer') setCurrentScreen('marketplace-catalog');
    if (acc === 'merchant') setCurrentScreen('merchant-dashboard');
    if (acc === 'driver') setCurrentScreen('driver-portal');
    if (acc === 'admin') setCurrentScreen('platform-admin');

    const tr = translations[lang];
    const label = isEn
      ? acc === 'consumer'
        ? tr.consumerAccount
        : acc === 'merchant'
        ? tr.merchantAccount
        : acc === 'driver'
        ? 'Dedicated Driver & Captain Portal'
        : 'Dedicated Admin & Oversight Hub'
      : acc === 'consumer'
      ? tr.consumerAccount
      : acc === 'merchant'
      ? tr.merchantAccount
      : acc === 'driver'
      ? 'بوابة الكابتن والسائق الميداني'
      : 'بوابة الإدارة المركزية والرقابة (شاملة تفاصيل الطلب)';
    showToast(isEn ? `Switched to: ${label}` : `تم التبديل إلى: ${label}`, 'login');
  };

  const handleLoginSuccess = (role: AccountType) => {
    setIsLoggedIn(true);
    setAuthRole(role);
    setCurrentAccount(role);
    if (role === 'consumer') setCurrentScreen('marketplace-catalog');
    if (role === 'merchant') setCurrentScreen('merchant-dashboard');
    if (role === 'admin') setCurrentScreen('platform-admin');
    
    showToast(isEn ? 'Logged in successfully!' : 'تم تسجيل الدخول بنجاح!', 'verified', 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthRole(null);
    setCurrentAccount('consumer');
    setCurrentScreen('marketplace-catalog');
    showToast(isEn ? 'Logged out' : 'تم تسجيل الخروج', 'logout', 'info');
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans selection:bg-[#85f8c4] selection:text-[#002114]"
    >
      {/* Top Universal Navbar with Dedicated Syrian Account Switcher */}
      <Navbar
        currentAccount={currentAccount}
        onChangeAccount={handleAccountChange}
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        walletBalance={walletBalance}
        onOpenTopup={() => setIsTopupOpen(true)}
        detectedLocation={detectedLocation}
        isGpsLoading={isGpsLoading}
        onAutoDetectLocation={handleAutoDetectLocation}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-28 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Auth Check for Restricted Portals: Partners, Admins, and Captains must be logged in with correct role */}
        {((currentAccount === 'merchant' || currentAccount === 'admin' || currentAccount === 'driver') && (!isLoggedIn || authRole !== currentAccount)) ? (
          <AuthPortal 
            onLoginSuccess={handleLoginSuccess} 
            lang={lang} 
            defaultMode={currentAccount === 'admin' ? 'admin' : currentAccount === 'merchant' ? 'partner' : 'consumer'} 
          />
        ) : (
          <>
            {/* Support Screens Check */}
        {currentScreen === 'live-navigation' ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setCurrentScreen('marketplace-catalog')}
              className="self-start px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isEn ? 'arrow_back' : 'arrow_forward'}
              </span>
              <span>{isEn ? 'Back to Main Portal' : 'العودة للبوابة الرئيسية'}</span>
            </button>
            <LiveNavigation
              onShowToast={showToast}
              driverWalletBalance={driverWalletBalance}
              onUpdateDriverWallet={handleUpdateDriverWallet}
              onNavigate={setCurrentScreen}
            />
          </div>
        ) : currentScreen === 'impact-report' ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setCurrentScreen('marketplace-catalog')}
              className="self-start px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isEn ? 'arrow_back' : 'arrow_forward'}
              </span>
              <span>{isEn ? 'Back to Main Portal' : 'العودة للبوابة الرئيسية'}</span>
            </button>
            <ImpactReport
              onShowToast={showToast}
              onNavigate={setCurrentScreen}
              walletBalance={walletBalance}
              onCreditWallet={(amt) => handleTopupSuccess(amt)}
              lang={lang}
              rewardRules={rewardRules}
            />
          </div>
        ) : (
          <>
            {/* 1. DEDICATED CONSUMER ACCOUNT */}
            {currentAccount === 'consumer' && (
              <ConsumerPortal
                walletBalance={walletBalance}
                onDeductWallet={handleDeductWallet}
                onOpenTopup={() => setIsTopupOpen(true)}
                onOpenPayout={() => setIsPayoutOpen(true)}
                onShowToast={showToast}
                detectedLocation={detectedLocation}
                onAutoDetectLocation={handleAutoDetectLocation}
                isGpsLoading={isGpsLoading}
                lang={lang}
              />
            )}

            {/* 2. DEDICATED MERCHANT ACCOUNT */}
            {currentAccount === 'merchant' && (
              <MerchantPortal
                orders={orders}
                merchantWalletBalance={merchantWalletBalance}
                onUpdateMerchantWallet={handleUpdateMerchantWallet}
                onOpenPayout={() => setIsPayoutOpen(true)}
                onShowToast={showToast}
                lang={lang}
              />
            )}

            {/* 3. DEDICATED DRIVER / CAPTAIN ACCOUNT */}
            {currentAccount === 'driver' && (
              <DriverPortal
                driverWalletBalance={driverWalletBalance}
                onUpdateDriverWallet={handleUpdateDriverWallet}
                onUpdateMerchantWallet={handleUpdateMerchantWallet}
                onOpenPayout={() => setIsPayoutOpen(true)}
                onShowToast={showToast}
                lang={lang}
                orders={orders}
                onExitToConsumer={() => handleAccountChange('consumer')}
              />
            )}

            {/* 4. DEDICATED ADMIN ACCOUNT WITH END-TO-END ORDER LIFECYCLE INSPECTOR */}
            {currentAccount === 'admin' && (
              <AdminPortal
                orders={orders}
                disputes={disputes}
                commissions={commissions}
                auditLogs={auditLogs}
                rewardRules={rewardRules}
                onShowToast={showToast}
                onRefundRescuer={handleRefundCustomer}
                onUpdateCommissionRate={handleUpdateCommissionRate}
                onSaveRewardRule={handleSaveRewardRule}
                onIssueBonus={handleIssueBonus}
                lang={lang}
              />
            )}
          </>
        )}
      </>
    )}
  </main>

      {/* Platform Universal Footer with subtle Captain & Admin Access Entry */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-bold text-[#006948] text-sm">
              {isEn ? 'Barakah Box • Syria' : 'صندوق بركة • سوريا'}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>
              {isEn
                ? 'National Platform for Food-Waste Reduction & Surplus Rescue'
                : 'المنظومة الوطنية لحفظ النعمة ومكافحة الهدر الغذائي'}
            </span>
          </div>

          {/* Quick Subtle Role & Support Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold">
            <button
              onClick={() => handleAccountChange('consumer')}
              className={`hover:text-[#006948] transition-colors cursor-pointer ${
                currentAccount === 'consumer' ? 'text-[#006948] font-bold' : ''
              }`}
            >
              {isEn ? 'Rescuer Portal' : 'بوابة المنقذ'}
            </button>

            <button
              onClick={() => handleAccountChange('merchant')}
              className={`hover:text-[#006948] transition-colors cursor-pointer ${
                currentAccount === 'merchant' ? 'text-[#006948] font-bold' : ''
              }`}
            >
              {isEn ? 'Partner Dashboard' : 'بوابة الشريك الشامي'}
            </button>

            {/* Subtle Driver Portal Entry as requested */}
            <button
              onClick={() => {
                handleAccountChange('driver');
                showToast(
                  isEn ? 'Welcome to Captain Portal! Manage your deliveries.' : 'مرحباً بك في بوابة الكباتن! يمكنك إدارة مهام التوصيل.',
                  'two_wheeler',
                  'info'
                );
              }}
              className="text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-700">two_wheeler</span>
              <span>{isEn ? 'Become a Driver / Captain Login' : 'انضم ككابتن توصيل / دخول الكباتن'}</span>
            </button>

            <button
              onClick={() => handleAccountChange('admin')}
              className={`hover:text-slate-900 transition-colors cursor-pointer ${
                currentAccount === 'admin' ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              {isEn ? 'Platform Governance' : 'بوابة الإدارة والرقابة'}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            {isEn
              ? 'Covering Damascus, Rif Dimashq, Aleppo, Homs, Latakia, Hama, Tartous & All Syrian Governorates.'
              : 'تغطي المنظومة دمشق، ريف دمشق، حلب، حمص، اللاذقية، حماة، طرطوس وكافة المحافظات السورية.'}
          </span>
          <span>© 2026 Barakah Box Syria. All rights reserved.</span>
        </div>
      </footer>

      {/* Wallet Topup Modal */}
      <WalletTopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        currentBalance={walletBalance}
        onTopupSuccess={handleTopupSuccess}
        lang={lang}
      />

      {/* Payout / Withdrawal Modal */}
      <PayoutModal
        isOpen={isPayoutOpen}
        onClose={() => setIsPayoutOpen(false)}
        currentBalance={
          currentAccount === 'merchant'
            ? merchantWalletBalance
            : currentAccount === 'driver'
            ? driverWalletBalance
            : walletBalance
        }
        role={
          currentAccount === 'consumer'
            ? 'rescuer'
            : currentAccount === 'merchant'
            ? 'partner'
            : currentAccount === 'driver'
            ? 'captain'
            : 'admin'
        }
        onPayoutSuccess={handlePayoutSuccess}
        lang={lang}
      />

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
