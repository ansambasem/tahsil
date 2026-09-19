import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, SelectField, showToast, ConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { subscriptionTypeLabels, formatDate } from '@/lib/format';
import type { Tariff } from '@/lib/types';

export function TariffsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTariff, setEditTariff] = useState<Tariff | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ tariff_name: '', tariff_code: '', subscription_type: 'residential', effective_from: new Date().toISOString().slice(0, 10), effective_to: '', status: 'active', notes: '' });
  const [slabs, setSlabs] = useState<{ from_units: string; to_units: string; rate_per_unit: string; fixed_charge: string }[]>([{ from_units: '0', to_units: '', rate_per_unit: '0', fixed_charge: '0' }]);

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.getTariffs(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slabPayload = slabs.map((s) => ({
        from_units: parseFloat(s.from_units) || 0,
        to_units: s.to_units ? parseFloat(s.to_units) : null,
        rate_per_unit: parseFloat(s.rate_per_unit) || 0,
        fixed_charge: parseFloat(s.fixed_charge) || 0,
      }));
      const payload = { ...form, effective_to: form.effective_to || null, slabs: slabPayload };
      if (editTariff) {
        await api.updateTariff(editTariff.id, payload);
      } else {
        await api.createTariff(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      showToast('success', editTariff ? 'تم تحديث التعرفة' : 'تم إنشاء التعرفة');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteTariff(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      showToast('success', 'تم حذف التعرفة');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditTariff(null);
    setForm({ tariff_name: '', tariff_code: '', subscription_type: 'residential', effective_from: new Date().toISOString().slice(0, 10), effective_to: '', status: 'active', notes: '' });
    setSlabs([{ from_units: '0', to_units: '', rate_per_unit: '0', fixed_charge: '0' }]);
    setModalOpen(true);
  }

  function openEdit(t: Tariff) {
    setEditTariff(t);
    setForm({ tariff_name: t.tariff_name, tariff_code: t.tariff_code, subscription_type: t.subscription_type, effective_from: t.effective_from, effective_to: t.effective_to || '', status: t.status, notes: t.notes || '' });
    setSlabs((t.tariff_slabs || []).map((s) => ({ from_units: String(s.from_units), to_units: s.to_units ? String(s.to_units) : '', rate_per_unit: String(s.rate_per_unit), fixed_charge: String(s.fixed_charge) })));
    setModalOpen(true);
  }

  const columns: Column<Tariff>[] = [
    { key: 'tariff_code', header: 'الرمز', render: (r) => <span className="font-mono text-xs font-semibold">{r.tariff_code}</span> },
    { key: 'tariff_name', header: 'الاسم' },
    { key: 'subscription_type', header: 'النوع', render: (r) => subscriptionTypeLabels[r.subscription_type] },
    { key: 'effective_from', header: 'ساري من', render: (r) => formatDate(r.effective_from) },
    { key: 'effective_to', header: 'ساري إلى', render: (r) => r.effective_to ? formatDate(r.effective_to) : 'غير محدد' },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="التعرفات" subtitle="إدارة تعرفات الفوترة" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> تعرفة جديدة</button>
      } />
      <DataTable columns={columns} data={tariffs || []} loading={isLoading} emptyMessage="لا توجد تعرفات" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTariff ? 'تعديل تعرفة' : 'تعرفة جديدة'} size="xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="اسم التعرفة" required>
            <input className="input" value={form.tariff_name} onChange={(e) => setForm({ ...form, tariff_name: e.target.value })} />
          </FormField>
          <FormField label="رمز التعرفة" required>
            <input className="input" value={form.tariff_code} onChange={(e) => setForm({ ...form, tariff_code: e.target.value })} disabled={!!editTariff} />
          </FormField>
          <SelectField label="نوع الاشتراك" required value={form.subscription_type} onChange={(v) => setForm({ ...form, subscription_type: v })}
            options={[{ value: 'residential', label: 'سكني' }, { value: 'commercial', label: 'تجاري' }, { value: 'industrial', label: 'صناعي' }]} />
          <SelectField label="الحالة" required value={form.status} onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }]} />
          <FormField label="ساري من" required>
            <input type="date" className="input" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
          </FormField>
          <FormField label="ساري إلى">
            <input type="date" className="input" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} />
          </FormField>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4" /> شرائح التعرفة</h4>
            <button onClick={() => setSlabs([...slabs, { from_units: '0', to_units: '', rate_per_unit: '0', fixed_charge: '0' }])} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> إضافة شريحة</button>
          </div>
          <div className="space-y-2">
            {slabs.map((slab, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end">
                <FormField label={i === 0 ? 'من' : ''}>
                  <input type="number" step="0.001" className="input" placeholder="من" value={slab.from_units} onChange={(e) => { const s = [...slabs]; s[i] = { ...slab, from_units: e.target.value }; setSlabs(s); }} />
                </FormField>
                <FormField label={i === 0 ? 'إلى' : ''}>
                  <input type="number" step="0.001" className="input" placeholder="غير محدود" value={slab.to_units} onChange={(e) => { const s = [...slabs]; s[i] = { ...slab, to_units: e.target.value }; setSlabs(s); }} />
                </FormField>
                <FormField label={i === 0 ? 'السعر/وحدة' : ''}>
                  <input type="number" step="0.001" className="input" placeholder="السعر" value={slab.rate_per_unit} onChange={(e) => { const s = [...slabs]; s[i] = { ...slab, rate_per_unit: e.target.value }; setSlabs(s); }} />
                </FormField>
                <FormField label={i === 0 ? 'رسم ثابت' : ''}>
                  <input type="number" step="0.01" className="input" placeholder="0" value={slab.fixed_charge} onChange={(e) => { const s = [...slabs]; s[i] = { ...slab, fixed_charge: e.target.value }; setSlabs(s); }} />
                </FormField>
                <button onClick={() => setSlabs(slabs.filter((_, idx) => idx !== i))} className="btn-ghost text-danger-500 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <FormField label="ملاحظات">
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="حذف تعرفة" message="هل أنت متأكد من حذف هذه التعرفة؟" confirmLabel="حذف" danger />
    </div>
  );
}
