import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, showToast } from '@/components/ui';
import { Pencil, ShieldCheck } from 'lucide-react';
import type { Role, Permission } from '@/lib/types';

export function RolesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', display_name: '', description: '' });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.getRoles(),
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.getPermissions(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editRole) {
        await api.updateRolePermissions(editRole.id, Array.from(selectedPermissions));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast('success', 'تم تحديث الصلاحيات');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  async function openEdit(r: Role) {
    setEditRole(r);
    setForm({ name: r.name, display_name: r.display_name, description: r.description || '' });
    const perms = await api.getRolePermissions(r.id);
    setSelectedPermissions(new Set(perms.map((p) => p.id)));
    setModalOpen(true);
  }

  function togglePermission(pid: string) {
    const next = new Set(selectedPermissions);
    if (next.has(pid)) next.delete(pid);
    else next.add(pid);
    setSelectedPermissions(next);
  }

  function toggleModule(moduleName: string, permIds: string[]) {
    const allSelected = permIds.every((id) => selectedPermissions.has(id));
    const next = new Set(selectedPermissions);
    if (allSelected) permIds.forEach((id) => next.delete(id));
    else permIds.forEach((id) => next.add(id));
    setSelectedPermissions(next);
  }

  const groupedPerms = (permissions || []).reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const columns: Column<Role>[] = [
    { key: 'name', header: 'الاسم', render: (r) => <span className="font-mono text-xs font-semibold">{r.name}</span> },
    { key: 'display_name', header: 'الاسم المعروض' },
    { key: 'description', header: 'الوصف', render: (r) => r.description || '-' },
    {
      key: 'actions', header: '', className: 'text-left',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const moduleLabels: Record<string, string> = {
    branches: 'الفروع', areas: 'المناطق', customers: 'المشتركون', meters: 'العدادات',
    weeks: 'الفترات', readings: 'القراءات', tariffs: 'التعرفات', charges: 'الرسوم',
    payments: 'المدفوعات', receipts: 'الإيصالات', reports: 'التقارير', users: 'المستخدمون',
    roles: 'الأدوار', permissions: 'الصلاحيات', settings: 'الإعدادات', audit_logs: 'سجل التدقيق', dashboard: 'لوحة التحكم',
  };

  return (
    <div>
      <PageHeader title="الأدوار" subtitle="إدارة أدوار النظام والصلاحيات" />
      <DataTable columns={columns} data={roles || []} loading={isLoading} emptyMessage="لا توجد أدوار" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="تعديل صلاحيات الدور" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم (بالإنجليزية)">
              <input className="input" value={form.name} disabled />
            </FormField>
            <FormField label="الاسم المعروض">
              <input className="input" value={form.display_name} disabled />
            </FormField>
          </div>
          <FormField label="الوصف">
            <input className="input" value={form.description} disabled />
          </FormField>

          <div>
            <h4 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> الصلاحيات</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(groupedPerms).map(([module, perms]) => (
                <div key={module} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={perms.every((p) => selectedPermissions.has(p.id))}
                      onChange={() => toggleModule(module, perms.map((p) => p.id))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-semibold text-sm text-slate-700">{moduleLabels[module] || module}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pr-6">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={selectedPermissions.has(p.id)} onChange={() => togglePermission(p.id)} className="w-4 h-4 rounded" />
                        {p.display_name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري...' : 'حفظ'}</button>
        </div>
      </Modal>
    </div>
  );
}
