import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { GoogleGenAI } from '@google/genai';

interface AIAssistantChatProps {
  onClose?: () => void;
  isFloating?: boolean;
  lang?: Language;
}

const INITIAL_MESSAGES_AR: ChatMessage[] = [
  {
    id: 'msg-welcome-ar',
    sender: 'assistant',
    text: 'مرحباً بك في خدمة عملاء بركة الذكية 🌿! أنا مستشارك الآلي لحفظ النعمة في سوريا. يسعدني مساعدتك في:\n• الاستفسار عن سلال التوفير اليومية في محافظتك ومحيطك\n• الدفع بالبطاقة البنكية السورية (التجاري، بيمو، البركة، الدولي الإسلامي)\n• سياسة السداد نقداً (كاش متاح حصرياً عند الاستلام من المتجر)\n• الاسترداد التلقائي الفوري لمبالغ السلال المغلقة\n\nكيف يمكنني مساعدتك الآن؟',
    timestamp: 'الآن',
  },
];

const INITIAL_MESSAGES_EN: ChatMessage[] = [
  {
    id: 'msg-welcome-en',
    sender: 'assistant',
    text: 'Welcome to Barakah AI Support & Customer Care 🌿! I am your automated food rescue assistant in Syria. I am here to help you with:\n• Finding surplus baskets in your governorate & nearby GPS radius\n• Syrian Bank Card payments (CBS, Bemo, Al Baraka, SIIB)\n• Cash payment policy (Available strictly for In-Store Self Pickup)\n• Instant 100% wallet auto-refunds for closed venues\n\nHow can I assist you today?',
    timestamp: 'Now',
  },
];

const QUICK_PROMPTS_AR = [
  'كيف بدفع بالبطاقة البنكية؟',
  'ليش الدفع كاش بس عند الاستلام من المتجر؟',
  'كيف بسترد فلوسي فوراً إذا المتجر مغلق؟',
  'كيف بستلم السلة بالكود PIN؟',
  'شو هي المحافظات والمناطق المتاحة؟',
];

