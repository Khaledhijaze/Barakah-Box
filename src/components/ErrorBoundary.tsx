import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              واجه النظام مشكلة تقنية أثناء معالجة البيانات. يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#006948] text-white rounded-xl font-bold shadow-md hover:bg-[#00855d] transition-all"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
