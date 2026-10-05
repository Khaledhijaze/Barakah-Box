import React, { useState } from 'react';
import { OrderItem } from '../types';
import { INITIAL_ORDERS, LOGO_URL } from '../data/mockData';

interface MerchantDashboardProps {
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (screen: any) => void;
  merchantWalletBalance: number;
  driverWalletBalance: number;
  onUpdateMerchantWallet: (delta: number) => void;
  onUpdateDriverWallet: (delta: number) => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  onShowToast,
  onNavigate,
  merchantWalletBalance,
  driverWalletBalance,
  onUpdateMerchantWallet,
  onUpdateDriverWallet,
}) => {
  const [activeTab, setActiveTab] = useState<'merchant' | 'driver'>('merchant');

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('9045');

  // Dispatch Form State
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

  // Proof of delivery state
  const [proofImage, setProofImage] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(['8', '4', '1', '9']);
  const [proofSuccess, setProofSuccess] = useState<string | null>(null);

  // Driver task state
  const [driverProofImage, setDriverProofImage] = useState<string>('');
  const [driverTaskCompleted, setDriverTaskCompleted] = useState<boolean>(false);

  // Modals state
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [cancelOrderModalItem, setCancelOrderModalItem] = useState<OrderItem | null>(null);

  // Metrics
  const discountPercent =
    origPrice > 0 && barakahPrice > 0 ? Math.round(((origPrice - barakahPrice) / origPrice) * 100) : 0;

  // Handle Box Publish
  const handlePublishBox = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishedAlert(true);
    onShowToast(`تم نشر ${qty} سلال بنجاح في السوق! تم إرسال إشعارات للزبائن في المزة.`, 'rocket_launch', 'success');
    setTimeout(() => setPublishedAlert(false), 5000);
  };

  // Upload merchant proof & payout
  const handleCompleteProof = (imgUrl?: string) => {
    const finalImg =
      imgUrl ||
      proofImage ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ';

    const order = orders.find((o) => o.id === selectedOrderId);
    const netAmount = order ? order.merchantNet : 13600;

    onUpdateMerchantWallet(netAmount);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderId
          ? {
              ...o,
              status: 'delivered',
              proofImage: finalImg,
              verifiedAt: 'تم التوثيق بالصورة اللحظية',
            }
          : o
      )
    );

    setProofSuccess(
      `تم توثيق إثبات تسليم الطلب #BB-${selectedOrderId} بنجاح! تم اقتطاع عمولة بركة (15%) وإيداع الصافي ${netAmount.toLocaleString(
        'ar-SY'
      )} ل.س فوراً في محفظة المتجر.`
    );
    onShowToast(`تم إيداع صافي السلة (${netAmount.toLocaleString('ar-SY')} ل.س) في محفظتك!`, 'check_circle', 'success');
  };

  // Driver task complete
  const handleDriverComplete = () => {
    const finalPhoto =
      driverProofImage ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ';

    onUpdateDriverWallet(3500);
    onUpdateMerchantWallet(11900);
    setDriverTaskCompleted(true);

    setOrders((prev) =>
      prev.map((o) =>
        o.id === '9048'
          ? {
              ...o,
              status: 'delivered',
              proofImage: finalPhoto,
              verifiedAt: 'مسلم بالكابتن وموثق بالصورة',
            }
          : o
      )
    );

    onShowToast('تم توثيق التسليم وإيداع أجر الكابتن (+3,500 ل.س) وصافي المتجر (+11,900 ل.س) فوراً!', 'verified', 'success');
  };

  // Confirm Cancellation
  const handleConfirmCancel = () => {
    if (!cancelOrderModalItem) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelOrderModalItem.id
          ? {
              ...o,
              status: 'cancelled',
            }
          : o
      )
    );
    onShowToast(`تم إلغاء الطلب #BB-${cancelOrderModalItem.id}. تم تطبيق غرامة إلغاء 5,000 ل.س.`, 'warning', 'error');
    setCancelOrderModalItem(null);
  };

  return (
    <div className="w-full flex">
      {/* Sidebar for Merchant & Driver */}
      <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200/80 shrink-0 flex-col justify-between min-h-[calc(100vh-140px)] p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Profile Card */}
          <div className="bg-[#f2f3ff] p-3.5 rounded-2xl flex items-center gap-3 border border-slate-200/60">
            <div className="w-10 h-10 rounded-xl bg-[#006948] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">
                {activeTab === 'merchant' ? 'store' : 'sports_motorsports'}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-[#131b2e]">
                {activeTab === 'merchant' ? 'مخبز وشمسين للشامي' : 'الكابتن خالد المصري'}
              </div>
              <div className="text-[11px] text-slate-500">
                {activeTab === 'merchant' ? 'فرع المزة فيلات غربية' : 'كابتن نشط • دمشق المزة'}
              </div>
            </div>
          </div>

          {/* Role Navigation Buttons */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('merchant')}
              className={`w-full text-right flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'merchant'
                  ? 'bg-[#00855d] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span className="flex-1">لوحة تحكم المتجر (Merchant)</span>
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              className={`w-full text-right flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'driver'
                  ? 'bg-[#00855d] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
              <span className="flex-1">مهام كابتن التوصيل (Driver)</span>
              <span className="w-2 h-2 rounded-full bg-[#fea619] animate-pulse"></span>
            </button>

            <div className="pt-3 pb-1 border-t border-slate-100 mt-2">
              <span className="text-[11px] font-bold text-slate-400">إدارة العمليات الميدانية</span>
            </div>

            <button
              onClick={() => onNavigate('live-navigation')}
              className="w-full text-right flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006948]">explore</span>
              <span>الملاحة الحية الميدانية (GPS)</span>
            </button>

            <button
              onClick={() => onNavigate('impact-report')}
              className="w-full text-right flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006948]">eco</span>
              <span>تقرير الأثر وحفظ النعمة</span>
            </button>

            <button
              onClick={() => onNavigate('platform-admin')}
              className="w-full text-right flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-600">admin_panel_settings</span>
              <span>إدارة المنصة والنزاعات</span>
            </button>
          </nav>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-slate-700 font-bold">
            <span className="material-symbols-outlined text-[16px] text-[#006948]">support_agent</span>
            <span>دعم الشركاء السريع:</span>
          </div>
          <span dir="ltr" className="font-mono text-left text-slate-600">
            +963-11-9876
          </span>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Top Header Banner & Fast Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#855300] text-xs font-bold">
                {activeTab === 'merchant' ? 'لوحة تحكم المتجر' : 'لوحة مهام الكابتن'}
              </span>
              <span className="text-xs text-slate-400">دمشق - المزة</span>
            </div>
            <h1 className="text-xl font-bold text-[#131b2e] mt-1">
              {activeTab === 'merchant' ? 'إدارة وتعبئة سلال الفائض والتحقق' : 'مهام واستلام وتوصيل سلال البركة'}
            </h1>
          </div>

          {/* Quick Tab Switch Pills */}
          <div className="flex items-center gap-3">
            <div className="bg-[#eaedff] p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setActiveTab('merchant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'merchant' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المتجر
              </button>
              <button
                onClick={() => setActiveTab('driver')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'driver' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>الكابتن</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[#f5fff7] border border-[#85f8c4] px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#006948]">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>
                {activeTab === 'merchant' ? 'رصيد المتجر: ' : 'محفظة الكابتن: '}
                {(activeTab === 'merchant' ? merchantWalletBalance : driverWalletBalance).toLocaleString('ar-SY')} ل.س
              </span>
            </div>
          </div>
        </div>

        {/* DRIVER DELIVERY VIEW */}
        {activeTab === 'driver' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Active Delivery Task Card & Route Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Task Details (7 cols) */}
              <section className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse"></span>
                        مهمة توصيل جارية الآن
                      </span>
                      <span className="text-base font-bold text-[#131b2e]">طلب #BB-9048</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">سلة مخبوزات فاخرة — مخبز وشمسين للشامي الأصيل</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block">أجر التوصيل للكابتن</span>
                    <span className="text-lg font-bold text-[#006948]">+3,500 ل.س</span>
                  </div>
                </div>

                {/* Pickup details */}
                <div className="bg-[#f2f3ff] rounded-xl p-3.5 flex flex-col gap-1 border-r-4 border-[#006948]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#006948] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">store</span>
                      نقطة الاستلام (المتجر)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      تم تجهيز السلة
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-800">مخبز وشمسين للشامي الأصيل</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                    دمشق - المزة / الشعلان (المسافة: 2.4 كم)
                  </div>
                </div>

                {/* Drop-off details */}
                <div className="bg-[#f2f3ff] rounded-xl p-3.5 flex flex-col gap-1 border-r-4 border-amber-500">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
                      نقطة التسليم (الزبون)
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      بانتظار وصول الكابتن
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-800">رامي السعيد</div>
                    <a
                      href="tel:+963944123456"
                      className="px-2.5 py-1 rounded-full bg-[#00855d] text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      <span>اتصال: +963-944-123456</span>
                    </a>
                  </div>
                  <div className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5">home</span>
                    <span>دمشق - المزة فيلات غربية، جانب جامع الكوثر، بناء الياسمين، طابق 2</span>
                  </div>
                </div>

                {/* 3-Way Settlement Breakdown */}
                <div className="bg-slate-50 rounded-xl p-3.5 flex flex-col gap-1 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700">البيانات المالية للتسوية الفورية:</span>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] text-slate-400">أجر التوصيل للكابتن</span>
                      <span className="text-sm font-bold text-[#006948]">3,500 ل.س</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] text-slate-400">قيمة السلة الإجمالية</span>
                      <span className="text-sm font-bold text-slate-800">14,000 ل.س</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="block text-[10px] text-slate-400">صافي المتجر بعد العمولة</span>
                      <span className="text-sm font-bold text-amber-700">11,900 ل.س</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavigate('live-navigation')}
                    className="flex-1 py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">explore</span>
                    <span>فتح شاشة الملاحة الحية (Turn-by-Turn GPS)</span>
                  </button>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>خرائط Google</span>
                  </a>
                </div>
              </section>

              {/* Mandatory Driver Photo Handover (5 cols) */}
              <section className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00855d] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#131b2e]">رفع صورة إثبات التسليم (Mandatory)</h2>
                      <p className="text-[11px] text-slate-500">التقاط صورة واضحة للسلة مع الزبون أو أمام الباب</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#fea619] text-[#684000] text-[10px] font-bold">
                    إلزامي للمصادقة
                  </span>
                </div>

                {/* Photo Dropzone */}
                <div
                  onClick={() => {
                    const sample =
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ';
                    setDriverProofImage(sample);
                  }}
                  className="relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#006948] bg-[#f2f3ff] p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[170px]"
                >
                  {driverProofImage ? (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-inner border border-slate-200">
                      <img src={driverProofImage} alt="إثبات التسليم" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDriverProofImage('');
                        }}
                        className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                        <span>تم التقاط صورة التسليم بنجاح</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full bg-white text-[#006948] flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">photo_camera</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">اضغط هنا لإدراج صورة إثبات التسليم الميداني</div>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        إثبات فوري يمنع الشكاوى ويضمن إيداع عمولة التوصيل 3,500 ل.س في حسابك في نفس اللحظة
                      </p>
                    </div>
                  )}
                </div>

                {/* Driver Completion Button */}
                <button
                  onClick={handleDriverComplete}
                  disabled={driverTaskCompleted}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    driverTaskCompleted
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-[#006948] hover:bg-[#00855d] text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  <span>
                    {driverTaskCompleted
                      ? 'تم تأكيد المهمة وإيداع الأجر'
                      : 'تأكيد التسليم ورفع صورة الإثبات (Complete & Payout)'}
                  </span>
                </button>

                {driverTaskCompleted && (
                  <div className="p-4 rounded-xl bg-[#f5fff7] border border-[#85f8c4] flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-[#006948] font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        تم توثيق التسليم وتسوية المبالغ فوراً!
                      </span>
                      <span className="bg-[#85f8c4] text-[#002114] px-2 py-0.5 rounded-full text-[10px]">مكتمل 100%</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 space-y-1">
                      <div className="flex justify-between">
                        <span>أجر الكابتن المودع بمحفظتك:</span>
                        <strong className="text-[#006948] font-bold">+3,500 ل.س</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>صافي المتجر المودع لمحفظة التاجر:</span>
                        <strong className="text-slate-800 font-bold">+11,900 ل.س</strong>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>عمولة منصة بركة التشغيلية (15%):</span>
                        <span>-2,100 ل.س</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* MERCHANT STORE VIEW */}
        {activeTab === 'merchant' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Quick Daily Metrics Strip */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">سلال تم بيعها اليوم</span>
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#006948]">
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#131b2e]">19</span>
                  <span className="text-xs text-slate-400">سلة</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[#006948] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>+32% عن الأمس</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">إجمالي إيرادات اليوم</span>
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-[#855300]">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#131b2e]">299,000</span>
                  <span className="text-xs text-slate-400">ل.س</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[#855300] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>جاهز للتسوية الأسبوعية</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">سلال بانتظار الاستلام / التوصيل</span>
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#131b2e]">3</span>
                  <span className="text-xs text-slate-400">طلبات نشطة</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>نافذة الاستلام والتوصيل جارية الآن</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">كمية الهدر الموفرة</span>
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#006948]">
                    <span className="material-symbols-outlined text-[20px]">eco</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#131b2e]">38</span>
                  <span className="text-xs text-slate-400">كغ طعام محفوظ</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[#006948] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">nature_people</span>
                  <span>تقليل 78 كغ انبعاثات CO₂</span>
                </div>
              </div>
            </section>

            {/* Interactive Grid: Dispatch Form & In-Store Photo Handover */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Surplus Inventory Dispatch Form (7 Cols) */}
              <section className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00855d] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">add_box</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#131b2e]">إضافة وتعبئة سلال الفائض اليومي</h2>
                      <p className="text-xs text-slate-500">انشر السلال المتبقية لتمكين الزبائن من حجزها فوراً</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#eaedff] text-[#006948] text-xs font-semibold rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                    مباشر بالسوق
                  </span>
                </div>

                <form onSubmit={handlePublishBox} className="flex flex-col gap-4 text-xs">
                  {/* Category Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-800">نوع سلة البركة:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['مخبوزات ومعجنات', 'وجبات مطبوخة', 'فواكه وخضار', 'حلويات وموالح'].map((catName) => (
                        <button
                          key={catName}
                          type="button"
                          onClick={() => setCategory(catName)}
                          className={`p-2.5 rounded-xl font-bold flex flex-col items-center gap-1 transition-all border cursor-pointer ${
                            category === catName
                              ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {catName === 'مخبوزات ومعجنات'
                              ? 'bakery_dining'
                              : catName === 'وجبات مطبوخة'
                              ? 'soup_kitchen'
                              : catName === 'فواكه وخضار'
                              ? 'nutrition'
                              : 'cake'}
                          </span>
                          <span>{catName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-800">السعر الحقيقي الأصلي (ل.س):</label>
                      <input
                        type="number"
                        value={origPrice}
                        onChange={(e) => setOrigPrice(Number(e.target.value))}
                        className="w-full bg-[#f2f3ff] px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800">سعر بركة المخفض (ل.س):</label>
                        <span className="px-2 py-0.5 rounded-full bg-[#fea619] text-[#684000] text-[10px] font-bold">
                          خصم {discountPercent}%
                        </span>
                      </div>
                      <input
                        type="number"
                        value={barakahPrice}
                        onChange={(e) => setBarakahPrice(Number(e.target.value))}
                        className="w-full bg-[#f2f3ff] px-3 py-2 rounded-xl text-xs font-bold text-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]"
                      />
                    </div>
                  </div>

                  {/* Quantity & Pickup Window */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-800">الكمية المتوفرة للإطلاق اليوم:</label>
                      <div className="flex items-center bg-[#f2f3ff] rounded-xl p-1 justify-between">
                        <button
                          type="button"
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-[#006948]"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-slate-900">{qty} سلال</span>
                        <button
                          type="button"
                          onClick={() => setQty(qty + 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:text-[#006948]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-800">نافذة وقت الاستلام المسائية:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={timeStart}
                          onChange={(e) => setTimeStart(e.target.value)}
                          className="bg-[#f2f3ff] px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 text-center"
                        />
                        <input
                          type="text"
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          className="bg-[#f2f3ff] px-2.5 py-2 rounded-xl text-xs font-medium text-slate-800 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-800">تفاصيل وصفية سريعة للزبائن:</label>
                    <textarea
                      rows={2}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-[#f2f3ff] p-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                    <span>نشر السلال في السوق فوراً (Publish Box)</span>
                  </button>

                  {publishedAlert && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-2 border border-emerald-200">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>تم نشر {qty} سلال بنجاح في السوق! بدأت إشعارات الزبائن القريبين في المزة الآن.</span>
                    </div>
                  )}
                </form>
              </section>

              {/* Handover & QR/OTP Verification Terminal (5 Cols) */}
              <section className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00855d] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#131b2e]">إثبات التسليم بالصورة (Proof)</h2>
                      <p className="text-[11px] text-slate-500">رفع صورة استلام الزبون للمصادقة الفورية</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                    توثيق حي
                  </span>
                </div>

                {/* Target Order Selection */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">الطلب المستهدف للتسليم:</span>
                    <span className="font-bold text-[#006948]">#BB-{selectedOrderId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId('9045')}
                      className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1 border cursor-pointer ${
                        selectedOrderId === '9045'
                          ? 'border-[#006948] bg-[#f5fff7] text-[#006948]'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>#BB-9045 (رامي)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId('9044')}
                      className={`p-2 rounded-xl font-bold flex items-center justify-center gap-1 border cursor-pointer ${
                        selectedOrderId === '9044'
                          ? 'border-[#006948] bg-[#f5fff7] text-[#006948]'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>#BB-9044 (ميساء)</span>
                    </button>
                  </div>
                </div>

                {/* Photo Dropzone */}
                <div
                  onClick={() => {
                    const sample =
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ';
                    setProofImage(sample);
                  }}
                  className="relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#006948] bg-[#f2f3ff] p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[150px]"
                >
                  {proofImage ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-inner border border-slate-200">
                      <img src={proofImage} alt="معاينة إثبات التسليم" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProofImage('');
                        }}
                        className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                        صورة واضحة ومطابقة ✓
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[28px] text-[#006948]">photo_camera</span>
                      <span className="font-bold text-slate-800">التقط صورة التسليم أو اسحب الملف هنا</span>
                      <span className="text-[11px] text-slate-500">صورة واضحة للسلة مع الزبون أو واجهة المتجر</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCompleteProof()}
                  className="w-full py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>تأكيد التسليم ورفع صورة الإثبات (Complete Payout)</span>
                </button>

                {/* OTP Backup */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">أو أدخل كود التسليم اليدوي (OTP):</span>
                    <span className="text-[11px] text-slate-400">4 أرقام</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center" dir="ltr">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const newOtp = [...otp];
                          newOtp[i] = e.target.value;
                          setOtp(newOtp);
                        }}
                        className="h-10 rounded-xl bg-slate-100 text-center font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCompleteProof()}
                    className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    تأكيد عبر رمز OTP فقط
                  </button>
                </div>

                {proofSuccess && (
                  <div className="p-3 rounded-xl bg-[#f5fff7] border border-[#85f8c4] flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1 text-[#006948] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>تم توثيق التسليم بنجاح!</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{proofSuccess}</p>
                  </div>
                )}
              </section>
            </div>

            {/* Real-time Daily Order Pipeline Table */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#006948] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e]">سجل طلبات اليوم المباشرة</h2>
                    <p className="text-xs text-slate-500">متابعة دقيقة لعمليات الحجز، الاستلام والتسوية الفورية</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                      <th className="py-2.5 px-3 rounded-r-xl">رقم الطلب والنوع</th>
                      <th className="py-2.5 px-3">الزبون المحترم</th>
                      <th className="py-2.5 px-3">نوع السلة والكابتن</th>
                      <th className="py-2.5 px-3">القيمة والتسوية</th>
                      <th className="py-2.5 px-3">نافذة الاستلام</th>
                      <th className="py-2.5 px-3">إثبات التسليم / الحالة</th>
                      <th className="py-2.5 px-3 rounded-l-xl text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold">
                          <div className="flex flex-col gap-1">
                            <span>#BB-{o.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-semibold ${
                                o.orderType === 'delivery'
                                  ? 'bg-[#ffddb8] text-[#855300]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {o.orderType === 'delivery' ? 'توصيل منزلي' : 'استلام ذاتي'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold">{o.customerName}</div>
                          <div className="text-[11px] text-slate-400">{o.customerPhone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold">{o.boxTitle}</div>
                          {o.driverName && (
                            <div className="text-[11px] text-[#006948] font-bold">الكابتن: {o.driverName}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#006948]">{o.price.toLocaleString('ar-SY')} ل.س</span>
                          <span className="block text-[11px] text-slate-400">
                            صافي: {o.merchantNet.toLocaleString('ar-SY')} ل.س
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
                            {o.pickupWindow}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {o.status === 'delivered' && (
                            <div className="flex items-center gap-1.5">
                              {o.proofImage && (
                                <button
                                  onClick={() => setLightboxImg(o.proofImage || null)}
                                  className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 cursor-pointer shadow-sm hover:opacity-80"
                                >
                                  <img src={o.proofImage} alt="إثبات" className="w-full h-full object-cover" />
                                </button>
                              )}
                              <span className="bg-[#85f8c4] text-[#002114] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                موثق بالصورة ✓
                              </span>
                            </div>
                          )}
                          {o.status === 'in_transit' && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                              جاري التوصيل
                            </span>
                          )}
                          {o.status === 'pending' && (
                            <span className="bg-[#ffddb8] text-[#855300] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              بانتظار الاستلام
                            </span>
                          )}
                          {o.status === 'cancelled' && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ملغي (متعثر)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {o.status === 'pending' && (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrderId(o.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#006948] hover:bg-[#00855d] text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                              >
                                إثبات التسليم
                              </button>
                              <button
                                onClick={() => setCancelOrderModalItem(o)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          )}
                          {o.status === 'in_transit' && (
                            <button
                              onClick={() => setActiveTab('driver')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all cursor-pointer"
                            >
                              مهمة الكابتن
                            </button>
                          )}
                          {o.status === 'delivered' && (
                            <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                              مغلق ومسوى
                            </span>
                          )}
                          {o.status === 'cancelled' && (
                            <span className="text-[11px] text-slate-400">مؤرشف</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Cancel Order Modal */}
      {cancelOrderModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-md w-full border border-red-200 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <span className="material-symbols-outlined text-[24px]">warning</span>
                <span>تأكيد إلغاء الطلب من المتجر</span>
              </div>
              <button onClick={() => setCancelOrderModalItem(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-red-50 p-3 rounded-xl text-red-950 text-xs flex flex-col gap-1.5 border border-red-100">
              <span className="font-bold">
                الطلب #BB-{cancelOrderModalItem.id} للزبون {cancelOrderModalItem.customerName}
              </span>
              <p className="text-[11px] text-red-800">تنبيه سياسات الامتثال: إلغاء الطلب يؤدي فوراً إلى:</p>
              <ul className="list-disc list-inside text-[11px] text-red-800 space-y-0.5">
                <li>استرداد المبلغ 100% فوراً لمحفظة الزبون.</li>
                <li>
                  تسجيل غرامة تشغيلية بقيمة <strong>5,000 ل.س</strong> على حساب المتجر.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                تأكيد الإلغاء وتطبيق الغرامة
              </button>
              <button
                onClick={() => setCancelOrderModalItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-3 max-w-lg w-full shadow-2xl flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <span>صورة إثبات التسليم المحفوظة نظامياً</span>
              <button onClick={() => setLightboxImg(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <img src={lightboxImg} alt="إثبات" className="w-full max-h-96 object-contain rounded-xl bg-slate-100" />
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>تاريخ التوثيق: اليوم - التسليم الفوري</span>
              <span className="text-[#006948] font-bold">تمت المصادقة والتسوية ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