const QUICK_PROMPTS_EN = [
  'How to pay with Syrian Bank Card?',
  'Why is cash only allowed for In-Store Pickup?',
  'How does the instant refund for closed stores work?',
  'How to redeem my basket using the 4-digit PIN?',
  'Which Syrian areas and districts are covered?',
];

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ onClose, isFloating = false, lang = 'ar' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(lang === 'en' ? INITIAL_MESSAGES_EN : INITIAL_MESSAGES_AR);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isEn = lang === 'en';
  const quickPrompts = isEn ? QUICK_PROMPTS_EN : QUICK_PROMPTS_AR;

  useEffect(() => {
    setMessages(lang === 'en' ? INITIAL_MESSAGES_EN : INITIAL_MESSAGES_AR);
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAIResponse = async (userQuery: string): Promise<string> => {
    const apiKey =
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) ||
      '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = isEn
          ? `You are the official bilingual AI Support Assistant for "Barakah Box (صندوق بركة)" in Syria.
Respond in clear, polite, and helpful English.
Key Platform Facts:
1. Payment methods: Syrian Bank Cards (Commercial Bank of Syria, Bemo, Al Baraka, SIIB), Internal Barakah Wallet, ShamCash.
2. Cash on Delivery policy: Cash payment is STRICTLY permitted for In-Store Self-Pickup only, disabled for delivery orders to guarantee delivery driver booking.
3. Instant Auto-Refund: If a store is closed during the pickup window, the user receives an instant 100% wallet credit refund immediately without waiting for human agent review.
4. Redemption: 4-digit PIN code + QR voucher presented to store clerk upon pickup.
5. Coverage: Damascus, Rif Dimashq, Aleppo, Homs, Latakia, Hama, Tartous with GPS radius search.
Keep answers concise (max 2-3 paragraphs).`
          : `أنت المساعد الذكي الرسمي لمنصة "صندوق بركة (Barakah Box)" في الجمهورية العربية السورية.
أجب باللغة العربية بلهجة مهذبة ومرحبة وسورية لطيفة مع دقة مهنية عالية.
معلومات المنصة الأساسية:
1. طرق الدفع: البطاقات المصرفية السورية (التجاري السوري، بيمو، البركة، الدولي الإسلامي)، محفظة بركة، شام كاش.
2. سياسة الدفع نقداً (كاش): متاح **فقط وحصرياً** عند الاستلام الذاتي من المتجر، وممنوع لطلبات التوصيل لضمان تأكيد حجز الكابتن.
3. الاسترداد التلقائي الفوري: في حال إغلاق المتجر خلال وقت الاستلام، يحصل المنقذ على استرداد 100% فورياً بمحفظته دون انتظار مراجعة.
4. كود الاستلام PIN: مكون من 4 أرقام يبرزه المنقذ للشريك بالفرع.
5. التغطية: دمشق، ريف دمشق، حلب، حمص، اللاذقية، حماة، طرطوس عبر محدد النطاق الجغرافي ونظام GPS.
اجعل إجاباتك مفيدة ومباشرة.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }],
            },
          ],
        });

        if (response.text) {
          return response.text;
        }
      } catch (err) {
        console.warn('Gemini client call fallback to local reasoning engine:', err);
      }
    }

    // Local bilingual reasoning engine
    const lower = userQuery.toLowerCase();

    if (isEn) {
      if (lower.includes('card') || lower.includes('bank') || lower.includes('payment') || lower.includes('pay')) {
        return `💳 **Syrian Bank Card Payment**:
You can pay directly using local debit and ATM cards issued by verified Syrian banks:
• **Commercial Bank of Syria (CBS)**
• **Banque Bemo Saudi Fransi (BBSF)**
• **Al Baraka Bank Syria**
• **Syria International Islamic Bank (SIIB)**
• **National Electronic Payment Gateway**

Simply select "Bank Card" when reserving your surprise box, enter your card details, and the transaction will be processed instantly with zero extra fees!`;
      }

      if (lower.includes('cash') || lower.includes('pickup') || lower.includes('delivery')) {
        return `💵 **Cash Payment Policy**:
• **Cash is strictly available for In-Store Self-Pickup only.**
• **It is disabled for home delivery orders** to ensure delivery captain dispatch commitment and protect freshly prepared food from being left unattended.
To pay cash, ensure you choose *"Self-Pickup (GPS)"* during checkout and hand the cash to the merchant upon showing your PIN code.`;
      }

      if (lower.includes('refund') || lower.includes('closed') || lower.includes('store closed')) {
        return `⚡ **Instant 100% Wallet Auto-Refund**:
If you arrive during the designated pickup window and the store is closed, tap *"Need Help with this Order?"* in your orders tab and select *"Store was closed upon arrival"*.
Our automated refund policy triggers an immediate **100% wallet credit** to your account without waiting for support review!`;
      }

      if (lower.includes('pin') || lower.includes('code') || lower.includes('qr')) {
        return `🔢 **Pickup Verification PIN**:
Once your reservation is confirmed, a unique 4-digit code (e.g., 7 4 9 2) and QR voucher appear on your screen. Show this code to the merchant upon arrival to collect your fresh surprise box.`;
      }

      return `Hello! We are here to help you rescue fresh food and save up to 70% across Syrian governorates. Feel free to ask about our payment methods, cash pickup rules, instant refunds, or store locations!`;
    }

    // Arabic Responses
    if (lower.includes('بطاق') || lower.includes('بنك') || lower.includes('مصرف') || lower.includes('فيزا')) {
      return `💳 **طريقة السداد بالبطاقة البنكية السورية**:
يمكنك الآن الدفع مباشرة عبر بطاقات الصراف الآلي والبطاقات المصرفية الصادرة عن البنوك السورية المعتمدة:
• **المصرف التجاري السوري (CBS)**
• **بنك بيمو السعودي الفرنسي**
• **بنك البركة سورية**
• **بنك سورية الدولي الإسلامي (SIIB)**
• **بوابة الدفع الإلكتروني الوطنية**

عند حجز أي سلة، اختر "بطاقة بنكية مصرفية"، وأدخل رقم البطاقة وتاريخ الانتهاء، وسيتم خصم المبلغ عبر بوابة الدفع الوطنية الآمنة فوراً!`;
    }

    if (lower.includes('كاش') || lower.includes('نقد') || lower.includes('توصيل') || lower.includes('متجر') || lower.includes('فرع')) {
      return `💵 **سياسة الدفع نقداً (كاش)**:
• **سداد الكاش متاح حصرياً عند الاستلام الذاتي من المتجر (الفرع)**.
• **غير متاح لطلبات التوصيل المنزلي**، لضمان حجز كابتن التوصيل مسبقاً وتفادي تعطل الطعام الطازج.
إذا كنت ترغب بالدفع نقداً، تأكد من تحديد خيار *"استلام مباشر من المتجر"* أثناء حجز السلة وسداد القيمة مباشرة للمخبز أو المطعم بالفرع.`;
    }

    if (lower.includes('استرداد') || lower.includes('مغلق') || lower.includes('فلوس') || lower.includes('تعويض')) {
      return `⚡ **الاسترداد التلقائي الفوري 100%**:
إذا حضرت للمتجر أثناء نافذة الاستلام وكان مغلقاً، اضغط على زر *"تحتاج مساعدة في هذا الطلب؟"* من صفحة طلباتي واختر *"المتجر كان مغلقاً عند الوصول"*.
سيقوم النظام فوراً بإيداع **100% من قيمة السلة** في محفظتك دون انتظار أي مراجعة بشرية!`;
    }

    if (lower.includes('كود') || lower.includes('pin') || lower.includes('رمز') || lower.includes('استلام')) {
      return `🔢 **رمز الاستلام السريع (PIN Code)**:
بمجرد تأكيد حجز سلة البركة، يظهر لك رمز سري مكون من 4 أرقام (مثل: 7 4 9 2) مرفقاً بباركود رقمي.
عند وصولك للفرع اعرض الرمز للتاجر للتحقق منه عبر جهازه واستلام السلة فوراً.`;
    }

    return `أهلاً بك في منصة بركة! نحن هنا لمساعدتك في الحصول على سلال الأطعمة الطازجة بخصومات تصل حتى 70% وحمايتها من الهدر في سوريا.
يمكنك الاستفسار عن الدفع بالبطاقة، سياسة الكاش، الاسترداد التلقائي الفوري، أو أماكن المتاجر بالقرب منك.`;
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-SY', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const replyText = await generateAIResponse(text);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-SY', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: isEn
          ? 'Temporary network glitch. You can retry or submit a ticket from the support desk.'
          : 'عذراً، حدث خطأ مؤقت في الاتصال. يمكنك إعادة المحاولة أو فتح تذكرة دعم فني.',
        timestamp: isEn ? 'Now' : 'الآن',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ${
        isFloating ? 'w-full sm:w-[420px] h-[580px]' : 'w-full h-[620px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-l from-[#006948] via-[#00855d] to-[#005137] text-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px] text-[#85f8c4]">smart_toy</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#006948]"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm">{isEn ? 'Barakah AI Support' : 'مساعد بركة الذكي (AI)'}</h3>
              <span className="px-1.5 py-0.2 rounded bg-[#85f8c4] text-[#002114] text-[9px] font-bold">
                {isEn ? 'Online 24/7' : 'متصل 24/7'}
              </span>
            </div>
            <p className="text-[11px] text-white/80">
              {isEn ? 'Automated Customer Care & Inquiries' : 'خدمة العملاء الذكية ودعم المنقذ في سوريا'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#faf8ff] text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-[#006948] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                  <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-[#006948] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line text-[12px]">{m.text}</div>
                <div
                  className={`text-[9px] mt-1.5 font-mono ${
                    isUser ? 'text-white/70' : 'text-slate-400'
                  } ${isEn ? 'text-right' : 'text-left'}`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-7 h-7 rounded-xl bg-[#006948] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[15px]">smart_toy</span>
            </div>
            <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce delay-150"></span>
              <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce delay-300"></span>
              <span className="text-[11px] text-slate-500 font-medium mr-1">
                {isEn ? 'Thinking & drafting reply...' : 'جاري صياغة الرد...'}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-bold shrink-0 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[13px] text-[#006948]">tips_and_updates</span>
          <span>{isEn ? 'Quick FAQs:' : 'أسئلة سريعة:'}</span>
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] border border-slate-200 transition-all font-medium cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={
            isEn
              ? 'Ask about bank cards, cash pickup, instant refunds...'
              : 'اكتب استفسارك هنا (عن البطاقة البنكية، الكاش، الاسترداد)...'
          }
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#006948] focus:bg-white"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-xl bg-[#006948] hover:bg-[#00855d] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
        >
          <span className={`material-symbols-outlined text-[18px] ${isEn ? 'rotate-180' : ''}`}>send</span>
        </button>
      </div>
    </div>
  );
};
