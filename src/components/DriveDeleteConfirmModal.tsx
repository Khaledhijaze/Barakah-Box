import React from 'react';
import { Language } from '../types';

interface DriveDeleteConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  isFolder?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  lang: Language;
}

export const DriveDeleteConfirmModal: React.FC<DriveDeleteConfirmModalProps> = ({
  isOpen,
  fileName,
  isFolder = false,
  onConfirm,
  onCancel,
  isDeleting = false,
  lang,
}) => {
  if (!isOpen) return null;

  const isEn = lang === 'en';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden transform transition-all scale-100 p-6 space-y-5">
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEn
                ? isFolder
                  ? 'Confirm Deleting Google Drive Folder'
                  : 'Confirm Deleting Google Drive File'
                : isFolder
                ? 'تأكيد حذف المجلد من Google Drive'
                : 'تأكيد حذف الملف من Google Drive'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEn
                ? 'This destructive action requires explicit authorization.'
                : 'هذا الإجراء تعديل دائم على سحابتك ويتطلب تأكيداً صريحاً.'}
            </p>
          </div>
        </div>

        {/* Affected Item Details */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <span className="text-slate-500 block mb-1 font-semibold">
            {isEn ? 'Target Item in Google Drive:' : 'العنصر المستهدف في Google Drive:'}
          </span>
          <div className="flex items-center gap-2 font-bold text-slate-800 break-all">
            <span className="material-symbols-outlined text-slate-600 text-[18px]">
              {isFolder ? 'folder' : 'description'}
            </span>
            <span>{fileName}</span>
          </div>
        </div>

        <p className="text-xs text-red-600 font-medium">
          {isEn
            ? 'Are you sure you want to permanently delete this item from your Google Drive? This action cannot be undone.'
            : 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً من حساب Google Drive الخاص بك؟ لا يمكن التراجع عن هذا الإجراء.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isEn ? 'Cancel (No Changes)' : 'إلغاء (تراجع)'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{isEn ? 'Deleting from Drive...' : 'جاري الحذف من Drive...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                <span>{isEn ? 'Yes, Delete from Google Drive' : 'نعم، احذف الملف من Drive'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
