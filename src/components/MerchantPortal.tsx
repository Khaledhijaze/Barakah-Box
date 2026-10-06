import React, { useState } from 'react';
import { OrderItem, MerchantComplaint, Language } from '../types';
import { t } from '../data/translations';

interface MerchantPortalProps {
  orders: OrderItem[];
  merchantWalletBalance: number;
  onUpdateMerchantWallet: (delta: number) => void;
  onOpenPayout: () => void;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  lang?: Language;
  userProfile?: UserProfile | null;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  orders,
  merchantWalletBalance,
  onUpdateMerchantWallet,
  onOpenPayout,
  onShowToast,
  lang = 'ar',
  userProfile,
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'dispatch' | 'verification' | 'orders' | 'complaints'>('overview');
  const [selectedBranch, setSelectedBranch] = useState<'damascus' | 'aleppo' | 'homs'>('damascus');
  
  // NEW: Store Operational State
  const [isStorePaused, setIsStorePaused] = useState(false);
  const [dailyBoxLimit, setDailyBoxLimit] = useState(25);
  const [isScanning, setIsScanning] = useState(false);

  // Dispatch Form
  const [category, setCategory] = useState<string>('مخبوزات ومعجنات');
  const [origPrice, setOrigPrice] = useState<number>(50000);
  const [barakahPrice, setBarakahPrice] = useState<number>(16000);
  const [qty, setQty] = useState<number>(6);
  const [timeStart, setTimeStart] = useState<string>('8:30 م');
  const [timeEnd, setTimeEnd] = useState<string>('10:00 م');
  const [desc, setDesc] = useState<string>(
    'سلة مفاجآت غير محددة الأصناف تحتوي على تشكيلة مخبوزات ومعجنات فرنسية وكرواسان تم إعدادها اليوم بحالة ممتازة وطازجة بالكامل.'
  );
  const [publishedAlert, setPublishedAlert] = useState(false);

  // Verification state
  const [targetOrderId, setTargetOrderId] = useState<string>('9045');
  const [otpDigits, setOtpDigits] = useState<string[]>(['8', '4', '1', '9']);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  // Order Issue Modal Target
  const [orderIssueTarget, setOrderIssueTarget] = useState<OrderItem | null>(null);
  const [selectedOrderIssueReason, setSelectedOrderIssueReason] = useState<
    'تخلف الزبون عن الاستلام' | 'تأخر كابتن التوصيل' | 'نفاد المخزون الطازج'
  >('تخلف الزبون عن الاستلام');

  // Merchant Complaints State
  const [merchantComplaints, setMerchantComplaints] = useState<MerchantComplaint[]>([
    {
      id: 'CMP-4012',
      createdAt: 'اليوم، 10:15 ص',
      merchantName: 'مخبز وشمسين للشامي الأصيل',
      branch: 'فرع دمشق (المزة)',
      orderNumber: '#BB-9045',
      customerName: 'رامي السعيد',
      complaintType: 'تأخر كابتن التوصيل',
      priority: 'عاجل',
      description: 'السلة تم تجهيزها منذ أكثر من 25 دقيقة والكابتن لم يصل بعد لاستلامها.',
      status: 'تم التدخل الميداني',
      adminNotes: 'تم التواصل مع الكابتن أحمد وتحديد موقعه بدوار المواساة، وصل واستلم السلة وتم حفظ حق المتجر.',
    },
    {
      id: 'CMP-3990',
      createdAt: 'أمس، 09:30 م',
      merchantName: 'مخبز وشمسين للشامي الأصيل',
      branch: 'فرع دمشق (المزة)',
      orderNumber: '#BB-8812',
      customerName: 'سامر الكردي',
      complaintType: 'تخلف الزبون عن الاستلام',
      priority: 'عاجل',
      description: 'انتهت نافذة الاستلام المحددة والزبون لم يحضر لاستلام سلة الخبز الطازج.',
      status: 'تمت التسوية والتعويض',
      isNoShowClaim: true,
      payoutReleased: true,
      payoutAmount: 13600,
      adminNotes: 'تم صرف 100% من حصة المتجر (13,600 ل.س) لمحفظته فورياً وتوجيه السلة لبنك حفظ النعمة.',
    },
  ]);

