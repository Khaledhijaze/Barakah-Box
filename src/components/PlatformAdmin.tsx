import React, { useState } from 'react';
import { DisputeIncident, CommissionTier, AuditLog } from '../types';
import { INITIAL_DISPUTES, INITIAL_COMMISSIONS, INITIAL_AUDIT_LOGS } from '../data/mockData';

interface PlatformAdminProps {
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (screen: any) => void;
  onRefundCustomer: (amount: number) => void;
}

export const PlatformAdmin: React.FC<PlatformAdminProps> = ({
  onShowToast,
  onRefundCustomer,
}) => {
  const [disputes, setDisputes] = useState<DisputeIncident[]>(INITIAL_DISPUTES);
  const [commissions, setCommissions] = useState<CommissionTier[]>(INITIAL_COMMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Delivery Engine Form State
  const [deliveryMode, setDeliveryMode] = useState<'hybrid' | 'self'>('hybrid');
  const [baseFee, setBaseFee] = useState<number>(3500);
  const [extraKmFee, setExtraKmFee] = useState<number>(500);
  const [driverSharePercent, setDriverSharePercent] = useState<number>(85);
  const [peakHoursSurcharge, setPeakHoursSurcharge] = useState<boolean>(true);

  // Modals
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [editRate, setEditRate] = useState<number>(15);
  const [activePhotoProof, setActivePhotoProof] = useState<AuditLog | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Instant Refund
  const handleExecuteRefund = (disp: DisputeIncident) => {
    onRefundCustomer(disp.totalAmount);
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disp.id
          ? {
              ...d,
              status: 'refunded',
            }
          : d
      )
    );
    onShowToast(
      `تم استرداد 100% (${disp.totalAmount.toLocaleString('ar-SY')} ل.س) لمحفظة العميل (${disp.customerName}) فوراً!`,
      'check_circle',
      'success'
    );
  };

  // Handle Commission Update
  const handleSaveCommission = () => {
    if (!editingTier) return;
    setCommissions((prev) =>
      prev.map((t) => (t.id === editingTier.id ? { ...t, ratePercent: editRate } : t))
    );
    onShowToast(`تم تحديث نسبة عمولة (${editingTier.category}) إلى ${editRate}% بنجاح.`, 'check_circle', 'success');
    setEditingTier(null);
  };

  // Filtered Audit Logs
  const filteredAudit = auditLogs.filter(
    (l) =>
      l.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.storeName.includes(searchQuery) ||
      l.customerName.includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Command & Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006948] animate-ping"></span>
            <span className="font-bold text-[#006948]">نظام الإدارة المركزية والامتثال المالي</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">سيرفر دمشق 01 (نشط - تتبع فوري)</span>
          </div>
          <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">
            غرفة التحكم الشاملة واللوجستيات والنزاعات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مراقبة التداولات الحية، تسوية النزاعات الفورية، والتحكم بالعمولات الديناميكية ورسوم التوصيل والتقاسم الثلاثي
          </p>
        </div>

        {/* Quick Action Deck */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-[#eaedff] px-3.5 py-2 rounded-xl flex items-center gap-2 text-slate-800 font-semibold border border-slate-200">
            <span className="material-symbols-outlined text-[18px] text-[#0058be]">database</span>
            <span>تزامن Supabase: لحظي</span>
          </div>
          <button
            onClick={() => onShowToast('جاري تدقيق 18,450 معاملة في قواعد بيانات دمشق... النزاهة 100%', 'verified_user')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-[#855300]">verified_user</span>
            <span>تشغيل تدقيق النزاهة</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>تصدير الميزانية</span>
          </button>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV Metric */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي حجم التداول (GMV)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006948]">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#131b2e] font-mono">
              142,500,000 <span className="text-xs text-slate-400 font-normal">ل.س</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[#006948] text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+23.4% مقارنة بالشهر السابق</span>
            </div>
          </div>
          <div className="mt-3">
            <svg className="w-full h-8 text-[#006948]" fill="none" viewBox="0 0 100 24">
              <path
                d="M0 20 L15 17 L30 19 L45 12 L60 14 L75 8 L90 10 L100 3"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 20 L15 17 L30 19 L45 12 L60 14 L75 8 L90 10 L100 3 L100 24 L0 24 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>
        </div>

        {/* Net Platform Revenue */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">صافي إيرادات وعمولات المنصة</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#855300]">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#855300] font-mono">
              18,525,000 <span className="text-xs text-slate-400 font-normal">ل.س</span>
            </div>
            <div className="text-xs text-amber-700 font-bold mt-1">متوسط العمولة الإجمالية 13.0%</div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
              <div className="bg-amber-500 h-full" style={{ width: '72%' }}></div>
              <div className="bg-blue-600 h-full" style={{ width: '28%' }}></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>اقتطاع مالي: 72%</span>
              <span>اشتراكات: 28%</span>
            </div>
          </div>
        </div>

        {/* Food Saved */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">السلال الغذائية المنقذة من الهدر</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006948]">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#131b2e]">
              18,450 <span className="text-xs text-[#006948] font-bold">سلة بركة</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#006948]">scale</span>
              <span>يعادل 27.6 طن غذاء صالح</span>
            </div>
          </div>
          <div className="mt-3 bg-[#f2f3ff] p-2 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">وفر مالي للمستهلكين:</span>
            <span className="text-[#006948] font-bold">92,250,000 ل.س</span>
          </div>
        </div>

        {/* Partner Network */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">شبكة الشركاء والكباتن</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0058be]">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">متاجر نشطة</span>
              <span className="text-lg font-bold text-slate-800">142</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block">كباتن التوصيل</span>
              <span className="text-lg font-bold text-[#0058be]">68</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#006948]">verified</span>
            <span>معدل رضا المنظومة 98.4%</span>
          </div>
        </div>
      </section>

      {/* 3-Way Financial Settlement Engine Breakdown Widget */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#006948]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006948] text-[24px]">call_split</span>
              <h2 className="text-lg font-bold text-[#131b2e]">محرك التقاسم المالي الثلاثي اللحظي (3-Way Engine)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                نموذج الطلب المنزلي المباشر
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع القيمة الإجمالية تلقائياً بنقرة واحدة بين التاجر، كابتن التوصيل، وحصة منصة بركة التشغيلية
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#f2f3ff] px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">حالة المحفظة المجمعة:</span>
            <span className="font-mono font-bold text-[#006948] text-xs">TXN-SPLIT-AUTOMATED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Customer Invoice */}
          <div className="bg-[#f2f3ff] rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">إجمالي الفاتورة للعميل</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">receipt</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                17,500 <span className="text-xs font-normal text-slate-400">ل.س</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>قيمة السلة:</span>
                <span className="font-bold text-slate-800">14,000 ل.س</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span className="font-bold text-slate-800">3,500 ل.س</span>
              </div>
            </div>
          </div>

          {/* 1. Merchant Split */}
          <div className="bg-white rounded-xl p-4 border-2 border-[#006948] relative shadow-sm flex flex-col justify-between">
            <span className="absolute -top-2.5 right-4 bg-[#006948] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              1. صافي حصة التاجر (85%)
            </span>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">مستحقات المتجر المباشرة</span>
                <span className="material-symbols-outlined text-[#006948] text-[20px]">storefront</span>
              </div>
              <div className="text-2xl font-bold text-[#006948] font-mono">
                11,900 <span className="text-xs font-normal text-slate-400">ل.س</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>اقتطاع عمولة السلة (15%):</span>
                <span className="font-bold text-red-600">-2,100 ل.س</span>
              </div>
              <span className="text-[10px] text-[#006948] block mt-1">تودع فوراً في محفظة التاجر السورية</span>
            </div>
          </div>

          {/* 2. Driver Split */}
          <div className="bg-white rounded-xl p-4 border-2 border-amber-500 relative shadow-sm flex flex-col justify-between">
            <span className="absolute -top-2.5 right-4 bg-amber-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              2. صافي كابتن التوصيل (85%)
            </span>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">أجر الكابتن للمشوار</span>
                <span className="material-symbols-outlined text-amber-600 text-[20px]">electric_moped</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono">
                2,975 <span className="text-xs font-normal text-slate-400">ل.س</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>اقتطاع المنصة (15%):</span>
                <span className="font-bold text-red-600">-525 ل.س</span>
              </div>
              <span className="text-[10px] text-amber-700 block mt-1">تسوية كاش أو محفظة رقمية فورية</span>
            </div>
          </div>

          {/* 3. Platform Revenue */}
          <div className="bg-white rounded-xl p-4 border-2 border-blue-500 relative shadow-sm flex flex-col justify-between">
            <span className="absolute -top-2.5 right-4 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              3. إيراد منصة بركة
            </span>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">إجمالي العمولات المقتطعة</span>
                <span className="material-symbols-outlined text-blue-600 text-[20px]">account_balance</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 font-mono">
                2,625 <span className="text-xs font-normal text-slate-400">ل.س</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>عمولة المتجر:</span>
                <span className="font-bold text-blue-600">2,100 ل.س</span>
              </div>
              <div className="flex justify-between">
                <span>عمولة التوصيل:</span>
                <span className="font-bold text-blue-600">525 ل.س</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Dispute & Refund Engine */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-lg font-bold text-[#131b2e]">محرك النزاعات والاسترداد المالي الفوري</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                {disputes.filter((d) => d.status !== 'refunded').length} حالات تستوجب التدخل
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              حماية أموال المستهلكين ورد المبالغ بنقرة واحدة إلى المحفظة في حال إخفاق المتاجر أو نفاد السلال
            </p>
          </div>
        </div>

        {/* Dispute Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                <th className="py-2.5 px-3 rounded-r-xl">معرف الطلب والوقت</th>
                <th className="py-2.5 px-3">المتجر / الكابتن</th>
                <th className="py-2.5 px-3">المستهلك والمحفظة</th>
                <th className="py-2.5 px-3">قيمة السلة + التوصيل</th>
                <th className="py-2.5 px-3">سبب النزاع والمخالفة</th>
                <th className="py-2.5 px-3">حالة المعالجة</th>
                <th className="py-2.5 px-3 rounded-l-xl text-center">الإجراء الفوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {disputes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-[#006948]">#{d.orderNumber}</span>
                    <span className="block text-[11px] text-slate-400">{d.timeAgo}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold">{d.merchantName}</div>
                    {d.driverName && <span className="text-[11px] text-slate-500">الكابتن: {d.driverName}</span>}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold">{d.customerName}</div>
                    <span className="text-[11px] text-blue-600 font-mono">{d.customerWallet}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#131b2e] font-mono">
                    {d.totalAmount.toLocaleString('ar-SY')} ل.س
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      {d.reason}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {d.status === 'refunded' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        تم الاسترداد التلقائي 100%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">pending</span>
                        بانتظار التعويض
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {d.status === 'refunded' ? (
                      <span className="text-[11px] text-slate-400">تمت التسوية بنجاح (-5,000 غرامة تاجر)</span>
                    ) : (
                      <button
                        onClick={() => handleExecuteRefund(d)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">reply_all</span>
                        <span>إرجاع 100% فوراً + غرامة</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Dispute Auto-Rule Bar */}
        <div className="p-3 rounded-xl bg-[#f2f3ff] flex flex-col md:flex-row items-center justify-between gap-3 text-xs border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">bolt</span>
            <span className="font-bold">بروتوكول حماية المستهلك التلقائي نشط:</span>
            <span className="text-slate-500">
              يتم اقتطاع غرامة 5,000 ل.س تلقائياً من تسوية المتجر القادمة لكل إلغاء بعد قبول الطلب مع تعويض كامل للعميل.
            </span>
          </div>
          <span className="px-3 py-1 bg-white text-[#006948] font-mono text-[11px] font-bold rounded-lg shadow-sm border border-slate-200">
            قاعدة رقم: SY-DISP-04
          </span>
        </div>
      </section>

      {/* Two Column Section: Dynamic Commissions & Delivery Logistics Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Merchant Commission Management (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#131b2e]">لوحة إدارة عمولات التجار الديناميكية</h2>
                <p className="text-xs text-slate-500">التحكم الفوري بنسب المنصة حسب تصنيف النشاط التجاري</p>
              </div>
              <button
                onClick={() => {
                  const name = prompt('أدخل اسم الفئة التجارية الجديدة:');
                  if (name) onShowToast(`تم إنشاء فئة جديدة "${name}"`, 'check_circle', 'success');
                }}
                className="px-3 py-1.5 bg-[#00855d] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-[#006948] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>فئة جديدة</span>
              </button>
            </div>

            <div className="space-y-3">
              {commissions.map((tier) => (
                <div
                  key={tier.id}
                  className="p-3.5 rounded-xl bg-[#f2f3ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/80 hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#85f8c4] flex items-center justify-center text-[#002114] shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{tier.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{tier.category}</span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {tier.badgeText}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tier.subLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-left">
                      <span className="text-base font-bold text-[#006948] font-mono">{tier.ratePercent}%</span>
                      <span className="block text-[10px] text-slate-400">عمولة مقتطعة</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingTier(tier);
                        setEditRate(tier.ratePercent);
                      }}
                      className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#006948]">notifications_active</span>
              يتم إرسال إشعار SMS للتاجر فور تعديل نسبته التعاقدية.
            </span>
            <button
              onClick={() => onShowToast('تم فتح محرر العقود الموحدة المعتمدة في سوريا', 'info')}
              className="text-[#006948] font-bold hover:underline cursor-pointer"
            >
              العقد الموحد
            </button>
          </div>
        </div>

        {/* Delivery & Logistics Settings Panel (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between border-t-4 border-t-[#006948]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#131b2e]">إعدادات رسوم التوصيل واللوجستيات</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    محرّك الأسعار
                  </span>
                </div>
                <p className="text-xs text-slate-500">التحكم في نموذج التسليم، أسعار الكيلومترات، ونسب الكباتن</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ffddb8] text-[#855300] flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">two_wheeler</span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="p-3 rounded-xl bg-[#f2f3ff] mb-4 border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block mb-2">نمط التسليم المعتمد بالمنصة:</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode('self');
                    onShowToast('تم ضبط المنظومة: استلام ذاتي من المتاجر', 'shopping_bag');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    deliveryMode === 'self' ? 'bg-[#006948] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  <span>استلام ذاتي فقط</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode('hybrid');
                    onShowToast('تم تفعيل شبكة كباتن التوصيل الشركاء', 'electric_moped');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    deliveryMode === 'hybrid'
                      ? 'bg-[#006948] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">electric_moped</span>
                  <span>تفعيل الكباتن والشركاء</span>
                </button>
              </div>
            </div>

            {/* Configurable Form Controls */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">رسوم التوصيل الأساسية</span>
                  <span className="text-[11px] text-slate-400">تشمل المسافة الأولى (حتى أول 3 كم)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-20 text-center font-bold font-mono bg-white px-2 py-1 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                  <span className="text-[11px] text-slate-500">ل.س</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">تعرفة الكيلومتر الإضافي</span>
                  <span className="text-[11px] text-slate-400">لكل 1 كم بعد مسافة الأساس المحددة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={extraKmFee}
                    onChange={(e) => setExtraKmFee(Number(e.target.value))}
                    className="w-20 text-center font-bold font-mono bg-white px-2 py-1 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                  <span className="text-[11px] text-slate-500">ل.س</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">نسبة كابتن التوصيل (Driver Share)</span>
                  <span className="text-[11px] text-slate-400">85% للكابتن، وتقتطع 15% للمنصة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={driverSharePercent}
                    onChange={(e) => setDriverSharePercent(Number(e.target.value))}
                    className="w-16 text-center font-bold font-mono bg-white px-2 py-1 rounded-lg border border-slate-300 text-[#006948] focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                  <span className="text-[11px] text-slate-500">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">رسوم أوقات الذروة الإضافية (Peak Surcharge)</span>
                  <span className="text-[11px] text-slate-400">إضافة +1,000 ل.س خلال ذروة الإفطار/السحور والمساء</span>
                </div>
                <input
                  type="checkbox"
                  checked={peakHoursSurcharge}
                  onChange={(e) => setPeakHoursSurcharge(e.target.checked)}
                  className="w-4 h-4 accent-[#006948] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
            <span className="text-slate-500 flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[#006948] text-[16px]">cloud_sync</span>
              <span>تزامن Supabase Realtime جاهز</span>
            </span>
            <button
              onClick={() =>
                onShowToast(
                  `تم حفظ تسعيرة التوصيل (أساس: ${baseFee} ل.س، إضافي: ${extraKmFee} ل.س، كابتن: ${driverSharePercent}%) وتزامنها مع Supabase!`,
                  'save',
                  'success'
                )
              }
              className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>حفظ وتطبيق تسعيرة التوصيل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Trail Logs (Supabase Audit Stream) */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0058be]">fact_check</span>
              <h2 className="text-base font-bold text-[#131b2e]">
                سجل تدقيق عمليات التحقق والأمان (Audit Trail Logs)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تسجيل رقمي مشفّر لكل مسح QR code، إثبات صورة التوصيل (Driver Photo Proof)، والإحداثيات الجغرافية GPS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم المعاملة أو الرمز..."
                className="pr-8 pl-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006948] w-64 border border-slate-200"
              />
              <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-2.5 top-2">
                search
              </span>
            </div>
            <button
              onClick={() => onShowToast('تم تحديث تدفق سجلات التحقق وتتبع الكباتن لحظياً', 'sync')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#f2f3ff] text-slate-600 font-bold">
                <th className="py-2.5 px-3 rounded-r-xl">الختم الزمني</th>
                <th className="py-2.5 px-3">رمز المعاملة (UUID)</th>
                <th className="py-2.5 px-3">وسيلة التحقق وإثبات الكابتن</th>
                <th className="py-2.5 px-3">المتجر / الكابتن</th>
                <th className="py-2.5 px-3">المستلم والوجهة</th>
                <th className="py-2.5 px-3">الموقع الجغرافي (GPS)</th>
                <th className="py-2.5 px-3">حالة النزاهة</th>
                <th className="py-2.5 px-3 rounded-l-xl text-center">إجراء فوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredAudit.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#006948]">{log.uuid}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {log.verificationMethod}
                      </span>
                      {log.photoUrl && (
                        <button
                          onClick={() => setActivePhotoProof(log)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-[#85f8c4] text-[#006948] rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer border border-slate-200"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          <span>معاينة</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold">{log.storeName}</div>
                    <span className="text-[11px] text-slate-400">الكابتن: {log.driverName}</span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {log.customerName} ({log.destination})
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#006948]">{log.gpsCoords}</td>
                  <td className="py-3 px-3">
                    {log.status === 'verified' ? (
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        تسليم موثق ومطابق
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                        فشل التوصيل للعميل
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {log.status === 'failed' ? (
                      <button
                        onClick={() => {
                          onRefundCustomer(17500);
                          setAuditLogs((prev) =>
                            prev.map((l) =>
                              l.id === log.id ? { ...l, status: 'verified', note: 'تم استرداد 100% للعميل' } : l
                            )
                          );
                          onShowToast(
                            `تم استرداد 100% لمحفظة ${log.customerName} بنجاح عبر Supabase.`,
                            'check_circle',
                            'success'
                          );
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] shadow-sm transition-all cursor-pointer"
                      >
                        استرداد 100% فوراً
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">معتمد نظامياً</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commission Edit Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-[#131b2e] text-base">تعديل نسبة العمولة التعاقدية</h3>
              <button onClick={() => setEditingTier(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">الفئة المستهدفة:</label>
                <input
                  type="text"
                  readOnly
                  value={editingTier.category}
                  className="w-full bg-[#f2f3ff] px-3 py-2 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">نسبة العمولة الجديدة (%):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full bg-slate-100 px-3 py-2 rounded-xl text-xl font-bold font-mono text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006948]"
                  />
                  <span className="text-lg font-bold text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">الحد المسموح به لمنصة بركة: بين 5% و30%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCommission}
                className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                حفظ وتطبيق العمولة فوراً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Photo Proof Modal */}
      {activePhotoProof && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#006948] font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>إثبات صورة التوصيل (Driver Photo Proof)</span>
              </div>
              <button onClick={() => setActivePhotoProof(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {activePhotoProof.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100">
                <img
                  src={activePhotoProof.photoUrl}
                  alt="صورة إثبات التسليم"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-[#f2f3ff] p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">معرف المعاملة:</span>
                <span className="font-mono font-bold text-[#006948]">{activePhotoProof.uuid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المتجر:</span>
                <span className="font-bold text-slate-800">{activePhotoProof.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكابتن:</span>
                <span className="font-bold text-slate-800">{activePhotoProof.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">إحداثيات GPS:</span>
                <span className="font-mono text-[#006948] font-bold">{activePhotoProof.gpsCoords}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] flex items-center gap-1.5 border border-emerald-200">
              <span className="material-symbols-outlined text-[16px] text-[#006948]">verified</span>
              <span>{activePhotoProof.note}</span>
            </div>

            <button
              onClick={() => setActivePhotoProof(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق المعاينة
            </button>
          </div>
        </div>
      )}

      {/* Financial Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#006948] font-bold text-base">
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                <span>تصدير الميزانية وتقارير التسويات</span>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">ملخص الحسابات المعتمد لشهر آذار 2025 عبر Supabase Realtime:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-[#f2f3ff] rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">إجمالي التداول (GMV)</span>
                  <span className="text-lg font-bold text-slate-900">142.5M</span>
                  <span className="text-[10px] text-slate-400 block">ل.س</span>
                </div>
                <div className="p-3 bg-[#f2f3ff] rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">عمولات المنصة</span>
                  <span className="text-lg font-bold text-[#855300]">18.52M</span>
                  <span className="text-[10px] text-slate-400 block">ل.س</span>
                </div>
                <div className="p-3 bg-[#f2f3ff] rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">تسويات المتاجر</span>
                  <span className="text-lg font-bold text-[#006948]">123.97M</span>
                  <span className="text-[10px] text-slate-400 block">ل.س</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>عدد العمليات المكتملة:</span>
                  <strong className="font-mono">18,450 سلة</strong>
                </div>
                <div className="flex justify-between">
                  <span>نسبة النزاعات المعالجة:</span>
                  <strong className="text-[#006948] font-mono">99.8%</strong>
                </div>
                <div className="flex justify-between">
                  <span>التسويات المعلقة:</span>
                  <strong className="text-slate-500 font-mono">0 ل.س (تمت التسوية بالكامل)</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  onShowToast('جاري تصدير وتحميل تقرير الميزانية والتسويات بصيغة Excel/CSV...', 'download', 'success');
                }}
                className="px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>تحميل ملف CSV / Excel الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
