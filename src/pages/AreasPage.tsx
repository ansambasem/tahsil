import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, SelectField, showToast, ConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Area, Branch } from '@/lib/types';

export function AreasPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ branch_id: '', area_code: '', area_name: '', status: 'active', notes: '' });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.getAreas(),
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.getBranches(),
  });

  const activeBranches = (branches || []).filter((b) => b.status === 'active');

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editArea) {
        await api.updateArea(editArea.id, form);
      } else {
        await api.createArea(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      showToast('success', editArea ? 'تم تحديث المنطقة' : 'تم إنشاء المنطقة');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteArea(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      showToast('success', 'تم حذف المنطقة');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditArea(null);
    setForm({ branch_id: '', area_code: '', area_name: '', status: 'active', notes: '' });
    setModalOpen(true);
  }

  function openEdit(a: Area) {
    setEditArea(a);
    setForm({ branch_id: a.branch_id, area_code: a.area_code, area_name: a.area_name, status: a.status, notes: a.notes || '' });
    setModalOpen(true);
  }

  const columns: Column<Area>[] = [
    { key: 'area_code', header: 'الرمز' },
    { key: 'area_name', header: 'اسم المنطقة' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
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
      <PageHeader title="المناطق" subtitle="إدارة المناطق التابعة للفروع" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> منطقة جديدة</button>
      } />
      <DataTable columns={columns} data={areas || []} loading={isLoading} emptyMessage="لا توجد مناطق" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editArea ? 'تعديل منطقة' : 'منطقة جديدة'}>
        <div className="space-y-4">
          <SelectField
            label="الفرع" required value={form.branch_id}
            onChange={(v) => setForm({ ...form, branch_id: v })}
            options={activeBranches.map((b) => ({ value: b.id, label: b.branch_name }))}
            placeholder="اختر الفرع"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="رمز المنطقة" required>
              <input className="input" value={form.area_code} onChange={(e) => setForm({ ...form, area_code: e.target.value })} disabled={!!editArea} />
            </FormField>
            <FormField label="اسم المنطقة" required>
              <input className="input" value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} />
            </FormField>
          </div>
          <FormField label="الحالة" required>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </FormField>
          <FormField label="ملاحظات">
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="حذف المنطقة" message="هل أنت متأكد من حذف هذه المنطقة؟"
        confirmLabel="حذف" danger
      />
    </div>
  );
}
