import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  Gauge,
  Calendar,
  ClipboardList,
  Receipt,
  Wallet,
  FileText,
  Settings,
  ShieldCheck,
  ScrollText,
  Tag,
  Droplets,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/branches', label: 'الفروع', icon: Building2, permission: 'branches.view' },
  { to: '/areas', label: 'المناطق', icon: MapPin, permission: 'areas.view' },
  { to: '/customers', label: 'المشتركون', icon: Users, permission: 'customers.view' },
  { to: '/meters', label: 'العدادات', icon: Gauge, permission: 'meters.view' },
  { to: '/tariffs', label: 'التعرفات', icon: Tag, permission: 'tariffs.view' },
  { to: '/weeks', label: 'الفترات الأسبوعية', icon: Calendar, permission: 'weeks.view' },
  { to: '/readings', label: 'القراءات', icon: ClipboardList, permission: 'readings.view' },
  { to: '/charges', label: 'الرسوم', icon: FileText, permission: 'charges.view' },
  { to: '/payments', label: 'المدفوعات', icon: Wallet, permission: 'payments.view' },
  { to: '/receipts', label: 'الإيصالات', icon: Receipt, permission: 'receipts.view' },
  { to: '/arrears', label: 'المتأخرات', icon: AlertCircle, permission: 'charges.view' },
  { to: '/reports', label: 'التقارير', icon: FileText, permission: 'reports.view' },
  { to: '/users', label: 'المستخدمون', icon: Users, permission: 'users.view' },
  { to: '/roles', label: 'الأدوار', icon: ShieldCheck, permission: 'roles.view' },
  { to: '/audit-logs', label: 'سجل التدقيق', icon: ScrollText, permission: 'audit_logs.view' },
  { to: '/settings', label: 'الإعدادات', icon: Settings, permission: 'settings.view' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAdminOrManager } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-72 bg-slate-900 text-slate-300 z-40 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">تحصيل</h1>
            <p className="text-slate-400 text-xs">نظام تحصيل فواتير المياه</p>
          </div>
        </div>

        <nav className="overflow-y-auto h-[calc(100vh-4rem)] py-4 px-3 space-y-1">
          {navItems.map((item) => {
            if (!isAdminOrManager) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
