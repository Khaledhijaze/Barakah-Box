import React, { useState } from 'react';
import { Language, RewardRule } from '../types';
import { t } from '../data/translations';

interface ImpactReportProps {
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigate: (screen: any) => void;
  walletBalance?: number;
  onCreditWallet?: (amount: number) => void;
  lang?: Language;
  rewardRules?: RewardRule[];
}

export const ImpactReport: React.FC<ImpactReportProps> = ({
  onShowToast,
  onCreditWallet,
  lang = 'ar',
  rewardRules = [],
}) => {
  const isEn = lang === 'en';
  const tr = t[lang];

  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [hasClaimedMilestone, setHasClaimedMilestone] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Consumer's personal metrics
  const consumerStats = {
    boxesSaved: 14,
    moneySavedSyp: 128500,
    foodMassKg: 38.5,
    co2OffsetKg: 82.0,
    waterSavedLiters: 14200,
    activeStreakDays: 6,
  };

  // Dynamically find active milestones from reward rules
  const activeBoxRules = rewardRules
    .filter((r) => r.isActive && r.criteriaType === 'boxes_count')
    .sort((a, b) => a.targetThreshold - b.targetThreshold);

  const currentRule = activeBoxRules.find((r) => consumerStats.boxesSaved < r.targetThreshold) || activeBoxRules[activeBoxRules.length - 1];
  const nextRule = activeBoxRules.find((r) => r.targetThreshold > (currentRule?.targetThreshold || 0));

  const currentMilestoneTarget = currentRule?.targetThreshold || 10;
  const nextMilestoneTarget = nextRule?.targetThreshold || 25;
  const rewardAmount = currentRule?.rewardAmountSyp || 5000;
  
  const isMilestoneEligible = consumerStats.boxesSaved >= currentMilestoneTarget;

  const handleClaimReward = () => {
    if (hasClaimedMilestone) return;
    setHasClaimedMilestone(true);
    if (onCreditWallet) {
      onCreditWallet(rewardAmount);
    }
    onShowToast(
      isEn
        ? `🎉 Congratulations! ${rewardAmount.toLocaleString()} SYP milestone reward credited to your wallet!`
        : `🎉 مبارك! تم إيداع مكافأة إنجاز حفظ النعمة (${rewardAmount.toLocaleString()} ل.س) في محفظتك الإلكترونية بنجاح!`,
      'verified',
      'success'
    );
  };

  return (
    <div dir={isEn ? 'ltr' : 'rtl'} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 animate-in fade-in">
      {/* 1. CONSUMER PROFILE & IMPACT HERO BANNER */}
      <section className="relative bg-white rounded-3xl shadow-sm p-6 lg:p-7 border border-slate-200 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#85f8c4]/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-60 h-60 rounded-full bg-[#eaedff]/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#006948] to-[#005137] text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
              {isEn ? 'RS' : 'ر.س'}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#131b2e]">
                  {isEn ? 'Customer: Rami Al-Saeed' : 'المستهلك: رامي السعيد'}
                </h1>
                <span className="inline-flex items-center gap-1 bg-[#85f8c4] px-2.5 py-0.5 rounded-full text-[#002114] text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">eco</span>
                  <span>{isEn ? 'Syrian Food Hero' : 'بطل حفظ النعمة في سوريا'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  {isEn ? 'Silver Barakah Tier' : 'عضوية بركة الفضية'}
                </span>
              </div>

              <p className="text-xs text-slate-500 max-w-xl">
                {tr.personalImpactSub}
              </p>
            </div>
          </div>

          {/* Time range toggle & Certificate Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-[#eaedff] p-1 rounded-xl flex items-center text-xs font-bold border border-slate-200">
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'month' ? 'bg-[#006948] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'This Month' : 'هذا الشهر'}
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  period === 'all' ? 'bg-[#006948] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'All Time' : 'منذ الانضمام'}
              </button>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#006948] text-[18px]">workspace_premium</span>
              <span>{isEn ? 'View Food Hero Certificate' : 'عرض شهادة الأثر والتكريم'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CONSUMER-ONLY 4 CORE METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Personal Saved Boxes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{tr.personalSavedBoxes}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006948] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-mono text-[#006948] tracking-tight">
              {consumerStats.boxesSaved}
            </span>
            <span className="text-xs text-slate-400 font-bold mr-1.5 ml-1.5">{tr.boxesCount}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-2 block">
            {isEn ? 'Rescued from bakery & restaurant disposal' : 'أنقذتها بنفسك من الهدر الميداني'}
          </span>
        </div>

        {/* Metric 2: Personal Money Saved (L.S. / SYP) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{tr.personalMoneySaved}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-mono text-amber-700 tracking-tight">
              {consumerStats.moneySavedSyp.toLocaleString(isEn ? 'en-US' : 'ar-SY')}
            </span>
            <span className="text-xs text-slate-400 font-bold mr-1.5 ml-1.5">{tr.currency}</span>
          </div>
          <span className="text-[11px] text-amber-800 font-semibold mt-2 block">
            {isEn ? 'Compared to original bakery retail price' : 'مقارنة بأسعار التجزئة الأصلية'}
          </span>
        </div>

        {/* Metric 3: Personal Food Mass Saved (KG) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{tr.personalFoodMass}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0058be] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">scale</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-mono text-[#0058be] tracking-tight">
              {consumerStats.foodMassKg}
            </span>
            <span className="text-xs text-slate-400 font-bold mr-1.5 ml-1.5">kg / كغ</span>
          </div>
          <span className="text-[11px] text-blue-800 font-semibold mt-2 block">
            {isEn ? 'Wholesome fresh bread, pastries & meals' : 'معجنات ووجبات طازجة صالحة للأكل'}
          </span>
        </div>

        {/* Metric 4: Personal CO2 Offset */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">{tr.personalCo2Offset}</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">cloud_off</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold font-mono text-teal-800 tracking-tight">
              {consumerStats.co2OffsetKg}
            </span>
            <span className="text-xs text-slate-400 font-bold mr-1.5 ml-1.5">kg CO2</span>
          </div>
          <span className="text-[11px] text-teal-800 font-semibold mt-2 block">
            {isEn ? 'Greenhouse emissions prevented' : 'انبعاثات احتباس حراري تم تحييدها'}
          </span>
        </div>
      </section>

      {/* 3. MILESTONE REWARDS & GAMIFICATION (PROGRESS BAR) */}
      <section className="bg-gradient-to-l from-[#006948] via-[#005c3f] to-[#00422c] text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col gap-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-bold">
                Level 1 Reward
              </span>
              <span className="text-xs text-emerald-200">{tr.milestoneTitle}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">{tr.milestoneSub}</h2>
          </div>

          {/* Claim Button */}
          {hasClaimedMilestone ? (
            <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <span className="material-symbols-outlined text-[#85f8c4] text-[20px]">verified</span>
              <span>{isEn ? '5,000 SYP Credited ✓' : 'تم صرف 5,000 ل.س بالمحفظة ✓'}</span>
            </div>
          ) : isMilestoneEligible ? (
            <button
              onClick={handleClaimReward}
              className="px-5 py-3 rounded-2xl bg-[#85f8c4] hover:bg-[#6ee8b0] text-[#002114] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-bounce"
            >
              <span className="material-symbols-outlined text-[20px]">redeem</span>
              <span>{tr.claimRewardBtn}</span>
            </button>
          ) : (
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl text-xs text-emerald-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>
                {currentMilestoneTarget - consumerStats.boxesSaved} {tr.boxesToNextMilestone}
              </span>
            </div>
          )}
        </div>

        {/* Milestone Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold text-emerald-100">
            <span>
              {isEn ? 'Current Achievement:' : 'إنجازك الحالي:'}{' '}
              <strong className="text-white font-mono">{consumerStats.boxesSaved}</strong> / {currentMilestoneTarget} {tr.boxesCount}
            </span>
            <span>
              {isEn ? 'Next Tier Target:' : 'المستوى التالي:'}{' '}
              <strong className="text-white font-mono">{nextMilestoneTarget}</strong> {tr.boxesCount} ({nextRule?.rewardAmountSyp.toLocaleString() || '15,000'} {tr.currency})
            </span>
          </div>

          <div className="w-full h-3.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-[#85f8c4] to-emerald-300 rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.min(100, (consumerStats.boxesSaved / currentMilestoneTarget) * 100)}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* 4. FOOD HERO RECOGNITION CERTIFICATE MODAL */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center gap-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#f5fff7] text-[#006948] border-2 border-[#85f8c4] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">workspace_premium</span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#006948] uppercase tracking-wider block mb-1">
                {isEn ? 'National Food Waste Reduction Initiative' : 'المبادرة الوطنية للحد من الهدر الغذائي وحفظ النعمة'}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {isEn ? 'Certificate of Environmental Honor' : 'شهادة تكريم وبطولة بيئية'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isEn
                  ? 'Presented to Rami Al-Saeed for actively rescuing 14 surprise food boxes and offsetting 82 KG of CO2 in Syria.'
                  : 'تُمنح للمستهلك رامي السعيد تقديراً لمشاركته الفعالة في إنقاذ 14 سلة بركة وتفادي 82 كغ من انبعاثات الكربون في الجمهورية العربية السورية.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full bg-[#f2f3ff] p-4 rounded-2xl text-xs border border-slate-200">
              <div className="text-center">
                <span className="text-slate-500 block text-[10px]">{isEn ? 'Boxes Rescued' : 'سلال تم إنقاذها'}</span>
                <span className="font-bold font-mono text-base text-[#006948]">14 {tr.boxesCount}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-500 block text-[10px]">{isEn ? 'CO2 Avoided' : 'انبعاثات CO2'}</span>
                <span className="font-bold font-mono text-base text-[#0058be]">82.0 kg</span>
              </div>
            </div>

            <button
              onClick={() => setShowCertificateModal(false)}
              className="w-full py-2.5 bg-[#006948] hover:bg-[#00855d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isEn ? 'Close Certificate' : 'إغلاق الشهادة'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
