import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, SelectField, SearchInput, showToast, ConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Repeat } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/format';
import type { Meter, Customer, Branch, Area, MeterReplacement } from '@/lib/types';

export function MetersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMeter, setEditMeter] = useState<Meter | null>(null);
  const [replaceMeter, setReplaceMeter] = useState<Meter | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [form, setForm] = useState({ meter_number: '', customer_id: '', branch_id: '', area_id: '', installation_date: '', initial_reading: '0', current_reading: '0', status: 'active', notes: '' });
  const [replaceForm, setReplaceForm] = useState({ new_meter_number: '', new_initial_reading: '', reason: '' });
  const [replacements, setReplacements] = useState<MeterReplacement[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: meters, isLoading } = useQuery({
    queryKey: ['meters', debouncedSearch],
    queryFn: async () => {
      return await api.getMeters(debouncedSearch || undefined) as Meter[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list', form.branch_id],
    queryFn: async () => {
      if (!form.branch_id) return [];
      const result = await api.getCustomers({ branch_id: form.branch_id, page_size: 100 });
      return result.items as Customer[];
    },
    enabled: !!form.branch_id,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const all = await api.getBranches();
      return (all || []).filter((b) => b.status === 'active') as Branch[];
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['areas', form.branch_id],
    queryFn: async () => {
      if (!form.branch_id) return [];
      const all = await api.getAreas();
      return (all || []).filter((a) => a.branch_id === form.branch_id && a.status === 'active') as Area[];
    },
    enabled: !!form.branch_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, initial_reading: parseFloat(form.initial_reading) || 0, current_reading: parseFloat(form.current_reading) || 0 };
      if (editMeter) {
        await api.updateMeter(editMeter.id, payload);
      } else {
        await api.createMeter(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      showToast('success', editMeter ? 'تم تحديث العداد' : 'تم إنشاء العداد');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const replaceMutation = useMutation({
    mutationFn: async () => {
      if (!replaceMeter) return;
      await api.replaceMeter(replaceMeter.id, {
        new_meter_number: replaceForm.new_meter_number,
        new_initial_reading: parseFloat(replaceForm.new_initial_reading) || 0,
        reason: replaceForm.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      showToast('success', 'تم استبدال العداد بنجاح');
      setReplaceMeter(null);
      setReplaceForm({ new_meter_number: '', new_initial_reading: '', reason: '' });
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditMeter(null);
    setForm({ meter_number: '', customer_id: '', branch_id: '', area_id: '', installation_date: new Date().toISOString().slice(0, 10), initial_reading: '0', current_reading: '0', status: 'active', notes: '' });
    setModalOpen(true);
  }

  function openEdit(m: Meter) {
    setEditMeter(m);
    setForm({
      meter_number: m.meter_number, customer_id: m.customer_id, branch_id: m.branch_id, area_id: m.area_id,
      installation_date: m.installation_date, initial_reading: String(m.initial_reading), current_reading: String(m.current_reading),
      status: m.status, notes: m.notes || '',
    });
    setModalOpen(true);
  }

  async function openReplace(m: Meter) {
    setReplaceMeter(m);
    setReplaceForm({ new_meter_number: '', new_initial_reading: '', reason: '' });
    const data = await api.getMeterReplacements(m.id);
    setReplacements(data as MeterReplacement[]);
  }

  const columns: Column<Meter>[] = [
    { key: 'meter_number', header: 'رقم العداد', render: (r) => <span className="font-mono text-xs font-semibold">{r.meter_number}</span> },
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'area', header: 'المنطقة', render: (r) => r.area?.area_name || '-' },
    { key: 'current_reading', header: 'القراءة الحالية', render: (r) => formatNumber(r.current_reading, 1) },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openReplace(r); }} className="p-1.5 rounded-lg hover:bg-accent-50 text-accent-600" title="استبدال"><Repeat className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="العدادات" subtitle="إدارة عدادات المياه" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> عداد جديد</button>
      } />

      <div className="card p-4 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم العداد أو اسم المشترك..." />
      </div>

      <DataTable columns={columns} data={meters || []} loading={isLoading} emptyMessage="لا توجد عدادات" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editMeter ? 'تعديل عداد' : 'عداد جديد'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="رقم العداد" required>
            <input className="input" value={form.meter_number} onChange={(e) => setForm({ ...form, meter_number: e.target.value })} disabled={!!editMeter} />
          </FormField>
          <SelectField label="المشترك" required value={form.customer_id} onChange={(v) => {
            const c = customers?.find((c) => c.id === v);
            setForm({ ...form, customer_id: v, branch_id: c?.branch_id || form.branch_id, area_id: c?.area_id || form.area_id });
          }} options={(customers || []).map((c) => ({ value: c.id, label: `${c.customer_number} - ${c.customer_name}` }))} placeholder="اختر المشترك" />
          <SelectField label="الفرع" required value={form.branch_id} onChange={(v) => setForm({ ...form, branch_id: v, area_id: '' })}
            options={(branches || []).map((b) => ({ value: b.id, label: b.branch_name }))} placeholder="اختر الفرع" />
          <SelectField label="المنطقة" required value={form.area_id} onChange={(v) => setForm({ ...form, area_id: v })}
            options={(areas || []).map((a) => ({ value: a.id, label: a.area_name }))} placeholder="اختر المنطقة" />
          <FormField label="تاريخ التركيب" required>
            <input type="date" className="input" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} />
          </FormField>
          <FormField label="القراءة الابتدائية" required>
            <input type="number" step="0.001" className="input" value={form.initial_reading} onChange={(e) => setForm({ ...form, initial_reading: e.target.value })} disabled={!!editMeter} />
          </FormField>
          {editMeter && (
            <FormField label="القراءة الحالية" required>
              <input type="number" step="0.001" className="input" value={form.current_reading} onChange={(e) => setForm({ ...form, current_reading: e.target.value })} />
            </FormField>
          )}
          <SelectField label="الحالة" required value={form.status} onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }, { value: 'replaced', label: 'مستبدل' }]} />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </Modal>

      <Modal open={!!replaceMeter} onClose={() => setReplaceMeter(null)} title="استبدال عداد" size="lg">
        {replaceMeter && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs">العداد الحالي</p><p className="font-semibold">{replaceMeter.meter_number}</p></div>
                <div><p className="text-slate-500 text-xs">القراءة الحالية</p><p className="font-semibold">{formatNumber(replaceMeter.current_reading, 1)}</p></div>
                <div><p className="text-slate-500 text-xs">المشترك</p><p className="font-semibold">{replaceMeter.customer?.customer_name}</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="رقم العداد الجديد" required>
                <input className="input" value={replaceForm.new_meter_number} onChange={(e) => setReplaceForm({ ...replaceForm, new_meter_number: e.target.value })} />
              </FormField>
              <FormField label="القراءة الابتدائية للعداد الجديد" required>
                <input type="number" step="0.001" className="input" value={replaceForm.new_initial_reading} onChange={(e) => setReplaceForm({ ...replaceForm, new_initial_reading: e.target.value })} />
              </FormField>
            </div>
            <FormField label="سبب الاستبدال" required>
              <textarea className="input" rows={2} value={replaceForm.reason} onChange={(e) => setReplaceForm({ ...replaceForm, reason: e.target.value })} />
            </FormField>

            {replacements.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 text-sm mb-2">سجل الاستبدالات السابقة</h4>
                <div className="space-y-2">
                  {replacements.map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">{r.old_meter_number} ← {r.new_meter_number}</span>
                        <span className="text-slate-400 text-xs">{formatDate(r.replacement_date)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{r.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setReplaceMeter(null)} className="btn-secondary">إلغاء</button>
              <button onClick={() => replaceMutation.mutate()} disabled={replaceMutation.isPending} className="btn-primary">{replaceMutation.isPending ? 'جاري...' : 'استبدال'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
