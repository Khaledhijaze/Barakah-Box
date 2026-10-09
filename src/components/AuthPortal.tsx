import React, { useState } from 'react';
import { Language, AccountType, UserProfile } from '../types';
import { t } from '../data/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileToSupabase, verifyUserCredentials, registerUserInDb } from '../db/supabaseClient';

interface AuthPortalProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onClose: () => void;
  lang?: Language;
  defaultMode?: 'consumer' | 'partner' | 'admin';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLoginSuccess,
  onClose,
  lang = 'ar',
  defaultMode = 'consumer',
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];

  const [authType, setAuthType] = useState<'signin' | 'signup'>('signin');
  const [mode, setMode] = useState<'consumer' | 'partner' | 'admin'>(defaultMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<'produce' | 'grocery' | 'bakeries' | 'restaurants' | 'sweets'>('bakeries');
  const [adminCode, setAdminCode] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [storeDocUrl, setStoreDocUrl] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const [tempPassword, setTempPassword] = useState<string | undefined>(undefined);

  const categories = [
    { id: 'produce', ar: 'خضار وفواكه', en: 'Fruits & Veggies', icon: 'eco' },
    { id: 'grocery', ar: 'بقالة ومواد غذائية', en: 'Grocery', icon: 'shopping_basket' },
    { id: 'bakeries', ar: 'مخابز', en: 'Bakeries', icon: 'bakery_dining' },
    { id: 'restaurants', ar: 'مطاعم', en: 'Restaurants', icon: 'restaurant' },
    { id: 'sweets', ar: 'حلويات', en: 'Sweets', icon: 'icecream' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      if (authType === 'signin') {
        const identifier = mode === 'admin' ? email : (phoneNumber || email);
        const profile = await verifyUserCredentials(identifier, mode === 'consumer' ? undefined : password, mode === 'partner' ? 'merchant' : mode);
        
        if (profile) {
          setTempProfile(profile);
          setShowOtpStep(true);
          // In a real app, this would trigger an SMS/Email
          console.log("OTP Sent: 8822");
        } else {
          alert(isEn ? 'Invalid credentials or role!' : 'بيانات الدخول غير صحيحة أو الدور غير مطابق!');
        }
      } else {
        // Sign Up
        if (mode === 'admin' && adminCode !== '1234' && adminCode !== '9921') {
          alert(isEn ? 'Invalid Admin Security Pin!' : 'رمز الأمان الخاص بالإدارة غير صحيح!');
          setIsVerifying(false);
          return;
        }

        const newProfile: UserProfile = {
          id: `USR-${Math.floor(Math.random() * 90000) + 10000}`,
          name: name || (mode === 'consumer' ? 'المنقذ الشامي' : 'شريك بركة'),
          role: mode === 'partner' ? 'merchant' : mode,
          phoneNumber: phoneNumber,
          email: email,
          storeName: mode === 'partner' ? storeName : undefined,
          storeCategory: mode === 'partner' ? storeCategory : undefined,
          licenseUrl: storeDocUrl || undefined,
          location: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng, address: isEn ? 'Verified via GPS' : 'تم التوثيق عبر GPS' } : undefined
        };

        setTempProfile(newProfile);
        setTempPassword(mode === 'consumer' ? undefined : password);
        setShowOtpStep(true);
        console.log("OTP Sent: 8822");
      }
    } catch (err) {
      console.error(err);
      alert(isEn ? 'Database connection error' : 'فشل الاتصال بقاعدة البيانات');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode !== '8822') {
      alert(isEn ? 'Invalid verification code!' : 'رمز التحقق غير صحيح!');
      return;
    }

    if (!tempProfile) return;

    setIsVerifying(true);
    if (authType === 'signup') {
      const success = await registerUserInDb(tempProfile, tempPassword);
      if (success) {
        onLoginSuccess(tempProfile);
      } else {
        alert(isEn ? 'Registration failed. Try a different phone/email.' : 'فشل التسجيل. يرجى استخدام رقم هاتف أو بريد مختلف.');
        setShowOtpStep(false);
      }
    } else {
      onLoginSuccess(tempProfile);
    }
    setIsVerifying(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-200 no-scrollbar"
    >
      {/* Header Container (Green) */}
      <div className="bg-[#006948] p-8 text-white text-center relative overflow-hidden shrink-0">
        {/* Close Button Inside Header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/10"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-[22px] flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
            <span className="material-symbols-outlined text-[36px] text-[#85f8c4]">
              {mode === 'consumer' ? 'person' : mode === 'partner' ? 'store' : 'admin_panel_settings'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">
            {authType === 'signin' 
              ? (isEn ? 'Welcome Back' : 'مرحباً بك مجدداً')
              : (isEn ? 'Join Barakah Box' : 'انضم لعائلة بركة')}
          </h2>
          <p className="text-sm text-white/70 mt-1.5">
            {isEn ? 'National Food Rescue Network' : 'الشبكة الوطنية لحفظ النعمة'}
          </p>
        </div>
      </div>

      <div className="p-8">
        {showOtpStep ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <span className="material-symbols-outlined text-[32px] text-[#006948] animate-pulse">phonelink_ring</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEn ? 'Verify your identity' : 'تأكيد الهوية'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isEn 
                  ? `We've sent a 4-digit code to ${email || phoneNumber}. For testing, use 8822`
                  : `تم إرسال رمز من 4 أرقام إلى ${email || phoneNumber}. للتجربة استخدم 8822`}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-[1em] text-[#006948] outline-none focus:border-[#006948] transition-all"
                placeholder="••••"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpCode.length < 4}
              className="w-full bg-[#006948] hover:bg-[#00855d] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#006948]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined">verified_user</span>
                  <span>{isEn ? 'Confirm & Secure Account' : 'تأكيد وتأمين الحساب'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowOtpStep(false)}
              className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors text-center uppercase tracking-widest"
            >
              {isEn ? 'Back to details' : 'العودة لتعديل البيانات'}
            </button>
          </div>
        ) : (
          <>
            {/* Auth Type Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
          <button
            onClick={() => setAuthType('signin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authType === 'signin' ? 'bg-white text-[#006948] shadow-sm' : 'text-slate-500'
            }`}
          >
            {isEn ? 'Sign In' : 'تسجيل الدخول'}
          </button>
          <button
            onClick={() => setAuthType('signup')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authType === 'signup' ? 'bg-white text-[#006948] shadow-sm' : 'text-slate-500'
            }`}
          >
            {isEn ? 'Sign Up' : 'إنشاء حساب'}
          </button>
        </div>

        {/* Role Selector (only in Sign Up) */}
        {authType === 'signup' && (
          <div className="flex gap-2 mb-8">
            {(['consumer', 'partner', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setMode(r)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                  mode === r 
                    ? 'bg-[#006948]/5 border-[#006948] text-[#006948]' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {r === 'consumer' ? (isEn ? 'Rescuer' : 'منقذ') : r === 'partner' ? (isEn ? 'Partner' : 'شريك') : (isEn ? 'Admin' : 'إدارة')}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Field: Name (SignUp only) */}
          {authType === 'signup' && (mode === 'consumer' || mode === 'partner') && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">
                {isEn ? 'Full Name / Owner Name' : 'الاسم بالكامل / المفوض'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-[#006948]/5 outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Store Name (Partner only) */}
          {mode === 'partner' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">
                  {isEn ? 'Store / Business Name' : 'اسم المتجر / المنشأة'}
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-[#006948]/5 outline-none transition-all"
                  required
                />
              </div>
              
                {authType === 'signup' && (
                  <>
                    <div>
                       <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                        {isEn ? 'Store Location (GPS)' : 'موقع المتجر (GPS)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if ('geolocation' in navigator) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                              alert(isEn ? 'Location Pinned Successfully!' : 'تم تثبيت موقع المتجر بنجاح!');
                            });
                          }
                        } }
                        className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs ${gpsLocation ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#006948]'}`}
                      >
                        <span className="material-symbols-outlined">{gpsLocation ? 'location_on' : 'add_location_alt'}</span>
                        {gpsLocation ? (isEn ? 'GPS Location Locked' : 'تم قفل الموقع الجغرافي') : (isEn ? 'Pin Store on Map (GPS)' : 'تحديد موقع المتجر على الخريطة')}
                      </button>
                    </div>

                    <div className="mt-4">
                      <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                        {isEn ? 'Store Business Documents / License' : 'وثائق المتجر / السجل التجاري'}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          className="hidden"
                          id="store-doc-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingDoc(true);
                            const { publicUrl, error } = await uploadFileToSupabase(file, 'proofs', `docs/${Date.now()}-${file.name}`);
                            setIsUploadingDoc(false);
                            if (publicUrl) setStoreDocUrl(publicUrl);
                            else if (error) alert(error);
                          }}
                        />
                        <label
                          htmlFor="store-doc-upload"
                          className={`flex-1 py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all font-bold text-xs cursor-pointer ${storeDocUrl ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-[#006948]'}`}
                        >
                          {isUploadingDoc ? (
                            <span className="w-5 h-5 border-2 border-[#006948]/30 border-t-[#006948] rounded-full animate-spin"></span>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">{storeDocUrl ? 'task' : 'upload_file'}</span>
                              <span>{storeDocUrl ? (isEn ? 'Document Uploaded' : 'تم رفع الوثيقة') : (isEn ? 'Upload License (PDF/Image)' : 'رفع صورة السجل التجاري')}</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          {/* Store Category (Partner SignUp only) */}
          {authType === 'signup' && mode === 'partner' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                {isEn ? 'Business Category' : 'نوع النشاط التجاري'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setStoreCategory(cat.id as any)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-2 ${
                      storeCategory === cat.id
                        ? 'bg-[#006948] border-[#006948] text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    {isEn ? cat.en : cat.ar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Identification (Phone or Email) */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">
              {mode === 'admin' ? (isEn ? 'Admin Email' : 'البريد الإلكتروني للإدارة') : mode === 'consumer' ? (isEn ? 'Mobile Phone Number' : 'رقم الهاتف المحمول') : (isEn ? 'Phone / Email' : 'رقم الهاتف أو البريد')}
            </label>
            <input
              type={mode === 'admin' ? 'email' : 'text'}
              inputMode={mode === 'consumer' ? 'numeric' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-[#006948]/5 outline-none transition-all"
              placeholder={mode === 'admin' ? 'admin@barakah.sy' : mode === 'consumer' ? '09xx xxx xxx' : '09xx xxx xxx'}
              required
            />
          </div>

          {/* Password - Hidden for Rescuers as per request */}
          {mode !== 'consumer' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">
                {isEn ? 'Secure Password' : 'كلمة المرور'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-[#006948]/5 outline-none transition-all"
                required
              />
            </div>
          )}

          {/* Admin Code */}
          {mode === 'admin' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase tracking-wider">
                {isEn ? 'Admin Security Pin' : 'رمز الأمان الخاص بالإدارة'}
              </label>
              <input
                type="password"
                maxLength={4}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-black tracking-widest text-[#006948] outline-none"
                placeholder="••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-[#006948] hover:bg-[#00855d] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#006948]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {isVerifying ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined">{authType === 'signin' ? 'lock_open' : 'how_to_reg'}</span>
                <span>
                  {authType === 'signin' 
                    ? (isEn ? 'Authorized Login' : 'دخول آمن للمنظومة')
                    : (isEn ? 'Register Account' : 'إتمام عملية التسجيل')}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Subtle Mode Switcher (for non-signup) */}
        {authType === 'signin' && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => setMode(mode === 'consumer' ? 'partner' : 'consumer')}
              className="text-[10px] font-bold text-slate-400 hover:text-[#006948] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              {mode === 'consumer' ? (isEn ? 'Partner Login' : 'دخول الشركاء والمتاجر') : (isEn ? 'Rescuer Login' : 'العودة لدخول المنقذين')}
            </button>
            {mode !== 'admin' && (
              <button
                onClick={() => setMode('admin')}
                className="text-[10px] font-bold text-slate-300 hover:text-slate-500 text-center"
              >
                {isEn ? 'Platform Governance' : 'بوابة الإدارة والرقابة'}
              </button>
            )}
          </div>
        )}
      </>
    )}
  </div>
</motion.div>
  );
};
