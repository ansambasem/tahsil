import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SelectField, MoneyDisplay, SearchInput } from '@/components/ui';
import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { Charge, Branch } from '@/lib/types';

export function ArrearsPage() {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.getBranches(),
  });

  const { data: charges, isLoading } = useQuery<Charge[]>({
    queryKey: ['arrears', search, branchFilter],
    queryFn: () => api.getUnpaidCharges(),
  });

  const filteredCharges = (charges || []).filter((c) => {
    if (branchFilter && c.branch_id !== branchFilter) return false;
    if (search) {
      const name = c.customer?.customer_name || '';
      const num = c.customer?.customer_number || '';
      return name.includes(search) || num.includes(search);
    }
    return true;
  });

  const totalArrears = filteredCharges.reduce((sum, c) => sum + c.remaining_amount, 0);

  const columns: Column<Charge>[] = [
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'customer_number', header: 'رقم المشترك', render: (r) => <span className="font-mono text-xs">{r.customer?.customer_number}</span> },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'area', header: 'المنطقة', render: (r) => r.area?.area_name || '-' },
    { key: 'week', header: 'الفترة', render: (r) => r.week?.week_number || '-' },
    { key: 'charge_amount', header: 'الرسوم', render: (r) => <MoneyDisplay amount={r.charge_amount} /> },
    { key: 'paid_amount', header: 'المدفوع', render: (r) => <MoneyDisplay amount={r.paid_amount} className="text-success-600" /> },
    { key: 'remaining_amount', header: 'المتبقي', render: (r) => <MoneyDisplay amount={r.remaining_amount} className="text-danger-600" /> },
  ];

  return (
    <div>
      <PageHeader title="المتأخرات" subtitle="إجمالي المتأخرات والمبالغ المتبقية" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-6">
          <p className="text-sm text-slate-500">إجمالي المتأخرات</p>
          <p className="text-2xl font-bold text-danger-600 mt-1">{formatCurrency(totalArrears)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500">عدد المشتركين المدينين</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{new Set(filteredCharges.map((c) => c.customer_id)).size}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-slate-500">عدد الفواتير غير المسددة</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{filteredCharges.length}</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث باسم أو رقم المشترك..." />
          <SelectField label="" value={branchFilter} onChange={setBranchFilter}
            options={(branches || []).map((b) => ({ value: b.id, label: b.branch_name }))} placeholder="كل الفروع" />
        </div>
      </div>

      <DataTable columns={columns} data={filteredCharges} loading={isLoading} emptyMessage="لا توجد متأخرات" />
    </div>
  );
}
