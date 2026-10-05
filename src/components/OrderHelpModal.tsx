import React, { useState } from 'react';
import { SupportTicket, Language } from '../types';

interface OrderHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    vendor: string;
    itemDesc: string;
    amount: number;
    governorate: string;
    pickupTime: string;
  };
  onTriggerAutoRefund: (amount: number, orderId: string, reason: string) => void;
  onSubmitTicket: (ticket: SupportTicket) => void;
  onOpenAIChat?: () => void;
  lang?: Language;
}

export const OrderHelpModal: React.FC<OrderHelpModalProps> = ({
  isOpen,
  onClose,
  order,
  onTriggerAutoRefund,
  onSubmitTicket,
  onOpenAIChat,
  lang = 'ar',
}) => {
  const isEn = lang === 'en';

  const [selectedIssue, setSelectedIssue] = useState<
    'store_closed' | 'item_damaged' | 'payment_unconfirmed' | 'driver_issue' | null
  >(null);

  const [message, setMessage] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefundDone, setAutoRefundDone] = useState(false);

  if (!isOpen) return null;

  const handleIssueSelect = (issue: 'store_closed' | 'item_damaged' | 'payment_unconfirmed' | 'driver_issue') => {
    setSelectedIssue(issue);
    if (issue === 'item_damaged' && !proofPhoto) {
      setProofPhoto(
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ'
      );
    }
  };

  const handleExecuteStoreClosedAutoRefund = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAutoRefundDone(true);
      const reasonText = isEn
        ? 'Store was closed upon arrival during the designated pickup window'
        : 'المتجر كان مغلقاً عند الوصول خلال نافذة الاستلام';
      onTriggerAutoRefund(order.amount, order.id, reasonText);

      const ticket: SupportTicket = {
        id: `TKT-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: isEn ? 'Now (Instant Auto-Refund)' : 'الآن (مسترد فوري)',
        customerName: 'رامي السعيد',
        customerPhone: '0944-123456',
        orderId: order.id,
        vendorName: order.vendor,
        governorate: order.governorate as any,
        category: 'المتجر كان مغلقاً عند الوصول',
        issueType: 'store_closed',
        subject: isEn ? `Store closed upon arrival - Order #${order.id}` : `إغلاق المتجر لطلب #${order.id}`,
        message: isEn
          ? 'Consumer reported venue closed during pickup window. Executed instant 100% wallet credit.'
          : 'أبلغ المستهلك عن إغلاق الفرع خلال نافذة الاستلام وتم تنفيذ الاسترداد التلقائي الفوري.',
        status: 'auto_refunded',
        autoRefundTriggered: true,
        refundAmount: order.amount,
        response: isEn
          ? `Full refund (${order.amount.toLocaleString(isEn ? 'en-US' : 'ar-SY')} ${isEn ? 'SYP' : 'ل.س'}) was instantly credited to user wallet.`
          : `تم إيداع مبلغ التعويض الكامل (${order.amount.toLocaleString('ar-SY')} ل.س) فوراً في محفظة بركة دون الحاجة لأي مراجعة بشرية.`,
        adminDecision: 'approved_refund',
        resolutionSpeedMinutes: 0.4,
      };

      onSubmitTicket(ticket);
    }, 700);
  };

  const handleManualTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);

      const categoryMap = {
        store_closed: 'المتجر كان مغلقاً عند الوصول',
        item_damaged: 'محتويات السلة ناقصة، تالفة، أو منتهية الصلاحية',
        payment_unconfirmed: 'تم الدفع ولم يتم تأكيد الطلب',
        driver_issue: 'مشكلة في التوصيل أو السائق',
      } as const;

      const ticket: SupportTicket = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: isEn ? 'Now' : 'الآن',
        customerName: 'رامي السعيد',
        customerPhone: '0944-123456',
        orderId: order.id,
        vendorName: order.vendor,
        governorate: order.governorate as any,
        category: categoryMap[selectedIssue],
        issueType: selectedIssue,
        subject: `${categoryMap[selectedIssue]} - #${order.id}`,
        message: message.trim() || (isEn ? 'Quality dispute submitted with evidence.' : 'بلاغ موثق مع صورة إثبات الحالة.'),
        status: 'open',
        proofPhotoUrl: proofPhoto || undefined,
        adminDecision: 'pending',
      };

      onSubmitTicket(ticket);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        dir={isEn ? 'ltr' : 'rtl'}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-[#006948] via-[#00855d] to-[#005137] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-[#85f8c4]">help_center</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-[10px] font-bold">
                  {isEn ? 'Order Help Center' : 'مركز مساعدة الطلب'}
                </span>
                <span className="text-white/80 font-mono text-xs">{order.id}</span>
              </div>
              <h3 className="font-bold text-sm mt-0.5">
                {isEn ? 'Need Help with this Order?' : 'تحتاج مساعدة في هذا الطلب؟'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Order Snapshot Pill */}
          <div className="bg-[#f2f3ff] p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">{order.vendor}</span>
              <span className="text-[11px] text-slate-500">
                {order.itemDesc} • {order.governorate}
              </span>
            </div>
            <div className={isEn ? 'text-right' : 'text-left'}>
              <span className="font-bold text-sm text-[#006948] font-mono block">
                {order.amount.toLocaleString(isEn ? 'en-US' : 'ar-SY')} {isEn ? 'SYP' : 'ل.س'}
              </span>
              <span className="text-[10px] text-slate-400">{isEn ? 'Total Value' : 'القيمة الإجمالية'}</span>
            </div>
          </div>

          {/* Success Auto Refund Screen */}
          {autoRefundDone ? (
            <div className="p-6 bg-[#f5fff7] rounded-3xl border border-[#85f8c4] flex flex-col items-center text-center gap-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-[#006948] text-[#85f8c4] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[36px]">verified_user</span>
              </div>
              <h4 className="font-bold text-base text-slate-900">
                {isEn ? '100% Refund Issued Instantly 🌿' : 'تم استرداد المبلغ فورياً لمساندتك 🌿'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
                {isEn
                  ? `We apologize for the venue closure. Our automated guarantee protocol instantly credited ${order.amount.toLocaleString('en-US')} SYP to your Barakah wallet with zero wait time.`
                  : `نعتذر بشدة عن إغلاق المتجر. تم تفعيل بروتوكول الاسترداد الفوري وإيداع ${order.amount.toLocaleString('ar-SY')} ل.س مباشرةً في محفظتك دون الحاجة للانتظار.`}
              </p>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600">
                {isEn ? 'Wallet Reference:' : 'رقم إشعار المحفظة:'} REF-AUTO-{order.id.replace('#', '')}
              </div>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
              >
                {isEn ? 'Done, Thank You' : 'تم، شكراً لكم'}
              </button>
            </div>
          ) : (
            <>
              {/* Issue Selector Menu */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">
                  {isEn ? 'What issue are you facing with this basket?' : 'ما المشكلة التي تواجهها مع هذه السلة؟'}
                </label>
                <div className="flex flex-col gap-2">
                  {/* Issue 1: Store Closed */}
                  <div
                    onClick={() => handleIssueSelect('store_closed')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedIssue === 'store_closed'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-amber-600">storefront</span>
                        <span className="font-bold text-slate-900">
                          {isEn ? 'Store was closed upon arrival' : 'المتجر كان مغلقاً عند الوصول'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {isEn ? 'Instant Refund ⚡' : 'استرداد فوري ⚡'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {isEn
                        ? `Arrived during pickup window (${order.pickupTime}) and the store was closed.`
                        : `حضرت في موعد الاستلام (${order.pickupTime}) وكان الفرع مغلقاً أو رفض التسليم.`}
                    </span>
                  </div>

                  {/* Issue 2: Damaged / Missing Items */}
                  <div
                    onClick={() => handleIssueSelect('item_damaged')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedIssue === 'item_damaged'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-red-600">broken_image</span>
                        <span className="font-bold text-slate-900">
                          {isEn ? 'Box items missing, damaged, or expired' : 'محتويات السلة ناقصة، تالفة، أو منتهية الصلاحية'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {isEn ? 'Photo Proof Required' : 'يتطلب صورة إثبات'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {isEn
                        ? 'Food quality does not match freshness standards or items were spoiled.'
                        : 'جودة الطعام لا تطابق معايير بركة أو هناك تلف في المخبوزات.'}
                    </span>
                  </div>

                  {/* Issue 3: Payment succeeded but not confirmed */}
                  <div
                    onClick={() => handleIssueSelect('payment_unconfirmed')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedIssue === 'payment_unconfirmed'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-blue-600">credit_card_off</span>
                        <span className="font-bold text-slate-900">
                          {isEn ? 'Payment succeeded but order not confirmed' : 'تم الدفع بالبطاقة/شام كاش ولم يتم تأكيد الطلب'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {isEn ? 'Financial Audit' : 'تدقيق مالي'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {isEn
                        ? 'Account was debited but the pickup token or PIN was not generated.'
                        : 'تم خصم الرصيد البنكي ولكن لم تظهر وثيقة الاستلام أو كود PIN.'}
                    </span>
                  </div>

                  {/* Issue 4: Driver / Delivery issue */}
                  <div
                    onClick={() => handleIssueSelect('driver_issue')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedIssue === 'driver_issue'
                        ? 'border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-orange-600">two_wheeler</span>
                        <span className="font-bold text-slate-900">
                          {isEn ? 'Driver or delivery delay issue' : 'مشكلة في التوصيل أو كابتن التوصيل'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {isEn ? 'Live GPS Dispatch' : 'تتبع ميداني'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {isEn
                        ? 'Captain was severely delayed or order was dropped at the wrong address.'
                        : 'تأخر الكابتن أكثر من 45 دقيقة أو تم تسليم الطلب بعنوان خاطئ.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Auto-Refund Button when Store Closed */}
              {selectedIssue === 'store_closed' && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col gap-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#006948] text-[22px] shrink-0 mt-0.5">
                      electric_bolt
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {isEn ? 'Automated Instant Wallet Refund Protocol' : 'نظام الاسترداد التلقائي الفوري لمشتركي بركة'}
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                        {isEn
                          ? `Since you reported the venue was closed during pickup hours, you can instantly refund 100% of the basket value (${order.amount.toLocaleString('en-US')} SYP) directly into your digital wallet.`
                          : `بما أنك أبلغت عن إغلاق الفرع أثناء نافذة الاستلام، يمكنك استرداد كامل المبلغ (${order.amount.toLocaleString('ar-SY')} ل.س) فورياً إلى محفظتك الإلكترونية بنقرة واحدة.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteStoreClosedAutoRefund}
                    disabled={isProcessing}
                    className="w-full py-3 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isProcessing ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                        <span>{isEn ? 'Processing instant credit...' : 'جاري اعتماد الاسترداد وإيداع الرصيد...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                        <span>
                          {isEn
                            ? `Confirm 100% Instant Refund to Wallet (${order.amount.toLocaleString('en-US')} SYP)`
                            : `تأكيد الاسترداد الفوري 100% لمحفظتي (${order.amount.toLocaleString('ar-SY')} ل.س)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Damaged / Quality Issue: Mandatory Photo Proof */}
              {selectedIssue === 'item_damaged' && (
                <form onSubmit={handleManualTicketSubmit} className="flex flex-col gap-3 animate-in fade-in">
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-red-900 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                        <span>
                          {isEn ? 'Photo Proof of Food Quality (Mandatory):' : 'صورة إثبات حالة الطعام (إلزامية للتعويض):'}
                        </span>
                      </span>
                      <span className="text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                        {isEn ? 'Official Record' : 'توثيق رسمي'}
                      </span>
                    </div>

                    {proofPhoto ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-red-300">
                        <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProofPhoto(null)}
                          className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-red-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center cursor-pointer hover:bg-red-50 transition-colors">
                        <span className="material-symbols-outlined text-[28px] text-red-500">upload_file</span>
                        <span className="font-bold text-red-800 text-xs">
                          {isEn ? 'Click here to attach a photo of the damaged items' : 'اضغط هنا لإرفاق صورة السلة التالفة'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isEn ? 'Must clearly show freshness defects or missing parts' : 'يجب إظهار الأصناف غير الصالحة وتاريخ الحجز'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={() => {
                            setProofPhoto(
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuBogqdOkcG5wFAYzC7n0vv5j0cz1fj6kuGpluS4FIXWVSvHTxevhCIrsKcQ5KZSX6dnwlLJGn0D2zwfjXqSXWYjUdZug78LptthVj-YGvTHfsCQq9tLntTBuXTQ1qPcdmv3fVln--3HHeh1M9BBYyRA3XR339W9J4psLLOFTg2z0265NXI9_ek-kNc6NvoTxX4K_IKvY_28obeDdAqGEDIxtMvwJi2e22msQzBBHixgieGNNsqynCpZ'
                            );
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isEn ? 'Explanation & Observations:' : 'شرح المشكلة والملاحظات:'}
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        isEn
                          ? 'Explain whether food was stale, missing items, or packaging was broken...'
                          : 'اذكر ما إذا كانت السلة غير طازجة أو ناقصة أو تالفة...'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#006948]"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing || !proofPhoto}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isProcessing
                      ? isEn ? 'Submitting dispute...' : 'جاري رفع البلاغ...'
                      : isEn ? 'Submit Quality Dispute for Review' : 'إرسال البلاغ لمدير الجودة للتعويض'}
                  </button>
                </form>
              )}

              {/* Other Issues: Simple Message Form */}
              {(selectedIssue === 'payment_unconfirmed' || selectedIssue === 'driver_issue') && (
                <form onSubmit={handleManualTicketSubmit} className="flex flex-col gap-3 animate-in fade-in">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isEn ? 'Incident Details:' : 'تفاصيل البلاغ:'}
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        isEn
                          ? 'Describe the issue and provide transaction ID or captain phone...'
                          : 'اشرح المشكلة بالتفصيل مع تزويدنا برقم العملية البنكية أو رقم هاتف الكابتن...'
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#006948]"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isProcessing
                      ? isEn ? 'Creating ticket...' : 'جاري فتح التذكرة...'
                      : isEn ? 'Open Urgent Ticket for Support' : 'فتح تذكرة عاجلة لفريق الدعم'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Quick AI Help Option at Bottom (NO WHATSAPP BUTTON!) */}
          {onOpenAIChat && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">
                {isEn ? 'Instant Automated Help:' : 'مساعدة آلية سريعة:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAIChat();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#006948]">smart_toy</span>
                <span>{isEn ? 'Barakah AI Chat' : 'شات بركة AI'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
