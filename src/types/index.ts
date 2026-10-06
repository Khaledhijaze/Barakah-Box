export type Language = 'ar' | 'en';

export type AccountType = 'consumer' | 'merchant' | 'driver' | 'admin';

export type AppScreen =
  | 'marketplace-catalog'
  | 'merchant-dashboard'
  | 'driver-portal'
  | 'platform-admin'
  | 'live-navigation'
  | 'impact-report';

export type SyrianGovernorate =
  | 'الكل'
  | 'دمشق'
  | 'ريف دمشق'
  | 'حلب'
  | 'حمص'
  | 'حماة'
  | 'اللاذقية'
  | 'طرطوس'
  | 'درعا'
  | 'السويداء';

export interface BarakahBox {
  id: string;
  vendor: string;
  vendor_en?: string;
  vendorCategory: 'bakeries' | 'restaurants' | 'produce' | 'grocery' | 'sweets';
  categoryLabel: string;
  categoryLabel_en?: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  rating: number;
  reviewsCount: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  distanceKm: number;
  governorate: SyrianGovernorate;
  governorate_id?: string;
  neighborhood: string;
  neighborhood_en?: string;
  lat?: number;
  lng?: number;
  stockLeft: number;
  pickupStart: string;
  pickupEnd: string;
  urgentText?: string;
  urgentText_en?: string;
  image: string;
  badgeLabel?: string;
  badgeLabel_en?: string;
}

export interface OrderLifecycleStep {
  stepNumber: number;
  title: string;
  timestamp: string;
  actor: 'المستهلك' | 'التاجر' | 'كابتن التوصيل' | 'نظام المقاصة الآلي' | 'إدارة المنصة';
  actorName: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  summary: string;
  details: string;
  evidenceType?: 'qr_hash' | 'pin' | 'gps' | 'photo' | 'financial_txn';
  evidenceValue?: string;
  proofImageUrl?: string;
  location?: string;
}

export interface OrderItem {
  id: string;
  customerName: string;
  customerPhone: string;
  governorate: SyrianGovernorate;
  cityArea: string;
  deliveryAddress: string;
  storeName: string;
  storePhone: string;
  boxTitle: string;
  orderType: 'pickup' | 'delivery';
  price: number;
  merchantNet: number;
  driverFee?: number;
  driverName?: string;
  driverPhone?: string;
  pickupWindow: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  proofImage?: string;
  verifiedAt?: string;
  orderPlacedAt: string;
  paymentMethod: 'محفظة بركة' | 'شام كاش' | 'بطاقة بنكية' | 'دفع عند الاستلام';
  financialSplit: {
    totalCustomerPaid: number;
    merchantShare: number;
    driverShare: number;
    platformOperationalFee: number;
    currency: 'ل.س';
  };
  lifecycle: OrderLifecycleStep[];
}

export interface DisputeIncident {
  id: string;
  orderNumber: string;
  governorate: SyrianGovernorate;
  timeAgo: string;
  timeExact: string;
  merchantName: string;
  driverName?: string;
  customerName: string;
  customerWallet: string;
  totalAmount: number;
  reason: string;
  status: 'pending' | 'refunded' | 'resolved' | 'investigating';
  withFine: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  uuid: string;
  governorate: SyrianGovernorate;
  verificationMethod: string;
  storeName: string;
  driverName: string;
  customerName: string;
  destination: string;
  gpsCoords: string;
  status: 'verified' | 'failed' | 'disputed';
  photoUrl?: string;
  note: string;
}

export interface CommissionTier {
  id: string;
  category: string;
  ratePercent: number;
  monthlyFee?: number;
  partnersCount: number;
  subLabel: string;
  badgeText: string;
  icon: string;
}

export interface SupportTicket {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  vendorName?: string;
  governorate?: SyrianGovernorate;
  category:
    | 'المتجر كان مغلقاً عند الوصول'
    | 'محتويات السلة ناقصة، تالفة، أو منتهية الصلاحية'
    | 'تم الدفع ولم يتم تأكيد الطلب'
    | 'مشكلة في التوصيل أو السائق'
    | 'سداد وبطاقة بنكية'
    | 'استفسار عام';
  issueType: 'store_closed' | 'item_damaged' | 'payment_unconfirmed' | 'driver_issue' | 'general';
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'auto_refunded';
  proofPhotoUrl?: string;
  autoRefundTriggered?: boolean;
  refundAmount?: number;
  response?: string;
  adminDecision?: 'approved_refund' | 'rejected' | 'penalized_merchant' | 'pending';
  resolutionSpeedMinutes?: number;
}

export interface MerchantComplaint {
  id: string;
  createdAt: string;
  merchantName: string;
  branch: string;
  orderNumber?: string;
  customerName?: string;
  complaintType:
    | 'تخلف الزبون عن الاستلام'
    | 'تأخر كابتن التوصيل'
    | 'مشكلة في المقاصة أو الحساب البنكي'
    | 'طلب تصريف فائض طارئ ضخم'
    | 'عطل فني في نظام التوثيق'
    | 'نفاد المخزون الطازج';
  priority: 'عاجل' | 'متوسط' | 'عادي';
  description: string;
  status: 'قيد المراجعة الإدارية' | 'تم التدخل الميداني' | 'تمت التسوية والتعويض';
  isNoShowClaim?: boolean;
  payoutReleased?: boolean;
  payoutAmount?: number;
  adminNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isQuickHelp?: boolean;
}

export interface RewardRule {
  id: string;
  tierLevel: number;
  title_ar: string;
  title_en: string;
  criteriaType: 'boxes_count' | 'spent_amount';
  targetThreshold: number; // e.g. 10 boxes, or 100,000 SYP
  rewardAmountSyp: number; // e.g. 5,000 SYP
  isActive: boolean;
  description_ar: string;
  description_en: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: AccountType;
  phoneNumber?: string;
  email?: string;
  storeName?: string;
  storeCategory?: string;
  licenseNumber?: string;
  licenseUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

