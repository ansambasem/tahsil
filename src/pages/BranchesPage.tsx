import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, showToast, ConfirmDialog } from '@/components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Branch } from '@/lib/types';

export function BranchesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ branch_code: '', branch_name: '', address: '', phone: '', manager: '', status: 'active', notes: '' });

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.getBranches(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editBranch) {
        await api.updateBranch(editBranch.id, form);
      } else {
        await api.createBranch(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showToast('success', editBranch ? 'تم تحديث الفرع بنجاح' : 'تم إنشاء الفرع بنجاح');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteBranch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      showToast('success', 'تم حذف الفرع');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditBranch(null);
    setForm({ branch_code: '', branch_name: '', address: '', phone: '', manager: '', status: 'active', notes: '' });
    setModalOpen(true);
  }

  function openEdit(b: Branch) {
    setEditBranch(b);
    setForm({
      branch_code: b.branch_code, branch_name: b.branch_name, address: b.address || '',
      phone: b.phone || '', manager: b.manager || '', status: b.status, notes: b.notes || '',
    });
    setModalOpen(true);
  }

  const columns: Column<Branch>[] = [
    { key: 'branch_code', header: 'الرمز' },
    { key: 'branch_name', header: 'اسم الفرع' },
    { key: 'address', header: 'العنوان', render: (r) => r.address || '-' },
    { key: 'phone', header: 'الهاتف', render: (r) => r.phone || '-' },
    { key: 'manager', header: 'المدير', render: (r) => r.manager || '-' },
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
      <PageHeader title="الفروع" subtitle="إدارة فروع النظام" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> فرع جديد</button>
      } />
      <DataTable columns={columns} data={branches || []} loading={isLoading} emptyMessage="لا توجد فروع" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBranch ? 'تعديل فرع' : 'فرع جديد'}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="رمز الفرع" required>
            <input className="input" value={form.branch_code} onChange={(e) => setForm({ ...form, branch_code: e.target.value })} disabled={!!editBranch} />
          </FormField>
          <FormField label="اسم الفرع" required>
            <input className="input" value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} />
          </FormField>
          <FormField label="العنوان">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="الهاتف">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="المدير">
            <input className="input" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
          </FormField>
          <FormField label="الحالة" required>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </FormField>
          <div className="col-span-2">
            <FormField label="ملاحظات">
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="حذف الفرع" message="هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف" danger
      />
    </div>
  );
}
