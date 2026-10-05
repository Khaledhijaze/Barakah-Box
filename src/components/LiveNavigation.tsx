import React, { useState } from 'react';

interface LiveNavigationProps {
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  driverWalletBalance: number;
  onUpdateDriverWallet: (delta: number) => void;
  onNavigate: (screen: any) => void;
}

export const LiveNavigation: React.FC<LiveNavigationProps> = ({
  onShowToast,
  driverWalletBalance,
  onUpdateDriverWallet,
  onNavigate,
}) => {
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [photoProofCaptured, setPhotoProofCaptured] = useState(false);
  const [showSettlementCelebration, setShowSettlementCelebration] = useState(false);

  // Dispute & Return Modals
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnDest, setSelectedReturnDest] = useState<'bank' | 'bakery'>('bank');
  const [returnPin, setReturnPin] = useState('7741');
  const [hasReturnPhoto, setHasReturnPhoto] = useState(false);

  // Dynamic Navigation state (normal or reversed)
  const [navMode, setNavMode] = useState<'forward' | 'return'>('forward');

  const handleArrival = () => {
    setHasArrived(true);
    onShowToast('تم تسجيل وصولك لموقع العميل. يرجى توثيق الصورة أمام الباب.', 'where_to_vote', 'info');
  };

  const handleFinalizePayout = () => {
    setPhotoProofCaptured(true);
    onUpdateDriverWallet(4000); // 3500 delivery + 500 fast bonus
    setShowSettlementCelebration(true);
    onShowToast('تم إتمام التسليم وإيداع +4,000 ل.س في محفظة الكابتن!', 'check_circle', 'success');
  };

  const handleConfirmReturn = () => {
    const isBank = selectedReturnDest === 'bank';
    const amount = isBank ? 5500 : 6000;
    setShowReturnModal(false);
    setNavMode('return');
    onUpdateDriverWallet(amount);

    onShowToast(
      isBank
        ? `🌿 تم توجيه السلة لبنك حفظ النعمة بنجاح! أُودع ${amount.toLocaleString('ar-SY')} ل.س في محفظتك + 50 نقطة بركة.`
        : `🔄 تم بدء مسار إرجاع السلة للمخبز بنجاح! أُودع ${amount.toLocaleString('ar-SY')} ل.س في محفظتك.`,
      'volunteer_activism',
      'success'
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Turn-by-Turn Real-time Maneuver HUD Banner */}
      <div className="relative w-full bg-[#283044] text-white rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        <div
          className={`absolute inset-y-0 right-0 w-3.5 ${
            navMode === 'return' ? 'bg-[#2170e4]' : 'bg-[#00855d]'
          }`}
        ></div>

        <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pr-6 sm:pr-8">
          {/* Maneuver info */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                navMode === 'return' ? 'bg-[#2170e4] text-white' : 'bg-[#00855d] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[42px] sm:text-[50px]">
                {navMode === 'return' ? 'turn_sharp_left' : 'turn_sharp_right'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl sm:text-4xl text-[#85f8c4] font-bold tracking-tight font-mono">
                  {navMode === 'return' ? '120 م' : '180 م'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    navMode === 'return' ? 'bg-blue-900 text-blue-200' : 'bg-white/20 text-white'
                  }`}
                >
                  {navMode === 'return' ? 'مسار الإرجاع العكسي' : 'الانعطاف التالي'}
                </span>
              </div>
              <p className="text-base sm:text-lg text-white font-bold leading-tight">
                {navMode === 'return'
                  ? selectedReturnDest === 'bank'
                    ? 'انعطف يساراً نحو بنك حفظ النعمة - فرع الشعلان والصالحية'
                    : 'انعطف يساراً نحو أوتوستراد المزة - فرع مخبز وشمسين'
                  : 'انعطف يميناً نحو شارع عبد المنعم رياض / حديقة السبكي'}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-300">
                <span className="material-symbols-outlined text-[16px]">straight</span>
                <span>
                  {navMode === 'return'
                    ? 'يليه: الوصول المباشر لمركز استلام الفائض الغذائي بعد 450 م'
                    : 'يليه: استمر للأمام 400 متر باتجاه تقاطع زقاق الصخر'}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Matrix */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 border-t lg:border-t-0 border-white/10 pt-3 lg:pt-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl flex flex-col items-center justify-center min-w-[85px] border border-white/10">
              <span className="text-[10px] text-[#85f8c4] font-bold">الوصول ETA</span>
              <span className="text-base font-bold font-mono">{navMode === 'return' ? '8:44 م' : '8:42 م'}</span>
              <span className="text-[10px] text-[#fea619]">
                {navMode === 'return' ? 'دقيقتان متبقيتان' : '6 دقائق متبقية'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl flex flex-col items-center justify-center min-w-[85px] border border-white/10">
              <span className="text-[10px] text-slate-300">المسافة</span>
              <span className="text-base font-bold font-mono">{navMode === 'return' ? '650 م' : '1.2 كم'}</span>
              <span className="text-[10px] text-slate-300">المتبقية</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl flex flex-col items-center justify-center min-w-[85px] border border-white/10">
              <span className="text-[10px] text-slate-300">السرعة</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-bold text-[#85f8c4] font-mono">28</span>
                <span className="text-[10px] text-slate-300">كم/س</span>
              </div>
              <span className="text-[10px] text-emerald-400">سكوتر كهربائي</span>
            </div>

            {/* Quick Voice / Reroute buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsVoiceMuted(!isVoiceMuted);
                  onShowToast(isVoiceMuted ? 'تم تفعيل التوجيه الصوتي' : 'تم كتم التوجيه الصوتي', 'volume_up');
                }}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isVoiceMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onShowToast('جاري إعادة حساب أسرع مسار لتفادي زحام ساحة النجمة...', 'sync')}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">alt_route</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Map Stage (8 Cols) & Right Task Dossier (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Stage */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative w-full h-[540px] lg:h-[620px] rounded-2xl overflow-hidden shadow-md bg-slate-900 border border-slate-200">
            {/* Live Damascus Map Image */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrwCQ9XqSI7fHtaP_IrmHDANnwssTh7CrC1S5Szl0UjsE-PzGLwNSX1lXNW9XG8lirP1YxeBtQfOJ6TmgDra87WtN0R42_SuiO5zfnjPjoga9xzl5_hLCTJ3rqL5i-1yrWV86K_81lggKaAT9Ud7dN0akyUoYJ493RW9neyUdJh5lRKdXYLTu-bsTAeER9o5DR2fhXm2ArgXEJRoZ943m0okQY7DlA_4ieKT_3AX1LYo478Dd2kOyF')`,
              }}
            />

            {/* Dark & Gradient Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 pointer-events-none" />

            {/* Glowing Route Line Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="navRouteGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#006948" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#00855d" stopOpacity="1" />
                  <stop offset="100%" stopColor="#85f8c4" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M 120 540 L 210 480 L 290 430 L 340 390"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5"
                strokeDasharray="4 6"
                opacity="0.6"
              />
              <path
                d="M 340 390 C 370 360, 420 330, 470 300 L 580 260 L 640 200 L 710 150"
                fill="none"
                stroke="url(#navRouteGlow)"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>

            {/* Hazard Alert 1 */}
            <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-[#fea619] text-[#684000] shadow-md rounded-full text-xs font-bold pointer-events-auto">
              <span className="material-symbols-outlined text-[16px]">traffic</span>
              <span>ازدحام خفيف (شارع الحمراء)</span>
            </div>

            {/* Hazard Alert 2 */}
            <div className="absolute top-[35%] right-[25%] flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 text-white shadow rounded-lg text-xs pointer-events-auto">
              <span className="material-symbols-outlined text-amber-400 text-[16px]">warning</span>
              <span>مطب اصطناعي بعد 110م</span>
            </div>

            {/* Customer / Destination Pin */}
            <div className="absolute top-[140px] left-[700px] -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto">
              <div className="bg-white text-slate-900 shadow-xl rounded-xl p-2 px-3 mb-1 text-center whitespace-nowrap animate-bounce border border-slate-200">
                <span className="text-[10px] text-[#006948] font-bold block">
                  {navMode === 'return' ? 'وجهة الإرجاع العكسي' : 'نقطة التسليم #BB-9048'}
                </span>
                <p className="text-xs font-bold">
                  {navMode === 'return'
                    ? selectedReturnDest === 'bank'
                      ? 'بنك حفظ النعمة (الصالحية)'
                      : 'مخبز وشمسين (المزة)'
                    : 'رامي السعيد - بناء الزهور 14'}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-2xl ring-4 ${
                  navMode === 'return' ? 'bg-[#2170e4] ring-blue-300' : 'bg-red-600 ring-red-300'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {navMode === 'return' ? 'volunteer_activism' : 'home_pin'}
                </span>
              </div>
            </div>

            {/* Captain Electric Bike Position Marker */}
            <div className="absolute top-[390px] left-[340px] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="w-24 h-24 -top-12 -left-12 absolute rounded-full bg-[#00855d]/20 animate-ping pointer-events-none" />
              <div className="relative w-12 h-12 rounded-full bg-[#006948] text-white flex items-center justify-center shadow-2xl ring-4 ring-white">
                <span className="material-symbols-outlined text-[26px]">electric_moped</span>
                <div className="absolute -top-1 w-2.5 h-2.5 bg-[#85f8c4] rounded-full shadow-sm" />
              </div>
            </div>

            {/* Top Right Corridor Tag */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006948] animate-pulse"></span>
                <span className="text-xs font-bold text-slate-900">
                  {navMode === 'return'
                    ? 'مسار عودة: الشعلان ➔ بنك حفظ النعمة'
                    : 'مسار الشام الحي: المزرعة ➔ السبكي'}
                </span>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] flex items-center gap-1.5 self-start">
                <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">satellite_alt</span>
                <span>دقة GPS: 3 أمتار (14 قمر صناعي)</span>
              </div>
            </div>

            {/* Floating Map Controls */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
              <button
                type="button"
                onClick={() => onShowToast('تمت إعادة ضبط الخريطة على موقع دراجتك الحالي', 'my_location')}
                className="w-10 h-10 rounded-xl bg-white text-slate-800 shadow-xl flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">my_location</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIs3DMode(!is3DMode);
                  onShowToast(is3DMode ? 'التبديل إلى 2D' : 'التبديل إلى منظور القيادة ثلاثي الأبعاد 3D', '3d_rotation');
                }}
                className={`w-10 h-10 rounded-xl bg-white shadow-xl flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer ${
                  is3DMode ? 'text-[#006948]' : 'text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">3d_rotation</span>
              </button>
            </div>

            {/* Thermal Bag Indicator */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[#006948] text-[20px]">eco</span>
              <span className="font-bold text-slate-800">صندوق بركة محمي بحقيبة التبريد الحرارية</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">19°C</span>
            </div>
          </div>

          {/* Canned SMS Notification Chips */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">sms</span>
              <span>رسائل الإخطار الفوري للعميل بنقرة واحدة:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                '«أنا على بعد دقيقتين منك، يرجى الاستعداد»',
                '«وصلت الآن أسفل البناء»',
                '«تم وضع الصندوق أمام الباب وفق ملاحظاتك»',
              ].map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onShowToast(`تم إرسال الرسالة للعميل رامي: ${msg}`, 'send')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#85f8c4] hover:text-[#002114] text-slate-700 rounded-xl transition-colors cursor-pointer font-medium"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Dossier & Drop-off Actions (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Order Dossier Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#855300] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[26px]">
                    {navMode === 'return' ? 'volunteer_activism' : 'bakery_dining'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                      {navMode === 'return' ? 'مهمة إرجاع معتمدة' : 'طلب نشط'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {navMode === 'return' ? '#RET-9048' : '#BB-9048'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#131b2e] mt-0.5">
                    {navMode === 'return'
                      ? selectedReturnDest === 'bank'
                        ? 'بنك حفظ النعمة (الصالحية)'
                        : 'مخبز وشمسين (المزة)'
                      : 'مخبز وشمسين للشامي'}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">
                سلة مخبوزات فاخرة
              </span>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Customer info */}
            <div className="flex items-center justify-between bg-[#f2f3ff] p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00855d] text-white flex items-center justify-center font-bold text-xs">
                  {navMode === 'return' ? 'ع.م' : 'ر.س'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {navMode === 'return' ? 'الأستاذ عدنان (أمين المركز)' : 'رامي السعيد'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500" dir="ltr">
                    {navMode === 'return' ? '+963 11 333 001' : '+963 944 123 456'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:+963944123456"
                  className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center hover:bg-[#00855d]"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </a>
                <a
                  href="https://wa.me/963944123456"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-start gap-1.5 text-slate-700">
                <span className="material-symbols-outlined text-[#006948] text-[18px] shrink-0 mt-0.5">
                  location_on
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">العنوان الميداني:</span>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    {navMode === 'return'
                      ? 'دمشق، شارع الباكستان المتفرع من الصالحية، مركز بنك حفظ النعمة ومطبخ الإغاثة رقم 3.'
                      : 'دمشق، حي الشعلان، شارع السبكي المتفرع، بناء الزهور رقم 14، الطابق الثاني يمين المصعد.'}
                  </p>
                </div>
              </div>

              <div className="bg-[#ffddb8]/30 p-2.5 rounded-xl flex items-start gap-2 text-xs mt-1 border border-[#ffddb8]">
                <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">
                  sticky_note_2
                </span>
                <div>
                  <span className="font-bold text-amber-900 block text-[11px]">ملاحظة التسليم:</span>
                  <p className="text-amber-950 text-[11px] leading-snug">
                    "يرجى الرن على الجرس بلطف، وإذا لم أرد مباشرة يمكن ترك السلة بأمان أمام الباب والتقاط الصورة."
                  </p>
                </div>
              </div>
            </div>

            {/* Earning Chip */}
            <div className="p-3 bg-[#f2f3ff] rounded-xl flex items-center justify-between border border-slate-200">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400">حالة الدفع</span>
                <span className="text-xs font-bold text-[#006948] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  مدفوع مسبقاً (شام كاش)
                </span>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400">أجر التوصيل للكابتن</span>
                <p className="text-base font-bold text-[#006948] font-mono leading-none mt-0.5">
                  {navMode === 'return' ? '+5,500 ل.س' : '+3,500 ل.س'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Station */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006948] text-[20px]">where_to_vote</span>
                <h4 className="font-bold text-[#131b2e]">إجراءات إتمام التسليم</h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasArrived ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {hasArrived ? 'المرحلة: عند موقع العميل' : 'المرحلة: في الطريق'}
              </span>
            </div>

            {/* Arrival Button */}
            <button
              type="button"
              onClick={handleArrival}
              disabled={hasArrived}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                hasArrived
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">flag</span>
              <span>{hasArrived ? 'أنت الآن في موقع العميل المحدد ✓' : 'وصلت إلى موقع العميل'}</span>
            </button>

            {/* Drop Photo Proof Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">توثيق تسليم "صندوق بركة" بالصورة:</span>
                {photoProofCaptured && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    مطابقة ذكية 99.4% ✓
                  </span>
                )}
              </div>

              <div
                onClick={() => {
                  setPhotoProofCaptured(true);
                  onShowToast('تم التقاط وحفظ صورة إثبات التسليم بنجاح', 'add_a_photo');
                }}
                className="cursor-pointer relative h-40 rounded-2xl bg-[#f2f3ff] border-2 border-dashed border-slate-300 hover:border-[#006948] flex flex-col items-center justify-center p-3 text-center transition-all overflow-hidden"
              >
                {photoProofCaptured ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ"
                      alt="إثبات التسليم"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white text-[10px]">
                      <div className="flex items-center justify-between font-bold">
                        <span>مطابقة مؤكدة مع العبوة وموقع GPS</span>
                        <span>دمشق • الشعلان #14</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-xs">
                    <div className="w-10 h-10 rounded-full bg-white text-[#006948] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    </div>
                    <span className="font-bold text-slate-800">التقط صورة السلة أمام الباب</span>
                    <span className="text-[11px] text-slate-400">اضغط هنا لفتح الكاميرا أو المحاكاة الفورية</span>
                  </div>
                )}
              </div>

              {/* Final Complete Delivery Button */}
              <button
                type="button"
                onClick={handleFinalizePayout}
                className="w-full py-3 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                <span>تأكيد التسليم والإيداع (+4,000 ل.س)</span>
              </button>
            </div>

            {/* Quick escalation links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                className="text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">person_off</span>
                <span>تعذر الاتصال بالزبون؟</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="text-[#0058be] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">autorenew</span>
                <span>خيارات إرجاع السلة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Celebration Modal */}
      {showSettlementCelebration && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-16 h-16 rounded-full bg-[#85f8c4] flex items-center justify-center text-[#002114] shadow-lg mb-1">
                <span className="material-symbols-outlined text-[40px]">check_circle</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-0.5 rounded-full">
                تم الإيداع اللحظي عبر ShamCash بنجاح ✓
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">تم إتمام التوصيل والتسوية المالية بنجاح!</h3>
              <p className="text-xs text-slate-500">تم توثيق إثبات التسليم للطلب #BB-9048 وإشعار العميل رامي السعيد فوراً.</p>
            </div>

            <div className="bg-[#f2f3ff] rounded-2xl p-4 flex flex-col gap-2 text-xs border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">أجر التوصيل المكتسب:</span>
                <span className="font-bold text-slate-900 font-mono">+3,500 ل.س</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-amber-800 font-bold">حافز تسليم سريع وسليم (مكافأة بركة):</span>
                <span className="font-bold text-amber-700 font-mono">+500 ل.س</span>
              </div>
              <div className="flex justify-between py-2 text-base text-[#006948] font-bold border-b border-slate-200 bg-[#f5fff7] px-3 rounded-xl">
                <span>الإجمالي المودع فوراً:</span>
                <span className="font-mono text-lg">+4,000 ل.س</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>رقم المعاملة المرجعي:</span>
                <span className="font-mono font-bold">TXN-DEL-8942-SY</span>
              </div>
              <div className="flex justify-between text-xs text-[#006948] font-bold pt-1 bg-white p-2.5 rounded-xl border border-slate-200">
                <span>رصيد محفظة الكابتن اللحظي:</span>
                <span className="font-mono text-sm">{driverWalletBalance.toLocaleString('ar-SY')} ل.س</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSettlementCelebration(false);
                  onNavigate('impact-report');
                }}
                className="flex-1 py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                عرض سجل الأثر والشهادة الميدانية
              </button>
              <button
                type="button"
                onClick={() => setShowSettlementCelebration(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Dispute Escalation Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-5 flex flex-col gap-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">report_problem</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">الإبلاغ عن تعثر التسليم وفتح نزاع ميداني</h3>
                  <p className="text-[11px] text-slate-400">Field Dispute Escalation Protocol • دمشق</p>
                </div>
              </div>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#f2f3ff] p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">سبب تعثر التسليم الميداني:</span>
                <div className="space-y-1.5 text-slate-700">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <input type="radio" name="disp_reason" defaultChecked className="accent-[#006948]" />
                    <span>الزبون لا يرد على الاتصالات المتكررة (3 محاولات موثقة)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <input type="radio" name="disp_reason" className="accent-[#006948]" />
                    <span>العنوان غير واضح / بوابة البناء مقفلة تماماً</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <input type="radio" name="disp_reason" className="accent-[#006948]" />
                    <span>الزبون رفض الاستلام أو ألغى عند الوصول</span>
                  </label>
                </div>
              </div>

              <div className="bg-[#f5fff7] p-3 rounded-xl border border-[#85f8c4] flex flex-col gap-1">
                <div className="flex items-center justify-between text-[#006948] font-bold">
                  <span>بروتوكول حماية أجر الكابتن (Captain Guarantee):</span>
                  <span className="font-mono text-sm">+3,500 ل.س</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  أجرك الأساسي محفوظ بالكامل تقديراً لالتزامك بالحضور الميداني، وسيتم توجيهك لإعادة السلة للمتجر أو إيداعها ببنك بركة لحفظ النعمة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  setShowReturnModal(true);
                  onShowToast('تم تصعيد النزاع وحفظ أجر الكابتن بالكامل (+3,500 ل.س). جاري توجيهك لخيار الإرجاع...', 'shield');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                تأكيد تعثر التسليم والانتقال للإرجاع
              </button>
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Reverse Logistics Food Rescue Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0058be] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">autorenew</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">إرجاع السلة وتوجيه الفائض الغذائي</h3>
                  <p className="text-[11px] text-[#0058be] font-bold">Reverse Logistics & Food Rescue Protocol</p>
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-[#f2f3ff] rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">سلة متعثرة #BB-9048 (خبز ومعجنات)</p>
                  <p className="text-[11px] text-slate-500">حالة السلة: سليمة ومبردة 100% (19°C)</p>
                </div>
                <span className="bg-[#85f8c4] text-[#002114] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  معقمة ومغلقة
                </span>
              </div>

              {/* Destination selector */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">اختر وجهة الإرجاع المناسبة:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setSelectedReturnDest('bank')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                      selectedReturnDest === 'bank'
                        ? 'border-[#006948] bg-[#f5fff7]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px] text-[#006948]">volunteer_activism</span>
                        بنك حفظ النعمة
                      </span>
                      <input
                        type="radio"
                        name="ret_dest"
                        checked={selectedReturnDest === 'bank'}
                        onChange={() => setSelectedReturnDest('bank')}
                        className="accent-[#006948]"
                      />
                    </div>
                    <span className="text-[11px] text-[#006948] font-bold">فرع الشعلان - الصالحية</span>
                    <span className="text-[10px] text-slate-500">650 م (دقيقتان). توزيع خيري للأسر المستفيدة.</span>
                    <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                      <span>أجر العودة:</span>
                      <span className="text-[#006948] font-mono">+2,000 ل.س</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setSelectedReturnDest('bakery')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                      selectedReturnDest === 'bakery'
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px] text-amber-700">store</span>
                        مخبز وشمسين الأصيل
                      </span>
                      <input
                        type="radio"
                        name="ret_dest"
                        checked={selectedReturnDest === 'bakery'}
                        onChange={() => setSelectedReturnDest('bakery')}
                        className="accent-amber-600"
                      />
                    </div>
                    <span className="text-[11px] text-amber-800 font-bold">فرع المزة القديمة</span>
                    <span className="text-[10px] text-slate-500">2.4 كم (7 دقائق). إعادة لمستودع المتجر.</span>
                    <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between font-bold text-[11px]">
                      <span>أجر العودة:</span>
                      <span className="text-amber-800 font-mono">+2,500 ل.س</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payout breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">إجمالي ما يتقاضاه الكابتن فوراً:</span>
                  <span className="text-base font-bold text-[#006948] font-mono">
                    {selectedReturnDest === 'bank' ? '5,500 ل.س' : '6,000 ل.س'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400">PIN أمين الاستلام:</label>
                    <input
                      type="text"
                      value={returnPin}
                      onChange={(e) => setReturnPin(e.target.value)}
                      className="w-20 text-center font-mono font-bold bg-white px-2 py-1 rounded-lg border border-slate-300 text-[#006948]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasReturnPhoto(!hasReturnPhoto);
                      onShowToast(hasReturnPhoto ? 'تم إلغاء الصورة' : 'تم التقاط صورة الاستلام بنجاح ✓', 'photo_camera');
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      hasReturnPhoto ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    <span>{hasReturnPhoto ? 'صورة مرفقة ✓' : 'صورة'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="flex-1 py-3 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">navigation</span>
                <span>بدء الملاحة العكسية وتأكيد التسليم الميداني</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