  // New Complaint Form State
  const [complaintType, setComplaintType] = useState<MerchantComplaint['complaintType']>('تخلف الزبون عن الاستلام');
  const [complaintPriority, setComplaintPriority] = useState<MerchantComplaint['priority']>('عاجل');
  const [complaintOrderNum, setComplaintOrderNum] = useState<string>('');
  const [complaintDesc, setComplaintDesc] = useState<string>('');

  const discountPercent =
    origPrice > 0 && barakahPrice > 0 ? Math.round(((origPrice - barakahPrice) / origPrice) * 100) : 0;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishedAlert(true);
    onShowToast(`تم نشر ${qty} سلال بنجاح في سوق سوريا! بدأت إشعارات الزبائن القريبين فوراً.`, 'rocket_launch', 'success');
    setTimeout(() => setPublishedAlert(false), 5000);
  };

  const handleCompleteVerification = () => {
    const net = 13600;
    onUpdateMerchantWallet(net);
    setVerificationSuccess(
      `تم توثيق استلام الطلب #BB-${targetOrderId} بنجاح! تم اقتطاع عمولة بركة وإيداع الصافي ${net.toLocaleString('ar-SY')} ل.س فوراً بمحفظة المتجر.`
    );
    onShowToast(`تم تأكيد التسليم وإيداع ${net.toLocaleString('ar-SY')} ل.س صافي بحساب المتجر!`, 'check_circle', 'success');
  };

  // 1-Click Customer No-Show Payout Claim
  const handleClaimCustomerNoShow = (order: OrderItem) => {
    const payout = order.merchantNet || 13600;
    onUpdateMerchantWallet(payout);

    const newCmp: MerchantComplaint = {
      id: `CMP-NOSHOW-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'الآن (معتمد آلياً)',
      merchantName: 'مخبز وشمسين للشامي الأصيل',
      branch: selectedBranch === 'damascus' ? 'فرع دمشق (المزة)' : selectedBranch === 'aleppo' ? 'فرع حلب (الشهباء)' : 'فرع حمص (الدبلان)',
      orderNumber: `#BB-${order.id}`,
      customerName: order.customerName,
      complaintType: 'تخلف الزبون عن الاستلام',
      priority: 'عاجل',
      description: `تخلف الزبون ${order.customerName} عن الحضور حتى انتهاء موعد الاستلام. تم تفعيل بروتوكول حماية التاجر وصرف كامل مستحقاته.`,
      status: 'تمت التسوية والتعويض',
      isNoShowClaim: true,
      payoutReleased: true,
      payoutAmount: payout,
      adminNotes: `تم صرف كامل حصة التاجر (${payout.toLocaleString('ar-SY')} ل.س) فورياً، وتم توجيه سلة الفائض تلقائياً إلى بنك حفظ النعمة السوري.`,
    };

    setMerchantComplaints((prev) => [newCmp, ...prev]);
    setOrderIssueTarget(null);
    onShowToast(`تم اعتماد مطالبة تخلف الزبون وصرف المستحقات (${payout.toLocaleString('ar-SY')} ل.س) لمحفظتك فوراً!`, 'verified', 'success');
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc.trim()) {
      onShowToast('يرجى كتابة تفاصيل الشكوى بدقة', 'warning', 'error');
      return;
    }

    const branchName =
      selectedBranch === 'damascus'
        ? 'فرع دمشق (المزة)'
        : selectedBranch === 'aleppo'
        ? 'فرع حلب (الشهباء)'
        : 'فرع حمص (الدبلان)';

    const newCmp: MerchantComplaint = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'الآن',
      merchantName: 'مخبز وشمسين للشامي الأصيل',
      branch: branchName,
      orderNumber: complaintOrderNum.trim() || undefined,
      complaintType,
      priority: complaintPriority,
      description: complaintDesc,
      status: 'قيد المراجعة الإدارية',
    };

    setMerchantComplaints((prev) => [newCmp, ...prev]);
    setComplaintOrderNum('');
    setComplaintDesc('');
    onShowToast(`تم رفع الشكوى #${newCmp.id} للإدارة المركزية بنجاح!`, 'report_problem', 'success');
  };

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="w-full flex flex-col gap-6">
      {/* Merchant Profile Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#006948] text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
            <span className="material-symbols-outlined text-[32px]">store</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] text-xs font-bold">
                {tr.merchantAccount}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{tr.partnerPortalView}</span>
            </div>
            <h1 className="text-xl font-bold text-[#131b2e] mt-0.5">{userProfile?.storeName || 'مخبز وشمسين للشامي الأصيل'}</h1>
            <p className="text-xs text-slate-500">
              {isEn ? 'Business License: ' : 'ترخيص تجاري رقم: '} {userProfile?.licenseNumber || 'SY-DAM-9921'} • {userProfile?.location?.address || (isEn ? 'Damascus / Mazzeh' : 'فرع دمشق / المزة')}
            </p>
          </div>
        </div>

        {/* Financial Balance & Store Info */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#f5fff7] border border-[#85f8c4] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">account_balance_wallet</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">رصيد المتجر المتاح للسحب:</span>
              <span className="text-sm font-bold text-[#006948] font-mono">
                {merchantWalletBalance.toLocaleString('ar-SY')} ل.س
              </span>
            </div>
            <div className="flex items-center gap-1.5 mr-2">
              <button
                onClick={() => onUpdateMerchantWallet(50000)}
                title={isEn ? 'Demo Topup (+50k)' : 'شحن تجريبي (+50 ألف)'}
                className="w-7 h-7 rounded-lg bg-[#006948] text-[#85f8c4] flex items-center justify-center hover:bg-[#005137] transition-colors cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">bug_report</span>
              </button>
              <button
                onClick={onOpenPayout}
                className="px-2.5 py-1 bg-white border border-[#85f8c4] text-[#006948] hover:bg-[#f5fff7] rounded-xl text-[11px] font-bold shadow-sm cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">security</span>
                <span>{tr.withdrawAction}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'overview' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          <span>لوحة القيادة والمؤشرات اليومية</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dispatch')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dispatch' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">add_box</span>
          <span>إضافة وتعبئة سلال الفائض</span>
        </button>

        <button
          onClick={() => setActiveSubTab('verification')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'verification' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
          <span>محطة التحقق وتسليم السلة بالفرع</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'orders' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>جدول طلبات اليوم المباشرة</span>
        </button>

        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'complaints' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">report_problem</span>
          <span>مركز الشكاوى وتواصل الشركاء</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Operational Controls Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isStorePaused ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <span className="material-symbols-outlined">{isStorePaused ? 'pause_circle' : 'play_circle'}</span>
                   </div>
                   <div>
                      <span className="text-xs font-bold text-slate-800 block">{isEn ? 'Store Status' : 'حالة المتجر'}</span>
                      <span className="text-[10px] text-slate-500">{isStorePaused ? (isEn ? 'Temporarily Paused' : 'متوقف مؤقتاً') : (isEn ? 'Open & Active' : 'مفتوح ونشط')}</span>
                   </div>
                </div>
                <button 
                  onClick={() => setIsStorePaused(!isStorePaused)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${isStorePaused ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-red-600 text-white shadow-lg shadow-red-200'}`}
                >
                   {isStorePaused ? (isEn ? 'Resume Store' : 'تفعيل المتجر') : (isEn ? 'Pause Store' : 'إيقاف مؤقت')}
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">inventory</span>
                   </div>
                   <div>
                      <span className="text-xs font-bold text-slate-800 block">{isEn ? 'Daily Box Limit' : 'الحد اليومي للصناديق'}</span>
                      <span className="text-[10px] text-slate-500">{dailyBoxLimit} {tr.boxesCount}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => setDailyBoxLimit(Math.max(1, dailyBoxLimit - 1))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                   </button>
                   <span className="text-sm font-black text-indigo-600 w-8 text-center">{dailyBoxLimit}</span>
                   <button onClick={() => setDailyBoxLimit(dailyBoxLimit + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                   </button>
                </div>
             </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">سلال تم بيعها اليوم</span>
              <span className="text-2xl font-bold text-[#131b2e] mt-1 block">19 سلة</span>
              <span className="text-xs text-[#006948] font-bold mt-1 block">+32% عن الأمس</span>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">إجمالي إيراد اليوم</span>
              <span className="text-2xl font-bold text-[#855300] font-mono mt-1 block">299,000 ل.س</span>
              <span className="text-xs text-amber-700 font-bold mt-1 block">جاهز للتسوية الأسبوعية</span>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">طلبات بانتظار الاستلام</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">3 طلبات نشطة</span>
              <span className="text-xs text-[#006948] font-bold mt-1 block">نافذة الاستلام جارية الآن</span>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block">هدر تم تفاديه بالفرع</span>
              <span className="text-2xl font-bold text-[#006948] mt-1 block">38 كغ خبز ومعجنات</span>
              <span className="text-xs text-slate-500 font-medium mt-1 block">تقليل 78 كغ CO2</span>
            </div>
          </section>

          {/* Dedicated Account Manager Mini Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                س.ع
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">أ. سامي عثمان</span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>متصل الآن</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">مدير حسابك الشخصي المعتمد لرعاية وتنسيق عمليات الفرع</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <a
                href="tel:0944112233"
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-700">call</span>
                <span>اتصال مباشر</span>
              </a>

              <a
                href="https://wa.me/963944112233?text=مرحباً أستاذ سامي، أنا من مخبز وشمسين للشامي الأصيل ولدي استفسار عاجل"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>واتساب الحساب</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DISPATCH */}
      {activeSubTab === 'dispatch' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#131b2e]">إضافة وتعبئة سلال الفائض اليومي في سوريا</h2>
              <p className="text-xs text-slate-500">
                اطرح فائض الإنتاج الطازج بخصم تشجيعي لجذب الزبائن وتفادي أي تلف
              </p>
            </div>
          </div>

          {publishedAlert && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>تم نشر السلال بنجاح في سوق سوريا وتحديث خريطة التطبيق!</span>
            </div>
          )}

          <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">نوع السلة / التصنيف:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="bakeries">{isEn ? 'Bakeries' : 'مخابز ومعجنات'}</option>
                <option value="sweets">{isEn ? 'Sweets' : 'حلويات شرقية وشامية'}</option>
                <option value="restaurants">{isEn ? 'Restaurants' : 'وجبات مطبوخة ومشاوي'}</option>
                <option value="grocery">{isEn ? 'Grocery' : 'بقالة وألبان وأجبان'}</option>
                <option value="produce">{isEn ? 'Fruits & Veggies' : 'خضار وفواكه طازجة'}</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">الكمية المتاحة (عدد السلال):</label>
              <input
                type="text"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value.replace(/\D/g, '')))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">السعر الأصلي المعتاد (ل.س):</label>
              <input
                type="text"
                inputMode="numeric"
                value={origPrice}
                onChange={(e) => setOrigPrice(Number(e.target.value.replace(/\D/g, '')))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                سعر بركة المخفض للزبون (ل.س) - <span className="text-[#006948]">خصم {discountPercent}%</span>:
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={barakahPrice}
                onChange={(e) => setBarakahPrice(Number(e.target.value.replace(/\D/g, '')))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#006948] font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">بداية نافذة الاستلام:</label>
              <input
                type="text"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">نهاية نافذة الاستلام:</label>
              <input
                type="text"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">وصف السلة والمحتويات المتوقعة:</label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">publish</span>
                <span>نشر السلال في سوق سوريا فوراً</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: VERIFICATION */}
      {activeSubTab === 'verification' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">محطة التحقق وتسليم السلة بالفرع</h2>
            <p className="text-xs text-slate-500">
              أدخل رمز PIN المقدم من الزبون أو الكابتن لإتمام تسليم السلة وإيداع أرباحك فوراً
            </p>
          </div>

          <div className="max-w-md mx-auto w-full bg-[#f2f3ff] p-6 rounded-3xl border border-slate-200 flex flex-col gap-4 text-xs">
            {/* QR Scanner Simulation */}
            <div className="relative aspect-square w-full bg-slate-900 rounded-[32px] overflow-hidden flex items-center justify-center group mb-4">
               {isScanning ? (
                  <>
                    <div className="absolute inset-0 bg-slate-800 animate-pulse"></div>
                    <div className="absolute inset-x-8 top-1/2 h-0.5 bg-[#85f8c4] shadow-[0_0_15px_#85f8c4] animate-scan"></div>
                    <span className="text-white text-[10px] font-bold z-10">{isEn ? 'Searching for QR Code...' : 'جاري البحث عن الرمز...'}</span>
                  </>
               ) : (
                  <div className="text-center p-8">
                    <span className="material-symbols-outlined text-[60px] text-slate-700 group-hover:scale-110 transition-transform">qr_code_scanner</span>
                    <p className="text-slate-500 mt-2 font-bold">{isEn ? 'Scanner Ready' : 'الماسح الضوئي جاهز'}</p>
                  </div>
               )}
               <button 
                onClick={() => {
                  setIsScanning(true);
                  setTimeout(() => {
                    setIsScanning(false);
                    onShowToast(isEn ? 'QR Code Scanned Successfully!' : 'تم مسح الرمز بنجاح!', 'qr_code_2', 'success');
                  }, 2500);
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-white text-slate-900 rounded-full font-bold text-[10px] shadow-xl hover:bg-slate-50 transition-all cursor-pointer"
               >
                 {isScanning ? (isEn ? 'Cancel' : 'إلغاء') : (isEn ? 'Start QR Scan' : 'بدء المسح الضوئي')}
               </button>
            </div>

            <div className="relative flex items-center justify-center gap-4 text-slate-400 my-2">
               <div className="flex-1 h-px bg-slate-200"></div>
               <span className="text-[10px] font-bold uppercase tracking-widest">{isEn ? 'OR ENTER PIN' : 'أو أدخل الرمز يدوياً'}</span>
               <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">اختر رقم الطلب المراد تسليمه:</label>
              <select
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold font-mono text-slate-800"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #BB-{o.id} • {o.customerName} ({o.price.toLocaleString('ar-SY')} ل.س)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center gap-2 my-2">
              <span className="text-[11px] font-bold text-slate-600">أدخل رمز الأمان (PIN) المكون من 4 أرقام:</span>
              <div className="flex gap-2" dir="ltr">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const copy = [...otpDigits];
                      copy[i] = e.target.value;
                      setOtpDigits(copy);
                    }}
                    className="w-12 h-12 rounded-xl bg-white text-center font-bold text-lg text-slate-900 border border-slate-300 shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
               <label className="font-bold text-slate-700 block mb-1">{isEn ? 'Handover Proof (Photo Requirement):' : 'إثبات التسليم (مطلوب صورة):'}</label>
               <button 
                type="button"
                className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-[#006948] hover:bg-emerald-50/30 transition-all group"
               >
                 <span className="material-symbols-outlined text-[32px] text-slate-400 group-hover:text-[#006948]">add_a_photo</span>
                 <span className="text-slate-500 group-hover:text-[#006948] font-bold">{isEn ? 'Capture or Upload Delivery Proof' : 'التقاط أو رفع صورة إثبات التسليم'}</span>
               </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteVerification}
              className="w-full py-4 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>تأكيد التسليم وصرف المستحقات لمحفظة المتجر</span>
            </button>

            {verificationSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {verificationSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ORDERS WITH ORDER-SPECIFIC ISSUE LOGGING */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#131b2e]">سجل طلبات اليوم المباشرة بالفرع</h2>
              <p className="text-xs text-slate-500">يمكنك تسليم السلة أو الإبلاغ عن تخلف الزبون لصرف مستحقاتك فوراً</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                  <th className="py-2.5 px-3 rounded-r-xl">رقم الطلب</th>
                  <th className="py-2.5 px-3">الزبون</th>
                  <th className="py-2.5 px-3">نوع السلة</th>
                  <th className="py-2.5 px-3">طريقة السداد</th>
                  <th className="py-2.5 px-3">القيمة والصافي</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 rounded-l-xl text-center">إجراءات المتجر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold font-mono text-[#006948]">#BB-{o.id}</td>
                    <td className="py-3 px-3 font-bold">{o.customerName}</td>
                    <td className="py-3 px-3">{o.boxTitle}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#006948]">{o.price.toLocaleString('ar-SY')} ل.س</span>
                      <span className="block text-[10px] text-slate-400">صافي: {o.merchantNet.toLocaleString('ar-SY')} ل.س</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'in_transit'
                            ? 'bg-amber-100 text-amber-800'
                            : o.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {o.status === 'delivered'
                          ? 'مكتمل ومسوى ✓'
                          : o.status === 'in_transit'
                          ? 'جاري التوصيل'
                          : o.status === 'cancelled'
                          ? 'ملغي / No-Show'
                          : 'بانتظار الاستلام'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveSubTab('verification');
                            setTargetOrderId(o.id);
                          }}
                          className="px-2.5 py-1 bg-[#006948] hover:bg-[#00855d] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          إثبات وتسليم
                        </button>

                        {/* Report Issue with Order Button */}
                        <button
                          onClick={() => setOrderIssueTarget(o)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          إبلاغ عن مشكلة
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DEDICATED MERCHANT COMPLAINTS & CONTACT */}
      {activeSubTab === 'complaints' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-l from-[#684000] via-[#855300] to-[#513000] text-white rounded-3xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <span className="material-symbols-outlined text-[28px] text-[#ffddb8]">report_problem</span>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] text-[10px] font-bold">
                  خدمة شركاء بركة والمخابز السورية
                </span>
                <h2 className="text-xl font-bold mt-1">مركز الشكاوى، النزاعات الميدانية، وتواصل التاجر</h2>
                <p className="text-xs text-white/80 mt-0.5">
                  حماية حقوقك المالية، معالجة تأخر الكباتن، تخلف الزبائن عن الاستلام، والتنسيق الإداري المباشر
                </p>
              </div>
            </div>

            {/* Direct Contact Emergency Channels */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/20 flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px] text-amber-300">support</span>
                <span>مدير حسابك: أ. سامي عثمان</span>
              </div>

              <a
                href="tel:0119048"
                className="bg-white text-slate-900 font-bold py-2 px-3 rounded-xl shadow-sm flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#855300]">phone</span>
                <span>خط طوارئ المتاجر: 011-9048 (تحويلة 2)</span>
              </a>

              <a
                href="https://wa.me/963933000948"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>واتساب إدارة العمليات</span>
              </a>
            </div>
          </div>

          {/* Grid Layout: Left = Submit Complaint Form, Right = History of Complaints */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-[#855300] text-[22px]">add_alert</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">رفع شكوى أو بلاغ إداري جديد</h3>
                  <p className="text-[11px] text-slate-500">يصل البلاغ فوراً لغرفة عمليات دمشق والمحافظات</p>
                </div>
              </div>

              <form onSubmit={handleCreateComplaint} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الشكوى أو البلاغ:</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#855300] focus:bg-white"
                  >
                    <option value="تخلف الزبون عن الاستلام">تخلف الزبون عن الاستلام (Customer No-Show)</option>
                    <option value="تأخر كابتن التوصيل">تأخر أو عدم حضور كابتن التوصيل</option>
                    <option value="مشكلة في المقاصة أو الحساب البنكي">مشكلة في المقاصة أو الحساب البنكي</option>
                    <option value="طلب تصريف فائض طارئ ضخم">طلب تصريف فائض طارئ ضخم (كميات كبيرة)</option>
                    <option value="نفاد المخزون الطازج">نفاد المخزون الطازج مبكراً</option>
                    <option value="عطل فني في نظام التوثيق">عطل فني في نظام التوثيق أو قراءة الرمز</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">مستوى الأولوية:</label>
                    <select
                      value={complaintPriority}
                      onChange={(e) => setComplaintPriority(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="عاجل">عاجل (طعام طازج يتطلب تدخلاً سريعاً)</option>
                      <option value="متوسط">متوسط (خلال ساعتين)</option>
                      <option value="عادي">عادي (استفسار روتيني)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">رقم الطلب المتأثر:</label>
                    <input
                      type="text"
                      value={complaintOrderNum}
                      onChange={(e) => setComplaintOrderNum(e.target.value)}
                      placeholder="مثال: #BB-9048"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#855300] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">شرح المشكلة وتفاصيل البلاغ:</label>
                  <textarea
                    rows={4}
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="وضح ما حدث مع الزبون أو الكابتن أو مشكلة الحساب المصرفي..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#855300] focus:bg-white"
                    required
                  ></textarea>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">shield</span>
                  <span>
                    حقوق المتجر المالية محفوظة: في حال تخلف الزبون، تتكفل المنصة بتعويضك بنسبة 100% من حصتك المتفق عليها.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#855300] hover:bg-[#684000] text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>إرسال البلاغ للإدارة المركزية</span>
                </button>
              </form>
            </div>

            {/* Complaints List & Admin Responses (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#855300] text-[20px]">assignment</span>
                    <h3 className="font-bold text-sm text-slate-900">سجل الشكاوى وقرارات الإدارة ({merchantComplaints.length})</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">محدث لحظياً</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                  {merchantComplaints.map((cmp) => (
                    <div
                      key={cmp.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2.5 text-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-sm">{cmp.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {cmp.complaintType}
                          </span>
                          {cmp.orderNumber && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200">
                              طلب: {cmp.orderNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">{cmp.createdAt}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cmp.status === 'تمت التسوية والتعويض'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cmp.status === 'تم التدخل الميداني'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cmp.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-semibold mb-0.5">تفاصيل شكوى المتجر ({cmp.branch}):</span>
                        <p className="text-slate-800 font-medium leading-relaxed">{cmp.description}</p>
                      </div>

                      {cmp.adminNotes && (
                        <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-emerald-900">
                          <span className="font-bold text-[11px] block flex items-center gap-1 text-[#006948] mb-0.5">
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>قرار وإجراء إدارة المنصة المركزية:</span>
                          </span>
                          <p className="leading-relaxed font-semibold text-[11px]">{cmp.adminNotes}</p>
                          {cmp.payoutReleased && cmp.payoutAmount && (
                            <div className="mt-1 font-mono font-bold text-xs text-[#006948]">
                              + تم إيداع {cmp.payoutAmount.toLocaleString('ar-SY')} ل.س في محفظتك بنجاح
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Merchant Guidance Card */}
              <div className="bg-[#f2f3ff] rounded-3xl p-5 border border-slate-200 text-xs flex flex-col gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#006948] text-[18px]">verified_user</span>
                  <span>ميثاق حماية حقوق الشركاء والمتاجر في بركة:</span>
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  نحن نضمن لجميع شركائنا في سوريا تسوية سريعة، وعدم تحمل أي خسارة مالية ناتجة عن تخلف الزبائن، مع التزامنا بتوفير كباتن توصيل مؤهلين وأجهزة توثيق رقمية سريعة. لأي استفسار عاجل تواصل مباشرة مع مسؤول منطقتك.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Issue Logging Modal for Merchant */}
      {orderIssueTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[22px]">report_problem</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">إبلاغ عن مشكلة في الطلب #BB-{orderIssueTarget.id}</h3>
                  <span className="text-[11px] text-slate-500">{orderIssueTarget.customerName} • {orderIssueTarget.boxTitle}</span>
                </div>
              </div>
              <button
                onClick={() => setOrderIssueTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">حدد نوع المشكلة:</label>
                <div className="flex flex-col gap-2">
                  <label
                    onClick={() => setSelectedOrderIssueReason('تخلف الزبون عن الاستلام')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      selectedOrderIssueReason === 'تخلف الزبون عن الاستلام'
                        ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">تخلف الزبون عن الاستلام (No-Show)</span>
                      <span className="text-[10px] text-slate-500">انتهت النافذة ولم يحضر الزبون</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      صرف فوري 100%
                    </span>
                  </label>

                  <label
                    onClick={() => setSelectedOrderIssueReason('تأخر كابتن التوصيل')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      selectedOrderIssueReason === 'تأخر كابتن التوصيل'
                        ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">تأخر كابتن التوصيل</span>
                      <span className="text-[10px] text-slate-500">السلة جاهزة والكابتن لم يصل بعد</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-amber-700">two_wheeler</span>
                  </label>

                  <label
                    onClick={() => setSelectedOrderIssueReason('نفاد المخزون الطازج')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      selectedOrderIssueReason === 'نفاد المخزون الطازج'
                        ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">نفاد المخزون الطازج بالفرع</span>
                      <span className="text-[10px] text-slate-500">تم بيع الكمية للزبائن الحاضرين بالخطأ</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-red-600">inventory_2</span>
                  </label>
                </div>
              </div>

              {selectedOrderIssueReason === 'تخلف الزبون عن الاستلام' ? (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                  <strong className="block mb-0.5">ضمان حقوق التاجر:</strong>
                  بموجب سياسة بركة، يتم صرف <strong>{orderIssueTarget.merchantNet.toLocaleString('ar-SY')} ل.س</strong> (صافي
                  حقوقك) فوراً إلى محفظة المتجر، ونقوم بتحويل السلة لبنك حفظ النعمة دون أي خصم عليك.
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  سيتم توجيه البلاغ مباشرة لمدير العمليات للتدخل وحل المشكلة.
                </div>
              )}
            </div>

            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setOrderIssueTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold"
              >
                إلغاء
              </button>

              {selectedOrderIssueReason === 'تخلف الزبون عن الاستلام' ? (
                <button
                  type="button"
                  onClick={() => handleClaimCustomerNoShow(orderIssueTarget)}
                  className="flex-1 py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>اعتماد تخلف الزبون وصرف المستحقات فوراً</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onShowToast(`تم رفع بلاغ (${selectedOrderIssueReason}) للطلب #BB-${orderIssueTarget.id}`, 'send', 'info');
                    setOrderIssueTarget(null);
                  }}
                  className="flex-1 py-2.5 bg-[#855300] hover:bg-[#684000] text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>إرسال البلاغ لمدير العمليات</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
