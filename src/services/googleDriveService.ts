/**
 * Google Drive API v3 Service for Barakah Box
 * Client-side integration using OAuth Bearer tokens
 */

import { OrderItem, DisputeIncident, AuditLog, Language } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  shared?: boolean;
  parents?: string[];
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveAboutInfo {
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
  storageQuota?: DriveStorageQuota;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Fetch Google Drive storage quota and user profile info
 */
export async function getDriveAbout(accessToken: string): Promise<DriveAboutInfo> {
  const res = await fetch(`${DRIVE_API_BASE}/about?fields=user,storageQuota`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل استرجاع بيانات Google Drive (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * List files and folders in Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  options?: {
    parentFolderId?: string;
    searchTerm?: string;
    mimeTypeFilter?: string;
    pageSize?: number;
  }
): Promise<DriveFileItem[]> {
  const params = new URLSearchParams();
  params.set('pageSize', (options?.pageSize || 40).toString());
  params.set(
    'fields',
    'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink, thumbnailLink, shared, parents)'
  );
  params.set('orderBy', 'folder,modifiedTime desc');

  const queryParts: string[] = ['trashed = false'];

  if (options?.parentFolderId) {
    queryParts.push(`'${options.parentFolderId}' in parents`);
  }

  if (options?.searchTerm?.trim()) {
    const escaped = options.searchTerm.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  if (options?.mimeTypeFilter) {
    if (options.mimeTypeFilter === 'folder') {
      queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
    } else if (options.mimeTypeFilter === 'document') {
      queryParts.push(
        "(mimeType contains 'document' or mimeType contains 'pdf' or mimeType contains 'text' or mimeType = 'application/vnd.google-apps.document')"
      );
    } else if (options.mimeTypeFilter === 'spreadsheet') {
      queryParts.push(
        "(mimeType contains 'spreadsheet' or mimeType contains 'sheet' or mimeType contains 'csv' or mimeType = 'application/vnd.google-apps.spreadsheet')"
      );
    } else if (options.mimeTypeFilter === 'image') {
      queryParts.push("mimeType contains 'image/'");
    }
  }

  params.set('q', queryParts.join(' and '));

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`خطأ في استعراض ملفات Google Drive (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new folder in Google Drive
 */
export async function createDriveFolder(
  accessToken: string,
  name: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`فشل إنشاء المجلد في Google Drive (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Upload a file (Blob, text, or JSON) using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  options: {
    name: string;
    mimeType: string;
    content: string | Blob;
    parentFolderId?: string;
  }
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: options.name,
    mimeType: options.mimeType,
  };

  if (options.parentFolderId) {
    metadata.parents = [options.parentFolderId];
  }

  const contentBlob =
    typeof options.content === 'string'
      ? new Blob([options.content], { type: options.mimeType })
      : options.content;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${options.mimeType}\r\n\r\n`;

  const requestBody = new Blob([metadataPart, contentBlob, closeDelimiter]);

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: requestBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`فشل رفع الملف إلى Google Drive (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * MANDATORY: Delete file with explicit caller confirmation
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`فشل حذف الملف من Google Drive (${res.status}): ${err}`);
  }

  return true;
}

/**
 * Find or create standard Barakah Box root directory
 */
export async function getOrCreateBarakahFolder(
  accessToken: string,
  folderName = 'صندوق بركة - تقارير دمشق وسوريا'
): Promise<string> {
  try {
    const existing = await listDriveFiles(accessToken, {
      mimeTypeFilter: 'folder',
      searchTerm: folderName,
      pageSize: 5,
    });

    const match = existing.find((f) => f.name === folderName);
    if (match) {
      return match.id;
    }

    const created = await createDriveFolder(accessToken, folderName);
    return created.id;
  } catch (e) {
    console.warn('Could not check or create folder, will use root:', e);
    return 'root';
  }
}

/**
 * Format bytes to human readable format (MB, GB)
 */
export function formatBytes(bytesStr?: string | number): string {
  if (!bytesStr) return '0 B';
  const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr, 10) : bytesStr;
  if (isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ==========================================
// SYRIAN PLATFORM SPECIFIC EXPORTERS TO DRIVE
// ==========================================

/**
 * Export Order Invoice / Voucher to Google Drive as Markdown/Text
 */
export async function exportOrderInvoiceToDrive(
  accessToken: string,
  order: OrderItem,
  lang: Language
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBarakahFolder(accessToken);
  const isEn = lang === 'en';
  const now = new Date().toISOString().split('T')[0];

  const content = `=====================================================
${isEn ? 'BARAKAH BOX • SYRIA - OFFICIAL ORDER INVOICE' : 'صندوق بركة • سوريا - وثيقة الطلب والفاتورة المعتمدة'}
=====================================================
${isEn ? 'Order Number' : 'رقم الطلب'}: #${order.id}
${isEn ? 'Date' : 'التاريخ'}: ${order.orderPlacedAt} (${now})
${isEn ? 'Governorate' : 'المحافظة'}: ${order.governorate} - ${order.cityArea}
${isEn ? 'Delivery Type' : 'نوع الاستلام'}: ${order.orderType === 'pickup' ? (isEn ? 'Direct Pickup' : 'استلام مباشر') : (isEn ? 'Home Delivery' : 'توصيل منزلي')}
-----------------------------------------------------
${isEn ? 'Customer Details' : 'بيانات المستهلك'}:
- ${isEn ? 'Name' : 'الاسم'}: ${order.customerName}
- ${isEn ? 'Phone' : 'الهاتف'}: ${order.customerPhone}
- ${isEn ? 'Address' : 'العنوان'}: ${order.deliveryAddress}

${isEn ? 'Vendor / Partner Store' : 'المتجر / الشريك'}:
- ${isEn ? 'Store' : 'المتجر'}: ${order.storeName}
- ${isEn ? 'Contact' : 'هاتف المتجر'}: ${order.storePhone}
- ${isEn ? 'Rescued Item' : 'السلة المحجوزة'}: ${order.boxTitle}
- ${isEn ? 'Pickup Window' : 'نافذة الاستلام'}: ${order.pickupWindow}

-----------------------------------------------------
${isEn ? 'Financial Split & Settlement (SYP)' : 'التسوية المالية والمقاصة الفورية (ل.س)'}:
- ${isEn ? 'Total Customer Paid' : 'المبلغ الإجمالي المدفوع'}: ${order.financialSplit.totalCustomerPaid.toLocaleString()} ${order.financialSplit.currency}
- ${isEn ? 'Merchant Net' : 'صافي حصة التاجر'}: ${order.financialSplit.merchantShare.toLocaleString()} ${order.financialSplit.currency}
- ${isEn ? 'Driver Delivery Share' : 'حصة كابتن التوصيل'}: ${order.financialSplit.driverShare.toLocaleString()} ${order.financialSplit.currency}
- ${isEn ? 'Platform Ops Fee' : 'رسوم المنصة التشغيلية'}: ${order.financialSplit.platformOperationalFee.toLocaleString()} ${order.financialSplit.currency}
- ${isEn ? 'Payment Method' : 'طريقة الدفع'}: ${order.paymentMethod}
- ${isEn ? 'Status' : 'حالة التوثيق'}: ${order.status.toUpperCase()}

=====================================================
${isEn ? 'Generated & Backed up directly to Google Drive via Barakah Box Platform' : 'تم الإنشاء والأرشفة السحابية المباشرة في Google Drive عبر منصة صندوق بركة'}
`;

  const fileName = `BarakahBox_Invoice_${order.id}_${now}.txt`;

  return await uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/plain',
    content,
    parentFolderId: folderId,
  });
}

/**
 * Export Merchant Settlement Ledger to Google Drive as CSV
 */
export async function exportMerchantSettlementToDrive(
  accessToken: string,
  merchantName: string,
  orders: OrderItem[],
  merchantWalletBalance: number,
  lang: Language
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBarakahFolder(accessToken);
  const now = new Date().toISOString().split('T')[0];

  const headers = ['Order_ID', 'Date', 'Governorate', 'Customer', 'Box_Title', 'Merchant_Net_SYP', 'Status'];
  const rows = orders.map((o) => [
    o.id,
    o.orderPlacedAt,
    o.governorate,
    `"${o.customerName}"`,
    `"${o.boxTitle}"`,
    o.merchantNet,
    o.status,
  ]);

  const summaryRow = ['TOTAL_WALLET_BALANCE_SYP', '', '', '', '', merchantWalletBalance, 'ACTIVE'];
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(',')), summaryRow.join(',')].join('\n');

  const fileName = `BarakahBox_Merchant_Settlement_${merchantName.replace(/\s+/g, '_')}_${now}.csv`;

  return await uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/csv',
    content: csvContent,
    parentFolderId: folderId,
  });
}

