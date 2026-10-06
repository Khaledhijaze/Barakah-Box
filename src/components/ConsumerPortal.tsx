import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarakahBox, SyrianGovernorate, SupportTicket, Language } from '../types';
import { INITIAL_BOXES } from '../data/mockData';
import { AIAssistantChat } from './AIAssistantChat';
import { OrderHelpModal } from './OrderHelpModal';
import { SYRIAN_GOVERNORATES, SYRIAN_DISTRICTS, calculateDistanceKm, GovernorateItem, DistrictItem } from '../data/geographyData';
import { t } from '../data/translations';
import { fetchGovernoratesFromDb, fetchDistrictsFromDb, executeSupabaseInstantRefund, persistSupportTicketToDb } from '../db/supabaseClient';

interface ConsumerPortalProps {
  walletBalance: number;
  onDeductWallet: (amount: number) => void;
  onOpenTopup: () => void;
  onOpenPayout: () => void;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  detectedLocation: { lat: number; lng: number; gov_ar: string; gov_en: string; dist_ar: string; dist_en: string } | null;
  onAutoDetectLocation: () => void;
  isGpsLoading: boolean;
  lang?: Language;
}

export const ConsumerPortal: React.FC<ConsumerPortalProps> = ({
  walletBalance,
  onDeductWallet,
  onOpenTopup,
  onOpenPayout,
  onShowToast,
  detectedLocation,
  onAutoDetectLocation,
  isGpsLoading,
  lang = 'ar',
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'active_orders' | 'wallet' | 'impact' | 'support'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('nearest');

  // GPS RADIUS STATE
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(8); // 1 km to 15 km slider

  // FULFILLMENT CONTEXT TOGGLE (Delivery vs. Pickup)
  const [fulfillmentContext, setFulfillmentContext] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    isEn ? 'Damascus, Mazzeh - Near Al-Akram Mosque, Bldg 12' : 'دمشق، المزة - جانب جامع الأكرم، بناء 12'
  );
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [hasClaimedMilestone, setHasClaimedMilestone] = useState<boolean>(false);

  // Booking Modal State
  const [bookingModalBox, setBookingModalBox] = useState<BarakahBox | null>(null);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'shamcash' | 'cash'>('wallet');
  const [isBookingProcessing, setIsBookingProcessing] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Bank Card Form State (Inside Booking Modal)
  const [cardBank, setCardBank] = useState<string>('المصرف التجاري السوري (CBS)');
  const [cardNumber, setCardNumber] = useState<string>('9860 1204 8831 4410');
  const [cardExpiry, setCardExpiry] = useState<string>('09/27');

  // Order Help Modal Target State
  const [orderHelpTarget, setOrderHelpTarget] = useState<{
    id: string;
    vendor: string;
    itemDesc: string;
    amount: number;
    governorate: string;
    pickupTime: string;
  } | null>(null);

  // Unified Floating AI Support Modal (NO WHATSAPP!)
  const [isFloatingSupportOpen, setIsFloatingSupportOpen] = useState(false);

  // Customer Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-AUTO-9038',
      createdAt: isEn ? 'Today, 11:20 AM' : 'اليوم، 11:20 ص',
      customerName: 'رامي السعيد',
      customerPhone: '0944-123456',
      orderId: '#BB-9038',
      vendorName: 'حلويات الشهباء',
      governorate: 'حلب',
      category: 'المتجر كان مغلقاً عند الوصول',
      issueType: 'store_closed',
      subject: isEn ? 'Store Closed - Instant Auto Refund #BB-9038' : 'المتجر كان مغلقاً عند الوصول - طلب #BB-9038',
      message: isEn
        ? 'Customer arrived during pickup window and found venue closed. 100% wallet refund executed immediately.'
        : 'تم تفعيل الاسترداد التلقائي الفوري لمبلغ 22,000 ل.س وإيداعه في المحفظة دون انتظار.',
      status: 'auto_refunded',
      autoRefundTriggered: true,
      refundAmount: 22000,
      adminDecision: 'approved_refund',
      response: isEn
        ? '22,000 SYP refunded instantly to your digital wallet.'
        : 'تم استرداد 22,000 ل.س فورياً إلى محفظة بركة الرقمية.',
      resolutionSpeedMinutes: 0.3,
    },
    {
      id: 'TKT-7821',
      createdAt: isEn ? 'Yesterday, 06:45 PM' : 'أمس، 06:45 م',
      customerName: 'رامي السعيد',
      customerPhone: '0944-123456',
      orderId: '#BB-9048',
      vendorName: 'مخبز وشمسين للشامي الأصيل',
      governorate: 'دمشق',
      category: 'سداد وبطاقة بنكية',
      issueType: 'payment_unconfirmed',
      subject: isEn ? 'Debit Card Confirmation' : 'تأكيد خصم البطاقة المصرفية لطلب المخبز',
      message: isEn
        ? 'Reserved via Commercial Bank of Syria card. Inquiring about store readiness.'
        : 'تم حجز السلة عبر بطاقة المصرف التجاري السوري وأود التأكد من استلام المتجر للإشعار.',
      status: 'resolved',
      adminDecision: 'approved_refund',
      response: isEn ? 'Payment verified and basket ready for pickup.' : 'تم التحقق من نجاح العملية واكتمال الخصم، وسلتك جاهزة للاستلام بالفرع.',
      resolutionSpeedMinutes: 2.5,
    },
  ]);

  // New Support Ticket Form
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicket['category']>('سداد وبطاقة بنكية');
  const [newTicketOrder, setNewTicketOrder] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Active reservation voucher
  const [isQrEnlarged, setIsQrEnlarged] = useState(false);
  const [activeOrderVoucher, setActiveOrderVoucher] = useState({
    orderId: '#BB-9048',
    vendor: 'مخبز وشمسين للشامي الأصيل',
    itemDesc: 'سلة المخبوزات والكرواسان المشكلة الفاخرة',
    amount: 14000,
    pin: '7 4 9 2',
    pickupTime: isEn ? 'Tonight 8:30 PM - 9:45 PM' : 'الليلة 8:30 م - 9:45 م',
    governorate: isEn ? 'Damascus' : 'دمشق',
    location: isEn ? 'Damascus, Mazzeh - East Villas' : 'دمشق، المزة - الفيلات الشرقية، مقابل حديقة الطلائع',
    orderType: 'pickup' as 'pickup' | 'delivery',
    paymentMethod: isEn ? 'Syrian Bank Card (CBS)' : 'بطاقة بنكية مصرفية (التجاري)',
  });

  // Sample Past Completed Order
  const pastCompletedOrder = {
    orderId: '#BB-9042',
    vendor: isEn ? 'Al-Huda Bakeries' : 'أفران الهدى للشاميات',
    itemDesc: isEn ? 'Fresh Bread & Sesame Pastries' : 'سلة الخبز السياحي والكعك بسمسم',
    amount: 16000,
    pickupTime: isEn ? 'Yesterday, 7:00 PM - 8:30 PM' : 'أمس، 7:00 م - 8:30 م',
    governorate: isEn ? 'Damascus' : 'دمشق',
    location: isEn ? 'Damascus, Al-Shaalan' : 'دمشق، الشعلان - شارع المتنبي',
  };

  // Filter boxes dynamically based on GPS proximity and category
  const filteredBoxes = useMemo(() => {
    if (!detectedLocation) return [];

    return INITIAL_BOXES.map((box) => {
      const boxLat = box.lat || 33.5138;
      const boxLng = box.lng || 36.2765;
      const dynamicDist = calculateDistanceKm(detectedLocation.lat, detectedLocation.lng, boxLat, boxLng);

      return {
        ...box,
        distanceKm: dynamicDist,
      };
    })
      .filter((box) => {
        const matchCat = selectedCategory === 'all' || box.vendorCategory === selectedCategory;
        const matchRadius = box.distanceKm <= searchRadiusKm;

        return matchCat && matchRadius;
      })
      .sort((a, b) => {
        if (sortBy === 'nearest') return a.distanceKm - b.distanceKm;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'discount') return b.discountPercent - a.discountPercent;
        if (sortBy === 'price-low') return a.discountedPrice - b.discountedPrice;
        return 0;
      });
  }, [detectedLocation, selectedCategory, searchRadiusKm, sortBy]);

  const handleConfirmBooking = () => {
    if (!bookingModalBox) return;

    if (paymentMethod === 'wallet' && walletBalance < bookingModalBox.discountedPrice) {
      onShowToast(
        isEn
          ? 'Insufficient wallet balance. Please top up or choose Bank Card / ShamCash.'
          : 'رصيد المحفظة غير كافٍ، يرجى شحن الرصيد أو اختيار البطاقة البنكية أو شام كاش.',
        'account_balance_wallet',
        'error'
      );
      return;
    }

    if (paymentMethod === 'cash' && orderType === 'delivery') {
      onShowToast(
        isEn
          ? 'Cash payment is strictly available for In-Store Pickup! Please choose an electronic payment method for delivery.'
          : 'الدفع نقداً متاح حصرياً عند الاستلام من المتجر! لطلبات التوصيل يرجى اختيار وسيلة دفع إلكترونية.',
        'warning',
        'error'
      );
      return;
    }

    setIsBookingProcessing(true);
    setTimeout(() => {
      setIsBookingProcessing(false);
      if (paymentMethod === 'wallet') {
        onDeductWallet(bookingModalBox.discountedPrice);
      }

      const newPin = `${Math.floor(1 + Math.random() * 9)} ${Math.floor(1 + Math.random() * 9)} ${Math.floor(
        1 + Math.random() * 9
      )} ${Math.floor(1 + Math.random() * 9)}`;
      const newOrderId = `#BB-${Math.floor(1000 + Math.random() * 9000)}`;

      const payMethodLabel =
        paymentMethod === 'card'
          ? `${isEn ? 'Bank Card' : 'بطاقة بنكية'} (${cardBank})`
          : paymentMethod === 'wallet'
          ? isEn ? 'Barakah Wallet' : 'محفظة بركة'
          : paymentMethod === 'shamcash'
          ? 'شام كاش (ShamCash)'
          : isEn ? 'Cash on Pickup' : 'دفع نقدي كاش بالفرع';

      setActiveOrderVoucher({
        orderId: newOrderId,
        vendor: bookingModalBox.vendor,
        itemDesc: bookingModalBox.description,
        amount: bookingModalBox.discountedPrice,
        pin: newPin,
        pickupTime: `${bookingModalBox.pickupStart} - ${bookingModalBox.pickupEnd}`,
        governorate: bookingModalBox.governorate,
        location: `${bookingModalBox.governorate} - ${bookingModalBox.neighborhood}`,
        orderType,
        paymentMethod: payMethodLabel,
      });

      setBookingModalBox(null);
      setShowVoucherModal(true);
      onShowToast(
        isEn
          ? `Basket from (${bookingModalBox.vendor}) reserved successfully!`
          : `تم تأكيد حجز سلة (${bookingModalBox.vendor}) بنجاح عبر ${payMethodLabel}!`,
        'verified',
        'success'
      );
    }, 900);
  };

  // Instant Auto Refund Execution Handler (Direct Supabase Trigger & Ledger)
  const handleAutoRefund = async (amount: number, orderId: string, reason: string) => {
    onDeductWallet(-amount);
    await executeSupabaseInstantRefund('user-rami-uuid', `TKT-AUTO-${orderId}`, orderId, amount, reason);
    onShowToast(
      isEn
        ? `⚡ Instant 100% Auto-Refund triggered! ${amount.toLocaleString('en-US')} SYP credited to your wallet.`
        : `⚡ تم تفعيل الاسترداد التلقائي الفوري! أودع ${amount.toLocaleString('ar-SY')} ل.س في محفظتك بنجاح.`,
      'account_balance_wallet',
      'success'
    );
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      onShowToast(isEn ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول لتقديم التذكرة', 'warning', 'error');
      return;
    }

    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: isEn ? 'Just now' : 'الآن',
      customerName: 'رامي السعيد',
      customerPhone: '0944-123456',
      orderId: newTicketOrder.trim() || undefined,
      category: newTicketCategory,
      issueType: 'general',
      subject: newTicketSubject,
      message: newTicketMessage,
      status: 'open',
      adminDecision: 'pending',
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    await persistSupportTicketToDb(newTicket);
    setNewTicketSubject('');
    setNewTicketOrder('');
    setNewTicketMessage('');
    onShowToast(
      isEn ? `Support ticket #${newTicket.id} submitted successfully!` : `تم فتح تذكرة دعم فني جديدة رقم #${newTicket.id} بنجاح!`,
      'headset_mic',
      'success'
    );
  };

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="w-full flex flex-col gap-6 relative">
      {/* Consumer Profile Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#00855d] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
            {isEn ? 'RS' : 'ر.س'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold">
                {tr.rescuerLabel}
              </span>
              <span className="text-xs text-slate-500 font-semibold">{tr.appName}</span>
            </div>
            <h1 className="text-xl font-bold text-[#131b2e] mt-0.5">
              {isEn ? 'Rescuer: Rami Al-Saeed' : 'المنقذ: رامي السعيد'}
            </h1>
            
            {/* Impact Metrics Mini-Dashboard */}
            <div className="flex items-center gap-3 mt-1.5 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-1 shrink-0">
                 <span className="material-symbols-outlined text-[14px] text-[#006948]">restaurant</span>
                 <span className="text-[10px] font-bold text-slate-600">12 وجبة منقذة</span>
               </div>
               <div className="flex items-center gap-1 shrink-0">
                 <span className="material-symbols-outlined text-[14px] text-[#006948]">scale</span>
                 <span className="text-[10px] font-bold text-slate-600">8.5 كغ محفوظ</span>
               </div>
               <div className="flex items-center gap-1 shrink-0">
                 <span className="material-symbols-outlined text-[14px] text-[#006948]">eco</span>
                 <span className="text-[10px] font-bold text-slate-600">18 كغ CO2</span>
               </div>
            </div>
          </div>
        </div>

        {/* Quick Balance & Support Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#f5fff7] border border-[#85f8c4] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">account_balance_wallet</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">
                {isEn ? 'Barakah Wallet Balance:' : 'رصيد محفظة بركة:'}
              </span>
              <span className="text-sm font-bold text-[#006948] font-mono">
                {walletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
              </span>
            </div>
            <button
              onClick={onOpenTopup}
              className={`mr-2 px-2.5 py-1 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-[11px] font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1`}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>{isEn ? 'Top Up' : 'شحن الرصيد'}</span>
            </button>
          </div>

          <button
            onClick={() => setActiveSubTab('support')}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#006948] text-[18px]">support_agent</span>
            <span>{isEn ? 'Support & AI Chat' : 'تواصل معنا وشات AI'}</span>
          </button>
        </div>
      </div>

      {/* 1. BILINGUAL LOCATION, GPS RADIUS & DELIVERY TOGGLE BAR */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
        {/* Top: Delivery Context Toggle (Self-Pickup GPS vs Home Delivery) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-[#eaedff] p-1 rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
            <button
              onClick={() => {
                setFulfillmentContext('pickup');
                onShowToast(isEn ? 'Switched to Self-Pickup Mode (GPS)' : 'تم التبديل إلى نمط الاستلام المباشر من المتجر', 'storefront');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                fulfillmentContext === 'pickup'
                  ? 'bg-[#006948] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>{tr.pickupMode}</span>
            </button>

            <button
              onClick={() => {
                setFulfillmentContext('delivery');
                onShowToast(isEn ? 'Switched to Home Delivery Address' : 'تم التبديل إلى عنوان التوصيل المنزلي', 'local_shipping');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                fulfillmentContext === 'delivery'
                  ? 'bg-[#006948] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              <span>{tr.deliveryMode}</span>
            </button>
          </div>

          {/* Auto-Detect Location Display & Trigger */}
          {fulfillmentContext === 'delivery' ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">{isEn ? 'Deliver to:' : 'التوصيل إلى:'}</span>
              {isEditingAddress ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#006948]"
                  />
                  <button
                    onClick={() => setIsEditingAddress(false)}
                    className="px-2.5 py-1 bg-[#006948] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {isEn ? 'Save' : 'حفظ'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                  <span className="material-symbols-outlined text-[16px] text-[#006948]">home</span>
                  <span className="truncate max-w-xs">{deliveryAddress}</span>
                  <button
                    onClick={() => setIsEditingAddress(true)}
                    className="text-[#006948] text-[11px] underline hover:text-[#00855d] cursor-pointer"
                  >
                    {tr.changeAddress}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onAutoDetectLocation}
                disabled={isGpsLoading}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  detectedLocation
                    ? 'bg-[#f5fff7] text-[#006948] border-[#85f8c4] ring-1 ring-[#006948]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isGpsLoading ? 'animate-spin' : 'text-[#006948]'}`}>
                  {isGpsLoading ? 'refresh' : 'my_location'}
                </span>
                <span>{isGpsLoading ? tr.gpsLocating : tr.gpsNearMe}</span>
              </button>

              {detectedLocation && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isEn ? 'GPS Active:' : 'تم التحديد:'} {isEn ? detectedLocation.dist_en : detectedLocation.dist_ar} ✓
                </span>
              )}
            </div>
          )}
        </div>

        {/* GPS Radius Slider Only (Manual Dropdowns Removed) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 text-xs">
          <div className="md:col-span-12 flex flex-col justify-between p-4 rounded-2xl bg-[#f2f3ff] border border-slate-200">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006948]">radar</span>
                <span className="text-sm">{tr.radiusKm}:</span>
              </span>
              <span className="font-mono text-base text-[#006948] bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                {searchRadiusKm} {tr.kmUnit}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#006948] mt-3"
            />
            <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-bold px-1">
              <span>1 {tr.kmUnit}</span>
              <span>5 {tr.kmUnit}</span>
              <span>10 {tr.kmUnit}</span>
              <span>15 {tr.kmUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consumer Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'catalog'
              ? 'bg-[#006948] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">storefront</span>
          <span>{tr.tabCatalog}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('active_orders')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'active_orders'
              ? 'bg-[#006948] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>{tr.tabOrders}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wallet')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'wallet'
              ? 'bg-[#006948] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          <span>{tr.tabWallet}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('impact')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'impact'
              ? 'bg-[#006948] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">eco</span>
          <span>{tr.tabImpact}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('support')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'support'
              ? 'bg-[#006948] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          <span>{tr.tabSupport}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeSubTab === 'catalog' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Urgent Banner */}
          <div className="bg-[#f2f3ff] border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006948] text-[20px]">info</span>
              <span>{tr.saveSurplusNotice}</span>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white text-[#006948] font-bold border border-slate-200 text-[11px]">
              {detectedLocation ? `${filteredBoxes.length} ${tr.boxesCount} (${searchRadiusKm} ${tr.kmUnit})` : `${filteredBoxes.length} ${tr.boxesCount}`}
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
            {[
              { id: 'all', label: tr.allBoxes, icon: 'lunch_dining' },
              { id: 'produce', label: isEn ? 'Fruits & Veggies' : 'خضار وفواكه', icon: 'eco' },
              { id: 'grocery', label: isEn ? 'Grocery' : 'بقالة ومواد غذائية', icon: 'shopping_basket' },
              { id: 'bakeries', label: isEn ? 'Bakeries' : 'مخابز', icon: 'bakery_dining' },
              { id: 'restaurants', label: isEn ? 'Restaurants' : 'مطاعم', icon: 'restaurant' },
              { id: 'sweets', label: tr.sweets, icon: 'icecream' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBoxes.map((box) => (
              <div
                key={box.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={box.image}
                    alt={box.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Surprise Box Tag */}
                  <div className={`absolute top-3 ${isEn ? 'left-3' : 'right-3'} flex flex-col gap-1.5`}>
                    <div className="bg-[#006948] text-[#85f8c4] font-bold text-[10px] px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      {isEn ? 'Surprise Box' : 'صندوق مفاجآت بركة'}
                    </div>
                    <div className="bg-red-600 text-white font-bold text-[10px] px-2 py-1 rounded-lg shadow-lg text-center">
                      {tr.savePercent} {box.discountPercent}%
                    </div>
                  </div>
                  
                  <div className={`absolute top-3 ${isEn ? 'right-3' : 'left-3'} bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-amber-500 text-[14px]">star</span>
                    <span>{box.rating}</span>
                  </div>

                  {/* Real Pickup Countdown (Simulated) */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[14px] text-amber-400">timer</span>
                    <span>{isEn ? 'Ends in:' : 'ينتهي خلال:'} 02:45:12</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold">{box.vendor}</span>
                      <span className="text-[#006948] font-bold">
                        {tr.stockRemaining} {box.stockLeft} {tr.boxesCount}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{box.title}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{box.description}</p>
                    
                    {/* Allergen Warning */}
                    <div className="mt-2 flex items-center gap-1 text-[9px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      {isEn ? 'May contain allergens (Gluten, Dairy)' : 'قد يحتوي على مسببات حساسية (غلوتين، ألبان)'}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block font-mono leading-none">
                        {box.originalPrice.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                      </span>
                      <span className="text-base font-bold text-[#006948] font-mono">
                        {box.discountedPrice.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setBookingModalBox(box);
                        setOrderType(fulfillmentContext);
                        setPaymentMethod('wallet');
                      }}
                      className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                      <span>{tr.bookBoxBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE & PAST ORDERS WITH ORDER-LINKED SUPPORT */}
      {activeSubTab === 'active_orders' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Active Order Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#131b2e]">
                  {isEn ? 'Current Active Reserved Basket' : 'السلة المحجوزة الحالية (النشطة)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Show the security PIN code to cashier or report issues instantly' : 'أظهر كود PIN للتاجر بالفرع أو أبلغ عن أي مشكلة فوراً'}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#006948] text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{tr.readyToPickup}</span>
              </span>
            </div>

            <div className="bg-[#f2f3ff] rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-200">
                  <span className="material-symbols-outlined text-[36px] text-[#006948]">qr_code_2</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block font-mono">
                    {activeOrderVoucher.orderId} • {activeOrderVoucher.governorate}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{activeOrderVoucher.vendor}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{activeOrderVoucher.itemDesc}</p>
                </div>
              </div>

              {/* High-Visibility Large QR / PIN Area */}
              <div className="bg-white p-6 rounded-[32px] border-4 border-[#006948]/10 text-center shadow-lg relative group">
                <button 
                  onClick={() => setIsQrEnlarged(true)}
                  className="w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 mx-auto border-2 border-slate-200 overflow-hidden cursor-zoom-in relative"
                >
                   <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BARAKAH-${activeOrderVoucher.orderId}-${activeOrderVoucher.pin}`} 
                    alt="QR Code"
                    className="w-full h-full object-contain p-2"
                   />
                   <div className="absolute inset-0 bg-[#006948]/0 hover:bg-[#006948]/5 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-white opacity-0 hover:opacity-100 drop-shadow-md">zoom_in</span>
                   </div>
                </button>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tr.quickPin}</span>
                <span className="text-3xl font-black font-mono tracking-[0.2em] text-[#006948] block mt-1">
                  {activeOrderVoucher.pin}
                </span>
              </div>
            </div>

            {/* Action Bar for this Order */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                onClick={() => setShowVoucherModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>{tr.viewFullVoucher}</span>
              </button>

              {/* Order-Linked Support CTA */}
              <button
                onClick={() =>
                  setOrderHelpTarget({
                    id: activeOrderVoucher.orderId,
                    vendor: activeOrderVoucher.vendor,
                    itemDesc: activeOrderVoucher.itemDesc,
                    amount: activeOrderVoucher.amount,
                    governorate: activeOrderVoucher.governorate,
                    pickupTime: activeOrderVoucher.pickupTime,
                  })
                }
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-700">help_center</span>
                <span>{tr.needHelpWithOrder}</span>
              </button>
            </div>
          </div>

          {/* Past Completed Order with Help CTA */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900">
              {isEn ? 'Past Completed Orders Archive:' : 'سجل الطلبات السابقة المكتملة:'}
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006948] flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{pastCompletedOrder.vendor}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{pastCompletedOrder.orderId}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] block">{pastCompletedOrder.itemDesc}</span>
                  <span className="text-slate-400 text-[10px]">{pastCompletedOrder.pickupTime}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {pastCompletedOrder.amount.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                </span>
                <button
                  onClick={() =>
                    setOrderHelpTarget({
                      id: pastCompletedOrder.orderId,
                      vendor: pastCompletedOrder.vendor,
                      itemDesc: pastCompletedOrder.itemDesc,
                      amount: pastCompletedOrder.amount,
                      governorate: pastCompletedOrder.governorate,
                      pickupTime: pastCompletedOrder.pickupTime,
                    })
                  }
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-amber-600">report_problem</span>
                  <span>{tr.reportQualityIssue}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WALLET */}
      {activeSubTab === 'wallet' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#131b2e]">{tr.tabWallet}</h2>
              <p className="text-xs text-slate-500">
                {isEn ? 'National Electronic Payment Gateway & Syrian Banks' : 'تسديد سريع وسحب فوري متصل مع شبكة الدفع الإلكتروني الوطنية والمصارف السورية'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDeductWallet(-50000)}
                title={isEn ? 'Demo Topup (+50k)' : 'شحن تجريبي (+50 ألف)'}
                className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors cursor-pointer border border-amber-200 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">science</span>
              </button>
              <button
                onClick={onOpenTopup}
                className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>{isEn ? 'Top Up Wallet' : 'شحن رصيد إضافي'}</span>
              </button>

              <button
                onClick={onOpenPayout}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#006948]">security</span>
                <span>{tr.withdrawAction}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#006948] to-[#005137] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">{isEn ? 'Available Balance' : 'الرصيد المتاح للسداد'}</span>
                <span className="material-symbols-outlined text-white/80 text-[20px]">account_balance_wallet</span>
              </div>
              <div className="my-3">
                <span className="text-3xl font-bold font-mono tracking-tight">
                  {walletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')}
                </span>
                <span className="text-xs text-white/80 mr-1.5">{tr.currency}</span>
              </div>
              <span className="text-[10px] text-[#85f8c4]">
                {isEn ? 'Zero wait instant refunds & fast checkout' : 'سداد فوري واسترداد لحظي عند الإلغاء'}
              </span>
            </div>

            <div className="bg-[#f2f3ff] p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold">{isEn ? 'Linked Syrian Card' : 'البطاقات البنكية المربوطة'}</span>
                <span className="material-symbols-outlined text-[#006948] text-[20px]">credit_card</span>
              </div>
              <div className="my-2">
                <span className="text-xs font-bold text-slate-800 block">
                  {isEn ? 'Commercial Bank of Syria (CBS)' : 'المصرف التجاري السوري (CBS)'}
                </span>
                <span className="text-xs font-mono text-slate-500 mt-0.5 block" dir="ltr">
                  •••• •••• •••• 4120
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">
                {isEn ? 'National Payment Gateway Active' : 'بوابة الدفع الإلكتروني الوطنية مفعّلة'}
              </span>
            </div>

            <div className="bg-[#f2f3ff] p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold">{isEn ? 'Total Rescued Savings' : 'إجمالي التوفير في سوريا'}</span>
                <span className="material-symbols-outlined text-[#855300] text-[20px]">savings</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-[#855300]">
                  128,500 {tr.currency}
                </span>
              </div>
              <span className="text-[10px] text-amber-700 font-bold">
                {isEn ? 'Saved by rescuing surprise baskets' : 'وفرتها من خلال إنقاذ سلال البركة'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONSUMER ENVIRONMENTAL IMPACT & MILESTONE REWARDS */}
      {activeSubTab === 'impact' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold">
                {isEn ? 'Personal Impact & Gamification' : 'الأثر البيئي وحوافز الإنجاز'}
              </span>
              <span className="text-xs text-slate-500">{tr.appName}</span>
            </div>
            <h2 className="text-lg font-bold text-[#131b2e]">{tr.personalImpactTitle}</h2>
            <p className="text-xs text-slate-500">
              {tr.personalImpactSub}
            </p>
          </div>

          {/* 4 Core Consumer Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col justify-between">
              <span className="text-xs text-slate-600 font-bold block mb-1">{tr.personalSavedBoxes}</span>
              <span className="text-3xl font-bold text-[#006948] block font-mono">14 {tr.boxesCount}</span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-2 block">
                {isEn ? 'Rescued directly by you' : 'أنقذتها بنفسك في سوريا'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col justify-between">
              <span className="text-xs text-slate-600 font-bold block mb-1">{tr.personalMoneySaved}</span>
              <span className="text-3xl font-bold text-amber-700 block font-mono">
                {(128500).toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold mt-2 block">
                {isEn ? 'Net cash saved' : 'صافي التوفير بميزانيتك'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col justify-between">
              <span className="text-xs text-slate-600 font-bold block mb-1">{tr.personalFoodMass}</span>
              <span className="text-3xl font-bold text-[#0058be] block font-mono">38.5 kg</span>
              <span className="text-[10px] text-blue-800 font-semibold mt-2 block">
                {isEn ? 'Fresh food rescued from waste' : 'طعام طازج حُمي من التلف'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col justify-between">
              <span className="text-xs text-slate-600 font-bold block mb-1">{tr.personalCo2Offset}</span>
              <span className="text-3xl font-bold text-teal-800 block font-mono">82.0 kg</span>
              <span className="text-[10px] text-teal-800 font-semibold mt-2 block">
                {isEn ? 'Carbon footprint offset' : 'انبعاثات CO2 تم تحييدها'}
              </span>
            </div>
          </div>

          {/* Gamification Progress Bar & Milestone Wallet Reward */}
          <div className="bg-gradient-to-l from-[#006948] via-[#005c3f] to-[#00422c] text-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                    Tier 1 Goal
                  </span>
                  <span className="text-xs text-emerald-200">{tr.milestoneTitle}</span>
                </div>
                <h3 className="text-base font-bold">{tr.milestoneSub}</h3>
              </div>

              {/* Interactive Claim Button */}
              {hasClaimedMilestone ? (
                <div className="bg-white/20 px-4 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-white">
                  <span className="material-symbols-outlined text-[#85f8c4] text-[18px]">verified</span>
                  <span>{isEn ? '5,000 SYP Credited ✓' : 'تم استلام 5,000 ل.س بالمحفظة ✓'}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setHasClaimedMilestone(true);
                    onDeductWallet(-5000);
                    onShowToast(
                      isEn
                        ? '🎉 Congratulations! 5,000 SYP milestone reward credited to your wallet!'
                        : '🎉 تهانينا! تم تحصيل مكافأة إنجاز حفظ النعمة (+5,000 ل.س) في محفظتك بنجاح!',
                      'verified',
                      'success'
                    );
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#85f8c4] hover:bg-[#6ee8b0] text-[#002114] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">redeem</span>
                  <span>{tr.claimRewardBtn}</span>
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-emerald-100 font-semibold">
                <span>
                  {isEn ? 'Current: ' : 'الإنجاز الحالي: '}
                  <strong className="text-white font-mono">14</strong> / 10 {tr.boxesCount} (100% {isEn ? 'Completed' : 'مكتمل'})
                </span>
                <span>
                  {isEn ? 'Next: 25 Boxes' : 'الهدف القادم: 25 سلة'} (15,000 {tr.currency})
                </span>
              </div>
              <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
                <div className="h-full bg-gradient-to-r from-[#85f8c4] to-emerald-300 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEDICATED SUPPORT, BILINGUAL AI CHAT, & CUSTOMER CARE (NO WHATSAPP!) */}
      {activeSubTab === 'support' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          <div className="bg-gradient-to-l from-[#006948] via-[#00855d] to-[#005137] text-white rounded-3xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <span className="material-symbols-outlined text-[28px] text-[#85f8c4]">support_agent</span>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                  {tr.supportHubTitle}
                </span>
                <h2 className="text-xl font-bold mt-1">{tr.tabSupport}</h2>
                <p className="text-xs text-white/80 mt-0.5">{tr.supportHubSub}</p>
              </div>
            </div>

            {/* Quick Hotline numbers */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href="tel:0119048"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>{isEn ? 'Damascus: 011-9048' : 'دمشق: 011-9048'}</span>
              </a>

              <a
                href="tel:0214450"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>{isEn ? 'Aleppo: 021-4450' : 'حلب: 021-4450'}</span>
              </a>
            </div>
          </div>

          {/* Grid: Left = Bilingual AI Assistant, Right = Customer Service & Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col">
              <AIAssistantChat lang={lang} />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Form to submit a new ticket */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-[#006948] text-[22px]">contact_support</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{tr.openNewTicket}</h3>
                    <p className="text-[11px] text-slate-500">
                      {isEn ? 'Automated review & fast ticket handling' : 'مراجعة أوتوماتيكية واستجابة سريعة'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateSupportTicket} className="flex flex-col gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{tr.ticketCategoryLabel}:</label>
                    <select
                      value={newTicketCategory}
                      onChange={(e) => setNewTicketCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#006948] focus:bg-white"
                    >
                      <option value="المتجر كان مغلقاً عند الوصول">
                        {isEn ? 'Store was closed upon arrival (Instant Auto-Refund)' : 'المتجر كان مغلقاً عند الوصول (استرداد فوري)'}
                      </option>
                      <option value="محتويات السلة ناقصة، تالفة، أو منتهية الصلاحية">
                        {isEn ? 'Box items missing, damaged, or expired' : 'محتويات السلة ناقصة أو تالفة'}
                      </option>
                      <option value="تم الدفع ولم يتم تأكيد الطلب">
                        {isEn ? 'Payment debited but order unconfirmed' : 'تم الدفع ولم يتم تأكيد الطلب'}
                      </option>
                      <option value="مشكلة في التوصيل أو السائق">
                        {isEn ? 'Delivery driver delay or address issue' : 'مشكلة في التوصيل أو السائق'}
                      </option>
                      <option value="سداد وبطاقة بنكية">
                        {isEn ? 'Syrian Bank Card inquiries' : 'سداد وبطاقة بنكية مصرفية'}
                      </option>
                      <option value="استفسار عام">
                        {isEn ? 'General inquiry' : 'استفسار عام'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{tr.orderNumberOptional}:</label>
                    <input
                      type="text"
                      value={newTicketOrder}
                      onChange={(e) => setNewTicketOrder(e.target.value)}
                      placeholder="#BB-9048"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#006948] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{tr.subjectLabel}:</label>
                    <input
                      type="text"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder={isEn ? 'Brief topic title' : 'اكتب عنواناً مختصراً للمشكلة أو الاستفسار'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#006948] focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{tr.detailsLabel}:</label>
                    <textarea
                      rows={3}
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      placeholder={isEn ? 'Provide comprehensive details of the issue...' : 'اشرح المشكلة بالتفصيل...'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#006948] focus:bg-white"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>{tr.sendTicketBtn}</span>
                  </button>
                </form>
              </div>

              {/* Tickets List */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-[#006948]">history</span>
                    <span>{tr.myTicketsHistory} ({supportTickets.length}):</span>
                  </h4>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto no-scrollbar">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#006948] font-mono">{t.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'auto_refunded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'resolved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status === 'auto_refunded'
                            ? isEn ? 'Auto-Refunded ⚡' : 'مسترد آلياً ⚡'
                            : t.status === 'resolved'
                            ? isEn ? 'Resolved' : 'تم الحل'
                            : isEn ? 'Under Review' : 'قيد المراجعة'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">{t.subject}</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{t.message}</p>
                      {t.response && (
                        <div className="mt-2 pt-2 border-t border-slate-200 bg-white p-2 rounded-xl text-[11px] text-emerald-900 border border-emerald-100">
                          <span className="font-bold block text-[#006948]">
                            {isEn ? 'Support Resolution:' : 'رد خدمة العملاء:'}
                          </span>
                          <span>{t.response}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UNIFIED BILINGUAL FLOATING SUPPORT WIDGET (NO WHATSAPP!) */}
      <div className={`fixed bottom-6 ${isEn ? 'right-6' : 'left-6'} z-40`}>
        {!isFloatingSupportOpen ? (
          <button
            onClick={() => setIsFloatingSupportOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-l from-[#006948] to-[#005137] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer border-2 border-[#85f8c4]/40"
          >
            <div className="relative">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            </div>
            <div className={isEn ? 'text-left' : 'text-right'}>
              <span className="text-xs font-bold block leading-none">{tr.floatingSupportLabel}</span>
              <span className="text-[10px] text-emerald-200">{tr.floatingSupportSub}</span>
            </div>
          </button>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-5">
            <AIAssistantChat onClose={() => setIsFloatingSupportOpen(false)} isFloating={true} lang={lang} />
          </div>
        )}
      </div>

      {/* Order-Linked Support Help Modal */}
      {orderHelpTarget && (
        <OrderHelpModal
          isOpen={!!orderHelpTarget}
          onClose={() => setOrderHelpTarget(null)}
          order={orderHelpTarget}
          onTriggerAutoRefund={handleAutoRefund}
          onSubmitTicket={(newTicket) => {
            setSupportTickets((prev) => [newTicket, ...prev]);
            onShowToast(
              isEn ? `Dispute recorded for order #${newTicket.orderId}` : `تم تسجيل البلاغ الخاص بالطلب #${newTicket.orderId} بنجاح`,
              'verified',
              'success'
            );
          }}
          onOpenAIChat={() => setIsFloatingSupportOpen(true)}
          lang={lang}
        />
      )}

      {/* Booking Modal with Payment Method & Cash Rule */}
      {bookingModalBox && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            dir={isEn ? 'ltr' : 'rtl'}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh]"
          >
            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006948] text-[24px]">shopping_bag</span>
                <div>
                  <h3 className="font-bold text-sm text-[#131b2e]">
                    {isEn ? 'Confirm Barakah Basket Reservation' : 'تأكيد حجز سلة بركة'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {bookingModalBox.vendor} ({bookingModalBox.governorate})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setBookingModalBox(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs overflow-y-auto">
              <div className="bg-[#f2f3ff] p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{bookingModalBox.description}</span>
                  <span className="text-slate-500 text-[11px]">
                    {isEn ? 'Pickup window today:' : 'نافذة الاستلام اليوم:'} {bookingModalBox.pickupStart} - {bookingModalBox.pickupEnd}
                  </span>
                </div>
                <span className="text-lg font-bold text-[#006948] font-mono">
                  {bookingModalBox.discountedPrice.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                </span>
              </div>

              {/* STEP 1: Fulfillment Type (Self Pickup vs Delivery) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  {isEn ? 'Choose Fulfillment Method:' : 'اختر طريقة الاستلام:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`p-3 rounded-2xl border ${isEn ? 'text-left' : 'text-right'} transition-all cursor-pointer flex flex-col gap-1 ${
                      orderType === 'pickup'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {isEn ? 'In-Store Self-Pickup (GPS)' : 'استلام ذاتي من الفرع'}
                      </span>
                      <span className="material-symbols-outlined text-[#006948] text-[18px]">storefront</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {isEn ? '(Cash or Electronic Payment)' : '(يتيح الدفع نقداً كاش أو إلكترونياً)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('delivery');
                      if (paymentMethod === 'cash') {
                        setPaymentMethod('card');
                        onShowToast(
                          isEn
                            ? 'Switched to Bank Card: Cash on delivery is only available for in-store pickup.'
                            : 'تم تحويل وسيلة السداد إلى بطاقة بنكية لأن الدفع كاش متاح فقط عند الاستلام من الفرع',
                          'info'
                        );
                      }
                    }}
                    className={`p-3 rounded-2xl border ${isEn ? 'text-left' : 'text-right'} transition-all cursor-pointer flex flex-col gap-1 ${
                      orderType === 'delivery'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {isEn ? 'Home Delivery by Captain' : 'توصيل منزلي بالكابتن'}
                      </span>
                      <span className="material-symbols-outlined text-[#006948] text-[18px]">two_wheeler</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {isEn ? '(Prepaid Electronic Only)' : '(يتطلب سداداً إلكترونياً مسبقاً)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* STEP 2: Payment Method */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  {isEn ? 'Select Payment Method:' : 'اختر وسيلة الدفع:'}
                </label>
                <div className="flex flex-col gap-2">
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'card' ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-[#006948]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 block">
                            {isEn ? 'Syrian Bank Card (ATM/Debit)' : 'بطاقة بنكية مصرفية'}
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            {isEn ? 'National Gateway' : 'بوابة الدفع الوطنية'}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {isEn ? 'CBS, Bemo, Al Baraka, SIIB' : 'المصرف التجاري، بنك بيمو، البركة، الدولي الإسلامي'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006948]">credit_card</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('wallet')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'wallet' ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'wallet'}
                        onChange={() => setPaymentMethod('wallet')}
                        className="accent-[#006948]"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {isEn ? 'Barakah Digital Wallet' : 'محفظة بركة الرقمية'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {isEn ? 'Balance:' : 'الرصيد المتاح:'} {walletBalance.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#006948]">account_balance_wallet</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('shamcash')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'shamcash' ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === 'shamcash'}
                        onChange={() => setPaymentMethod('shamcash')}
                        className="accent-[#006948]"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">شام كاش (ShamCash)</span>
                        <span className="text-slate-400 text-[10px]">
                          {isEn ? 'Direct debit from ShamCash' : 'اقتطاع فوري ومباشر'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">SC</span>
                  </label>

                  {/* Cash Option: ONLY IF PICKUP */}
                  <label
                    onClick={() => {
                      if (orderType === 'pickup') {
                        setPaymentMethod('cash');
                      } else {
                        onShowToast(
                          isEn
                            ? 'Cash payment is strictly available for In-Store Pickup only!'
                            : 'سداد الكاش متاح حصرياً عند الاستلام من المتجر (الفرع)!',
                          'warning',
                          'error'
                        );
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      orderType === 'delivery'
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 border-dashed border-slate-300'
                        : paymentMethod === 'cash'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948] cursor-pointer'
                        : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="pay"
                        disabled={orderType === 'delivery'}
                        checked={paymentMethod === 'cash'}
                        onChange={() => {
                          if (orderType === 'pickup') setPaymentMethod('cash');
                        }}
                        className="accent-[#006948]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 block">
                            {isEn ? 'Cash on In-Store Pickup' : 'سداد الكاش نقداً عند الاستلام'}
                          </span>
                          {orderType === 'pickup' ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              {isEn ? 'Available In-Store' : 'متاح بالفرع'}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                              {isEn ? 'Disabled for Delivery' : 'معطل للتوصيل'}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-[10px]">
                          {orderType === 'pickup'
                            ? isEn ? 'Pay cash in-person upon showing PIN' : 'تسديد القيمة للمتجر يداً بيد عند إبراز رمز PIN'
                            : isEn ? 'Disabled for home delivery' : 'غير متاح للتوصيل المنزلي (متاح فقط عند الاستلام من الفرع)'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-500">payments</span>
                  </label>
                </div>
              </div>

              {/* If Card Payment: Input card details */}
              {paymentMethod === 'card' && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2.5 animate-in fade-in">
                  <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#006948]">credit_card</span>
                    <span>{isEn ? 'Syrian Bank Card Credentials:' : 'بيانات البطاقة المصرفية السورية:'}</span>
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">
                      {isEn ? 'Issuing Syrian Bank:' : 'المصرف المصدِر:'}
                    </label>
                    <select
                      value={cardBank}
                      onChange={(e) => setCardBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                    >
                      <option>المصرف التجاري السوري (CBS)</option>
                      <option>بنك بيمو السعودي الفرنسي (BBSF)</option>
                      <option>بنك البركة سورية (Al Baraka Bank)</option>
                      <option>بنك سورية الدولي الإسلامي (SIIB)</option>
                      <option>بنك الشام (Cham Bank)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">
                        {isEn ? 'Card Number (16 Digits):' : 'رقم البطاقة:'}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono text-left text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-semibold">
                        {isEn ? 'Exp:' : 'الانتهاء:'}
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono text-center text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#f2f3ff] p-4 flex items-center justify-between gap-3 border-t border-slate-200 text-xs">
              <button
                onClick={() => setBookingModalBox(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isBookingProcessing}
                className="flex-1 py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isBookingProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>{isEn ? 'Processing reservation...' : 'جاري معالجة الطلب...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>
                      {isEn
                        ? `Confirm Reservation (${bookingModalBox.discountedPrice.toLocaleString('en-US')} SYP)`
                        : `تأكيد الحجز (${bookingModalBox.discountedPrice.toLocaleString('ar-SY')} ل.س)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            dir={isEn ? 'ltr' : 'rtl'}
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-5 flex flex-col items-center text-center gap-4 border border-slate-200 animate-in fade-in zoom-in-95"
          >
            <div className="w-12 h-12 rounded-full bg-[#85f8c4] text-[#002114] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#131b2e]">
                {isEn ? 'Pickup Security Voucher' : 'وثيقة استلام سلة بركة'}
              </h4>
              <p className="text-xs text-slate-500">
                {activeOrderVoucher.vendor} ({activeOrderVoucher.governorate})
              </p>
            </div>

            <div className="bg-[#f2f3ff] p-4 rounded-2xl w-full flex flex-col items-center gap-2 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {isEn ? 'Security Redemption PIN' : 'الرمز السري للاستلام (PIN)'}
              </span>
              <span className="font-mono text-2xl font-bold text-[#006948] tracking-widest bg-white py-1.5 px-4 rounded-xl shadow-sm border border-slate-200">
                {activeOrderVoucher.pin}
              </span>
            </div>

            <div className={`w-full flex flex-col gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 ${isEn ? 'text-left' : 'text-right'}`}>
              <div className="flex justify-between">
                <span>{isEn ? 'Order Reference:' : 'رقم الحجز:'}</span>
                <span className="font-bold text-slate-900 font-mono">{activeOrderVoucher.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Payment:' : 'طريقة السداد:'}</span>
                <span className="font-bold text-[#006948]">{activeOrderVoucher.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Total Amount:' : 'المبلغ:'}</span>
                <span className="font-bold text-slate-900 font-mono">
                  {activeOrderVoucher.amount.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {tr.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Method:' : 'طريقة الاستلام:'}</span>
                <span className="font-bold text-slate-800">
                  {activeOrderVoucher.orderType === 'pickup'
                    ? isEn ? 'In-Store Self Pickup' : 'استلام ذاتي من الفرع'
                    : isEn ? 'Home Delivery by Captain' : 'توصيل منزلي بالكابتن'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isEn ? 'Pickup Window:' : 'نافذة الاستلام:'}</span>
                <span className="font-bold text-slate-800">{activeOrderVoucher.pickupTime}</span>
              </div>
            </div>

            <button
              onClick={() => setShowVoucherModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isEn ? 'Close' : 'إغلاق'}
            </button>
          </div>
        </div>
      )}
      {/* QR Code Enlargement Overlay */}
      <AnimatePresence>
        {isQrEnlarged && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQrEnlarged(false)}
            className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white cursor-zoom-out"
          >
            <div className="bg-white p-8 rounded-[40px] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
               <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=BARAKAH-${activeOrderVoucher.orderId}-${activeOrderVoucher.pin}`} 
                alt="Enlarged QR Code"
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
               />
               <button 
                onClick={() => setIsQrEnlarged(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer text-white"
               >
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>
            <div className="mt-8 text-center" onClick={(e) => e.stopPropagation()}>
               <h3 className="text-xl font-bold">{activeOrderVoucher.vendor}</h3>
               <p className="text-white/60 font-mono mt-1">Order: {activeOrderVoucher.orderId}</p>
               <div className="mt-4 text-4xl font-black tracking-[0.3em] bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
                  {activeOrderVoucher.pin}
               </div>
               <p className="mt-6 text-sm font-bold text-[#85f8c4] flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">qr_code_scanner</span>
                  {isEn ? 'Point the scanner at this code' : 'وجّه الماسح الضوئي نحو هذا الكود'}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
