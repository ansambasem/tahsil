import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '@/lib/format';
import { Users, ClipboardList, Wallet, AlertCircle, TrendingUp, Droplets, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DashboardStats, WeekPeriod, Payment } from '@/lib/types';

export function DashboardPage() {
  const { data: weeks } = useQuery({
    queryKey: ['weeks'],
    queryFn: () => api.getWeeks(),
  });

  const latestWeekId = weeks?.[0]?.id;

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', latestWeekId],
    queryFn: () => api.getDashboardStats(latestWeekId || undefined),
    enabled: !!latestWeekId,
  });

  const { data: latestPayments } = useQuery({
    queryKey: ['latest-payments'],
    queryFn: () => api.getLatestPayments(),
  });

  const { data: branchCollection } = useQuery({
    queryKey: ['branch-collection', latestWeekId],
    queryFn: () => api.getBranchCollection(latestWeekId || undefined),
    enabled: !!latestWeekId,
  });

  if (isLoading) return <LoadingState />;
  if (!stats || !stats.has_week) {
    return (
      <div>
        <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على أداء النظام" />
        <div className="card p-12 text-center">
          <Droplets className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">لا توجد فترة أسبوعية بعد. أنشئ فترة أسبوعية لعرض الإحصائيات.</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'مدفوع', value: stats.paid_customers, color: '#22c55e' },
    { name: 'غير مدفوع', value: stats.unpaid_customers, color: '#ef4444' },
  ];

  const kpis = [
    { label: 'إجمالي المشتركين', value: formatNumber(stats.total_customers, 0), icon: Users, color: 'primary' },
    { label: 'القراءات المطلوبة', value: formatNumber(stats.required_readings, 0), icon: ClipboardList, color: 'accent' },
    { label: 'القراءات المسجلة', value: formatNumber(stats.recorded_readings, 0), icon: ClipboardList, color: 'success' },
    { label: 'قراءات مفقودة', value: formatNumber(stats.missing_readings, 0), icon: AlertCircle, color: 'warning' },
    { label: 'إجمالي الاستهلاك', value: `${formatNumber(stats.total_consumption, 1)} م³`, icon: Droplets, color: 'accent' },
    { label: 'إجمالي الرسوم', value: formatCurrency(stats.total_charges), icon: Receipt, color: 'primary' },
    { label: 'إجمالي المحصل', value: formatCurrency(stats.total_collected), icon: Wallet, color: 'success' },
    { label: 'إجمالي المتبقي', value: formatCurrency(stats.total_remaining), icon: AlertCircle, color: 'danger' },
  ];

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle={weeks?.[0] ? `الفترة الحالية: ${weeks[0].week_number} (${formatDate(weeks[0].start_date)} - ${formatDate(weeks[0].end_date)})` : 'نظرة عامة على أداء النظام'}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const colorMap: Record<string, string> = {
            primary: 'bg-primary-50 text-primary-600',
            accent: 'bg-accent-50 text-accent-600',
            success: 'bg-success-50 text-success-600',
            warning: 'bg-warning-50 text-warning-600',
            danger: 'bg-danger-50 text-danger-600',
          };
          return (
            <div key={kpi.label} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[kpi.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 truncate">{kpi.label}</p>
                  <p className="text-lg font-bold text-slate-800 truncate">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-slate-800">التحصيل حسب الفرع</h3>
          </div>
          {branchCollection && branchCollection.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={branchCollection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Tajawal' }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ fontFamily: 'Tajawal', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="charges" name="الرسوم" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="collected" name="المحصل" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-4">نسبة التحصيل</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'Tajawal', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-4">
              <p className="text-3xl font-bold text-primary-600">{formatPercent(stats.collection_percentage)}</p>
              <p className="text-xs text-slate-500">نسبة التحصيل</p>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-slate-600">مدفوع: {stats.paid_customers}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger-500" />
                <span className="text-slate-600">غير مدفوع: {stats.unpaid_customers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-slate-800 mb-4">أحدث المدفوعات</h3>
        {latestPayments && latestPayments.length > 0 ? (
          <div className="space-y-3">
            {latestPayments.map((p: Payment) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success-50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.customer?.customer_name}</p>
                    <p className="text-xs text-slate-500">{p.customer?.customer_number} - {p.branch?.branch_name}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-success-600">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-400">{p.payment_number}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">لا توجد مدفوعات بعد</div>
        )}
      </div>
    </div>
  );
}