/**
 * Export Environmental Impact & Food Rescue Certificate
 */
export async function exportImpactCertificateToDrive(
  accessToken: string,
  stats: {
    co2SavedKg: number;
    mealsRescued: number;
    moneySavedSyp: number;
    userName?: string;
  },
  lang: Language
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBarakahFolder(accessToken);
  const isEn = lang === 'en';
  const now = new Date().toLocaleDateString(isEn ? 'en-US' : 'ar-SY');

  const certificateText = `
╔══════════════════════════════════════════════════════════════════════╗
║               ${isEn ? 'BARAKAH BOX • ENVIRONMENTAL IMPACT CERTIFICATE' : 'صندوق بركة • وثيقة شهادة الأثر البيئي ومكافحة الهدر'}               ║
╚══════════════════════════════════════════════════════════════════════╝

${isEn ? 'Presented to' : 'تُمنح هذه الشهادة المعتمدة إلى'}: ${stats.userName || (isEn ? 'Valued Food Saver' : 'حامي النعمة السوري')}
${isEn ? 'Date of Issue' : 'تاريخ الإصدار'}: ${now}
${isEn ? 'Region' : 'النطاق الجغرافي'}: ${isEn ? 'Syrian Arab Republic' : 'الجمهورية العربية السورية'}

${isEn ? 'Summary of Achievements' : 'ملخص الإنجازات البيئية والاقتصادية'}:
----------------------------------------------------------------------
1. ${isEn ? 'Total Surplus Meals Rescued' : 'إجمالي وجبات وسلال الطعام الطازج التي تم إنقاذها'}: ${stats.mealsRescued} ${isEn ? 'meals' : 'وجبة / سلة'}
2. ${isEn ? 'CO2 Emissions Prevented' : 'انبعاثات غاز الكربون التي تم تفاديها'}: ${stats.co2SavedKg.toFixed(1)} ${isEn ? 'kg CO2e' : 'كغ كربون'}
3. ${isEn ? 'Total Money Saved by Community' : 'المبلغ المالي الموفر للمستهلكين'}: ${stats.moneySavedSyp.toLocaleString()} ${isEn ? 'SYP' : 'ل.س'}

${isEn ? 'Thank you for protecting blessings and fighting food waste across Syria.' : 'شكراً لمساهمتك الفعالة في حفظ النعمة ومكافحة الهدر في سوريا.'}
----------------------------------------------------------------------
${isEn ? 'Archived securely to Google Drive' : 'مؤرشفة سحابياً بشكل دائم على Google Drive'}
`;

  const fileName = `BarakahBox_Impact_Certificate_${Date.now()}.txt`;

  return await uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/plain',
    content: certificateText,
    parentFolderId: folderId,
  });
}

