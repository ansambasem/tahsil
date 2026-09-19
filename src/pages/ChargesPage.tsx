import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SelectField, StatusBadge, MoneyDisplay, showToast, ConfirmDialog } from '@/components/ui';
import { Zap } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { Charge, WeekPeriod } from '@/lib/types';

export function ChargesPage() {
  const queryClient = useQueryClient();
  const [weekFilter, setWeekFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generateWeekId, setGenerateWeekId] = useState<string | null>(null);

  const { data: weeks } = useQuery<WeekPeriod[]>({
    queryKey: ['weeks'],
    queryFn: () => api.getWeeks(),
  });

  const { data: charges, isLoading } = useQuery<Charge[]>({
    queryKey: ['charges', weekFilter, statusFilter],
    queryFn: () => api.getCharges({ week_id: weekFilter || undefined, status: statusFilter || undefined }),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateCharges(generateWeekId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      showToast('success', 'تم توليد الرسوم بنجاح');
      setGenerateWeekId(null);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const columns: Column<Charge>[] = [
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'meter', header: 'العداد', render: (r) => <span className="font-mono text-xs">{r.meter?.meter_number}</span> },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'consumption', header: 'الاستهلاك', render: (r) => `${formatNumber(r.consumption, 1)} م³` },
    { key: 'charge_amount', header: 'الرسوم', render: (r) => <MoneyDisplay amount={r.charge_amount} /> },
    { key: 'paid_amount', header: 'المدفوع', render: (r) => <MoneyDisplay amount={r.paid_amount} /> },
    { key: 'remaining_amount', header: 'المتبقي', render: (r) => <MoneyDisplay amount={r.remaining_amount} /> },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="الرسوم" subtitle="إدارة رسوم الفوترة" actions={
        <button onClick={() => setGenerateWeekId(weekFilter || weeks?.[0]?.id || '')} className="btn-primary" disabled={!weeks?.length}>
          <Zap className="w-4 h-4" /> توليد الرسوم
        </button>
      } />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField label="" value={weekFilter} onChange={setWeekFilter}
            options={(weeks || []).map((w) => ({ value: w.id, label: w.week_number }))} placeholder="كل الفترات" />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="unpaid">غير مدفوع</option>
            <option value="partial">جزئي</option>
            <option value="paid">مدفوع</option>
          </select>
          <div className="text-left text-sm text-slate-500 flex items-center justify-end">
            {charges && <span>الإجمالي: {charges.length}</span>}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={charges || []} loading={isLoading} emptyMessage="لا توجد رسوم" />

      <ConfirmDialog
        open={!!generateWeekId} onClose={() => setGenerateWeekId(null)}
        onConfirm={() => generateMutation.mutate()}
        title="توليد الرسوم"
        message="سيتم توليد رسوم لجميع القراءات المسجلة في الفترة المحددة. لا يمكن تكرار هذا الإجراء."
        confirmLabel="توليد"
      />
    </div>
  );
}
