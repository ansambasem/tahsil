import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastContainer } from '@/components/ui';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { AreasPage } from '@/pages/AreasPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { MetersPage } from '@/pages/MetersPage';
import { TariffsPage } from '@/pages/TariffsPage';
import { WeeksPage } from '@/pages/WeeksPage';
import { ReadingsPage } from '@/pages/ReadingsPage';
import { ChargesPage } from '@/pages/ChargesPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ReceiptsPage } from '@/pages/ReceiptsPage';
import { ArrearsPage } from '@/pages/ArrearsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="meters" element={<MetersPage />} />
            <Route path="tariffs" element={<TariffsPage />} />
            <Route path="weeks" element={<WeeksPage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="charges" element={<ChargesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
            <Route path="arrears" element={<ArrearsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </AuthProvider>
  );
}
