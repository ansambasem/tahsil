import { type ReactNode, useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

// ============ Modal ============
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${sizeClass} w-full bg-white rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ============ ConfirmDialog ============
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-slate-600">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">{cancelLabel}</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============ StatusBadge ============
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-success-100 text-success-700',
    open: 'bg-success-100 text-success-700',
    entered: 'bg-primary-100 text-primary-700',
    verified: 'bg-success-100 text-success-700',
    pending: 'bg-warning-100 text-warning-700',
    inactive: 'bg-slate-100 text-slate-600',
    closed: 'bg-slate-200 text-slate-700',
    suspended: 'bg-danger-100 text-danger-700',
    unpaid: 'bg-danger-100 text-danger-700',
    partial: 'bg-warning-100 text-warning-700',
    paid: 'bg-success-100 text-success-700',
    cancelled: 'bg-slate-200 text-slate-600',
    reversed: 'bg-danger-100 text-danger-700',
  };

  const labels: Record<string, string> = {
    active: 'نشط',
    open: 'مفتوح',
    entered: 'مدخل',
    verified: 'متحقق',
    pending: 'في الانتظار',
    inactive: 'غير نشط',
    closed: 'مغلق',
    suspended: 'موقوف',
    unpaid: 'غير مدفوع',
    partial: 'جزئي',
    paid: 'مدفوع',
    cancelled: 'ملغي',
    reversed: 'معكوس',
  };

  return (
    <span className={`badge ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

// ============ MoneyDisplay ============
export function MoneyDisplay({ amount, className = '' }: { amount: number; className?: string }) {
  const formatted = new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount));
  const color = amount < 0 ? 'text-danger-600' : amount > 0 ? 'text-slate-800' : 'text-slate-500';
  return (
    <span className={`font-semibold ${color} ${className}`}>
      {formatted} <span className="text-xs font-normal text-slate-400">ريال</span>
    </span>
  );
}

// ============ LoadingState ============
export function LoadingState({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

// ============ EmptyState ============
export function EmptyState({ message, icon: Icon }: { message: string; icon?: typeof Info }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {Icon && <Icon className="w-12 h-12 text-slate-300 mb-3" />}
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// ============ ErrorState ============
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertCircle className="w-12 h-12 text-danger-400 mb-3" />
      <p className="text-danger-600 text-sm">{message}</p>
    </div>
  );
}

// ============ Toast ============
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastIdCounter = 0;
const toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

export function showToast(type: ToastType, message: string) {
  const id = `toast-${++toastIdCounter}`;
  currentToasts = [...currentToasts, { id, type, message }];
  toastListeners.forEach((l) => l(currentToasts));
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => L(currentToasts));
  }, 4000);
}

function L(toasts: Toast[]) { toastListeners.forEach((l) => l(toasts)); }

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts([...newToasts]);
    toastListeners.push(listener);
    return () => {
      const idx = toastListeners.indexOf(listener);
      if (idx > -1) toastListeners.splice(idx, 1);
    };
  }, []);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-danger-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
  };

  const bg = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    info: 'bg-primary-50 border-primary-200',
  };

  return (
    <div className="fixed top-4 left-4 z-[100] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-fade-in ${bg[t.type]}`}
        >
          {icons[t.type]}
          <span className="text-sm text-slate-700">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ============ Pagination ============
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        السابق
      </button>
      {start > 1 && <span className="px-2 text-slate-400">...</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            p === page ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2 text-slate-400">...</span>}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        التالي
      </button>
    </div>
  );
}

// ============ SearchInput ============
export function SearchInput({
  value,
  onChange,
  placeholder = 'بحث...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pr-10"
      />
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

// ============ SelectField ============
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-danger-500">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input" required={required}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============ FormField ============
export function FormField({
  label,
  children,
  required = false,
  error,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-danger-500 mr-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
}
