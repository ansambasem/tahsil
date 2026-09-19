import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, SearchInput, showToast, MoneyDisplay } from '@/components/ui';
import { Printer, Repeat, Eye, Droplets } from 'lucide-react';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/format';
import type { Receipt, ReceiptData } from '@/lib/types';

export function ReceiptsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);

  const { data: receipts, isLoading } = useQuery<Receipt[]>({
    queryKey: ['receipts', search],
    queryFn: () => api.getReceipts(search || undefined),
  });

  const reprintMutation = useMutation({
    mutationFn: (receiptId: string) => api.reprintReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      showToast('success', 'تم تسجيل إعادة الطباعة');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function printReceipt(r: Receipt) {
    const data = r.receipt_data as ReceiptData;
    const win = window.open('', '_blank');
    if (!win) { showToast('error', 'الرجاء السماح بالنوافذ المنبثقة'); return; }
    win.document.write(`
      <html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>إيصال ${data.receipt_number}</title>
      <style>
        body { font-family: 'Tajawal', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 32px; color: #2563eb; margin-bottom: 8px; }
        .title { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0; }
        .info-item { padding: 8px; background: #f8fafc; border-radius: 6px; }
        .info-label { font-size: 12px; color: #64748b; }
        .info-value { font-size: 14px; font-weight: bold; }
        .amounts { margin: 20px 0; }
        .amount-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
        .amount-row.total { font-size: 18px; font-weight: bold; border-bottom: 2px solid #2563eb; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">💧</div>
        <div class="title">شركة المياه</div>
        <div>إيصال استلام دفعة</div>
      </div>
      <div class="info">
        <div class="info-item"><div class="info-label">رقم الإيصال</div><div class="info-value">${data.receipt_number}</div></div>
        <div class="info-item"><div class="info-label">رقم العملية</div><div class="info-value">${data.payment_number}</div></div>
        <div class="info-item"><div class="info-label">التاريخ</div><div class="info-value">${data.date}</div></div>
        <div class="info-item"><div class="info-label">الفترة</div><div class="info-value">${data.week_number}</div></div>
        <div class="info-item"><div class="info-label">اسم المشترك</div><div class="info-value">${data.customer_name}</div></div>
        <div class="info-item"><div class="info-label">رقم المشترك</div><div class="info-value">${data.customer_number}</div></div>
        <div class="info-item"><div class="info-label">رقم العداد</div><div class="info-value">${data.meter_number}</div></div>
        <div class="info-item"><div class="info-label">الفرع</div><div class="info-value">${data.branch_name}</div></div>
        <div class="info-item"><div class="info-label">المنطقة</div><div class="info-value">${data.area_name}</div></div>
        <div class="info-item"><div class="info-label">طريقة الدفع</div><div class="info-value">${paymentMethodLabels[data.payment_method] || data.payment_method}</div></div>
      </div>
      <div class="info">
        <div class="info-item"><div class="info-label">القراءة السابقة</div><div class="info-value">${data.previous_reading}</div></div>
        <div class="info-item"><div class="info-label">القراءة الحالية</div><div class="info-value">${data.current_reading}</div></div>
        <div class="info-item"><div class="info-label">الاستهلاك</div><div class="info-value">${data.consumption} م³</div></div>
        <div class="info-item"><div class="info-label">الموظف</div><div class="info-value">${data.employee_name}</div></div>
      </div>
      <div class="amounts">
        <div class="amount-row"><span>الرسوم الإجمالية:</span><span>${formatCurrency(data.charge_amount)}</span></div>
        <div class="amount-row"><span>المبلغ المدفوع:</span><span style="color:#16a34a;font-weight:bold;">${formatCurrency(data.paid_amount)}</span></div>
        <div class="amount-row total"><span>المتبقي:</span><span>${formatCurrency(data.remaining_amount)}</span></div>
      </div>
      ${data.notes ? `<div style="margin:15px 0;padding:10px;background:#f8fafc;border-radius:6px;"><strong>ملاحظات:</strong> ${data.notes}</div>` : ''}
      <div class="footer">شكراً لتعاملكم معنا</div>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  }

  const columns: Column<Receipt>[] = [
    { key: 'receipt_number', header: 'رقم الإيصال', render: (r) => <span className="font-mono text-xs font-semibold">{r.receipt_number}</span> },
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'paid_amount', header: 'المبلغ', render: (r) => <MoneyDisplay amount={(r.receipt_data as ReceiptData).paid_amount} className="text-success-600" /> },
    { key: 'created_at', header: 'التاريخ', render: (r) => formatDateTime(r.created_at) },
    { key: 'reprint_count', header: 'إعادة الطباعة', render: (r) => r.reprint_count > 0 ? <span className="text-warning-600 text-xs">{r.reprint_count} مرة</span> : '-' },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); setViewReceipt(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="عرض"><Eye className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); printReceipt(r); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600" title="طباعة"><Printer className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); reprintMutation.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-600" title="إعادة طباعة"><Repeat className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="الإيصالات" subtitle="عرض وطباعة الإيصالات" />

      <div className="card p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم الإيصال، اسم أو رقم المشترك..." />
      </div>

      <DataTable columns={columns} data={receipts || []} loading={isLoading} emptyMessage="لا توجد إيصالات" />

      <Modal open={!!viewReceipt} onClose={() => setViewReceipt(null)} title="تفاصيل الإيصال" size="lg">
        {viewReceipt && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center"><Droplets className="w-7 h-7 text-white" /></div>
              <div>
                <p className="font-bold text-slate-800">شركة المياه</p>
                <p className="text-xs text-slate-500">إيصال استلام دفعة</p>
              </div>
            </div>
            {(() => {
              const d = viewReceipt.receipt_data as ReceiptData;
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'رقم الإيصال', v: d.receipt_number },
                      { l: 'رقم العملية', v: d.payment_number },
                      { l: 'التاريخ', v: d.date },
                      { l: 'الفترة', v: d.week_number },
                      { l: 'اسم المشترك', v: d.customer_name },
                      { l: 'رقم المشترك', v: d.customer_number },
                      { l: 'رقم العداد', v: d.meter_number },
                      { l: 'الفرع', v: d.branch_name },
                      { l: 'المنطقة', v: d.area_name },
                      { l: 'طريقة الدفع', v: paymentMethodLabels[d.payment_method] || d.payment_method },
                      { l: 'القراءة السابقة', v: String(d.previous_reading) },
                      { l: 'القراءة الحالية', v: String(d.current_reading) },
                      { l: 'الاستهلاك', v: `${d.consumption} م³` },
                      { l: 'الموظف', v: d.employee_name },
                    ].map((item) => (
                      <div key={item.l} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">{item.l}</p>
                        <p className="text-sm font-semibold text-slate-800">{item.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm"><span>الرسوم الإجمالية:</span><span className="font-bold">{formatCurrency(d.charge_amount)}</span></div>
                    <div className="flex justify-between text-sm"><span>المبلغ المدفوع:</span><span className="font-bold text-success-600">{formatCurrency(d.paid_amount)}</span></div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-primary-200"><span>المتبقي:</span><span>{formatCurrency(d.remaining_amount)}</span></div>
                  </div>
                  {d.notes && <div className="bg-slate-50 rounded-lg p-3 text-sm"><strong>ملاحظات:</strong> {d.notes}</div>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => printReceipt(viewReceipt)} className="btn-primary"><Printer className="w-4 h-4" /> طباعة</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
