import React, { useState, useEffect } from 'react';
import { OrderItem, DisputeIncident, CommissionTier, AuditLog, SyrianGovernorate, SupportTicket, Language, RewardRule, UserProfile } from '../types';
import { OrderLifecycleInspector } from './OrderLifecycleInspector';
import { t } from '../data/translations';
import { fetchGovernoratesFromDb, fetchSupportTicketsFromDb } from '../db/supabaseClient';

interface AdminPortalProps {
  orders: OrderItem[];
  disputes: DisputeIncident[];
  commissions: CommissionTier[];
  auditLogs: AuditLog[];
  rewardRules: RewardRule[];
  supportTickets: SupportTicket[];
  partners: UserProfile[];
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  onRefundRescuer: (amount: number) => void;
  onUpdateCommissionRate: (tierId: string, newRate: number) => void;
  onSaveRewardRule: (rule: RewardRule) => void;
  onIssueBonus: (amount: number, reason: string) => void;
  onUpdateUserPassword: (userId: string, newPass: string) => void;
  lang?: Language;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  orders,
  disputes,
  commissions,
  auditLogs,
  rewardRules,
  supportTickets,
  partners,
  onShowToast,
  onRefundRescuer,
  onUpdateCommissionRate,
  onSaveRewardRule,
  onIssueBonus,
  onUpdateUserPassword,
  lang = 'ar',
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];
  const [activeTab, setActiveTab] = useState<'inspector' | 'disputes' | 'settlement' | 'commissions' | 'rewards' | 'partners' | 'audit'>('inspector');
  const [selectedGovernorate, setSelectedGovernorate] = useState<SyrianGovernorate>('الكل');

  // Inspector order target
  const [inspectorOrderId, setInspectorOrderId] = useState<string>('');

  useEffect(() => {
    if (orders.length > 0 && !inspectorOrderId) {
      setInspectorOrderId(orders[0].id);
    }
  }, [orders, inspectorOrderId]);

  // Commission Edit
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [newRateInput, setNewRateInput] = useState<number>(15);

  // Reward Rule Edit
  const [editingReward, setEditingReward] = useState<RewardRule | null>(null);

  // Bonus Issuer
  const [bonusAmount, setBonusAmount] = useState<number>(5000);
  const [bonusReason, setBonusReason] = useState<string>('');
  const [bonusCustomer, setBonusCustomer] = useState<string>('رامي السعيد');

  // Unified Ticket Queue
  const [ticketQueue, setTicketQueue] = useState<SupportTicket[]>([]);

  // Ticket Queue Filter
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<
    'all' | 'pending_auto_refund' | 'food_quality_dispute' | 'no_show_verification' | 'general_inquiry'
  >('all');

  const [governorates, setGovernorates] = useState<SyrianGovernorate[]>(['الكل']);

  useEffect(() => {
    const loadGovs = async () => {
      const data = await fetchGovernoratesFromDb();
      const names = ['الكل' as SyrianGovernorate, ...data.map(g => (isEn ? g.name_en : g.name_ar) as SyrianGovernorate)];
      setGovernorates(names);
    };
    loadGovs();
  }, [isEn]);

  useEffect(() => {
    const loadTickets = async () => {
      const data = await fetchSupportTicketsFromDb();
      setTicketQueue(data);
    };
    loadTickets();
  }, []);

  const filteredTickets = ticketQueue.filter((t) => {
    const matchGov = selectedGovernorate === 'الكل' || t.governorate === selectedGovernorate;
    let matchCat = true;

    if (ticketCategoryFilter === 'pending_auto_refund') {
      matchCat = t.status === 'auto_refunded' || t.issueType === 'store_closed';
    } else if (ticketCategoryFilter === 'food_quality_dispute') {
      matchCat = t.issueType === 'item_damaged';
    } else if (ticketCategoryFilter === 'no_show_verification') {
      matchCat = t.subject.includes('No-Show') || t.subject.includes('تخلف');
    } else if (ticketCategoryFilter === 'general_inquiry') {
      matchCat = t.issueType === 'general' || t.issueType === 'payment_unconfirmed' || t.issueType === 'driver_issue';
    }

    return matchGov && matchCat;
  });

  const filteredAudit = auditLogs.filter(
    (a) => selectedGovernorate === 'الكل' || a.governorate === selectedGovernorate
  );

  // Resolution Action 1: Approve & Issue Wallet Credit
  const handleApproveRefund = (ticket: SupportTicket) => {
    const amount = ticket.refundAmount || 15000;
    onRefundRescuer(amount);

    setTicketQueue((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: 'resolved',
              adminDecision: 'approved_refund',
              response: `تم اعتماد الطلب وإيداع ${amount.toLocaleString('ar-SY')} ل.س فورياً في محفظة المنقذ.`,
              resolutionSpeedMinutes: 3.2,
            }
          : t
      )
    );

    onShowToast(`تم اعتماد وتعبئة محفظة المنقذ (${amount.toLocaleString('ar-SY')} ل.س) للتذكرة #${ticket.id}`, 'verified', 'success');
  };

  // Resolution Action 2: Reject & Notify Rescuer
  const handleRejectTicket = (ticket: SupportTicket) => {
    setTicketQueue((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: 'resolved',
              adminDecision: 'rejected',
              response: 'تم مراجعة الطلب ورفضه لعدم استيفاء شروط الاسترداد (تم الحضور خارج نافذة الاستلام أو الصورة غير مطابقة).',
              resolutionSpeedMinutes: 4.1,
            }
          : t
      )
    );

    onShowToast(`تم رفض التذكرة #${ticket.id} وإرسال إشعار توضيحي للمنقذ`, 'cancel', 'info');
  };

  // Resolution Action 3: Issue Partner Penalty / Warning
  const handlePenalizeMerchant = (ticket: SupportTicket) => {
    setTicketQueue((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              adminDecision: 'penalized_merchant',
              response: `تم تسجيل إنذار رسمي على متجر ${ticket.vendorName} وفرض غرامة 5,000 ل.س لعدم الالتزام بجودة السلة.`,
            }
          : t
      )
    );

    onShowToast(`تم توجيه إنذار رسمي وغرامة تشغيلية على متجر (${ticket.vendorName})`, 'warning', 'error');
  };

  const totalGmv = orders.reduce((acc, o) => acc + o.price, 0);
  const totalNet = orders.reduce((acc, o) => acc + o.merchantNet, 0);
  const totalAuditFailed = auditLogs.filter(a => a.status === 'failed').length;
  const integrityRate = auditLogs.length > 0 ? (100 - (totalAuditFailed / auditLogs.length) * 100).toFixed(1) : '100';

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="w-full flex flex-col gap-6">
      {/* Admin Profile & Governance Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-[#85f8c4] flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                حساب الإدارة والرقابة المركزية
              </span>
              <span className="text-xs text-slate-500 font-semibold">الجمهورية العربية السورية</span>
            </div>
            <h1 className="text-xl font-bold text-[#131b2e] mt-0.5">غرفة العمليات المركزية وإدارة النزاعات</h1>
            <p className="text-xs text-slate-500">
              إشراف شامل على المعاملات الميدانية، الاسترداد التلقائي الفوري، والتسوية القضائية
            </p>
          </div>
        </div>

        {/* Global Syrian KPIs & Quick Tools */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#f2f3ff] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs border border-slate-200">
            <span className="material-symbols-outlined text-[#0058be] text-[18px]">query_stats</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي تداول سوريا (GMV):</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{totalGmv.toLocaleString('ar-SY')} ل.س</span>
            </div>
          </div>

          <div className="bg-[#f5fff7] px-4 py-2 rounded-2xl flex items-center gap-2 text-xs border border-[#85f8c4]">
            <span className="material-symbols-outlined text-[#006948] text-[18px]">verified</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">معدل النزاهة الوطني:</span>
              <span className="text-sm font-bold text-[#006948] font-mono">{integrityRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Syrian Governorate Filter */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
          <span className="material-symbols-outlined text-[#006948] text-[20px]">location_city</span>
          <span>نطاق الرقابة حسب المحافظة:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {governorates.map((gov) => (
            <button
              key={gov}
              onClick={() => {
                setSelectedGovernorate(gov);
                onShowToast(`تم تصفية الرقابة لمحافظة: ${gov}`, 'location_on');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedGovernorate === gov
                  ? 'bg-[#006948] text-white border-[#006948] shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {gov}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('inspector')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inspector' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">timeline</span>
          <span>مفتش تفاصيل الطلب من البداية للنهاية (End-to-End)</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'disputes' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">gavel</span>
          <span>مركز إدارة التذاكر والنزاعات والمطالبات ({filteredTickets.length})</span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settlement' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">call_split</span>
          <span>محرك التقاسم المالي الثلاثي اللحظي</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'commissions' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">percent</span>
          <span>إدارة عمولات الشركاء بالمحافظات</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rewards' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">redeem</span>
          <span>إدارة شرائح المكافآت والبونص</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'partners' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>إدارة الشركاء وكلمات المرور</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          <span>سجل التدقيق الرقمي GPS</span>
        </button>
      </div>

      {/* TAB 1: ORDER LIFECYCLE INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Quick Select Table of All Orders */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">اختر أي طلب لفحص دورة حياته الكاملة:</h3>
                <p className="text-slate-500 text-[11px]">
                  انقر على أي طلب أدناه للاطلاع على تتبعه الشامل منذ لحظة حجزه وحتى إتمام تسويته
                </p>
              </div>
              <span className="text-[#006948] font-bold">
                الطلب النشط حالياً: #BB-{inspectorOrderId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setInspectorOrderId(o.id)}
                  className={`p-3.5 rounded-2xl text-right transition-all border cursor-pointer flex flex-col gap-1 ${
                    inspectorOrderId === o.id
                      ? 'bg-[#f5fff7] border-[#006948] ring-2 ring-[#006948]/20 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono text-[#006948]">#BB-{o.id}</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                      {o.governorate}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 text-xs">{o.customerName}</span>
                  <span className="text-[11px] text-slate-500">{o.storeName}</span>
                  <div className="mt-1 pt-1 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-700">{o.price.toLocaleString('ar-SY')} ل.س</span>
                    <span
                      className={`font-bold ${
                        o.status === 'delivered'
                          ? 'text-[#006948]'
                          : o.status === 'in_transit'
                          ? 'text-amber-600'
                          : o.status === 'cancelled'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {o.status === 'delivered' ? 'مكتمل' : o.status === 'in_transit' ? 'جاري النقل' : o.status === 'cancelled' ? 'ملغي' : 'معلق'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* End-to-End Inspector Card */}
          <OrderLifecycleInspector
            orders={orders}
            selectedOrderId={inspectorOrderId}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* TAB 2: CENTRALIZED SUPPORT & DISPUTE CENTER (BENCHMARKED TO SAUDI BARAKAH) */}
      {activeTab === 'disputes' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Real-time SLA & Performance Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">متوسط سرعة الإغلاق والحل</span>
                <span className="material-symbols-outlined text-[#006948] text-[20px]">speed</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-[#006948]">3.4 دقيقة</span>
                <span className="text-[10px] text-emerald-700 block font-semibold">المعيار القياسي &lt; 5.0 دقائق ✓</span>
              </div>
              <span className="text-[10px] text-slate-400">أسرع بنسبة 42% عن الأسبوع الماضي</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">نسبة الاسترداد التلقائي الفوري</span>
                <span className="material-symbols-outlined text-blue-600 text-[20px]">bolt</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-blue-700">100% فوري</span>
                <span className="text-[10px] text-blue-600 block font-semibold">لحالات إغلاق الفروع المؤكدة</span>
              </div>
              <span className="text-[10px] text-slate-400">دون الحاجة لمراجعة بشرية روتينية</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">معدل رضا المنقذ (RSAT)</span>
                <span className="material-symbols-outlined text-amber-500 text-[20px]">sentiment_very_satisfied</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-slate-900">98.6%</span>
                <span className="text-[10px] text-amber-700 block font-semibold">بناءً على 1,280 تقييم استرداد</span>
              </div>
              <span className="text-[10px] text-slate-400">مؤشر الثقة الأعلى في السوق السوري</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">تذاكر بانتظار الإجراء الآن</span>
                <span className="material-symbols-outlined text-red-600 text-[20px]">pending_actions</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-red-600">
                  {ticketQueue.filter((t) => t.status === 'open').length} تذاكر نشطة
                </span>
                <span className="text-[10px] text-red-700 block font-semibold">تتطلب تدقيق صور الإثبات</span>
              </div>
              <span className="text-[10px] text-slate-400">ضمان الرد خلال 15 دقيقة كحد أقصى</span>
            </div>
          </div>

          {/* Centralized Support Queue Table with Categorization */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">طابور التذاكر والنزاعات المركزية الميدانية:</h3>
                <p className="text-slate-500 text-[11px]">
                  قرارات سريعة بنقرة واحدة لتعويض المنقذين، اعتماد مطالبات تخلف المنقذين للشركاء، وفرض العقوبات
                </p>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending_auto_refund', label: 'استرداد فوري / إغلاق' },
                  { id: 'food_quality_dispute', label: 'نزاعات جودة السلال' },
                  { id: 'no_show_verification', label: 'تخلف المنقذين (No-Show)' },
                  { id: 'general_inquiry', label: 'استفسارات عامة' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTicketCategoryFilter(filter.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      ticketCategoryFilter === filter.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                    <th className="py-2.5 px-3 rounded-r-xl">رقم التذكرة والطلب</th>
                    <th className="py-2.5 px-3">المنقذ والمحافظة</th>
                    <th className="py-2.5 px-3">الشريك المصدر</th>
                    <th className="py-2.5 px-3">نوع البلاغ والتفاصيل</th>
                    <th className="py-2.5 px-3">صورة الإثبات</th>
                    <th className="py-2.5 px-3">الحالة والقرار</th>
                    <th className="py-2.5 px-3 rounded-l-xl text-center">إجراءات الحسم السريعة (One-Click)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-[48px] text-slate-200">folder_off</span>
                          <div className="text-slate-400 font-bold">{isEn ? 'No active tickets in this category' : 'لا توجد تذاكر نشطة في هذا التصنيف حالياً'}</div>
                          <p className="text-[10px] text-slate-300 max-w-[240px] mx-auto">
                            {isEn ? 'System integrity check passed. No pending disputes requiring manual intervention.' : 'تم فحص سلامة النظام بنجاح. لا توجد نزاعات معلقة تتطلب تدخل بشري.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#006948] block">{t.id}</span>
                        <span className="font-mono text-[10px] text-slate-400">طلب #{t.orderId}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold block">{t.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.customerPhone}</span>
                        <span className="text-[10px] text-slate-500 block">{t.governorate}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{t.vendorName}</span>
                        <span className="text-[10px] text-slate-400">{t.createdAt}</span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 block w-max mb-1">
                          {t.category}
                        </span>
                        <span className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{t.message}</span>
                        {t.response && (
                          <div className="mt-1 text-[10px] text-emerald-800 font-medium">
                            الإجراء: {t.response}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {t.proofPhotoUrl ? (
                          <a href={t.proofPhotoUrl} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shadow-2xs hover:scale-105 transition-transform">
                            <img src={t.proofPhotoUrl} alt="إثبات" className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">لا يوجد مرفق</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={t.refundAmount || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value.replace(/\D/g, ''));
                              setTicketQueue(prev => prev.map(item => item.id === t.id ? { ...item, refundAmount: val } : item));
                            }}
                            className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-mono text-[#006948]"
                          />
                          <span className="text-[9px] text-slate-400 block">{tr.currency}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {t.status === 'resolved' || t.status === 'auto_refunded' ? (
                          <span className="text-emerald-700 font-bold text-[10px]">مغلقة وموثقة ✓</span>
                        ) : (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {/* Action 1: Approve Wallet Credit */}
                            <button
                              onClick={() => handleApproveRefund(t)}
                              className="w-full px-2.5 py-1 bg-[#006948] hover:bg-[#00855d] text-white rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer transition-colors"
                            >
                              اعتماد وتعبئة المحفظة
                            </button>

                            <div className="flex items-center gap-1 w-full">
                              {/* Action 2: Reject */}
                              <button
                                onClick={() => handleRejectTicket(t)}
                                className="flex-1 px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold border border-slate-200 cursor-pointer"
                              >
                                رفض وتوضيح
                              </button>

                              {/* Action 3: Penalty */}
                              <button
                                onClick={() => handlePenalizeMerchant(t)}
                                className="flex-1 px-1.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[9px] font-bold border border-red-200 cursor-pointer"
                              >
                                إنذار للمتجر
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENT */}
      {activeTab === 'settlement' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">محرك التقاسم المالي الثلاثي اللحظي</h2>
            <p className="text-xs text-slate-500">
              توزيع إيراد السلال بين الشريك، كابتن التوصيل، والمنصة وفق القوانين السورية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#f5fff7] border border-[#85f8c4]">
              <span className="text-xs text-[#006948] font-bold block">مجموع حصص الشركاء (صافي)</span>
              <span className="text-2xl font-bold text-[#006948] font-mono mt-1 block">{totalNet.toLocaleString('ar-SY')} ل.س</span>
              <span className="text-[11px] text-slate-500 mt-1 block">محولة إلى محافظ الشركاء المسجلين</span>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-800 font-bold block">مجموع أجور الكباتن (85%)</span>
              <span className="text-2xl font-bold text-amber-800 font-mono mt-1 block">15,400,000 ل.س</span>
              <span className="text-[11px] text-slate-500 mt-1 block">مدفوعة فور تسليم كل سلة وإثبات الصورة</span>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs text-blue-800 font-bold block">عمولة المنصة التشغيلية (15%)</span>
              <span className="text-2xl font-bold text-[#0058be] font-mono mt-1 block">21,375,000 ل.س</span>
              <span className="text-[11px] text-slate-500 mt-1 block">تغطية الخوادم وتأمين الاسترداد التلقائي</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">إدارة عمولات الشركاء بالمحافظات السورية</h2>
            <p className="text-xs text-slate-500">التحكم الفوري بنسب المنصة حسب تصنيف النشاط التجاري</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {commissions.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.category}</span>
                    <span className="bg-emerald-100 text-[#006948] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t.badgeText}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">{t.subLabel}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xl font-bold text-[#006948] font-mono">{t.ratePercent}%</span>
                  <button
                    onClick={() => {
                      setEditingTier(t);
                      setNewRateInput(t.ratePercent);
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 cursor-pointer"
                  >
                    تعديل النسبة
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingTier && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4 text-xs">
                <h4 className="font-bold text-sm text-slate-900">تعديل نسبة عمولة {editingTier.category}</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newRateInput}
                      onChange={(e) => setNewRateInput(Number(e.target.value.replace(/\D/g, '')))}
                      className="w-full bg-slate-100 px-3 py-2 rounded-xl text-base font-bold text-slate-800"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setEditingTier(null)} className="px-3 py-1.5 text-slate-600">إلغاء</button>
                  <button
                    onClick={() => {
                      onUpdateCommissionRate(editingTier.id, newRateInput);
                      onShowToast(`تم تحديث عمولة ${editingTier.category} إلى ${newRateInput}%`, 'check_circle', 'success');
                      setEditingTier(null);
                    }}
                    className="px-4 py-1.5 bg-[#006948] text-white rounded-xl font-bold"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REWARD RULES & BONUS ISSUER */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Section 1: Reward Rules Manager */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-[#131b2e]">Reward Rules Manager (إدارة شرائح المكافآت)</h2>
              <p className="text-xs text-slate-500">ضبط المستويات والشرائح لتحفيز المنقذين على حفظ النعمة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewardRules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-2xl bg-[#f2f3ff] border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                      {isEn ? `Tier ${rule.tierLevel}` : `المستوى ${rule.tierLevel}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      <span className="text-[10px] font-bold text-slate-500">{rule.isActive ? 'نشط' : 'معطل'}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{isEn ? rule.title_en : rule.title_ar}</h4>
                  <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                    <p>المعيار: {rule.criteriaType === 'boxes_count' ? 'عدد السلال' : 'حجم الإنفاق'}</p>
                    <p>الهدف: {rule.targetThreshold.toLocaleString()} {rule.criteriaType === 'boxes_count' ? 'سلة' : 'ل.س'}</p>
                    <p className="font-bold text-[#006948]">المكافأة: {rule.rewardAmountSyp.toLocaleString()} ل.س</p>
                  </div>
                  <button
                    onClick={() => setEditingReward(rule)}
                    className="mt-2 w-full py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 text-[11px] cursor-pointer"
                  >
                    تعديل القاعدة
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Manual Bonus Issuer */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">إصدار مكافأة يدوية (Manual Wallet Bonus)</h2>
              <p className="text-xs text-slate-500">تحويل رصيد بونص مباشر للمنقذين المتميزين من أرباح المنصة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">المنقذ المستهدف:</label>
                <input
                  type="text"
                  value={bonusCustomer}
                  onChange={(e) => setBonusCustomer(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="اسم أو هاتف المنقذ"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">مبلغ المكافأة (ل.س):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value.replace(/\D/g, '')))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">سبب المكافأة:</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  placeholder="مثال: شكر على الإنقاذ المستمر"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!bonusReason) {
                  onShowToast('يرجى ذكر سبب المكافأة', 'warning', 'error');
                  return;
                }
                onIssueBonus(bonusAmount, bonusReason);
                setBonusReason('');
              }}
              className="w-full md:w-max px-6 py-3 bg-[#006948] hover:bg-[#00855d] text-white rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">redeem</span>
              <span>إصدار وتحويل المكافأة الآن</span>
            </button>
          </div>

          {/* Reward Edit Modal */}
          {editingReward && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-xs overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-slate-900">تعديل قاعدة المكافأة - المستوى {editingReward.tierLevel}</h4>
                  <button onClick={() => setEditingReward(null)} className="text-slate-400">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold">العنوان (AR):</label>
                    <input
                      type="text"
                      value={editingReward.title_ar}
                      onChange={(e) => setEditingReward({ ...editingReward, title_ar: e.target.value })}
                      className="bg-slate-100 p-2 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold">العنوان (EN):</label>
                    <input
                      type="text"
                      value={editingReward.title_en}
                      onChange={(e) => setEditingReward({ ...editingReward, title_en: e.target.value })}
                      className="bg-slate-100 p-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold">الهدف (Threshold):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editingReward.targetThreshold}
                      onChange={(e) => setEditingReward({ ...editingReward, targetThreshold: Number(e.target.value.replace(/\D/g, '')) })}
                      className="bg-slate-100 p-2 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold">المكافأة (ل.س):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editingReward.rewardAmountSyp}
                      onChange={(e) => setEditingReward({ ...editingReward, rewardAmountSyp: Number(e.target.value.replace(/\D/g, '')) })}
                      className="bg-slate-100 p-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingReward.isActive}
                    onChange={(e) => setEditingReward({ ...editingReward, isActive: e.target.checked })}
                    id="is_active_reward"
                  />
                  <label htmlFor="is_active_reward" className="font-bold">تفعيل القاعدة</label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button onClick={() => setEditingReward(null)} className="px-4 py-2 text-slate-500 font-bold">إلغاء</button>
                  <button
                    onClick={() => {
                      onSaveRewardRule(editingReward);
                      setEditingReward(null);
                    }}
                    className="px-6 py-2 bg-[#006948] text-white rounded-xl font-bold shadow-md"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PARTNERS MANAGEMENT */}
      {activeTab === 'partners' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">إدارة الشركاء وحسابات المتاجر</h2>
              <p className="text-xs text-slate-500">تغيير كلمات المرور، مراجعة الوثائق، وتعديل حالات النشاط</p>
            </div>
            <button className="px-4 py-2 bg-[#006948] text-white rounded-xl text-xs font-bold">إضافة شريك جديد</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">المتجر والشريك</th>
                  <th className="py-3 px-4">المحافظة</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إدارة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold block">{p.storeName || p.name}</span>
                      <span className="text-[10px] text-slate-400">المفوض: {p.name}</span>
                      {p.licenseUrl && (
                        <a href={p.licenseUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-[10px] text-[#006948] font-bold cursor-pointer hover:underline">
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          <span>عرض وثائق المتجر الموثقة</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">{p.location?.address || 'N/A'}</td>
                    <td className="py-3 px-4">{p.phoneNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800`}>
                        نشط
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => {
                          const newPass = prompt(isEn ? 'Enter New Password:' : 'أدخل كلمة المرور الجديدة:');
                          if (newPass) onUpdateUserPassword(p.id, newPass);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                      >
                        إعادة ضبط كلمة المرور
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">سجل التدقيق الرقمي، الـ GPS، والتحويلات المالية (Security Logs)</h2>
            <p className="text-xs text-slate-500">توثيق حي للتحقق الرقمي، صمود جدار الحماية المالي، وعمليات السحب الموثقة</p>
          </div>

          {/* Payout Monitoring Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-[#006948] text-[18px]">security</span>
                <span>طلبات السحب بانتظار المراجعة (Pending Payouts)</span>
              </span>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">الشريك: حلويات دمشق</span>
                <span className="font-bold">45,000 ل.س (شام كاش)</span>
                <button className="px-2 py-1 bg-[#006948] text-white rounded-lg font-bold">موافقة</button>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex flex-col gap-2">
              <span className="font-bold text-red-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-red-600 text-[18px]">gpp_maybe</span>
                <span>تنبيهات جدار الحماية (Security Alerts)</span>
              </span>
              <p className="text-red-700 italic">لا يوجد محاولات اختراق أو تخطي للحدود اليومية حالياً.</p>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                  <th className="py-2.5 px-3 rounded-r-xl">الختم الزمني</th>
                  <th className="py-2.5 px-3">معرف المعاملة</th>
                  <th className="py-2.5 px-3">المحافظة والوجهة</th>
                  <th className="py-2.5 px-3">المتجر / الكابتن</th>
                  <th className="py-2.5 px-3">إحداثيات GPS</th>
                  <th className="py-2.5 px-3 rounded-l-xl">الحالة والنزاهة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{a.timestamp}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#006948]">{a.uuid}</td>
                    <td className="py-3 px-3">{a.governorate} • {a.destination}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold">{a.storeName}</span>
                      <span className="block text-[10px] text-slate-400">الكابتن: {a.driverName}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">{a.gpsCoords}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'disputed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.status === 'verified' ? 'موثق ومعتمد ✓' : a.status === 'disputed' ? 'نزاع نشط' : 'فشل التسليم'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
