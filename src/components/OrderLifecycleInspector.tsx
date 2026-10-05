import React, { useState } from 'react';
import { OrderItem, OrderLifecycleStep } from '../types';

interface OrderLifecycleInspectorProps {
  orders: OrderItem[];
  selectedOrderId?: string;
  onClose?: () => void;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrderLifecycleInspector: React.FC<OrderLifecycleInspectorProps> = ({
  orders,
  selectedOrderId,
  onClose,
  onShowToast,
}) => {
  const [currentId, setCurrentId] = useState<string>(selectedOrderId || orders[0]?.id || '9048');
  const [filterGov, setFilterGov] = useState<string>('الكل');

  const currentOrder = orders.find((o) => o.id === currentId) || orders[0];

  const filteredOrderList = orders.filter((o) => {
    if (filterGov === 'الكل') return true;
    return o.governorate === filterGov;
  });

  if (!currentOrder) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Top Inspector Header */}
      <div className="bg-gradient-to-l from-[#006948] via-[#00855d] to-[#005137] text-white p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <span className="material-symbols-outlined text-[28px] text-[#85f8c4]">timeline</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                نظام الرقابة الإدارية الشاملة
              </span>
              <span className="text-white/70 text-xs">الجمهورية العربية السورية</span>
            </div>
            <h2 className="text-xl font-bold mt-1">مفتش دورة حياة الطلب الشاملة (من البداية حتى النهاية)</h2>
            <p className="text-xs text-white/80">
              تتبع زمني مشفّر ومفصل لكل حركة ونشاط وأثر مالي ومكاني منذ أول نقرة للمستهلك وحتى إتمام التسوية
            </p>
          </div>
        </div>

        {/* Quick Order Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterGov}
            onChange={(e) => setFilterGov(e.target.value)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-xl border border-white/20 cursor-pointer focus:outline-none"
          >
            <option value="الكل" className="text-slate-800">جميع المحافظات السورية</option>
            <option value="دمشق" className="text-slate-800">محافظة دمشق</option>
            <option value="ريف دمشق" className="text-slate-800">محافظة ريف دمشق</option>
            <option value="حلب" className="text-slate-800">محافظة حلب</option>
            <option value="حمص" className="text-slate-800">محافظة حمص</option>
            <option value="اللاذقية" className="text-slate-800">محافظة اللاذقية</option>
          </select>

          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="bg-white text-slate-900 font-bold py-2 px-3 rounded-xl border border-white cursor-pointer focus:outline-none shadow-sm font-mono"
          >
            {filteredOrderList.map((o) => (
              <option key={o.id} value={o.id}>
                طلب #{o.id} • {o.customerName} ({o.governorate})
              </option>
            ))}
          </select>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Order Quick Summary Dossier Bar */}
      <div className="p-4 sm:p-6 bg-[#f2f3ff] border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">معرف الطلب والمحافظة</span>
          <span className="font-mono text-sm font-bold text-[#006948]">#BB-{currentOrder.id}</span>
          <span className="block text-[11px] text-slate-600 font-bold mt-0.5">
            {currentOrder.governorate} • {currentOrder.cityArea}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">المستهلك والمحفظة</span>
          <span className="font-bold text-slate-800">{currentOrder.customerName}</span>
          <span className="block text-[11px] text-blue-700 font-mono" dir="ltr">
            {currentOrder.customerPhone}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">المتجر المصدر</span>
          <span className="font-bold text-slate-800">{currentOrder.storeName}</span>
          <span className="block text-[11px] text-slate-500 font-semibold">{currentOrder.boxTitle}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">طريقة الاستلام / الكابتن</span>
          <span className="font-bold text-slate-800">
            {currentOrder.orderType === 'delivery' ? 'توصيل منزلي بالكابتن' : 'استلام ذاتي بالفرع'}
          </span>
          <span className="block text-[11px] text-[#006948] font-bold">
            {currentOrder.driverName ? `الكابتن: ${currentOrder.driverName}` : 'مباشر مع التاجر'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">القيمة وطريقة السداد</span>
          <span className="text-sm font-bold text-[#006948] font-mono">
            {currentOrder.price.toLocaleString('ar-SY')} ل.س
          </span>
          <span className="block text-[11px] text-slate-600 font-semibold">{currentOrder.paymentMethod}</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-400 block font-bold">الحالة التشغيلية الآن</span>
          <span
            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
              currentOrder.status === 'delivered'
                ? 'bg-emerald-100 text-emerald-800'
                : currentOrder.status === 'in_transit'
                ? 'bg-amber-100 text-amber-800'
                : currentOrder.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {currentOrder.status === 'delivered' && 'مكتمل ومسوى نظامياً'}
            {currentOrder.status === 'in_transit' && 'جاري النقل الميداني (نشط)'}
            {currentOrder.status === 'pending' && 'بانتظار الاستلام'}
            {currentOrder.status === 'cancelled' && 'ملغي وفق البروتوكول'}
          </span>
        </div>
      </div>

      {/* Main End-to-End Visual Timeline */}
      <div className="p-5 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006948] text-[22px]">route</span>
            <span>المسار الزمني التنفيذي للطلب (End-to-End Steps):</span>
          </h3>
          <span className="text-xs text-slate-500">
            عدد المراحل الموثقة: {currentOrder.lifecycle.length} مراحل
          </span>
        </div>

        {/* Steps Stack */}
        <div className="relative flex flex-col gap-6 before:absolute before:top-4 before:bottom-4 before:right-[23px] before:w-1 before:bg-slate-200">
          {currentOrder.lifecycle.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isFailed = step.status === 'failed';

            return (
              <div key={idx} className="relative flex items-start gap-4 sm:gap-6 pr-12 group">
                {/* Step Circle Indicator */}
                <div
                  className={`absolute right-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md z-10 transition-all ${
                    isCompleted
                      ? 'bg-[#006948] text-white'
                      : isActive
                      ? 'bg-[#fea619] text-[#684000] ring-4 ring-amber-100 animate-pulse'
                      : isFailed
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  ) : isActive ? (
                    <span className="material-symbols-outlined text-[20px]">sync</span>
                  ) : isFailed ? (
                    <span className="material-symbols-outlined text-[20px]">priority_high</span>
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                {/* Step Content Box */}
                <div
                  className={`flex-1 rounded-2xl p-4 sm:p-5 border transition-all ${
                    isActive
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                      : isCompleted
                      ? 'bg-white border-slate-200 shadow-sm'
                      : isFailed
                      ? 'bg-red-50/60 border-red-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{step.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        الجهة المنفذة: {step.actor} ({step.actorName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {step.timestamp}
                      </span>
                      {step.location && (
                        <span className="font-medium text-slate-500 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px] text-[#006948]">location_on</span>
                          {step.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 mb-1">{step.summary}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.details}</p>

                  {/* Evidence / Proof / Photo / Financial Tokens */}
                  {(step.evidenceType || step.proofImageUrl) && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {step.evidenceValue && (
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl font-mono text-[11px] text-slate-700">
                          <span className="material-symbols-outlined text-[15px] text-[#006948]">verified</span>
                          <span>توثيق السجل: {step.evidenceValue}</span>
                        </div>
                      )}

                      {step.proofImageUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-bold">صورة إثبات التسليم الميدانية:</span>
                          <img
                            src={step.proofImageUrl}
                            alt="إثبات"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-300 shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3-Way Financial Settlement Engine Breakdown Box for this specific Order */}
        <div className="bg-[#f2f3ff] rounded-2xl p-5 border border-slate-300 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006948] text-[22px]">account_balance</span>
              <h4 className="font-bold text-sm text-slate-900">
                المقاصة المالية المدققة للطلب (End-to-End 3-Way Financial Split)
              </h4>
            </div>
            <span className="bg-[#85f8c4] text-[#002114] text-[10px] font-bold px-2 py-0.5 rounded-full">
              تدقيق البنك المركزي السوري
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي المبلغ المحصّل من المستهلك:</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {currentOrder.financialSplit.totalCustomerPaid.toLocaleString('ar-SY')} ل.س
              </span>
              <span className="text-[10px] text-slate-500 block">شامل قيمة السلة والتوصيل</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">صافي حصة التاجر (85%):</span>
              <span className="text-lg font-bold text-[#006948] font-mono">
                {currentOrder.financialSplit.merchantShare.toLocaleString('ar-SY')} ل.س
              </span>
              <span className="text-[10px] text-emerald-700 block">تودع فوراً بحساب متجر {currentOrder.storeName}</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">صافي أجر كابتن التوصيل (85%):</span>
              <span className="text-lg font-bold text-amber-700 font-mono">
                {currentOrder.financialSplit.driverShare.toLocaleString('ar-SY')} ل.س
              </span>
              <span className="text-[10px] text-amber-700 block">
                {currentOrder.driverName ? `تودع في محفظة الكابتن ${currentOrder.driverName}` : 'استلام مباشر (0 ل.س)'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-bold">عمولة المنصة التشغيلية (15%):</span>
              <span className="text-lg font-bold text-[#0058be] font-mono">
                {currentOrder.financialSplit.platformOperationalFee.toLocaleString('ar-SY')} ل.س
              </span>
              <span className="text-[10px] text-blue-700 block">سيرفرات بركة والعمليات الوطنية</span>
            </div>
          </div>
        </div>

        {/* Admin Operational Actions on this Order */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">admin_panel_settings</span>
            <span>صلاحيات التدخل الإداري الاستثنائي على هذا الطلب:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onShowToast(
                  `تم إصدار أمر استرداد فوري بقيمة ${currentOrder.price.toLocaleString('ar-SY')} ل.س لمحفظة ${currentOrder.customerName}`,
                  'check_circle',
                  'success'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-200 transition-colors cursor-pointer"
            >
              استرداد 100% للزبون
            </button>
            <button
              onClick={() =>
                onShowToast(
                  `تم تسجيل غرامة تشغيلية 5,000 ل.س على متجر ${currentOrder.storeName} وتوجيه إشعار رسمي`,
                  'warning',
                  'error'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold border border-amber-200 transition-colors cursor-pointer"
            >
              فرض غرامة على المتجر
            </button>
            <button
              onClick={() =>
                onShowToast(
                  `تم تحويل السلة رسمياً إلى بنك حفظ النعمة في ${currentOrder.governorate}`,
                  'volunteer_activism',
                  'info'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              إعادة توجيه لبنك حفظ النعمة
            </button>
            <button
              onClick={() =>
                onShowToast(
                  `تم تحميل ملف التدقيق الكامل للطلب #BB-${currentOrder.id} بصيغة PDF / JSON`,
                  'download',
                  'success'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-[#006948] text-white hover:bg-[#00855d] font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>تحميل تقرير التتبع الكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
