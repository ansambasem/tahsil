import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal, FormField, StatusBadge, SelectField, SearchInput, showToast, ConfirmDialog, MoneyDisplay, Pagination } from '@/components/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { subscriptionTypeLabels } from '@/lib/format';
import type { Customer, Branch, Area } from '@/lib/types';

const PAGE_SIZE = 15;

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    customer_number: '', customer_name: '', branch_id: '', area_id: '',
    address: '', phone: '', national_id: '', subscription_type: 'residential', status: 'active', notes: '',
  });

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

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

  const { data, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch, branchFilter, statusFilter, page],
    queryFn: async () => {
      const result = await api.getCustomers({
        search: debouncedSearch || undefined,
        branch_id: branchFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      return { items: result.items as Customer[], total: result.total };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editCustomer) {
        await api.updateCustomer(editCustomer.id, form);
      } else {
        await api.createCustomer(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('success', editCustomer ? 'تم تحديث المشترك' : 'تم إنشاء المشترك');
      setModalOpen(false);
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('success', 'تم حذف المشترك');
    },
    onError: (err: Error) => showToast('error', err.message),
  });

  function openCreate() {
    setEditCustomer(null);
    setForm({ customer_number: '', customer_name: '', branch_id: '', area_id: '', address: '', phone: '', national_id: '', subscription_type: 'residential', status: 'active', notes: '' });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setForm({
      customer_number: c.customer_number, customer_name: c.customer_name, branch_id: c.branch_id, area_id: c.area_id,
      address: c.address || '', phone: c.phone || '', national_id: c.national_id || '',
      subscription_type: c.subscription_type, status: c.status, notes: c.notes || '',
    });
    setModalOpen(true);
  }

  const columns: Column<Customer>[] = [
    { key: 'customer_number', header: 'رقم المشترك', render: (r) => <span className="font-mono text-xs font-semibold">{r.customer_number}</span> },
    { key: 'customer_name', header: 'الاسم' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'area', header: 'المنطقة', render: (r) => r.area?.area_name || '-' },
    { key: 'subscription_type', header: 'النوع', render: (r) => subscriptionTypeLabels[r.subscription_type] },
    { key: 'phone', header: 'الهاتف', render: (r) => r.phone || '-' },
    { key: 'status', header: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'balance', header: 'الرصيد', render: (r) => <MoneyDisplay amount={r.balance} /> },
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

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div>
      <PageHeader title="المشتركون" subtitle="إدارة مشتركي المياه" actions={
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> مشترك جديد</button>
      } />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم المشترك، الاسم، الهاتف..." />
          <select className="input" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(0); }}>
            <option value="">كل الفروع</option>
            {(branches || []).map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
          </select>
          <select className="input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">موقوف</option>
          </select>
          <div className="text-left text-sm text-slate-500 flex items-center justify-end">
            {data && <span>الإجمالي: {data.total}</span>}
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={data?.items || []} loading={isLoading} emptyMessage="لا يوجد مشتركون" />
      <Pagination page={page + 1} totalPages={totalPages} onPageChange={(p) => setPage(p - 1)} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCustomer ? 'تعديل مشترك' : 'مشترك جديد'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="رقم المشترك" required>
            <input className="input" value={form.customer_number} onChange={(e) => setForm({ ...form, customer_number: e.target.value })} disabled={!!editCustomer} />
          </FormField>
          <FormField label="الاسم" required>
            <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </FormField>
          <SelectField label="الفرع" required value={form.branch_id} onChange={(v) => setForm({ ...form, branch_id: v, area_id: '' })}
            options={(branches || []).map((b) => ({ value: b.id, label: b.branch_name }))} placeholder="اختر الفرع" />
          <SelectField label="المنطقة" required value={form.area_id} onChange={(v) => setForm({ ...form, area_id: v })}
            options={(areas || []).map((a) => ({ value: a.id, label: a.area_name }))} placeholder="اختر المنطقة" />
          <FormField label="العنوان">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="الهاتف">
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="الهوية الوطنية">
            <input className="input" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </FormField>
          <SelectField label="نوع الاشتراك" required value={form.subscription_type} onChange={(v) => setForm({ ...form, subscription_type: v })}
            options={[{ value: 'residential', label: 'سكني' }, { value: 'commercial', label: 'تجاري' }, { value: 'industrial', label: 'صناعي' }]} />
          <SelectField label="الحالة" required value={form.status} onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }, { value: 'suspended', label: 'موقوف' }]} />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">إلغاء</button>
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary">{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="حذف مشترك" message="هل أنت متأكد من حذف هذا المشترك؟" confirmLabel="حذف" danger />
    </div>
  );
}
