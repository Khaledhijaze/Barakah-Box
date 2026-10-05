import React from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  icon?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const icon = toast.icon || (isError ? 'error' : 'check_circle');

  return (
    <div className="fixed bottom-6 left-6 z-50 transform transition-all duration-300 pointer-events-auto">
      <div
        className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white ${
          isError ? 'bg-red-700' : 'bg-slate-900'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            isError ? 'text-red-200' : 'text-[#85f8c4]'
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-medium">{toast.text}</span>
        <button
          onClick={onClose}
          className="mr-2 text-slate-300 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
