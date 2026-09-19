import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, SelectField, showToast, ConfirmDialog } from '@/components/ui';
import { Plus, Lock, Unlock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { WeekPeriod, Branch } from '@/lib/types';

export function WeeksPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [closeWeek, setCloseWeek] = useState<WeekPeriod | null>(null);
  const [reopenWeek, setReopenWeek] = useState<WeekPeriod | null>(null);
  const [form, setForm] = useState({ week_number: '', branch_id: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', notes: '' });
  const [reopenReason, setReopenReason] = useState('');

  const { data: weeks, isLoading } = useQuery({
    queryKey: ['weeks'],
    queryFn: () => api.getWeeks(),
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.getBranches(),
  });

  const activeBranches = (branches || []).filter((b) => b.status === 'active');

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.createWeek(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      showToast('success', 'تم إنشاء الفترة الأسبوعية');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      await api.closeWeek(closeWeek!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      showToast('success', 'تم إغلاق الفترة');
      setCloseWeek(null);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
      await api.reopenWeek(reopenWeek!.id, reopenReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      showToast('success', 'تم إعادة فتح الفترة');
      setReopenWeek(null);
      setReopenReason('');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    const today = new Date();
    const end = new Date(today); end.setDate(end.getDate() + 6);
    setForm({ week_number: '', branch_id: '', start_date: today.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10), notes: '' });
    setModalOpen(true);
  }

  const columns: Column<WeekPeriod>[] = [
    { key: 'week_number', header: 'رقم الفترة', render: (r) => <span className="font-mono text-xs font-semibold">{r.week_number}</span> },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'start_date', header: 'من', render: (r) => formatDate(r.start_date) },
    { key: 'end_date', header: 'إلى', render: (r) => formatDate(r.end_date) },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          {r.status === 'open' ? (
            <button onClick={(e) => { e.stopPropagation(); setCloseWeek(r); }} className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-600" title="إغلاق"><Lock className="w-4 h-4" /></button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setReopenWeek(r); }} className="p-1.5 rounded-lg hover:bg-success-50 text-success-600" title="إعادة فتح"><Unlock className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="الفترات الأسبوعية" subtitle="إدارة فترات الفوترة الأسبوعية" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> فترة جديدة</button>
      } />
      <DataTable columns={columns} data={weeks || []} loading={isLoading} emptyMessage="لا توجد فترات" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="فترة أسبوعية جديدة">
        <div className="space-y-4">
          <FormField label="رقم الفترة" required>
            <input className="input" value={form.week_number} onChange={(e) => setForm({ ...form, week_number: e.target.value })} placeholder="مثال: W2024-03" />
          </FormField>
          <SelectField label="الفرع" required value={form.branch_id} onChange={(v) => setForm({ ...form, branch_id: v })}
            options={activeBranches.map((b) => ({ value: b.id, label: b.branch_name }))} placeholder="اختر الفرع" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="تاريخ البداية" required>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </FormField>
            <FormField label="تاريخ النهاية" required>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </FormField>
          </div>
          <FormField label="ملاحظات">
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'جاري...' : 'حفظ'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!closeWeek} onClose={() => setCloseWeek(null)} onConfirm={() => closeMutation.mutate()}
        title="إغلاق الفترة" message={`هل أنت متأكد من إغلاق الفترة ${closeWeek?.week_number}؟ لا يمكن تعديل القراءات بعد الإغلاق.`}
        confirmLabel="إغلاق" danger />

      <Modal open={!!reopenWeek} onClose={() => setReopenWeek(null)} title="إعادة فتح الفترة" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-warning-600 bg-warning-50 p-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            إعادة فتح الفترة سيسمح بتعديل البيانات. سيتم تسجيل هذا الإجراء في سجل التدقيق.
          </div>
          <FormField label="سبب إعادة الفتح" required>
            <textarea className="input" rows={3} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
          </FormField>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setReopenWeek(null)} className="btn-secondary">إلغاء</button>
            <button onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending || !reopenReason.trim()} className="btn-primary">{reopenMutation.isPending ? 'جاري...' : 'إعادة فتح'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
