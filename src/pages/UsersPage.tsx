import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, SelectField, showToast, ConfirmDialog, StatusBadge } from '@/components/ui';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { Role, UserWithRoles } from '@/lib/types';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithRoles | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithRoles | null>(null);
  const [form, setForm] = useState({ email: '', display_name: '', phone: '', password: '', role_id: '', is_active: true });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      return await api.getUsers() as UserWithRoles[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      return await api.getRoles() as Role[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.createUser({
        email: form.email,
        password: form.password,
        display_name: form.display_name,
        phone: form.phone,
        is_active: form.is_active,
        role_id: form.role_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'تم إنشاء المستخدم');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      await api.updateUser(editUser.id, {
        display_name: form.display_name,
        phone: form.phone,
        is_active: form.is_active,
        role_id: form.role_id,
        password: form.password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'تم تحديث المستخدم');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (u: UserWithRoles) => {
      await api.deleteUser(u.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'تم حذف المستخدم');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditUser(null);
    setForm({ email: '', display_name: '', phone: '', password: '', role_id: '', is_active: true });
    setModalOpen(true);
  }

  function openEdit(u: UserWithRoles) {
    setEditUser(u);
    setForm({ email: u.email, display_name: u.display_name, phone: u.phone || '', password: '', role_id: u.role_ids[0] || '', is_active: u.is_active });
    setModalOpen(true);
  }

  const roleLabels: Record<string, string> = { ADMIN: 'الأدمن', MANAGER: 'مدير النظام' };

  const columns: Column<UserWithRoles>[] = [
    { key: 'display_name', header: 'الاسم' },
    { key: 'email', header: 'البريد الإلكتروني', render: (r) => <span className="text-xs text-slate-500">{r.email}</span> },
    { key: 'phone', header: 'الهاتف', render: (r) => r.phone || '-' },
    { key: 'role_names', header: 'الدور', render: (r) => r.role_names.map((rn) => <span key={rn} className="badge bg-primary-100 text-primary-700 ml-1">{roleLabels[rn] || rn}</span>) },
    { key: 'is_active', header: 'الحالة', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'created_at', header: 'تاريخ الإنشاء', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteUser(r); }} className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="المستخدمون" subtitle="إدارة مستخدمي النظام وأدوارهم" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> مستخدم جديد</button>
      } />
      <DataTable columns={columns} data={users || []} loading={isLoading} emptyMessage="لا يوجد مستخدمون" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'تعديل مستخدم' : 'مستخدم جديد'}>
        <div className="space-y-4">
          <FormField label="الاسم" required>
            <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </FormField>
          <FormField label="البريد الإلكتروني" required>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editUser} />
          </FormField>
          <FormField label="الهاتف">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          {!editUser && (
            <FormField label="كلمة المرور" required>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </FormField>
          )}
          <SelectField label="الدور" required value={form.role_id} onChange={(v) => setForm({ ...form, role_id: v })}
            options={(roles || []).map((r) => ({ value: r.id, label: r.display_name }))} placeholder="اختر الدور" />
          <FormField label="الحالة">
            <select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}>
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => editUser ? updateMutation.mutate() : createMutation.mutate()} disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
            {(editUser ? updateMutation : createMutation).isPending ? 'جاري...' : 'حفظ'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteUser} onClose={() => setDeleteUser(null)} onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser)}
        title="حذف مستخدم" message={`هل أنت متأكد من حذف المستخدم ${deleteUser?.display_name}؟`} confirmLabel="حذف" danger />
    </div>
  );
}
