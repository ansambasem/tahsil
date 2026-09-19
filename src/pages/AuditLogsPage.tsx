import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SelectField, SearchInput } from '@/components/ui';
import { formatDateTime, actionTypeLabels } from '@/lib/format';
import type { AuditLog } from '@/lib/types';

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', search, actionFilter],
    queryFn: () => api.getAuditLogs({ search, action_type: actionFilter }),
  });

  const actionTypes = Object.keys(actionTypeLabels);

  const columns: Column<AuditLog>[] = [
    { key: 'created_at', header: 'التاريخ', render: (r) => <span className="text-xs text-slate-500">{formatDateTime(r.created_at)}</span> },
    { key: 'user_name', header: 'المستخدم', render: (r) => r.user_name || '-' },
    { key: 'action_type', header: 'الإجراء', render: (r) => <span className="badge bg-primary-100 text-primary-700">{actionTypeLabels[r.action_type] || r.action_type}</span> },
    { key: 'record_type', header: 'النوع', render: (r) => <span className="text-xs text-slate-500">{r.record_type}</span> },
    { key: 'reason', header: 'السبب', render: (r) => r.reason || '-' },
    {
      key: 'details', header: 'التفاصيل', className: 'max-w-xs',
      render: (r) => {
        const val = r.new_value || r.old_value;
        if (!val) return '-';
        const str = JSON.stringify(val);
        return <span className="text-xs text-slate-400 font-mono truncate block max-w-xs">{str.length > 60 ? str.slice(0, 60) + '...' : str}</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="سجل التدقيق" subtitle="سجل العمليات الحساسة في النظام" />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث باسم المستخدم أو السبب..." />
          <SelectField label="" value={actionFilter} onChange={setActionFilter}
            options={actionTypes.map((a) => ({ value: a, label: actionTypeLabels[a] || a }))}
            placeholder="كل الإجراءات" />
        </div>
      </div>

      <DataTable columns={columns} data={logs || []} loading={isLoading} emptyMessage="لا توجد سجلات" />
    </div>
  );
}
