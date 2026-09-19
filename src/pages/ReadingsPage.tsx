import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, SelectField, showToast, SearchInput } from '@/components/ui';
import { Plus, Pencil } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/format';
import type { MeterReading, WeekPeriod } from '@/lib/types';

export function ReadingsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editReading, setEditReading] = useState<MeterReading | null>(null);
  const [weekFilter, setWeekFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ week_id: '', meter_id: '', current_reading: '', notes: '' });
  const [editReason, setEditReason] = useState('');
  const [preview, setPreview] = useState<{ previous: number; consumption: number } | null>(null);

  const { data: weeks } = useQuery<WeekPeriod[]>({
    queryKey: ['weeks'],
    queryFn: () => api.getWeeks(),
  });

  const { data: meters } = useQuery({
    queryKey: ['meters-list'],
    queryFn: () => api.getMeters(),
  });

  const { data: readings, isLoading } = useQuery<MeterReading[]>({
    queryKey: ['readings', weekFilter, search],
    queryFn: () => api.getReadings({ week_id: weekFilter || undefined, search: search || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createReading({
      week_id: form.week_id,
      meter_id: form.meter_id,
      current_reading: parseFloat(form.current_reading) || 0,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      queryClient.invalidateQueries({ queryKey: ['meters-list'] });
      showToast('success', 'تم تسجيل القراءة بنجاح');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateReading(editReading!.id, {
      current_reading: parseFloat(form.current_reading) || 0,
      notes: form.notes || undefined,
      reason: editReason || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      queryClient.invalidateQueries({ queryKey: ['meters-list'] });
      showToast('success', 'تم تعديل القراءة');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditReading(null);
    setForm({ week_id: weeks?.[0]?.id || '', meter_id: '', current_reading: '', notes: '' });
    setPreview(null);
    setModalOpen(true);
  }

  function openEdit(r: MeterReading) {
    setEditReading(r);
    setForm({ week_id: r.week_id, meter_id: r.meter_id, current_reading: String(r.current_reading), notes: r.notes || '' });
    setEditReason('');
    setPreview({ previous: r.previous_reading, consumption: Number(r.current_reading) - Number(r.previous_reading) });
    setModalOpen(true);
  }

  function onMeterChange(meterId: string) {
    setForm({ ...form, meter_id: meterId });
    const m = meters?.find((m) => m.id === meterId);
    if (m) setPreview({ previous: m.current_reading, consumption: (parseFloat(form.current_reading) || 0) - m.current_reading });
  }

  function onReadingChange(val: string) {
    setForm({ ...form, current_reading: val });
    const m = meters?.find((m) => m.id === form.meter_id);
    if (m) setPreview({ previous: m.current_reading, consumption: (parseFloat(val) || 0) - m.current_reading });
  }

  const columns: Column<MeterReading>[] = [
    { key: 'meter', header: 'العداد', render: (r) => <span className="font-mono text-xs">{r.meter?.meter_number}</span> },
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'previous_reading', header: 'القراءة السابقة', render: (r) => formatNumber(r.previous_reading, 1) },
    { key: 'current_reading', header: 'القراءة الحالية', render: (r) => formatNumber(r.current_reading, 1) },
    { key: 'consumption', header: 'الاستهلاك', render: (r) => <span className={`font-semibold ${r.consumption > 0 ? 'text-primary-600' : 'text-slate-500'}`}>{formatNumber(r.consumption, 1)} م³</span> },
    { key: 'reading_date', header: 'التاريخ', render: (r) => formatDate(r.reading_date) },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="القراءات" subtitle="إدخال وتعديل قراءات العدادات" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> قراءة جديدة</button>
      } />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم العداد أو اسم المشترك..." />
          <select className="input" value={weekFilter} onChange={(e) => setWeekFilter(e.target.value)}>
            <option value="">كل الفترات</option>
            {(weeks || []).map((w) => <option key={w.id} value={w.id}>{w.week_number}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={readings || []} loading={isLoading} emptyMessage="لا توجد قراءات" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editReading ? 'تعديل قراءة' : 'قراءة جديدة'} size="lg">
        <div className="space-y-4">
          {!editReading && (
            <>
              <SelectField label="الفترة الأسبوعية" required value={form.week_id} onChange={(v) => setForm({ ...form, week_id: v })}
                options={(weeks || []).map((w) => ({ value: w.id, label: `${w.week_number}` }))} placeholder="اختر الفترة" />
              <SelectField label="العداد" required value={form.meter_id} onChange={onMeterChange}
                options={(meters || []).map((m) => ({ value: m.id, label: `${m.meter_number} - ${m.customer?.customer_name}` }))} placeholder="اختر العداد" />
            </>
          )}
          <FormField label="القراءة الحالية" required>
            <input type="number" step="0.001" className="input" value={form.current_reading} onChange={(e) => onReadingChange(e.target.value)} />
          </FormField>
          {preview && (
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">القراءة السابقة</p><p className="font-bold text-slate-700">{formatNumber(preview.previous, 1)}</p></div>
                <div><p className="text-slate-500 text-xs">الاستهلاك المحسوب</p><p className={`font-bold ${preview.consumption < 0 ? 'text-danger-600' : 'text-primary-600'}`}>{formatNumber(preview.consumption, 1)} م³</p></div>
              </div>
            </div>
          )}
          <FormField label="ملاحظات">
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          {editReading && (
            <FormField label="سبب التعديل" required>
              <textarea className="input" rows={2} value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="سبب تعديل القراءة (يتم تسجيله في سجل التدقيق)" />
            </FormField>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => editReading ? updateMutation.mutate() : createMutation.mutate()} disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
            {(editReading ? updateMutation : createMutation).isPending ? 'جاري...' : 'حفظ'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
