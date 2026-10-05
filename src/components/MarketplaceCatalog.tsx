import React, { useState, useEffect } from 'react';
import { BarakahBox } from '../types';
import { INITIAL_BOXES, LOGO_URL } from '../data/mockData';

interface MarketplaceCatalogProps {
  walletBalance: number;
  onDeductWallet: (amount: number) => void;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (screen: any) => void;
}

export const MarketplaceCatalog: React.FC<MarketplaceCatalogProps> = ({
  walletBalance,
  onDeductWallet,
  onShowToast,
  onNavigate,
}) => {
  // Countdown Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(38 * 60 + 10);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>('now');
  const [sortBy, setSortBy] = useState<string>('nearest');

  // Modals state
  const [bookingModalBox, setBookingModalBox] = useState<BarakahBox | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'shamcash' | 'card' | 'cash'>('wallet');
  const [isBookingProcessing, setIsBookingProcessing] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeOrderVoucher, setActiveOrderVoucher] = useState({
    orderId: '#BB-9824',
    vendor: 'مخبز وشمسين للشامي الأصيل',
    itemDesc: 'سلة المخبوزات والكرواسان المشكلة الفاخرة',
    amount: 14000,
    pin: '7 4 9 2',
    pickupTime: 'الليلة 8:30 م - 9:45 م',
  });

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Filter & Sort Logic
  const filteredBoxes = INITIAL_BOXES.filter((box) => {
    if (selectedCategory === 'all') return true;
    return box.vendorCategory === selectedCategory;
  }).sort((a, b) => {
    if (sortBy === 'nearest') return a.distanceKm - b.distanceKm;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
    if (sortBy === 'price-low') return a.discountedPrice - b.discountedPrice;
    return 0;
  });

  // Handle Booking Confirmation
  const handleConfirmBooking = () => {
    if (!bookingModalBox) return;

    if (paymentMethod === 'wallet' && walletBalance < bookingModalBox.discountedPrice) {
      onShowToast('رصيد المحفظة غير كافٍ، يرجى شحن الرصيد أو اختيار شام كاش.', 'account_balance_wallet', 'error');
      return;
    }

    setIsBookingProcessing(true);
    setTimeout(() => {
      setIsBookingProcessing(false);
      if (paymentMethod === 'wallet') {
        onDeductWallet(bookingModalBox.discountedPrice);
      }

      // Generate random pin & order
      const newPin = `${Math.floor(1 + Math.random() * 9)} ${Math.floor(1 + Math.random() * 9)} ${Math.floor(
        1 + Math.random() * 9
      )} ${Math.floor(1 + Math.random() * 9)}`;
      const newOrderId = `#BB-${Math.floor(1000 + Math.random() * 9000)}`;

      setActiveOrderVoucher({
        orderId: newOrderId,
        vendor: bookingModalBox.vendor,
        itemDesc: bookingModalBox.description,
        amount: bookingModalBox.discountedPrice,
        pin: newPin,
        pickupTime: `${bookingModalBox.pickupStart} - ${bookingModalBox.pickupEnd}`,
      });

      setBookingModalBox(null);
      setShowVoucherModal(true);
      onShowToast(`تم تأكيد حجز سلة (${bookingModalBox.vendor}) بنجاح!`, 'verified', 'success');
    }, 900);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Dynamic Notification / Impact Banner */}
      <div className="w-full bg-gradient-to-l from-[#006948] via-[#00855d] to-[#006c4a] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-[17px]">verified</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold">أنقذ سلة طعام شهية اليوم ووفر حتى 70%</span>
              <span className="text-white/80 hidden sm:inline">• وشارك في حماية البيئة وتقليل الهدر بدمشق</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-white/95 text-xs bg-white/10 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-[16px]">distance</span>
            <span>المناطق النشطة:</span>
            <span className="font-bold text-[#ffddb8]">الشعلان، المزة، المهاجرين، أبو رمانة</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
        {/* Active Handover Highlight Hero Widget */}
        <section className="w-full bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 overflow-hidden relative border border-slate-100">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#85f8c4]/20 blur-2xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
            {/* Order Info & Meta */}
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#006948] animate-ping"></span>
                    طلب مؤكد وجاهز للاستلام
                  </span>
                  <span className="text-slate-400 text-xs font-mono font-bold tracking-wider">
                    {activeOrderVoucher.orderId}
                  </span>
                </div>

                {/* Live Countdown Timer */}
                <div className="flex items-center gap-2 bg-[#ffddb8] text-[#2a1700] px-3.5 py-1 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span className="text-xs font-medium">ينتهي وقت الاستلام خلال:</span>
                  <span className="text-base font-mono font-bold tracking-wider text-[#855300]">
                    {formatTimer(secondsRemaining)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-1">
                <div className="w-16 h-16 rounded-2xl bg-[#eaedff] shrink-0 flex items-center justify-center shadow-inner text-[#006948]">
                  <span className="material-symbols-outlined text-[36px]">bakery_dining</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-[#131b2e]">{activeOrderVoucher.vendor}</h2>
                    <span className="material-symbols-outlined text-[18px] text-[#006948]" title="متجر موثق">
                      check_circle
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {activeOrderVoucher.itemDesc}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-slate-500 text-xs flex-wrap">
                    <span className="flex items-center gap-1 text-[#006948] font-semibold">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      نافذة الاستلام: {activeOrderVoucher.pickupTime}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      دمشق، المزة - الفيلات الشرقية، مقابل حديقة الطلائع
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Links & Hotline */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#006948]">directions</span>
                  <span>الاتجاهات عبر Google Maps</span>
                </a>
                <a
                  href="tel:+96311998877"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#0058be]">call</span>
                  <span>الاتصال بالفرع</span>
                </a>
                <span className="text-slate-400 text-xs mr-auto hidden sm:inline">أبرز الرمز للفرن فور وصولك</span>
              </div>
            </div>

            {/* Verification Section & QR Card */}
            <div className="lg:w-80 bg-[#f2f3ff] p-4 rounded-2xl flex flex-col items-center justify-between text-center gap-3 shadow-inner shrink-0 border border-slate-200/60">
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  رمز استلام الطلب
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006948]">
                  <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
                  تحقق رقمي
                </span>
              </div>

              {/* Stylized QR Code Graphic */}
              <div className="relative w-40 h-40 bg-white p-2.5 rounded-xl shadow-sm flex items-center justify-center border border-slate-200">
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Corner Finder 1 */}
                  <rect x="6" y="6" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="12" y="12" width="12" height="12" rx="1" fill="currentColor" />
                  {/* Corner Finder 2 */}
                  <rect x="70" y="6" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="76" y="12" width="12" height="12" rx="1" fill="currentColor" />
                  {/* Corner Finder 3 */}
                  <rect x="6" y="70" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="12" y="76" width="12" height="12" rx="1" fill="currentColor" />
                  {/* Decorative Modules */}
                  <rect x="36" y="10" width="6" height="6" />
                  <rect x="48" y="10" width="12" height="6" />
                  <rect x="36" y="22" width="10" height="6" />
                  <rect x="52" y="24" width="8" height="8" />
                  <rect x="10" y="38" width="6" height="12" />
                  <rect x="22" y="44" width="8" height="6" />
                  <rect x="36" y="38" width="14" height="14" rx="2" fill="#006948" />
                  <rect x="56" y="40" width="8" height="6" />
                  <rect x="68" y="38" width="10" height="12" />
                  <rect x="84" y="40" width="6" height="16" />
                  <rect x="38" y="58" width="8" height="8" />
                  <rect x="52" y="56" width="12" height="6" />
                  <rect x="68" y="58" width="6" height="10" />
                  <rect x="36" y="72" width="8" height="14" />
                  <rect x="50" y="76" width="14" height="6" />
                  <rect x="70" y="74" width="10" height="8" />
                  <rect x="84" y="72" width="6" height="14" />
                  <circle cx="50" cy="50" r="4" fill="#00855d" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-[#006948] border border-slate-100">
                    <span className="material-symbols-outlined text-[18px]">eco</span>
                  </span>
                </div>
              </div>

              {/* Secret Handover 4-digit PIN */}
              <div className="w-full">
                <span className="text-slate-500 text-[11px] font-bold block mb-1">رمز التحقق السريع (PIN)</span>
                <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-lg text-slate-900 tracking-widest bg-white py-1.5 px-3 rounded-xl shadow-sm border border-slate-200">
                  {activeOrderVoucher.pin.split(' ').map((num, i) => (
                    <span key={i} className="w-7 h-8 bg-slate-100 flex items-center justify-center rounded-lg text-sm">
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowVoucherModal(true)}
                className="w-full bg-[#006948] text-white py-2 px-3 rounded-xl text-xs font-bold hover:bg-[#00855d] transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                <span>عرض وثيقة الاستلام كاملة</span>
              </button>
            </div>
          </div>
        </section>

        {/* Filters, Categories & Sorting Bar */}
        <section className="flex flex-col gap-3">
          {/* Categories Tab Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: 'الكل (28 سلة)', icon: 'apps' },
                { id: 'bakeries', label: 'مخابز وحلويات', icon: 'bakery_dining' },
                { id: 'produce', label: 'خضار وفواكه طازجة', icon: 'nutrition' },
                { id: 'grocery', label: 'سوبرماركت وألبان', icon: 'local_convenience_store' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm border cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#006948] text-white border-[#006948]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Range selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm text-xs font-medium text-slate-700 shrink-0">
              <span className="material-symbols-outlined text-[#006948] text-[18px]">my_location</span>
              <span>نطاق 5 كم: دمشق وضواحيها</span>
            </div>
          </div>

          {/* Secondary Filter & Sort Strip */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Time Window Chips */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              <span className="text-slate-400 whitespace-nowrap ml-1 font-medium">نافذة الاستلام:</span>
              <button
                onClick={() => setSelectedTimeWindow('now')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  selectedTimeWindow === 'now'
                    ? 'bg-[#ffddb8] text-[#653e00]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>الاستلام الآن (خلال ساعة)</span>
              </button>
              <button
                onClick={() => setSelectedTimeWindow('evening')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTimeWindow === 'evening'
                    ? 'bg-[#ffddb8] text-[#653e00]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الليلة 8:00 - 10:00 مساءً
              </button>
              <button
                onClick={() => setSelectedTimeWindow('tomorrow')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTimeWindow === 'tomorrow'
                    ? 'bg-[#ffddb8] text-[#653e00]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                غداً صباحاً
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <span className="text-slate-400 whitespace-nowrap font-medium">ترتيب حسب:</span>
              <div className="relative inline-block text-right">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-slate-100 text-slate-800 font-bold py-1.5 pr-3 pl-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006948]/20 border border-slate-200"
                >
                  <option value="nearest">الأقرب مسافة أولاً (المسافة)</option>
                  <option value="rating">أعلى تقييم للمتجر ⭐</option>
                  <option value="discount">أكبر نسبة توفير (الخصم %)</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2 top-2 pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Surprise Boxes Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#131b2e]">سلال البركة المتاحة للحجز الفوري</h2>
              <p className="text-xs text-slate-500 mt-0.5">كميات محدودة يتم تجهيزها يومياً لمنع هدر الأطعمة الفاخرة</p>
            </div>
            <span className="text-xs text-[#006948] font-bold hidden sm:inline">يتم التحديث المباشر كل دقيقة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBoxes.map((box) => (
              <div
                key={box.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group border border-slate-200"
              >
                <div className="relative">
                  <img
                    src={box.image}
                    alt={box.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-[#fea619] text-[#684000] text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                    وفر {box.discountPercent}%
                  </div>
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">near_me</span>
                    <span>
                      {box.distanceKm} كم • {box.neighborhood}
                    </span>
                  </div>
                  {box.badgeLabel && (
                    <div className="absolute bottom-2 right-2 bg-[#ba1a1a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      <span>{box.badgeLabel}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>{box.categoryLabel}</span>
                      <span className="flex items-center gap-0.5 text-slate-800 font-bold">
                        <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1">star</span>
                        {box.rating} ({box.reviewsCount})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#131b2e] line-clamp-1">{box.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {box.description}
                    </p>
                  </div>

                  <div className="bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#006948]">schedule</span>
                      استلام: {box.pickupStart} - {box.pickupEnd}
                    </span>
                    <span className="text-red-600 font-bold">{box.urgentText}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400 line-through">
                        {box.originalPrice.toLocaleString('ar-SY')} ل.س
                      </span>
                      <span className="text-lg font-bold text-[#006948]">
                        {box.discountedPrice.toLocaleString('ar-SY')} <span className="text-xs">ل.س</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setBookingModalBox(box)}
                      className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span>احجز الآن</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Interactive Mini-Map & Community Dispatch Tracker */}
        <section className="w-full bg-[#f2f3ff] rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row items-center gap-6 border border-slate-200">
          <div className="flex-1 flex flex-col gap-3">
            <div className="inline-flex items-center gap-1 text-[#006948] text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">share_location</span>
              <span>خريطة نقاط التوزيع المباشر</span>
            </div>
            <h3 className="text-xl font-bold text-[#131b2e]">استلم سلتك مباشرة دون انتظار</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              نظامنا يحدد لك أقرب المتاجر المسجلة في مبادرة بركة في شوارع دمشق، لتمكينك من استلام وجبتك وهي بأعلى مستويات الطزاجة والجودة خلال عودتك لمنزلك.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl text-center border border-slate-200 shadow-sm">
                <span className="text-xl font-bold text-[#006948] block">12</span>
                <span className="text-[11px] text-slate-500 font-medium">مخبز شريك بالشعلان</span>
              </div>
              <div className="bg-white p-3 rounded-xl text-center border border-slate-200 shadow-sm">
                <span className="text-xl font-bold text-[#855300] block">18</span>
                <span className="text-[11px] text-slate-500 font-medium">مطعم بالمزة والربوة</span>
              </div>
              <div className="bg-white p-3 rounded-xl text-center border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-xl font-bold text-[#0058be] block">100%</span>
                <span className="text-[11px] text-slate-500 font-medium">فحص جودة وسلامة</span>
              </div>
            </div>
          </div>

          {/* Map Display Container */}
          <div className="w-full md:w-5/12 h-64 rounded-2xl overflow-hidden shadow-md relative border border-slate-200">
            <div
              className="bg-cover bg-center w-full h-full flex flex-col justify-end p-3"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQpf5YLYC9WzaXO5a3dKnvITf59hT-hohx2KLN-nvsUCsuESBcbUdsBoWj60GZyU5ILBehUwQTlK7SXidZl9QPC5W7PY3gWbx488hox5EY9k0d5sswil8SSu32Wn6YPx_J3p6qbM4CQ9ALDEJjApAQiFdTJjg87YeEDTV_ueHa1JKPKYhlOpvcZAQnWCkJMExpy09lB64gwHKn6HJb_B_SxoCf7bk-4leVRroO8b3zCKMSu0Hd9skc')`,
              }}
            >
              <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl flex items-center justify-between text-slate-800 text-xs font-semibold shadow-md">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#006948] animate-ping"></span>
                  4 نقاط استلام نشطة الآن قربك
                </span>
                <span className="text-[#006948] font-bold">دمشق الغربية</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Booking & Payment Modal */}
      {bookingModalBox && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#85f8c4] text-[#002114] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#131b2e]">تأكيد حجز سلة بركة</h3>
                  <span className="text-xs text-slate-500">{bookingModalBox.vendor}</span>
                </div>
              </div>
              <button
                onClick={() => setBookingModalBox(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4">
              <div className="bg-[#f2f3ff] p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#131b2e] block">{bookingModalBox.description}</span>
                  <span className="text-[11px] text-slate-500">
                    الاستلام المباشر اليوم: {bookingModalBox.pickupStart} - {bookingModalBox.pickupEnd}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-[#006948]">
                    {bookingModalBox.discountedPrice.toLocaleString('ar-SY')}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-normal">ل.س</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">اختر وسيلة الدفع المعتمدة:</label>
                <div className="flex flex-col gap-2">
                  {/* Internal Wallet */}
                  <label
                    onClick={() => setPaymentMethod('wallet')}
                    className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all ${
                      paymentMethod === 'wallet' ? 'border-[#006948] bg-[#f5fff7]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pay_method"
                        checked={paymentMethod === 'wallet'}
                        onChange={() => setPaymentMethod('wallet')}
                        className="accent-[#006948]"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span>محفظة بركة الرقمية</span>
                          <span className="bg-[#85f8c4] text-[#002114] text-[10px] px-1.5 py-0.2 rounded font-normal">
                            رصيد متاح
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          الرصيد الحالي: {walletBalance.toLocaleString('ar-SY')} ل.س{' '}
                          {walletBalance < bookingModalBox.discountedPrice ? '(غير كافٍ)' : '(كافٍ للدفع الفوري)'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006948] text-[22px]">account_balance_wallet</span>
                  </label>

                  {/* ShamCash Gateway */}
                  <label
                    onClick={() => setPaymentMethod('shamcash')}
                    className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all ${
                      paymentMethod === 'shamcash' ? 'border-[#006948] bg-[#f5fff7]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pay_method"
                        checked={paymentMethod === 'shamcash'}
                        onChange={() => setPaymentMethod('shamcash')}
                        className="accent-[#006948]"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span>شام كاش (ShamCash)</span>
                          <span className="bg-[#d8e2ff] text-[#001a42] text-[10px] px-1.5 py-0.2 rounded font-normal">
                            دفع إلكتروني سريع
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">سداد فوري ومباشر دون خصم من رصيد المحفظة</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#2170e4] text-white flex items-center justify-center font-bold text-xs">
                      SC
                    </div>
                  </label>

                  {/* Cash on Pickup */}
                  <label
                    onClick={() => setPaymentMethod('cash')}
                    className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all ${
                      paymentMethod === 'cash' ? 'border-[#006948] bg-[#f5fff7]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="pay_method"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="accent-[#006948]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">الدفع نقداً عند الاستلام</span>
                        <span className="text-[11px] text-slate-500">سدد القيمة مباشرة للبائع عند إبراز رمز QR</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-[22px]">payments</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
                <span className="material-symbols-outlined text-[#006948] text-[18px] shrink-0 mt-0.5">verified_user</span>
                <p>
                  ضمان الجودة من مبادرة بركة: جميع الأطعمة معبأة وفق المعايير الصحية السورية، وتلغى صلاحية الحجز تلقائياً في حال عدم الاستلام ضمن النافذة المحددة.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between gap-3 border-t border-slate-200">
              <button
                onClick={() => setBookingModalBox(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isBookingProcessing}
                className="flex-1 bg-[#006948] hover:bg-[#00855d] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isBookingProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>جاري التحقق والاقتطاع...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الحجز وإنشاء رمز الاستلام</span>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Fullsheet Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-5 flex flex-col items-center text-center gap-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#85f8c4] text-[#002114] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#131b2e]">وثيقة استلام سلة بركة</h4>
              <p className="text-xs text-slate-500 mt-0.5">أظهر هذا الرمز لموظف الصندوق في {activeOrderVoucher.vendor}</p>
            </div>

            <div className="bg-[#f2f3ff] p-4 rounded-2xl w-full flex flex-col items-center gap-3 border border-slate-200">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <svg className="w-44 h-44 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="6" y="6" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="12" y="12" width="12" height="12" rx="1" fill="currentColor" />
                  <rect x="70" y="6" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="76" y="12" width="12" height="12" rx="1" fill="currentColor" />
                  <rect x="6" y="70" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="12" y="76" width="12" height="12" rx="1" fill="currentColor" />
                  <rect x="36" y="14" width="8" height="8" />
                  <rect x="52" y="10" width="10" height="12" />
                  <rect x="40" y="34" width="20" height="20" rx="3" fill="#006948" />
                  <rect x="12" y="44" width="8" height="10" />
                  <rect x="72" y="44" width="16" height="8" />
                  <rect x="42" y="68" width="16" height="8" />
                  <rect x="68" y="72" width="14" height="14" />
                </svg>
              </div>

              <div className="w-full">
                <span className="text-slate-400 text-[11px] font-bold uppercase block mb-1">الرمز البديل المؤقت</span>
                <span className="font-mono text-xl font-bold text-[#006948] tracking-widest bg-white py-1 px-4 rounded-lg inline-block shadow-sm border border-slate-200">
                  {activeOrderVoucher.pin}
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>رقم الحجز:</span>
                <span className="font-bold text-slate-800 font-mono">{activeOrderVoucher.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ المدفوع:</span>
                <span className="font-bold text-[#006948]">
                  {activeOrderVoucher.amount.toLocaleString('ar-SY')} ل.س
                </span>
              </div>
              <div className="flex justify-between">
                <span>نافذة الاستلام:</span>
                <span className="font-bold text-slate-700">{activeOrderVoucher.pickupTime}</span>
              </div>
            </div>

            <button
              onClick={() => setShowVoucherModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق وتصغير
            </button>
          </div>
        </div>
      )}

      {/* Global Comprehensive Footer */}
      <footer className="w-full bg-white mt-12 border-t border-slate-200">
        <div className="bg-[#00855d] text-white py-2.5 px-4 text-center flex items-center justify-center gap-2 flex-wrap text-xs sm:text-sm">
          <span className="material-symbols-outlined text-[18px]">eco</span>
          <span className="font-bold">أنقذنا معاً أكثر من 18,450 وجبة وسلة غذائية حتى الآن!</span>
          <span className="hidden md:inline text-white/80">| كل سلة بركة تحمي الموارد وتدعم التكافل</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="صندوق بركة" className="h-7 w-auto object-contain" />
              <span className="text-base font-bold text-[#006948]">صندوق بركة</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              منصة رائدة لتمكين المتاجر والمخابز والمطاعم من تصريف فوائض الأطعمة الطازجة بجودة ممتازة وأسعار عادلة لدعم الاستدامة والتكافل في دمشق.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 mb-1">التنقل السريع</span>
            <button
              onClick={() => onNavigate('marketplace-catalog')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              سوق السلال اليومي
            </button>
            <button
              onClick={() => onNavigate('live-navigation')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              متابعة الاستلام المباشر
            </button>
            <button
              onClick={() => onNavigate('impact-report')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              أثر البركة المجتمعي
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-900 mb-1">للشركاء والتجار والكباتن</span>
            <button
              onClick={() => onNavigate('merchant-dashboard')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              لوحة إدارة وتعبئة السلال
            </button>
            <button
              onClick={() => onNavigate('merchant-dashboard')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              مهام كابتن التوصيل
            </button>
            <button
              onClick={() => onNavigate('platform-admin')}
              className="text-right text-slate-500 hover:text-[#006948] transition-colors cursor-pointer"
            >
              إدارة المنصة والنزاعات
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-900 mb-1">الأمان والموثوقية</span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[17px] text-[#006948]">security</span>
              <span>تحقق رقمي فوري عبر الرمز QR</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[17px] text-[#0058be]">account_balance</span>
              <span>دفع إلكتروني آمن بواسطة شام كاش</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="material-symbols-outlined text-[17px] text-[#855300]">volunteer_activism</span>
              <span>مبادرة بركة المجتمعية للتنمية</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 py-3 text-center text-slate-500 text-xs">
          © 2025 مبادرة صندوق بركة (Barakah Box). جميع الحقوق محفوظة لتعزيز الاستدامة الغذائية.
        </div>
      </footer>
    </div>
  );
};