/**
 * Export Platform Audit & Oversight Report
 */
export async function exportAdminAuditToDrive(
  accessToken: string,
  disputes: DisputeIncident[],
  audits: AuditLog[],
  lang: Language
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBarakahFolder(accessToken);
  const now = new Date().toISOString().split('T')[0];

  const auditContent = `=====================================================
BARAKAH BOX SYRIA - ADMINISTRATIVE & AUDIT LOGS EXPORT
Date: ${now}
=====================================================

1. DISPUTE INCIDENTS (${disputes.length} records):
${disputes
  .map(
    (d, i) =>
      `[${i + 1}] Order #${d.orderNumber} | Gov: ${d.governorate} | Merchant: ${d.merchantName} | Customer: ${d.customerName} | Amount: ${d.totalAmount} SYP | Status: ${d.status} | Reason: ${d.reason}`
  )
  .join('\n')}

-----------------------------------------------------
2. ON-THE-GROUND AUDIT LOGS (${audits.length} records):
${audits
  .map(
    (a, i) =>
      `[${i + 1}] ${a.timestamp} | Store: ${a.storeName} | Driver: ${a.driverName} | Gov: ${a.governorate} | Method: ${a.verificationMethod} | Status: ${a.status} | Note: ${a.note}`
  )
  .join('\n')}
`;

  const fileName = `BarakahBox_Admin_Audit_Report_${now}.txt`;

  return await uploadFileToDrive(accessToken, {
    name: fileName,
    mimeType: 'text/plain',
    content: auditContent,
    parentFolderId: folderId,
  });
}
