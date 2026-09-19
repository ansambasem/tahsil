import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SelectField, MoneyDisplay } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, subscriptionTypeLabels } from '@/lib/format';
import type { Payment, Charge, WeekPeriod, Branch } from '@/lib/types';

export function ReportsPage() {
  const [reportType, setReportType] = useState('collection');
  const [weekFilter, setWeekFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const { data: weeks } = useQuery<WeekPeriod[]>({
    queryKey: ['weeks'],
    queryFn: () => api.getWeeks(),
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => api.getBranches(),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['report-payments', weekFilter, branchFilter],
    queryFn: () => api.getReportPayments({ week_id: weekFilter || undefined, branch_id: branchFilter || undefined }),
    enabled: reportType === 'collection' || reportType === 'payments',
  });

  const { data: charges } = useQuery<Charge[]>({
    queryKey: ['report-charges', weekFilter, branchFilter],
    queryFn: () => api.getReportCharges({ week_id: weekFilter || undefined, branch_id: branchFilter || undefined }),
    enabled: reportType === 'collection' || reportType === 'charges' || reportType === 'arrears',
  });

  const reportTypes = [
    { value: 'collection', label: 'تقرير التحصيل' },
    { value: 'payments', label: 'تقرير المدفوعات' },
    { value: 'charges', label: 'تقرير الرسوم' },
    { value: 'arrears', label: 'تقرير المتأخرات' },
    { value: 'consumption', label: 'تقرير الاستهلاك' },
  ];

  const totalCollected = (payments || []).reduce((s, p) => s + p.amount, 0);
  const totalCharges = (charges || []).reduce((s, c) => s + c.charge_amount, 0);
  const totalRemaining = (charges || []).reduce((s, c) => s + c.remaining_amount, 0);

  const branchChart = (charges || []).reduce<Record<string, { name: string; charges: number; collected: number }>>((acc, c) => {
    const name = c.branch?.branch_name || 'غير محدد';
    if (!acc[name]) acc[name] = { name, charges: 0, collected: 0 };
    acc[name].charges += c.charge_amount;
    acc[name].collected += c.paid_amount;
    return acc;
  }, {});

  const branchData = Object.values(branchChart);

  const typeChart = (charges || []).reduce<Record<string, { name: string; value: number }>>((acc, c) => {
    const type = c.customer?.subscription_type || 'residential';
    const name = subscriptionTypeLabels[type];
    if (!acc[name]) acc[name] = { name, value: 0 };
    acc[name].value += c.consumption;
    return acc;
  }, {});
  const typeData = Object.values(typeChart);
  const pieColors = ['#3b82f6', '#22d3ee', '#22c55e', '#f59e0b'];

  function exportCSV() {
    let rows: Record<string, unknown>[] = [];
    let headers = '';
    if (reportType === 'collection' || reportType === 'payments') {
      headers = 'رقم العملية,المشترك,الفرع,المبلغ,الطريقة,التاريخ';
      rows = (payments || []).map((p) => ({ num: p.payment_number, customer: p.customer?.customer_name, branch: p.branch?.branch_name, amount: p.amount, method: p.payment_method, date: p.created_at }));
    } else if (reportType === 'charges' || reportType === 'arrears') {
      headers = 'المشترك,الفرع,الاستهلاك,الرسوم,المدفوع,المتبقي,الحالة';
      rows = (charges || []).map((c) => ({ customer: c.customer?.customer_name, branch: c.branch?.branch_name, consumption: c.consumption, charge: c.charge_amount, paid: c.paid_amount, remaining: c.remaining_amount, status: c.status }));
    }
    const csv = [headers, ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const paymentColumns: Column<Payment>[] = [
    { key: 'payment_number', header: 'رقم العملية', render: (r) => <span className="font-mono text-xs">{r.payment_number}</span> },
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'amount', header: 'المبلغ', render: (r) => <MoneyDisplay amount={r.amount} className="text-success-600" /> },
    { key: 'created_at', header: 'التاريخ', render: (r) => new Date(r.created_at).toLocaleDateString('ar-SA') },
  ];

  const chargeColumns: Column<Charge>[] = [
    { key: 'customer', header: 'المشترك', render: (r) => r.customer?.customer_name || '-' },
    { key: 'branch', header: 'الفرع', render: (r) => r.branch?.branch_name || '-' },
    { key: 'consumption', header: 'الاستهلاك', render: (r) => `${r.consumption} م³` },
    { key: 'charge_amount', header: 'الرسوم', render: (r) => <MoneyDisplay amount={r.charge_amount} /> },
    { key: 'paid_amount', header: 'المدفوع', render: (r) => <MoneyDisplay amount={r.paid_amount} /> },
    { key: 'remaining_amount', header: 'المتبقي', render: (r) => <MoneyDisplay amount={r.remaining_amount} className="text-danger-600" /> },
  ];

  return (
    <div>
      <PageHeader title="التقارير" subtitle="تقارير النظام المالية والتشغيلية" actions={
        <button onClick={exportCSV} className="btn-secondary">تصدير CSV</button>
      } />

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField label="نوع التقرير" value={reportType} onChange={setReportType} options={reportTypes} />
          <SelectField label="الفترة" value={weekFilter} onChange={setWeekFilter}
            options={(weeks || []).map((w) => ({ value: w.id, label: w.week_number }))} placeholder="كل الفترات" />
          <SelectField label="الفرع" value={branchFilter} onChange={setBranchFilter}
            options={(branches || []).map((b) => ({ value: b.id, label: b.branch_name }))} placeholder="كل الفروع" />
        </div>
      </div>

      {(reportType === 'collection' || reportType === 'payments' || reportType === 'charges' || reportType === 'arrears') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-6">
            <p className="text-sm text-slate-500">إجمالي المحصل</p>
            <p className="text-2xl font-bold text-success-600 mt-1">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-500">إجمالي الرسوم</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalCharges)}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-slate-500">إجمالي المتبقي</p>
            <p className="text-2xl font-bold text-danger-600 mt-1">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>
      )}

      {reportType === 'collection' && branchData.length > 0 && (
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">التحصيل حسب الفرع</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Tajawal' }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontFamily: 'Tajawal', borderRadius: '8px' }} />
              <Bar dataKey="charges" name="الرسوم" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="collected" name="المحصل" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'consumption' && typeData.length > 0 && (
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-slate-800 mb-4">الاستهلاك حسب نوع الاشتراك</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={(e) => e.name}>
                {typeData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${Number(v)} م³`} contentStyle={{ fontFamily: 'Tajawal', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {(reportType === 'collection' || reportType === 'payments') && (
        <DataTable columns={paymentColumns} data={payments || []} loading={paymentsLoading} emptyMessage="لا توجد بيانات" />
      )}
      {(reportType === 'charges' || reportType === 'arrears') && (
        <DataTable columns={chargeColumns} data={(charges || []).filter((c) => reportType === 'arrears' ? c.remaining_amount > 0 : true)} loading={false} emptyMessage="لا توجد بيانات" />
      )}
    </div>
  );
}
