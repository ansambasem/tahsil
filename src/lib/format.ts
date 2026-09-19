export function formatCurrency(amount: number, currency = 'ريال'): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${formatted} ${currency}`;
}

export function formatNumber(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

export const subscriptionTypeLabels: Record<string, string> = {
  residential: 'سكني',
  commercial: 'تجاري',
  industrial: 'صناعي',
};

export const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  suspended: 'موقوف',
  open: 'مفتوح',
  closed: 'مغلق',
  pending: 'في الانتظار',
  entered: 'مدخل',
  verified: 'متحقق',
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئياً',
  paid: 'مدفوع',
  cancelled: 'ملغي',
  reversed: 'معكوس',
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدي',
  transfer: 'تحويل',
  card: 'بطاقة',
};

export const actionTypeLabels: Record<string, string> = {
  'payment.create': 'تسجيل دفعة',
  'payment.reverse': 'عكس دفعة',
  'charges.generate': 'توليد رسوم',
  'week.close': 'إغلاق فترة',
  'week.reopen': 'إعادة فتح فترة',
  'reading.create': 'إدخال قراءة',
  'reading.update': 'تعديل قراءة',
  'meter.replace': 'استبدال عداد',
  'tariff.update': 'تعديل تعرفة',
  'receipt.reprint': 'إعادة طباعة إيصال',
  'user.create': 'إنشاء مستخدم',
  'permission.change': 'تغيير صلاحية',
};
