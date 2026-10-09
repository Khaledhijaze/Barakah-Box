/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AccountType, AppScreen, SyrianGovernorate, OrderItem, DisputeIncident, CommissionTier, AuditLog, Language, RewardRule, UserProfile, BarakahBox, SupportTicket } from './types';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { resolveLocationFromCoords } from './data/geographyData';
import { t as translations } from './data/translations';
import { 
  executeSecurePayout, 
  fetchOrdersFromDb, 
  fetchDisputesFromDb, 
  fetchCommissionsFromDb, 
  fetchAuditLogsFromDb, 
  fetchRewardRulesFromDb,
  fetchBoxesFromDb,
  fetchUserWalletBalance,
  fetchSupportTicketsFromDb,
  fetchUsersFromDb,
  updateUserPassword
} from './db/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentAccount, setCurrentAccount] = useState<AccountType>('consumer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState<AccountType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('marketplace-catalog');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // GLOBAL GPS & AUTO-LOCATION STATE
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number;
    lng: number;
    gov_ar: string;
    gov_en: string;
    dist_ar: string;
    dist_en: string;
  } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((text: string, icon = 'check_circle', type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, text, icon, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3800);
  }, []);

  // Shared platform data from DB
  const [boxes, setBoxes] = useState<BarakahBox[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [disputes, setDisputes] = useState<DisputeIncident[]>([]);
  const [commissions, setCommissions] = useState<CommissionTier[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [partners, setPartners] = useState<UserProfile[]>([]);

  // Wallets
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [merchantWalletBalance, setMerchantWalletBalance] = useState<number>(0);
  const [driverWalletBalance, setDriverWalletBalance] = useState<number>(0);

  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState<boolean>(false);

  const isEn = lang === 'en';

  /**
   * Universal Data Loader (Real Supabase Integration)
   */
  const refreshAppData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [o, d, c, a, r, b, t, p] = await Promise.all([
        isLoggedIn ? fetchOrdersFromDb(authRole === 'merchant' ? 'merchant' : authRole === 'consumer' ? 'consumer' : undefined, userProfile?.storeName || userProfile?.phoneNumber) : Promise.resolve([]),
        isLoggedIn && authRole === 'admin' ? fetchDisputesFromDb() : Promise.resolve([]),
        isLoggedIn && authRole === 'admin' ? fetchCommissionsFromDb() : Promise.resolve([]),
        isLoggedIn && authRole === 'admin' ? fetchAuditLogsFromDb() : Promise.resolve([]),
        fetchRewardRulesFromDb(),
        fetchBoxesFromDb(),
        isLoggedIn ? fetchSupportTicketsFromDb() : Promise.resolve([]),
        isLoggedIn && authRole === 'admin' ? fetchUsersFromDb('merchant') : Promise.resolve([])
      ]);
      setOrders(o);
      setDisputes(d);
      setCommissions(c);
      setAuditLogs(a);
      setRewardRules(r);
      setBoxes(b);
      setSupportTickets(t);
      setPartners(p);
    } catch (err) {
      console.error("Error refreshing data:", err);
      showToast(isEn ? 'Connection to database lost' : 'فقد الاتصال بقاعدة البيانات الرئيسية', 'cloud_off', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [isLoggedIn, authRole, userProfile, isEn, showToast]);

  useEffect(() => {
    refreshAppData();
  }, [refreshAppData]);

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

  useEffect(() => {
    handleAutoDetectLocation();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

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
      userProfile?.id || 'USR-ANON',
      role,
      amount,
      method,
      'Internal Settlement',
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
    // SECURITY GUARD: Force AuthPortal for any non-consumer or unauthenticated role
    if (acc !== 'consumer' && (!isLoggedIn || authRole !== acc)) {
      setCurrentAccount(acc);
      return;
    }
    
    setCurrentAccount(acc);
    if (acc === 'consumer') setCurrentScreen('marketplace-catalog');
    if (acc === 'merchant') setCurrentScreen('merchant-dashboard');
    if (acc === 'driver') setCurrentScreen('driver-portal');
    if (acc === 'admin') setCurrentScreen('platform-admin');

    const tr = translations[lang];
    const label = isEn
      ? acc === 'consumer' ? tr.consumerAccount : acc === 'merchant' ? tr.merchantAccount : acc === 'driver' ? 'Driver Portal' : 'Admin Hub'
      : acc === 'consumer' ? tr.consumerAccount : acc === 'merchant' ? tr.merchantAccount : acc === 'driver' ? 'بوابة الكابتن' : 'بوابة الإدارة';
    showToast(isEn ? `Portal: ${label}` : `تم الانتقال إلى: ${label}`, 'login');
  };

  const handleLoginSuccess = async (profile: UserProfile) => {
    setIsLoggedIn(true);
    setAuthRole(profile.role);
    setUserProfile(profile);
    setCurrentAccount(profile.role);
    setIsAuthModalOpen(false);
    
    // Default screens per role
    if (profile.role === 'consumer') setCurrentScreen('marketplace-catalog');
    if (profile.role === 'merchant') setCurrentScreen('merchant-dashboard');
    if (profile.role === 'admin') setCurrentScreen('platform-admin');
    
    // Fetch REAL wallet balances from DB
    const balance = await fetchUserWalletBalance(profile.id);
    if (profile.role === 'consumer') setWalletBalance(balance);
    if (profile.role === 'merchant') setMerchantWalletBalance(balance);
    if (profile.role === 'driver') setDriverWalletBalance(balance);

    showToast(isEn ? `Identity Verified: ${profile.name}` : `تم التحقق من الهوية: ${profile.name}`, 'verified', 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthRole(null);
    setUserProfile(null);
    setCurrentAccount('consumer');
    setCurrentScreen('marketplace-catalog');
    showToast(isEn ? 'Session ended securely' : 'تم إنهاء الجلسة وتأمين الحساب', 'logout', 'info');
  };

  const handleUpdateUserPassword = async (userId: string, newPass: string) => {
    const success = await updateUserPassword(userId, newPass);
    if (success) {
      showToast(isEn ? 'Password updated successfully' : 'تم تحديث كلمة المرور بنجاح', 'lock_reset');
    } else {
      showToast(isEn ? 'Failed to update password' : 'فشل تحديث كلمة المرور', 'error', 'error');
    }
  };

  return (
    <ErrorBoundary>
      <div
        dir={isEn ? 'ltr' : 'rtl'}
        className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col font-sans selection:bg-[#85f8c4] selection:text-[#002114]"
      >
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
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-1 pt-28 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* AUTH GUARD: If not consumer and not logged in with correct role, show AuthPortal */}
          {((currentAccount !== 'consumer') && (!isLoggedIn || authRole !== currentAccount)) ? (
            <div className="flex items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
              <AuthPortal 
                onLoginSuccess={handleLoginSuccess} 
                onClose={() => setCurrentAccount('consumer')}
                onShowToast={showToast}
                lang={lang} 
                defaultMode={currentAccount === 'admin' ? 'admin' : currentAccount === 'merchant' ? 'partner' : 'consumer'} 
              />
            </div>
          ) : (
            <div className="relative">
              {isLoadingData && (
                <div className="absolute inset-x-0 -top-4 flex justify-center z-10">
                  <div className="bg-[#006948] text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-lg animate-bounce">
                    {isEn ? 'Syncing with Syrian Database...' : 'جاري المزامنة مع قاعدة البيانات السورية...'}
                  </div>
                </div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentAccount}-${currentScreen}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentScreen === 'live-navigation' ? (
                    <LiveNavigation
                      onShowToast={showToast}
                      driverWalletBalance={driverWalletBalance}
                      onUpdateDriverWallet={handleUpdateDriverWallet}
                      onNavigate={setCurrentScreen}
                    />
                  ) : currentScreen === 'impact-report' ? (
                    <ImpactReport
                      onShowToast={showToast}
                      onNavigate={setCurrentScreen}
                      walletBalance={walletBalance}
                      onCreditWallet={(amt) => handleTopupSuccess(amt)}
                      lang={lang}
                      rewardRules={rewardRules}
                      orders={orders}
                      userProfile={userProfile}
                    />
                  ) : currentAccount === 'consumer' ? (
                    <ConsumerPortal
                      boxes={boxes}
                      orders={orders}
                      supportTickets={supportTickets}
                      walletBalance={walletBalance}
                      onDeductWallet={handleDeductWallet}
                      onOpenTopup={() => setIsTopupOpen(true)}
                      onOpenPayout={() => setIsPayoutOpen(true)}
                      onShowToast={showToast}
                      onOpenAuth={() => setIsAuthModalOpen(true)}
                      detectedLocation={detectedLocation}
                      onAutoDetectLocation={handleAutoDetectLocation}
                      isGpsLoading={isGpsLoading}
                      lang={lang}
                      userProfile={userProfile}
                    />
                  ) : currentAccount === 'merchant' ? (
                    <MerchantPortal
                      orders={orders}
                      merchantWalletBalance={merchantWalletBalance}
                      onUpdateMerchantWallet={handleUpdateMerchantWallet}
                      onOpenPayout={() => setIsPayoutOpen(true)}
                      onShowToast={showToast}
                      lang={lang}
                      userProfile={userProfile}
                    />
                  ) : currentAccount === 'driver' ? (
                    <DriverPortal
                      driverWalletBalance={driverWalletBalance}
                      onUpdateDriverWallet={handleUpdateDriverWallet}
                      onUpdateMerchantWallet={handleUpdateMerchantWallet}
                      onOpenPayout={() => setIsPayoutOpen(true)}
                      onShowToast={showToast}
                      lang={lang}
                      orders={orders}
                      onExitToConsumer={() => handleAccountChange('consumer')}
                      userProfile={userProfile}
                    />
                  ) : (
                    <AdminPortal
                      orders={orders}
                      disputes={disputes}
                      commissions={commissions}
                      auditLogs={auditLogs}
                      rewardRules={rewardRules}
                      supportTickets={supportTickets}
                      partners={partners}
                      onShowToast={showToast}
                      onRefundRescuer={handleRefundCustomer}
                      onUpdateCommissionRate={handleUpdateCommissionRate}
                      onSaveRewardRule={handleSaveRewardRule}
                      onIssueBonus={handleIssueBonus}
                      onUpdateUserPassword={handleUpdateUserPassword}
                      lang={lang}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="font-bold text-[#006948] text-sm">
                {isEn ? 'Barakah Box • Syria' : 'صندوق بركة • سوريا'}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span>
                {isEn
                  ? 'National Platform for Food-Waste Reduction'
                  : 'المنظومة الوطنية لحفظ النعمة'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 font-semibold">
              <button onClick={() => handleAccountChange('consumer')} className={`hover:text-[#006948] transition-colors ${currentAccount === 'consumer' ? 'text-[#006948]' : ''}`}>
                {isEn ? 'Rescuer' : 'المنقذ'}
              </button>
              <button onClick={() => handleAccountChange('merchant')} className={`hover:text-[#006948] transition-colors ${currentAccount === 'merchant' ? 'text-[#006948]' : ''}`}>
                {isEn ? 'Partner' : 'الشريك الشامي'}
              </button>
              <button onClick={() => handleAccountChange('driver')} className="text-amber-800 hover:text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-bold">
                <span className="material-symbols-outlined text-[15px]">two_wheeler</span>
                <span>{isEn ? 'Captain' : 'الكابتن'}</span>
              </button>
              <button onClick={() => handleAccountChange('admin')} className={`hover:text-slate-900 transition-colors ${currentAccount === 'admin' ? 'text-slate-900' : 'text-slate-400'}`}>
                {isEn ? 'Governance' : 'الرقابة'}
              </button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-4 text-[10px] text-slate-400 text-center sm:text-right">
            © 2026 Barakah Box Syria. {isEn ? 'Secure Database Integrated.' : 'قاعدة البيانات الموحدة موثقة.'}
          </div>
        </footer>

        <WalletTopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} currentBalance={walletBalance} onTopupSuccess={handleTopupSuccess} lang={lang} />
        <PayoutModal 
          isOpen={isPayoutOpen} 
          onClose={() => setIsPayoutOpen(false)} 
          currentBalance={currentAccount === 'merchant' ? merchantWalletBalance : currentAccount === 'driver' ? driverWalletBalance : walletBalance} 
          role={currentAccount === 'consumer' ? 'rescuer' : currentAccount === 'merchant' ? 'partner' : currentAccount === 'driver' ? 'captain' : 'admin'} 
          onPayoutSuccess={handlePayoutSuccess} 
          lang={lang} 
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
        
        <AnimatePresence>
          {isAuthModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
              <div className="relative w-full max-w-md">
                <AuthPortal onLoginSuccess={handleLoginSuccess} onClose={() => setIsAuthModalOpen(false)} onShowToast={showToast} lang={lang} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
