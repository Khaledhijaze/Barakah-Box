import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
} from '../services/firebaseAuth';
import {
  DriveFileItem,
  DriveAboutInfo,
  getDriveAbout,
  listDriveFiles,
  createDriveFolder,
  uploadFileToDrive,
  deleteDriveFile,
  getOrCreateBarakahFolder,
  formatBytes,
  exportOrderInvoiceToDrive,
  exportMerchantSettlementToDrive,
  exportImpactCertificateToDrive,
  exportAdminAuditToDrive,
} from '../services/googleDriveService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { DriveDeleteConfirmModal } from './DriveDeleteConfirmModal';
import { OrderItem, DisputeIncident, AuditLog, Language, SyrianGovernorate } from '../types';

interface GoogleDriveHubProps {
  orders: OrderItem[];
  disputes: DisputeIncident[];
  auditLogs: AuditLog[];
  merchantWalletBalance: number;
  onShowToast: (text: string, icon?: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

export const GoogleDriveHub: React.FC<GoogleDriveHubProps> = ({
  orders,
  disputes,
  auditLogs,
  merchantWalletBalance,
  onShowToast,
  lang,
}) => {
  const isEn = lang === 'en';

  // Auth States (token kept in memory only)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Drive Data States
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<{ id?: string; name: string }[]>([
    { id: undefined, name: isEn ? 'My Google Drive' : 'ملفاتي في Google Drive' },
  ]);

  // Modals & Action States
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Mandatory Delete Confirmation Modal state
  const [itemToDelete, setItemToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick export state
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAuthChecked(true);
      },
      () => {
        setUser(null);
        setToken(null);
        setAuthChecked(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive info and files when token or folder changes
  const fetchDriveData = useCallback(async () => {
    const currentToken = token || (await getAccessToken());
    if (!currentToken) return;

    setIsLoadingFiles(true);
    try {
      // 1. Fetch about/storage info
      try {
        const about = await getDriveAbout(currentToken);
        setAboutInfo(about);
      } catch (err) {
        console.warn('Could not load about info:', err);
      }

      // 2. Fetch files list
      const items = await listDriveFiles(currentToken, {
        parentFolderId: currentFolderId,
        searchTerm: searchQuery,
        mimeTypeFilter: typeFilter === 'all' ? undefined : typeFilter,
        pageSize: 50,
      });
      setFiles(items);
    } catch (err: any) {
      console.error('Error fetching drive data:', err);
      onShowToast(
        isEn
          ? `Google Drive Sync Error: ${err.message || 'Check connection'}`
          : `خطأ أثناء المزامنة مع Google Drive: ${err.message || 'تحقق من الاتصال'}`,
        'error',
        'error'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  }, [token, currentFolderId, searchQuery, typeFilter, isEn, onShowToast]);

  useEffect(() => {
    if (token) {
      fetchDriveData();
    }
  }, [token, fetchDriveData]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
        setUser(res.user);
        onShowToast(
          isEn
            ? `Connected to Google Drive successfully as ${res.user.displayName || res.user.email}!`
            : `تم الاتصال بحساب Google Drive بنجاح: ${res.user.displayName || res.user.email}!`,
          'cloud_done',
          'success'
        );
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      onShowToast(
        isEn
          ? `Authentication failed: ${err.message}`
          : `فشل تسجيل الدخول بحساب Google: ${err.message}`,
        'warning',
        'error'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setToken(null);
      setUser(null);
      setFiles([]);
      setAboutInfo(null);
      onShowToast(
        isEn ? 'Signed out of Google Drive' : 'تم تسجيل الخروج من Google Drive',
        'logout',
        'info'
      );
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Folder navigation helpers
  const handleOpenFolder = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolderId(target.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !token) return;

    setIsCreatingFolder(true);
    try {
      const created = await createDriveFolder(token, newFolderName.trim(), currentFolderId);
      onShowToast(
        isEn
          ? `Folder "${created.name}" created in Google Drive!`
          : `تم إنشاء المجلد "${created.name}" في Google Drive بنجاح!`,
        'create_new_folder',
        'success'
      );
      setNewFolderName('');
      setIsNewFolderOpen(false);
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !token) return;

    const file = fileList[0];
    setIsUploading(true);
    try {
      const uploaded = await uploadFileToDrive(token, {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: file,
        parentFolderId: currentFolderId,
      });

      onShowToast(
        isEn
          ? `File "${uploaded.name}" uploaded to Google Drive!`
          : `تم رفع الملف "${uploaded.name}" إلى Google Drive بنجاح!`,
        'cloud_upload',
        'success'
      );
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // MANDATORY: Execute delete ONLY after explicit user confirmation dialog
  const handleExecuteDelete = async () => {
    if (!itemToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(token, itemToDelete.id);
      onShowToast(
        isEn
          ? `"${itemToDelete.name}" was permanently removed from Google Drive.`
          : `تم حذف "${itemToDelete.name}" من Google Drive بنجاح.`,
        'delete',
        'info'
      );
      setItemToDelete(null);
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Platform Direct Quick Exports
  const handleExportInvoices = async () => {
    if (!token) return;
    setIsExporting('invoices');
    try {
      if (orders.length === 0) {
        throw new Error(isEn ? 'No orders to export' : 'لا توجد طلبات للتصدير حالياً');
      }
      // Export latest order or sample
      const targetOrder = orders[0];
      const exported = await exportOrderInvoiceToDrive(token, targetOrder, lang);
      onShowToast(
        isEn
          ? `Order #${targetOrder.id} Invoice saved to Google Drive!`
          : `تم تصدير وحفظ فاتورة الطلب #${targetOrder.id} في Google Drive بنجاح!`,
        'receipt_long',
        'success'
      );
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportSettlements = async () => {
    if (!token) return;
    setIsExporting('settlement');
    try {
      const exported = await exportMerchantSettlementToDrive(
        token,
        'دمشق_الرئيسية_الشام',
        orders,
        merchantWalletBalance,
        lang
      );
      onShowToast(
        isEn
          ? `Merchant Settlement ledger saved to Google Drive: "${exported.name}"`
          : `تم حفظ كشف حساب التاجر وتسويات المقاصة في Google Drive: "${exported.name}"`,
        'table_chart',
        'success'
      );
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportImpactCertificate = async () => {
    if (!token) return;
    setIsExporting('impact');
    try {
      const exported = await exportImpactCertificateToDrive(
        token,
        {
          co2SavedKg: 142.8,
          mealsRescued: 78,
          moneySavedSyp: 840000,
          userName: user?.displayName || 'المستهلك السوري المبارك',
        },
        lang
      );
      onShowToast(
        isEn
          ? `Impact Certificate exported to Google Drive!`
          : `تم تصدير شهادة الأثر البيئي وحفظ النعمة إلى Google Drive بنجاح!`,
        'workspace_premium',
        'success'
      );
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportAudit = async () => {
    if (!token) return;
    setIsExporting('audit');
    try {
      const exported = await exportAdminAuditToDrive(token, disputes, auditLogs, lang);
      onShowToast(
        isEn
          ? `Administrative & Audit records exported to Google Drive!`
          : `تم تصدير سجلات الرقابة والنزاعات الإدارية إلى Google Drive!`,
        'verified_user',
        'success'
      );
      fetchDriveData();
    } catch (err: any) {
      onShowToast(err.message, 'error', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  // Helper for file type icons & colors
  const getFileIcon = (file: DriveFileItem) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return { icon: 'folder', color: 'text-amber-500 bg-amber-50' };
    }
    if (file.mimeType.includes('pdf')) {
      return { icon: 'picture_as_pdf', color: 'text-red-500 bg-red-50' };
    }
    if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('csv')) {
      return { icon: 'table_chart', color: 'text-emerald-600 bg-emerald-50' };
    }
    if (file.mimeType.includes('document') || file.mimeType.includes('word') || file.mimeType.includes('text')) {
      return { icon: 'description', color: 'text-blue-500 bg-blue-50' };
    }
    if (file.mimeType.includes('image/')) {
      return { icon: 'image', color: 'text-purple-500 bg-purple-50' };
    }
    return { icon: 'insert_drive_file', color: 'text-slate-500 bg-slate-50' };
  };

  // 1. UNAUTHENTICATED STATE: Clean, professional Google Workspace prompt
  if (!token) {
    return (
      <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-[#006948] via-[#005137] to-[#003826] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="max-w-3xl space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold border border-white/15">
              <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
              <span>{isEn ? 'Google Drive Cloud Integration' : 'التكامل السحابي المعتمد مع Google Drive'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isEn
                ? 'Centralized Cloud Storage & Document Hub with Google Drive'
                : 'مركز الأرشفة والمستندات السحابية لمنظومة بركة عبر Google Drive'}
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              {isEn
                ? 'Connect your Google Drive account with your explicit permission to seamlessly store, archive, view, and organize official food rescue certificates, merchant settlement ledgers, order invoices, and field delivery verification logs.'
                : 'اربط حساب Google Drive الخاص بك بإذن وتفويض منك لتخزين، أرشفة، استعراض وإدارة وثائق حفظ النعمة، كشوفات حساب التجار، فواتير الطلبات، وسجلات الرقابة الميدانية في دمشق وسوريا مباشرة وبأمان.'}
            </p>

            {/* Official Sign in button */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <GoogleSignInButton
                onClick={handleSignIn}
                isLoading={isLoggingIn}
                text={
                  isEn
                    ? 'Connect Google Drive with Google Account'
                    : 'تسجيل الدخول والمزامنة مع Google Drive'
                }
              />
              <span className="text-xs text-emerald-200/80 font-medium">
                {isEn
                  ? '🔒 Direct, secure authorization directly via Google Identity'
                  : '🔒 تفويض مباشر وآمن بدون تخزين بيانات المرور'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006948] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">receipt_long</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isEn ? 'Automated Invoices & Vouchers' : 'أرشفة الفواتير ووثائق الطلب'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isEn
                ? 'Save and backup every food rescue transaction receipt and QR voucher directly to your Drive in text, PDF or CSV.'
                : 'حفظ وتوثيق كافة فواتير السلال الطازجة ورموز QR للاستلام بملفات نصية وجداول منظمة داخل مجلد مخصص في Drive.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">table_chart</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isEn ? 'Merchant Financial Statements' : 'كشوفات حساب التجار والمقاصة'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isEn
                ? 'Export comprehensive settlement statements with merchant net shares and delivery captain fees directly to Google Sheets.'
                : 'تصدير كشوفات المقاصة المالية الفورية للتاجر ونسب الكباتن والمنصة بصيغ متوافقة مع Google Sheets بضغطة زر.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isEn ? 'Official Impact Certificates' : 'شهادات الأثر البيئي وحفظ النعمة'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isEn
                ? 'Generate verified impact certificates showing CO2 emissions prevented and kilograms of food saved across Syrian governorates.'
                : 'إصدار شهادات توثيق الأثر البيئي ومكافحة الهدر وحفظ النعمة وتخزينها كسجل دائم في Google Drive الخاص بك.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED STATE: Full Drive Explorer & Sync Dashboard
  const storageLimit = aboutInfo?.storageQuota?.limit ? parseInt(aboutInfo.storageQuota.limit, 10) : 0;
  const storageUsage = aboutInfo?.storageQuota?.usage ? parseInt(aboutInfo.storageQuota.usage, 10) : 0;
  const usagePercent = storageLimit > 0 ? Math.min(100, Math.round((storageUsage / storageLimit) * 100)) : 0;

  return (
    <div className="space-y-6" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Hidden File Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Connected Header & Storage Stats Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* User Identity */}
        <div className="flex items-center gap-3.5">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#006948]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#006948] text-white flex items-center justify-center text-lg font-bold">
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                {user?.displayName || (isEn ? 'Google User' : 'مستخدم Google')}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{isEn ? 'Drive Connected' : 'متصل بـ Google Drive'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Quota & Quick Logout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {storageLimit > 0 && (
            <div className="bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 text-xs min-w-[200px]">
              <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700">
                <span>{isEn ? 'Drive Storage' : 'مساحة تخزين Drive'}</span>
                <span className="text-[#006948] font-bold">{usagePercent}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#006948] h-full transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>{formatBytes(storageUsage)} {isEn ? 'used' : 'مستخدم'}</span>
                <span>{formatBytes(storageLimit)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchDriveData}
              disabled={isLoadingFiles}
              title={isEn ? 'Refresh Google Drive files' : 'تحديث ملفات Google Drive'}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoadingFiles ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>{isEn ? 'Disconnect' : 'قطع الاتصال'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Syrian Platform Fast Cloud Exporter Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 rounded-3xl p-5 border border-emerald-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006948] text-[20px]">
              backup
            </span>
            <span className="font-bold text-xs sm:text-sm text-slate-800">
              {isEn ? 'Instant Syrian Platform Exports to Google Drive' : 'التصدير السحابي الفوري إلى Google Drive لمنظومة بركة'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
            {isEn ? 'Barakah Box Folder' : 'مجلد: صندوق بركة - تقارير دمشق وسوريا'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={handleExportInvoices}
            disabled={isExporting !== null}
            className="p-2.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer group disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006948] group-hover:text-white">
              receipt_long
            </span>
            <span className="truncate">
              {isExporting === 'invoices' ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save Order Invoice' : 'تصدير فاتورة طلب')}
            </span>
          </button>

          <button
            onClick={handleExportSettlements}
            disabled={isExporting !== null}
            className="p-2.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer group disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-600 group-hover:text-white">
              table_chart
            </span>
            <span className="truncate">
              {isExporting === 'settlement' ? (isEn ? 'Exporting...' : 'جاري التصدير...') : (isEn ? 'Export Merchant Ledger' : 'كشف حساب التاجر')}
            </span>
          </button>

          <button
            onClick={handleExportImpactCertificate}
            disabled={isExporting !== null}
            className="p-2.5 rounded-xl bg-white hover:bg-amber-600 hover:text-white border border-amber-200 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer group disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-600 group-hover:text-white">
              workspace_premium
            </span>
            <span className="truncate">
              {isExporting === 'impact' ? (isEn ? 'Generating...' : 'جاري الإنشاء...') : (isEn ? 'Save Impact Certificate' : 'شهادة حفظ النعمة')}
            </span>
          </button>

          <button
            onClick={handleExportAudit}
            disabled={isExporting !== null}
            className="p-2.5 rounded-xl bg-white hover:bg-purple-600 hover:text-white border border-purple-200 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer group disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] text-purple-600 group-hover:text-white">
              verified_user
            </span>
            <span className="truncate">
              {isExporting === 'audit' ? (isEn ? 'Archiving...' : 'جاري الأرشفة...') : (isEn ? 'Archive Audit Logs' : 'أرشفة سجلات الرقابة')}
            </span>
          </button>
        </div>
      </div>

      {/* Explorer Controls: Breadcrumbs, Search, Type Filter & Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Row 1: Breadcrumbs & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-slate-600">
            <span className="material-symbols-outlined text-[18px] text-slate-400">folder_open</span>
            {folderPath.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    {isEn ? 'chevron_right' : 'chevron_left'}
                  </span>
                )}
                <button
                  onClick={() => handleNavigateBreadcrumb(idx)}
                  className={`hover:text-[#006948] transition-colors cursor-pointer ${
                    idx === folderPath.length - 1 ? 'font-bold text-slate-900 underline decoration-[#006948] underline-offset-4' : ''
                  }`}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Action Buttons: Upload & New Folder */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-500">create_new_folder</span>
              <span>{isEn ? 'New Folder' : 'مجلد جديد'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#005137] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>{isUploading ? (isEn ? 'Uploading...' : 'جاري الرفع...') : (isEn ? 'Upload to Drive' : 'رفع ملف إلى Drive')}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Input & Category Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 right-3 rtl:right-3 ltr:left-3 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search files in Google Drive...' : 'بحث في ملفات Google Drive...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-9 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-8 rtl:right-auto rtl:left-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Type Filter Pills & View Mode */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: isEn ? 'All' : 'الكل', icon: 'grid_view' },
              { id: 'folder', label: isEn ? 'Folders' : 'مجلدات', icon: 'folder' },
              { id: 'document', label: isEn ? 'Docs / PDF' : 'مستندات', icon: 'description' },
              { id: 'spreadsheet', label: isEn ? 'Sheets' : 'جداول', icon: 'table_chart' },
              { id: 'image', label: isEn ? 'Photos' : 'صور', icon: 'image' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  typeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}

            <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content: Files List / Grid / Empty State */}
        {isLoadingFiles ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#006948] rounded-full animate-spin" />
            <p className="text-xs font-medium">
              {isEn ? 'Fetching files from Google Drive...' : 'جاري مزامنة الملفات من Google Drive...'}
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">folder_open</span>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-700 text-sm">
                {isEn ? 'No files or folders found' : 'لم يتم العثور على ملفات أو مجلدات'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isEn
                  ? 'Upload a document or use the Syrian platform quick export buttons above to backup reports to Drive.'
                  : 'يمكنك رفع ملف جديد أو استخدام أزرار التصدير بالأعلى لحفظ الفواتير وكشوفات الحساب في Google Drive.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
            {files.map((file) => {
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
              const { icon, color } = getFileIcon(file);
              return (
                <div
                  key={file.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => isFolder && handleOpenFolder(file)}
                      className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 ${
                        isFolder ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">{icon}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={isEn ? 'Open in Google Drive' : 'فتح في Google Drive'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#006948] hover:bg-slate-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                      )}
                      {/* MANDATORY EXPLICIT CONFIRMATION MODAL TRIGGER */}
                      <button
                        onClick={() => setItemToDelete(file)}
                        title={isEn ? 'Delete file permanently' : 'حذف الملف نهائياً'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => isFolder && handleOpenFolder(file)}
                    className={`${isFolder ? 'cursor-pointer' : ''}`}
                  >
                    <h4
                      className="font-bold text-slate-800 text-xs truncate hover:text-[#006948] transition-colors"
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{isFolder ? (isEn ? 'Folder' : 'مجلد') : formatBytes(file.size)}</span>
                      {file.modifiedTime && (
                        <>
                          <span>•</span>
                          <span>{new Date(file.modifiedTime).toLocaleDateString(isEn ? 'en-US' : 'ar-SY')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold">
                  <th className="py-2.5 px-3">{isEn ? 'Name' : 'اسم الملف / المجلد'}</th>
                  <th className="py-2.5 px-3">{isEn ? 'Size' : 'الحجم'}</th>
                  <th className="py-2.5 px-3">{isEn ? 'Modified' : 'تاريخ التعديل'}</th>
                  <th className="py-2.5 px-3 text-center">{isEn ? 'Actions' : 'إجراءات'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const { icon, color } = getFileIcon(file);
                  return (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div
                          onClick={() => isFolder && handleOpenFolder(file)}
                          className={`flex items-center gap-2.5 ${isFolder ? 'cursor-pointer hover:text-[#006948]' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-[16px]">{icon}</span>
                          </div>
                          <span className="font-bold truncate max-w-xs sm:max-w-md" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {isFolder ? (isEn ? 'Folder' : 'مجلد') : formatBytes(file.size)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString(isEn ? 'en-US' : 'ar-SY') : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg text-slate-500 hover:text-[#006948] hover:bg-slate-100"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </a>
                          )}
                          <button
                            onClick={() => setItemToDelete(file)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateFolder}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[24px]">create_new_folder</span>
              <h3 className="font-bold text-slate-900 text-sm">
                {isEn ? 'Create New Folder on Google Drive' : 'إنشاء مجلد جديد في Google Drive'}
              </h3>
            </div>
            <input
              type="text"
              autoFocus
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={isEn ? 'e.g. Damascus_Food_Reports_2026' : 'مثال: تقارير_فائض_دمشق_2026'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006948]/20 focus:border-[#006948]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                disabled={isCreatingFolder || !newFolderName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006948] hover:bg-[#005137] text-white cursor-pointer disabled:opacity-50"
              >
                {isCreatingFolder ? (isEn ? 'Creating...' : 'جاري الإنشاء...') : (isEn ? 'Create' : 'إنشاء')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANDATORY: Explicit User Confirmation for Destructive Deletion */}
      <DriveDeleteConfirmModal
        isOpen={itemToDelete !== null}
        fileName={itemToDelete?.name || ''}
        isFolder={itemToDelete?.mimeType === 'application/vnd.google-apps.folder'}
        onConfirm={handleExecuteDelete}
        onCancel={() => setItemToDelete(null)}
        isDeleting={isDeleting}
        lang={lang}
      />
    </div>
  );
};
