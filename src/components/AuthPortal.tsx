import React, { useState } from 'react';
import { Language, AccountType } from '../types';
import { t } from '../data/translations';
import { motion, AnimatePresence } from 'motion/react';

interface AuthPortalProps {
  onLoginSuccess: (role: AccountType) => void;
  lang?: Language;
  defaultMode?: 'consumer' | 'partner' | 'admin';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLoginSuccess,
  lang = 'ar',
  defaultMode = 'consumer',
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];

  const [mode, setMode] = useState<'consumer' | 'partner' | 'admin'>(defaultMode);
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');
  const [phoneNumber, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<'produce' | 'grocery' | 'bakeries' | 'restaurants' | 'sweets'>('bakeries');
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'admin_code'>(mode === 'consumer' ? 'input' : 'input');

  const categories = [
    { id: 'produce', ar: 'خضار وفواكه', en: 'Fruits & Veggies', icon: 'eco' },
    { id: 'grocery', ar: 'بقالة ومواد غذائية', en: 'Grocery', icon: 'shopping_basket' },
    { id: 'bakeries', ar: 'مخابز', en: 'Bakeries', icon: 'bakery_dining' },
    { id: 'restaurants', ar: 'مطاعم', en: 'Restaurants', icon: 'restaurant' },
    { id: 'sweets', ar: 'حلويات', en: 'Sweets', icon: 'icecream' },
  ];

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      onLoginSuccess('consumer');
      setIsVerifying(false);
    }, 1200);
  };

  const handlePartnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'admin' && step !== 'admin_code') {
      setStep('admin_code');
      return;
    }
    
    setIsVerifying(true);
    setTimeout(() => {
      onLoginSuccess(mode === 'partner' ? 'merchant' : 'admin');
      setIsVerifying(false);
    }, 1200);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === '9921') { // Mock secure code
      setIsVerifying(true);
      setTimeout(() => {
        onLoginSuccess('admin');
        setIsVerifying(false);
      }, 1200);
    } else {
      alert(isEn ? 'Invalid Admin Code!' : 'رمز الأمان غير صحيح!');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-[#006948] p-8 text-white text-center relative">
          <div className="w-20 h-20 bg-white/20 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="material-symbols-outlined text-[40px] text-[#85f8c4]">
              {mode === 'consumer' ? 'person' : mode === 'partner' ? 'store' : 'admin_panel_settings'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">
            {mode === 'consumer'
              ? (isEn ? 'Rescuer Login' : 'تسجيل دخول المنقذ')
              : mode === 'partner'
              ? (authAction === 'register' ? (isEn ? 'Partner Registration' : 'تسجيل شريك جديد') : (isEn ? 'Partner Portal' : 'بوابة الشريك الشامي'))
              : (isEn ? 'Admin Control' : 'لوحة الإدارة المركزية')}
          </h2>
          <p className="text-sm text-white/70 mt-2">
            {mode === 'consumer'
              ? (isEn ? 'Enter your Syrian phone to continue' : 'أدخل رقم هاتفك السوري للمتابعة')
              : (isEn ? 'Secure access for authorized members only' : 'وصول آمن للمصرح لهم فقط')}
          </p>
        </div>

        <div className="p-8">
          {mode === 'consumer' ? (
            <AnimatePresence mode="wait">
              {step === 'input' ? (
                <motion.form
                  key="phone-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handlePhoneLogin}
                  className="space-y-5"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                      {isEn ? 'Syrian Phone Number' : 'رقم الموبايل السوري'}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="09xx xxx xxx"
                        value={phoneNumber}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-lg font-bold text-slate-900 focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] outline-none transition-all"
                        required
                      />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 material-symbols-outlined">
                        phone_iphone
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#006948] hover:bg-[#00855d] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#006948]/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>{isEn ? 'Send Verification Code' : 'إرسال رمز التحقق'}</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                      {isEn ? 'arrow_forward' : 'arrow_back'}
                    </span>
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-500">
                      {isEn ? 'Code sent to:' : 'تم إرسال الرمز إلى:'} <span className="font-bold text-slate-900">{phoneNumber}</span>
                    </p>
                    <button onClick={() => setStep('input')} className="text-[#006948] text-xs font-bold underline mt-1 cursor-pointer">
                      {isEn ? 'Change Number' : 'تغيير الرقم'}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block text-center uppercase tracking-wider">
                      {isEn ? 'Enter 4-Digit Code' : 'أدخل الرمز المكون من 4 أرقام'}
                    </label>
                    <div className="flex justify-center gap-3" dir="ltr">
                      {[1, 2, 3, 4].map((i) => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          className="w-14 h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-2xl font-black text-[#006948] focus:border-[#006948] focus:ring-4 focus:ring-[#006948]/10 outline-none transition-all shadow-inner"
                          required
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-[#006948] hover:bg-[#00855d] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#006948]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">verified_user</span>
                        <span>{isEn ? 'Confirm & Enter' : 'تأكيد ودخول'}</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          ) : step === 'admin_code' ? (
            <form onSubmit={handleAdminVerify} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  {isEn ? 'Admin Security Code' : 'رمز الأمان الخاص بالإدارة'}
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center text-xl font-black tracking-widest text-[#006948] focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] outline-none transition-all"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-[#006948] hover:bg-[#00855d] text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">security</span>
                    <span>{isEn ? 'Verify & Enter Operations Room' : 'تحقق ودخول غرفة العمليات'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePartnerLogin} className="space-y-5">
              {authAction === 'register' && mode === 'partner' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                      {isEn ? 'Store Name' : 'اسم المنشأة / المحل'}
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] outline-none transition-all"
                      placeholder={isEn ? 'e.g. Damascus Bakery' : 'مثال: مخبز دمشق الدولي'}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                      {isEn ? 'Business Category' : 'نوع النشاط التجاري'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setStoreCategory(cat.id as any)}
                          className={`px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                            storeCategory === cat.id
                              ? 'bg-[#006948] border-[#006948] text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                          {isEn ? cat.en : cat.ar}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  {isEn ? 'Email Address' : 'البريد الإلكتروني'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] outline-none transition-all"
                  placeholder="admin@barakah.sy"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">
                  {isEn ? 'Secure Password' : 'كلمة المرور'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-[#006948]/10 focus:border-[#006948] outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{authAction === 'register' ? 'how_to_reg' : 'lock_open'}</span>
                    <span>{authAction === 'register' ? (isEn ? 'Register Store' : 'تسجيل المنشأة') : (isEn ? 'Authorized Login' : 'دخول آمن')}</span>
                  </>
                )}
              </button>
              {mode === 'partner' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthAction(authAction === 'login' ? 'register' : 'login')}
                    className="text-xs font-bold text-[#006948] underline cursor-pointer"
                  >
                    {authAction === 'login' ? (isEn ? 'Need to register your store?' : 'ترغب بتسجيل متجرك معنا؟') : (isEn ? 'Already have an account? Login' : 'لديك حساب بالفعل؟ سجل دخولك')}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Mode Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
            {mode === 'consumer' ? (
              <button
                onClick={() => { setMode('partner'); setStep('input'); }}
                className="text-xs font-bold text-slate-500 hover:text-[#006948] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">store</span>
                {isEn ? 'Switch to Partner Portal' : 'الدخول كشريك شامي (تاجر)'}
              </button>
            ) : (
              <button
                onClick={() => { setMode('consumer'); setStep('input'); }}
                className="text-xs font-bold text-slate-500 hover:text-[#006948] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                {isEn ? 'Switch to Rescuer Login' : 'العودة لتسجيل دخول المنقذ'}
              </button>
            )}
            
            {mode !== 'admin' && (
              <button
                onClick={() => { setMode('admin'); setStep('input'); }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {isEn ? 'Admin Access' : 'بوابة الإدارة المركزية'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
