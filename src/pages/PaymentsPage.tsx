import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, SelectField, StatusBadge, MoneyDisplay, SearchInput, showToast } from '@/components/ui';
import { Plus, Undo } from 'lucide-react';
import { formatCurrency, formatDateTime, paymentMethodLabels } from '@/lib/format';
import type { Payment, Charge } from '@/lib/types';

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [reversePayment, setReversePayment] = useState<Payment | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payForm, setPayForm] = useState({ charge_id: '', amount: '', payment_method: 'cash', notes: '' });
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', search, statusFilter],
    queryFn: () => api.getPayments({ search: search || undefined, status: statusFilter || undefined }),
  });

  const { data: unpaidCharges } = useQuery<Charge[]>({
    queryKey: ['unpaid-charges'],
    queryFn: () => api.getUnpaidCharges(),
  });

  const payMutation = useMutation({
    mutationFn: () => api.processPayment({
      charge_id: payForm.charge_id,
      amount: parseFloat(payForm.amount) || 0,
      payment_method: payForm.payment_method,
      notes: payForm.notes || undefined,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['unpaid-charges'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast('success', `تم تسجيل الدفعة بنجاح. رقم الإيصال: ${data.receipt_number}`);
      setPayModalOpen(false);
      setPayForm({ charge_id: '', amount: '', payment_method: 'cash', notes: '' });
      setSelectedCharge(null);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const reverseMutation = useMutation({
    mutationFn: () => api.reversePayment(reversePayment!.id, reverseReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['unpaid-charges'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      showToast('success', 'تم عكس الدفعة بنجاح');
      setReversePayment(null);
      setReverseReason('');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openPay() {
    setPayForm({ charge_id: '', amount: '', payment_method: 'cash', notes: '' });
    setSelectedCharge(null);
    setPayModalOpen(true);
  }

  function onChargeSelect(chargeId: string) {
    const c = unpaidCharges?.find((c) => c.id === chargeId);
    setSelectedCharge(c || null);
    setPayForm({ ...payForm, charge_id: chargeId, amount: c ? String(c.remaining_amount) : '' });
  }

  const columns: Column<Payment>[] = [
    { key: 'payment_number', header: 'رقم العملية', render: (r) => <span className="font-mono text-xs font-semibold">{r.payment_number}</span> },
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'amount', header: 'المبلغ', render: (r) => <MoneyDisplay amount={r.amount} className="text-success-600" /> },
    { key: 'payment_method', header: 'الطريقة', render: (r) => paymentMethodLabels[r.payment_method] },
    { key: 'created_at', header: 'التاريخ', render: (r) => formatDateTime(r.created_at) },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        r.status === 'active' ? (
          <button onClick={(e) => { e.stopPropagation(); setReversePayment(r); }} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500" title="عكس"><Undo className="w-4 h-4" /></button>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="المدفوعات" subtitle="تسجيل وإدارة المدفوعات" actions={
        <button onClick={openPay} className="btn-primary"><Plus className="w-4 h-4" /> دفعة جديدة</button>
      } />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم العملة، اسم أو رقم المشترك..." />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="reversed">معكوس</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={payments || []} loading={isLoading} emptyMessage="لا توجد مدفوعات" />

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="تسجيل دفعة جديدة" size="lg">
        <div className="space-y-4">
          <SelectField label="الرسم" required value={payForm.charge_id} onChange={onChargeSelect}
            options={(unpaidCharges || []).map((c) => ({
              value: c.id,
              label: `${c.customer?.customer_name} - ${c.customer?.customer_number} | متبقي: ${formatCurrency(c.remaining_amount)}`,
            }))}
            placeholder="اختر الرسم غير المدفوع" />

          {selectedCharge && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">الرسوم الإجمالية</p><p className="font-bold">{formatCurrency(selectedCharge.charge_amount)}</p></div>
                <div><p className="text-slate-500 text-xs">المدفوع</p><p className="font-bold text-success-600">{formatCurrency(selectedCharge.paid_amount)}</p></div>
                <div><p className="text-slate-500 text-xs">المتبقي</p><p className="font-bold text-danger-600">{formatCurrency(selectedCharge.remaining_amount)}</p></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="المبلغ" required>
              <input type="number" step="0.01" className="input" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            </FormField>
            <SelectField label="طريقة الدفع" required value={payForm.payment_method} onChange={(v) => setPayForm({ ...payForm, payment_method: v })}
              options={[{ value: 'cash', label: 'نقدي' }, { value: 'transfer', label: 'تحويل' }, { value: 'card', label: 'بطاقة' }]} />
          </div>
          <FormField label="ملاحظات">
            <textarea className="input" rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setPayModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending || !payForm.charge_id || !payForm.amount} className="btn-primary">
            {payMutation.isPending ? 'جاري...' : 'تسجيل الدفعة'}
          </button>
        </div>
      </Modal>

      <Modal open={!!reversePayment} onClose={() => setReversePayment(null)} title="عكس دفعة" size="sm">
        {reversePayment && (
          <div className="space-y-4">
            <div className="bg-danger-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">رقم العملية:</span><span className="font-mono font-semibold">{reversePayment.payment_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">المبلغ:</span><span className="font-bold text-danger-600">{formatCurrency(reversePayment.amount)}</span>
              </div>
            </div>
            <FormField label="سبب العكس" required>
              <textarea className="input" rows={3} value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="سبب عكس الدفعة (يتم تسجيله في سجل التدقيق)" />
            </FormField>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReversePayment(null)} className="btn-secondary">إلغاء</button>
              <button onClick={() => reverseMutation.mutate()} disabled={reverseMutation.isPending || !reverseReason.trim()} className="btn-danger">
                {reverseMutation.isPending ? 'جاري...' : 'عكس الدفعة'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
