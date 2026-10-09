import React, { useState, useRef } from 'react';
import { Language, OrderItem, UserProfile } from '../types';
import { t } from '../data/translations';
import { uploadFileToSupabase, updateOrderStatus } from '../db/supabaseClient';

interface DriverPortalProps {
  driverWalletBalance: number;
  onUpdateDriverWallet: (delta: number) => void;
  onUpdateMerchantWallet: (delta: number) => void;
  onOpenPayout: () => void;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  lang?: Language;
  orders?: OrderItem[];
  onExitToConsumer?: () => void;
  userProfile?: UserProfile | null;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  driverWalletBalance,
  onUpdateDriverWallet,
  onUpdateMerchantWallet,
  onOpenPayout,
  onShowToast,
  lang = 'ar',
  onExitToConsumer,
  orders = [],
  userProfile,
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];

  // Captain Registration & Shift Status
  const [captainShift, setCaptainShift] = useState<'available' | 'on_trip' | 'offline'>('available');
  const [activeTab, setActiveTab] = useState<'active_mission' | 'earnings' | 'profile'>('active_mission');

  // Active Task State
  const [taskStatus, setTaskStatus] = useState<'picked_up' | 'arrived_dest' | 'delivered'>('picked_up');
  const [customerPinInput, setCustomerPinInput] = useState<string>('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);

  // Active mission details derived from orders
  const activeOrder = orders.find(o => o.status === 'in_transit' || o.status === 'pending');

  const activeMission = activeOrder ? {
    orderId: `#BB-${activeOrder.id}`,
    customerName: activeOrder.customerName,
    customerPhone: activeOrder.customerPhone,
    customerAddress: activeOrder.deliveryAddress,
    storeName: activeOrder.storeName,
    storeAddress: activeOrder.cityArea,
    itemDescription: activeOrder.boxTitle,
    requiredPin: '1234', // In real system, this would be in the order data
    deliveryFee: activeOrder.driverFee || 8500,
    speedBonus: 1000,
    distanceKm: 2.4,
    estimatedMinutes: 8,
  } : null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;

    setIsUploadingPhoto(true);
    const fileName = `proofs/driver-${activeOrder.id}-${Date.now()}.jpg`;
    const { publicUrl, error } = await uploadFileToSupabase(file, 'proofs', fileName);
    setIsUploadingPhoto(false);

    if (error) {
      onShowToast(isEn ? 'Upload failed: ' + error : 'فشل الرفع: ' + error, 'error', 'error');
      return;
    }

    if (publicUrl) {
      setProofPhotoUrl(publicUrl);
      onShowToast(isEn ? 'Handover photo proof uploaded successfully!' : 'تم إرفاق صورة إثبات التسليم بنجاح!', 'add_a_photo', 'success');
    }
  };

  const handleCompleteHandover = async () => {
    if (!activeMission) return;

    if (!proofPhotoUrl) {
      onShowToast(
        isEn
          ? 'Mandatory: Please capture and upload delivery photo proof first!'
          : 'إلزامي: يرجى التقاط ورفع صورة إثبات التسليم أولاً لإتمام العملية!',
        'warning',
        'error'
      );
      return;
    }

    if (customerPinInput.trim() !== activeMission.requiredPin) {
      onShowToast(
        isEn ? 'Invalid customer security PIN code' : 'رمز PIN للعميل غير متطابق، تأكد من الرمز المستلم',
        'lock',
        'error'
      );
      return;
    }

    setIsCompleting(true);
    if (activeOrder) {
      await updateOrderStatus(activeOrder.id, 'delivered', proofPhotoUrl);
    }
    
    setTimeout(() => {
      setIsCompleting(false);
      setTaskStatus('delivered');
      setCaptainShift('available');
      const totalEarned = (activeMission?.deliveryFee || 0) + (activeMission?.speedBonus || 0);
      onUpdateDriverWallet(totalEarned);

      // Simulate merchant payout (Net Box Revenue after commission)
      onUpdateMerchantWallet(11900);

      setShowCelebrationModal(true);
      onShowToast(
        isEn
          ? `Mission accomplished! +${totalEarned.toLocaleString('en-US')} SYP credited to Captain Wallet! Platform commission deducted & merchant revenue transferred.`
          : `تم إنجاز المهمة وإيداع +${totalEarned.toLocaleString('ar-SY')} ل.س في محفظة الكابتن! تم خصم عمولة المنصة وتحويل صافي الإيراد للمتجر.`,
        'verified',
        'success'
      );
    }, 400);
  };

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="w-full flex flex-col gap-6 animate-in fade-in">
      {/* Top Workspace Header with Exit to Consumer Portal */}
      <div className="bg-[#1f2637] text-white rounded-2xl p-3.5 px-5 flex items-center justify-between shadow-sm border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#85f8c4] text-[20px]">two_wheeler</span>
          <span className="text-xs font-bold">
            {isEn ? 'Independent Captain Delivery Workspace • Damascus' : 'مساحة عمل الكابتن والسائق الميداني المستقل • دمشق'}
          </span>
        </div>
        {onExitToConsumer && (
          <button
            onClick={onExitToConsumer}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">
              {isEn ? 'arrow_back' : 'arrow_forward'}
            </span>
            <span>{isEn ? 'Exit to Rescuer Portal' : 'العودة لبوابة المنقذ'}</span>
          </button>
        )}
      </div>

      {/* 1. CAPTAIN ONBOARDING & PROFILE HERO BAR */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1KeYYedGj5dqHfThOg-E8DmwwD3jm7IEdhAlH06ZOp8YEEwdSgs2swcJlzWuhkubnL8ahMNhYpRSKzPosEEyVDvSChMsBg4DN1i0e8KReNjrJCyVPK-HmE6CxisgHxxrNryzj6WN7BQFT0Hb8Z6a8ScSB1m0qEjkQJGtktjqp7IuZbUrZ_2-vfqmrWGrvP5q8Kt6PN3L5T_sI383iRxF3cwjUW3Gj2FXAq6OaczxlN6iGVmhLnnnu"
              alt="Captain Samer"
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-[#006948]/20"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold ${
                captainShift === 'available'
                  ? 'bg-emerald-500'
                  : captainShift === 'on_trip'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            >
              ✓
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[#131b2e]">
                {isEn ? 'Captain Samer Al-Halabi' : 'الكابتن سامر الحلبي'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">electric_moped</span>
                <span>{isEn ? 'Eco Electric Moped' : 'سكوتر كهربائي صديق للبيئة'}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">eco</span>
                <span>{isEn ? 'Green Hero • 380 kg CO2 Saved' : 'بطل الكربون الأخضر • 380 كغ CO2 محيّد'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                ⭐ 4.98 (320 {isEn ? 'trips' : 'رحلة'})
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {isEn ? 'Syrian Driver ID:' : 'رقم رخصة القيادة السورية:'}{' '}
              <span className="font-mono font-bold text-slate-700">SY-DL-884920</span> •{' '}
              {isEn ? 'Zone: Damascus - Mazzeh & Shaalan' : 'النطاق الميداني: دمشق - المزة والشعلان'}
            </p>

            {/* Shift Status Selector */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-bold text-slate-500">{isEn ? 'Current Shift:' : 'حالة المناوبة:'}</span>
              <button
                onClick={() => {
                  setCaptainShift('available');
                  onShowToast(tr.driverStatusAvailable, 'check_circle', 'success');
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  captainShift === 'available'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'Available' : 'متاح'}
              </button>
              <button
                onClick={() => {
                  setCaptainShift('on_trip');
                  onShowToast(tr.driverStatusOnTrip, 'two_wheeler', 'info');
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  captainShift === 'on_trip'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'On Delivery' : 'في مسار نشط'}
              </button>
              <button
                onClick={() => {
                  setCaptainShift('offline');
                  onShowToast(tr.driverStatusOffline, 'do_not_disturb', 'info');
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  captainShift === 'offline'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'Break / Offline' : 'استراحة'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Driver Wallet Balances */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#f5fff7] border border-[#85f8c4] px-5 py-3 rounded-2xl flex items-center gap-3 text-xs">
            <div className="w-10 h-10 rounded-xl bg-[#006948] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">
                {isEn ? 'Captain Wallet Earnings:' : 'محفظة أتعاب الكابتن:'}
              </span>
              <span className="text-lg font-bold text-[#006948] font-mono">
                {driverWalletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex flex-col justify-center text-xs">
            <span className="text-[10px] text-slate-400 font-bold">{isEn ? "Today's Deliveries:" : 'رحلات اليوم:'}</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              8 {isEn ? 'Deliveries (100% on-time)' : 'تسليمات (100% بالوقت)'}
            </span>
          </div>
        </div>
      </section>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('active_mission')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'active_mission' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">navigation</span>
          <span>{isEn ? 'Active Delivery Task & Map' : 'مهمة التوصيل والخريطة الحية'}</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'earnings' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">payments</span>
          <span>{isEn ? 'Earnings & Payout Ledger' : 'سجل الأتعاب والتحويلات'}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">badge</span>
          <span>{isEn ? 'Captain Documents & Vehicle' : 'وثائق الكابتن والمركبة'}</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE MISSION WITH INTERACTIVE ROUTE MAP & MANDATORY PHOTO PROOF HANDOVER */}
      {activeTab === 'active_mission' && (
        activeMission ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 Cols): Mission Details & GPS HUD */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Live Navigation HUD */}
              <div className="bg-[#283044] text-white rounded-3xl p-5 shadow-lg border border-slate-700 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-bold text-xs text-[#85f8c4]">{isEn ? 'GPS Route Active' : 'الملاحة الحية الميدانية نشطة'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">{isEn ? 'Distance:' : 'المسافة:'}</span>
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                      {activeMission.distanceKm} {tr.kmUnit}
                    </span>
                    <span className="text-slate-400">{isEn ? 'ETA:' : 'الوقت التقديري:'}</span>
                    <span className="font-mono font-bold text-emerald-300 bg-slate-800 px-2 py-0.5 rounded">
                      {activeMission.estimatedMinutes} {isEn ? 'min' : 'دقائق'}
                    </span>
                  </div>
                </div>

                {/* Maneuver Instruction */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00855d] text-white flex items-center justify-center shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-[36px]">turn_sharp_right</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-mono text-[#85f8c4] block">180 م</span>
                    <p className="text-sm font-bold text-white">
                      {isEn
                        ? 'Turn right towards Mazzeh Autostrade / Al-Akram Mosque destination'
                        : 'انعطف يميناً باتجاه أوتوستراد المزة جانب جامع الأكرم للوصول للعميل'}
                    </p>
                  </div>
                </div>

                {/* Waypoints */}
                <div className="bg-[#1f2637] p-3.5 rounded-2xl flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-slate-400">{tr.pickupVenueLabel}</span>
                    <span className="font-bold text-white">{activeMission.storeName} ({activeMission.storeAddress})</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-400">{tr.customerDestLabel}</span>
                    <span className="font-bold text-white">{activeMission.customerName} - {activeMission.customerAddress}</span>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE MAP ROUTE NAVIGATION */}
              <div className="bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <span className="material-symbols-outlined text-[#85f8c4] text-[18px]">map</span>
                    <span>{isEn ? 'Damascus Field GPS Route Navigation' : 'خريطة التتبع الميداني الحي في دمشق'}</span>
                  </span>
                  <span className="bg-slate-800 text-[#85f8c4] px-2 py-0.5 rounded text-[11px] font-mono">
                    33.5012° N, 36.2550° E
                  </span>
                </div>

                {/* Visual Map SVG with Road Line and Waypoints */}
                <div className="relative w-full h-44 bg-[#1a2332] rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fea619" />
                        <stop offset="50%" stopColor="#85f8c4" />
                        <stop offset="100%" stopColor="#006948" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="40" x2="100%" y2="40" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="100%" y2="90" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="100%" y2="140" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="60%" y1="0" x2="60%" y2="100%" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="85%" y1="0" x2="85%" y2="100%" stroke="#253248" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Street Labels */}
                    <text x="30" y="25" fill="#64748b" fontSize="9" fontWeight="bold">أوتوستراد المزة الرئيسي</text>
                    <text x="240" y="75" fill="#64748b" fontSize="9" fontWeight="bold">شارع عبد المنعم رياض</text>
                    <text x="180" y="155" fill="#64748b" fontSize="9" fontWeight="bold">محور جامع الأكرم - الفيلات</text>

                    {/* Route Polyline */}
                    <path
                      d="M 60 40 L 140 40 L 220 90 L 320 90 L 380 135"
                      fill="none"
                      stroke="url(#routeGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Waypoint 1: Store */}
                  <div className="absolute top-[28px] left-[45px] flex items-center gap-1.5 bg-[#fea619] text-[#281700] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                    <span className="material-symbols-outlined text-[13px]">storefront</span>
                    <span>{isEn ? 'Bakery' : 'المخبز'}</span>
                  </div>

                  {/* Animated Captain Marker */}
                  <div className="absolute top-[75px] left-[205px] flex flex-col items-center animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-[#006948] text-white flex items-center justify-center shadow-lg border-2 border-[#85f8c4]">
                      <span className="material-symbols-outlined text-[17px]">two_wheeler</span>
                    </div>
                    <span className="bg-black/70 text-[#85f8c4] text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap">
                      {isEn ? 'Captain Here (180m left)' : 'الكابتن (متبقي 180م)'}
                    </span>
                  </div>

                  {/* Waypoint 2: Customer Doorstep */}
                  <div className="absolute top-[120px] right-[40px] flex items-center gap-1.5 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">
                    <span className="material-symbols-outlined text-[13px]">home</span>
                    <span>{isEn ? 'Customer' : 'العميل'}</span>
                  </div>
                </div>
              </div>

              {/* Mission Order Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{activeMission.orderId}</span>
                    <span className="text-slate-500 block">{activeMission.itemDescription}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                      {isEn ? 'Prepaid Electronically' : 'مسدد إلكترونياً مسبقاً'}
                    </span>
                    <span className="font-mono text-sm font-bold text-[#006948]">
                      +{(activeMission.deliveryFee + activeMission.speedBonus).toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                    </span>
                  </div>
                </div>

                {/* Step progression */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">store</span>
                    <span className="font-bold block mt-1">{isEn ? '1. Box Picked Up' : '1. تم استلام السلة'}</span>
                    <span className="text-[10px] text-emerald-700">✓ {isEn ? 'Confirmed' : 'مؤكد'}</span>
                  </div>
                  <div className="p-3 bg-[#f5fff7] rounded-xl border border-[#85f8c4]">
                    <span className="material-symbols-outlined text-[#006948] text-[20px]">two_wheeler</span>
                    <span className="font-bold block mt-1">{isEn ? '2. In Transit' : '2. في المسار'}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">{isEn ? 'Arrived at door' : 'وصلت للباب'}</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${taskStatus === 'delivered' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">check_circle</span>
                    <span className="font-bold block mt-1">{isEn ? '3. Photo Handover' : '3. التسليم بالصورة'}</span>
                    <span className="text-[10px] text-slate-500">{taskStatus === 'delivered' ? '✓' : isEn ? 'Pending Photo' : 'بانتظار الصورة'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 Cols): Mandatory Handover Verification & Photo Upload */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-[#006948] text-[22px]">verified_user</span>
                  <div>
                    <h3 className="font-bold text-slate-900">{isEn ? 'Handover Verification' : 'اعتماد التسليم وتوثيق الإثبات'}</h3>
                    <p className="text-[11px] text-slate-500">{isEn ? 'Mandatory photo proof requirement' : 'رفع الصورة إلزامي لصرف الأتعاب'}</p>
                  </div>
                </div>

                {/* Customer PIN Code */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isEn ? 'Customer Verification PIN (4 Digits):' : 'رمز التحقق من العميل (PIN):'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={customerPinInput}
                    onChange={(e) => setCustomerPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center font-mono text-xl tracking-widest bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-[#006948] focus:outline-none focus:border-[#006948]"
                  />
                </div>

                {/* MANDATORY PHOTO UPLOAD */}
                <div>
                  <label className="font-bold text-slate-800 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                      <span>{tr.uploadPhotoProofMandatory} *</span>
                    </span>
                    {proofPhotoUrl && (
                      <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ {isEn ? 'Photo Attached' : 'تم الإرفاق'}
                      </span>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">{tr.uploadPhotoHelp}</p>

                  {proofPhotoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-sm group">
                      <img src={proofPhotoUrl} alt="Delivery proof" className="w-full h-44 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100"
                        >
                          {isEn ? 'Retake Photo' : 'إعادة التقاط'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/40 hover:bg-red-50 text-red-700 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <span className="material-symbols-outlined text-[28px] animate-spin">refresh</span>
                          <span className="font-bold text-xs">{isEn ? 'Processing camera image...' : 'جاري معالجة صورة الكاميرا...'}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[26px]">add_a_photo</span>
                          </div>
                          <span className="font-bold text-xs">{isEn ? 'Tap to Capture Delivery Photo' : 'اضغط لالتقاط وتوثيق صورة التسليم'}</span>
                          <span className="text-[10px] text-slate-500">{isEn ? '(Required before handover)' : '(مطلوب بشكل إلزامي)'}</span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleCapturePhoto}
                  />
                </div>

                {/* Payout Summary */}
                <div className="bg-[#f2f3ff] p-3.5 rounded-2xl border border-slate-200 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{tr.driverDeliveryFeeEarned}</span>
                    <span className="font-mono font-bold text-slate-800">{activeMission.deliveryFee.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isEn ? 'Speed On-Time Bonus:' : 'حافز السرعة بالوقت:'}</span>
                    <span className="font-mono font-bold text-emerald-700">+{activeMission.speedBonus.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-slate-900">{isEn ? 'Total Payout into Wallet:' : 'إجمالي ما يُودع بمحفظتك:'}</span>
                    <span className="font-mono text-[#006948]">
                      +{(activeMission.deliveryFee + activeMission.speedBonus).toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                    </span>
                  </div>
                </div>

                {/* COMPLETE HANDOVER ACTION BUTTON */}
                <button
                  onClick={handleCompleteHandover}
                  disabled={isCompleting || !proofPhotoUrl || taskStatus === 'delivered'}
                  className="w-full py-3 bg-[#006948] hover:bg-[#00855d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCompleting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      <span>{isEn ? 'Releasing payouts...' : 'جاري إتمام المقاصة وصرف الأتعاب...'}</span>
                    </>
                  ) : taskStatus === 'delivered' ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>{isEn ? 'Delivery Completed Successfully' : 'تم التسليم بنجاح وإيداع المستحقات'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                      <span>{tr.completeHandoverBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[40px] text-slate-300">moped</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {isEn ? 'No active missions assigned' : 'لا يوجد مهام توصيل نشطة حالياً'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
              {isEn 
                ? 'Check back later or ensure your status is set to Available to receive new delivery tasks.' 
                : 'انتظر قليلاً أو تأكد من ضبط حالتك إلى "متاح" لتلقي مهام توصيل جديدة في محيطك.'}
            </p>
          </div>
        )
      )}

      {/* TAB 2: EARNINGS & PAYOUT LEDGER */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{isEn ? 'Captain Earnings & Delivery Fees' : 'سجل مستحقات الكابتن ومحفظة التسويات'}</h2>
              <p className="text-slate-500">{isEn ? 'Direct automated payout after every photo-verified handover' : 'صرف آلي فوري للأتعاب فور رفع صورة الإثبات والمطابقة'}</p>
            </div>
            <button
              onClick={onOpenPayout}
              className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">security</span>
              <span>{isEn ? 'Instant Payout' : 'سحب الأرباح الفوري'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">{isEn ? 'Task #' : 'رقم المهمة'}</th>
                  <th className="p-3">{isEn ? 'Store Venue' : 'المتجر'}</th>
                  <th className="p-3">{isEn ? 'Customer Zone' : 'منطقة العميل'}</th>
                  <th className="p-3">{isEn ? 'Base Fee' : 'أجر التوصيل'}</th>
                  <th className="p-3">{isEn ? 'Bonus' : 'حافز السرعة'}</th>
                  <th className="p-3">{isEn ? 'Status' : 'حالة التسوية'}</th>
                  <th className="p-3">{isEn ? 'Photo Proof' : 'صورة الإثبات'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#006948]">#BB-9048</td>
                  <td className="p-3">مخبز وشمسين للشامي الأصيل</td>
                  <td className="p-3">المزة - جامع الأكرم</td>
                  <td className="p-3 font-mono">8,500 {tr.currency}</td>
                  <td className="p-3 font-mono text-emerald-600">+1,000 {tr.currency}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">مُودع في المحفظة ✓</span></td>
                  <td className="p-3 text-[#006948] font-bold">موثق بالصورة ✓</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-[#006948]">#BB-9035</td>
                  <td className="p-3">حلويات دمشق القديمة</td>
                  <td className="p-3">باب توما - القشلة</td>
                  <td className="p-3 font-mono">8,000 {tr.currency}</td>
                  <td className="p-3 font-mono text-emerald-600">+1,000 {tr.currency}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">مُودع في المحفظة ✓</span></td>
                  <td className="p-3 text-[#006948] font-bold">موثق بالصورة ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE & ONBOARDING */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-5 text-xs">
          <h2 className="text-base font-bold text-slate-900">{isEn ? 'Driver Official Profile & Onboarding' : 'ملف تسجيل الكابتن والبيانات الرسمية'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <span className="font-bold text-slate-900">{isEn ? 'Captain Identification' : 'الهوية الوطنية ورخصة القيادة'}</span>
              <p className="text-slate-500">{isEn ? 'Syrian National ID:' : 'الرقم الوطني السوري:'} <span className="font-mono font-bold text-slate-800">01040082194</span></p>
              <p className="text-slate-500">{isEn ? 'Syrian Driver License:' : 'رخصة القيادة السورية:'} <span className="font-mono font-bold text-slate-800">SY-DL-884920 (Category B)</span></p>
              <p className="text-slate-500">{isEn ? 'Phone Number:' : 'رقم الهاتف المسجل:'} <span className="font-mono font-bold text-slate-800">0933-881920</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <span className="font-bold text-slate-900">{isEn ? 'Vehicle & Eco Mobility' : 'المركبة ومواصفات السلامة'}</span>
              <p className="text-slate-500">{isEn ? 'Vehicle Type:' : 'نوع المركبة:'} <span className="font-bold text-[#006948]">سكوتر كهربائي صديق للبيئة</span></p>
              <p className="text-slate-500">{isEn ? 'Plate Number:' : 'رقم اللوحة:'} <span className="font-mono font-bold text-slate-800">دمشق - 418290</span></p>
              <p className="text-slate-500">{isEn ? 'Thermal Food Insulation Box:' : 'صندوق حفظ الأطعمة الحراري:'} <span className="font-bold text-emerald-700">معتمد ومطابق للشروط الصحية ✓</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Handover Modal */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-[#85f8c4] text-[#002114] flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#131b2e]">
                {isEn ? 'Delivery Handover Confirmed!' : 'تم تأكيد التسليم وصرف الأتعاب بنجاح!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isEn ? 'Photo verified, merchant payout released, and fee credited to your wallet.' : 'تم اعتماد صورة الإثبات، تحرير مستحقات المتجر، وإيداع الأتعاب في محفظتك.'}
              </p>
            </div>

            <div className="bg-[#f5fff7] border border-[#85f8c4] p-4 rounded-2xl w-full text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">{isEn ? 'Delivery Fee Earned:' : 'أتعاب التوصيل:'}</span>
                <span className="font-bold font-mono text-[#006948]">+8,500 {tr.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{isEn ? 'Speed Bonus:' : 'مكافأة السرعة:'}</span>
                <span className="font-bold font-mono text-emerald-600">+1,000 {tr.currency}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 pt-1 font-bold text-slate-900">
                <span>{isEn ? 'New Captain Wallet Balance:' : 'رصيد المحفظة الجديد:'}</span>
                <span className="font-mono text-[#006948]">{driverWalletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCelebrationModal(false)}
              className="w-full py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              {isEn ? 'Continue Next Delivery' : 'متابعة المهام التالية'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
