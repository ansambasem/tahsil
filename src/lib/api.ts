const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('غير مصرح');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ');
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser; permissions: string[] }>('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => request<AuthUser & { permissions: string[] }>('/auth/me'),
  getRoles: () => request<Role[]>('/auth/roles'),
  getPermissions: () => request<Permission[]>('/auth/permissions'),
  getRolePermissions: (roleId: string) => request<Permission[]>(`/auth/role-permissions/${roleId}`),
  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    request<{ success: boolean }>(`/auth/role-permissions/${roleId}`, { method: 'PUT', body: { permissionIds } }),
  getUsers: () => request<UserWithRoles[]>('/auth/users'),
  createUser: (data: { email: string; password: string; display_name: string; phone?: string; is_active: boolean; role_id?: string }) =>
    request('/auth/users', { method: 'POST', body: data }),
  updateUser: (id: string, data: { display_name: string; phone?: string; is_active: boolean; role_id?: string; password?: string }) =>
    request(`/auth/users/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id: string) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Branches
  getBranches: () => request<Branch[]>('/branches'),
  createBranch: (data: Partial<Branch>) => request<Branch>('/branches', { method: 'POST', body: data }),
  updateBranch: (id: string, data: Partial<Branch>) => request<Branch>(`/branches/${id}`, { method: 'PUT', body: data }),
  deleteBranch: (id: string) => request(`/branches/${id}`, { method: 'DELETE' }),

  // Areas
  getAreas: () => request<Area[]>('/areas'),
  createArea: (data: Partial<Area>) => request<Area>('/areas', { method: 'POST', body: data }),
  updateArea: (id: string, data: Partial<Area>) => request<Area>(`/areas/${id}`, { method: 'PUT', body: data }),
  deleteArea: (id: string) => request(`/areas/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params: { search?: string; branch_id?: string; status?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.branch_id) q.set('branch_id', params.branch_id);
    if (params.status) q.set('status', params.status);
    q.set('page', String(params.page || 0));
    q.set('page_size', String(params.page_size || 15));
    return request<{ items: Customer[]; total: number }>(`/customers?${q}`);
  },
  createCustomer: (data: Partial<Customer>) => request<Customer>('/customers', { method: 'POST', body: data }),
  updateCustomer: (id: string, data: Partial<Customer>) => request<Customer>(`/customers/${id}`, { method: 'PUT', body: data }),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Meters
  getMeters: (search?: string) => request<Meter[]>(`/meters${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createMeter: (data: Partial<Meter>) => request<Meter>('/meters', { method: 'POST', body: data }),
  updateMeter: (id: string, data: Partial<Meter>) => request<Meter>(`/meters/${id}`, { method: 'PUT', body: data }),
  deleteMeter: (id: string) => request(`/meters/${id}`, { method: 'DELETE' }),
  getMeterReplacements: (meterId: string) => request<MeterReplacement[]>(`/meters/${meterId}/replacements`),
  replaceMeter: (id: string, data: { new_meter_number: string; new_initial_reading: number; reason: string }) =>
    request(`/meters/${id}/replace`, { method: 'POST', body: data }),

  // Tariffs
  getTariffs: () => request<Tariff[]>('/tariffs'),
  createTariff: (data: Partial<Tariff> & { slabs: TariffSlabInput[] }) => request<Tariff>('/tariffs', { method: 'POST', body: data }),
  updateTariff: (id: string, data: Partial<Tariff> & { slabs: TariffSlabInput[] }) => request<Tariff>(`/tariffs/${id}`, { method: 'PUT', body: data }),
  deleteTariff: (id: string) => request(`/tariffs/${id}`, { method: 'DELETE' }),

  // Weeks
  getWeeks: () => request<WeekPeriod[]>('/weeks'),
  createWeek: (data: Partial<WeekPeriod>) => request<WeekPeriod>('/weeks', { method: 'POST', body: data }),
  closeWeek: (id: string) => request(`/weeks/${id}/close`, { method: 'POST' }),
  reopenWeek: (id: string, reason: string) => request(`/weeks/${id}/reopen`, { method: 'POST', body: { reason } }),

  // Readings
  getReadings: (params: { week_id?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params.week_id) q.set('week_id', params.week_id);
    if (params.search) q.set('search', params.search);
    return request<MeterReading[]>(`/readings?${q}`);
  },
  createReading: (data: { week_id: string; meter_id: string; current_reading: number; notes?: string }) =>
    request('/readings', { method: 'POST', body: data }),
  updateReading: (id: string, data: { current_reading: number; notes?: string; reason?: string }) =>
    request(`/readings/${id}`, { method: 'PUT', body: data }),

  // Charges
  getCharges: (params: { week_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params.week_id) q.set('week_id', params.week_id);
    if (params.status) q.set('status', params.status);
    return request<Charge[]>(`/charges?${q}`);
  },
  getUnpaidCharges: () => request<Charge[]>('/charges/unpaid'),
  generateCharges: (weekId: string) => request('/charges/generate', { method: 'POST', body: { week_id: weekId } }),

  // Payments
  getPayments: (params: { search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    return request<Payment[]>(`/payments?${q}`);
  },
  processPayment: (data: { charge_id: string; amount: number; payment_method: string; notes?: string }) =>
    request<{ receipt_number: string }>('/payments', { method: 'POST', body: data }),
  reversePayment: (id: string, reason: string) => request(`/payments/${id}/reverse`, { method: 'POST', body: { reason } }),

  // Receipts
  getReceipts: (search?: string) => request<Receipt[]>(`/receipts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  reprintReceipt: (id: string) => request(`/receipts/${id}/reprint`, { method: 'POST' }),

  // Audit logs
  getAuditLogs: (params: { search?: string; action_type?: string }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.action_type) q.set('action_type', params.action_type);
    return request<AuditLog[]>(`/audit-logs?${q}`);
  },

  // Settings
  getSettings: () => request<Setting[]>('/settings'),
  updateSetting: (key: string, value: string) => request(`/settings/${key}`, { method: 'PUT', body: { value } }),

  // Reports
  getReportPayments: (params: { week_id?: string; branch_id?: string }) => {
    const q = new URLSearchParams();
    if (params.week_id) q.set('week_id', params.week_id);
    if (params.branch_id) q.set('branch_id', params.branch_id);
    return request<Payment[]>(`/reports/payments?${q}`);
  },
  getReportCharges: (params: { week_id?: string; branch_id?: string }) => {
    const q = new URLSearchParams();
    if (params.week_id) q.set('week_id', params.week_id);
    if (params.branch_id) q.set('branch_id', params.branch_id);
    return request<Charge[]>(`/reports/charges?${q}`);
  },

  // Dashboard
  getDashboardStats: (weekId?: string) => request<DashboardStats>(`/dashboard/stats${weekId ? `?week_id=${weekId}` : ''}`),
  getLatestPayments: () => request<Payment[]>('/dashboard/latest-payments'),
  getBranchCollection: (weekId?: string) => request<{ name: string; charges: number; collected: number }[]>(`/dashboard/branch-collection${weekId ? `?week_id=${weekId}` : ''}`),
};

// Types (re-exported for convenience)
export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  roles: string[];
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  module: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role_names: string[];
  role_ids: string[];
}

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  address: string | null;
  phone: string | null;
  manager: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  branch_id: string;
  area_code: string;
  area_name: string;
  status: string;
  notes: string | null;
  branch?: Branch;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_number: string;
  customer_name: string;
  branch_id: string;
  area_id: string;
  address: string | null;
  phone: string | null;
  national_id: string | null;
  subscription_type: string;
  status: string;
  balance: number;
  notes: string | null;
  branch?: Branch;
  area?: Area;
  created_at: string;
  updated_at: string;
}

export interface Meter {
  id: string;
  meter_number: string;
  customer_id: string;
  branch_id: string;
  area_id: string;
  installation_date: string;
  initial_reading: number;
  current_reading: number;
  status: string;
  notes: string | null;
  customer?: { customer_name: string; customer_number: string };
  branch?: { branch_name: string };
  area?: { area_name: string };
  created_at: string;
  updated_at: string;
}

export interface MeterReplacement {
  id: string;
  meter_id: string;
  old_meter_number: string;
  new_meter_number: string;
  old_final_reading: number;
  new_initial_reading: number;
  replacement_date: string;
  reason: string;
  created_at: string;
}

export interface Tariff {
  id: string;
  tariff_name: string;
  tariff_code: string;
  subscription_type: string;
  effective_from: string;
  effective_to: string | null;
  status: string;
  notes: string | null;
  tariff_slabs?: TariffSlab[];
  created_at: string;
  updated_at: string;
}

export interface TariffSlab {
  id: string;
  tariff_id: string;
  from_units: number;
  to_units: number | null;
  rate_per_unit: number;
  fixed_charge: number;
}

export interface TariffSlabInput {
  from_units: number;
  to_units: number | null;
  rate_per_unit: number;
  fixed_charge: number;
}

export interface WeekPeriod {
  id: string;
  week_number: string;
  branch_id: string;
  start_date: string;
  end_date: string;
  status: string;
  closed_by: string | null;
  closed_at: string | null;
  notes: string | null;
  branch?: Branch;
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  week_id: string;
  meter_id: string;
  customer_id: string;
  branch_id: string;
  area_id: string;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  reading_date: string;
  status: string;
  notes: string | null;
  meter?: { meter_number: string };
  customer?: { customer_name: string; customer_number: string };
  branch?: { branch_name: string };
  area?: { area_name: string };
  week?: { week_number: string };
  created_at: string;
  updated_at: string;
}

export interface Charge {
  id: string;
  week_id: string;
  customer_id: string;
  meter_id: string;
  branch_id: string;
  area_id: string;
  tariff_id: string;
  tariff_snapshot: Record<string, unknown>;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  charge_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  customer?: { customer_name: string; customer_number: string; subscription_type?: string };
  meter?: { meter_number: string };
  branch?: { branch_name: string };
  area?: { area_name: string };
  week?: { week_number: string };
  tariff?: { tariff_name: string; tariff_code: string };
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  charge_id: string;
  customer_id: string;
  branch_id: string;
  week_id: string;
  amount: number;
  payment_method: string;
  status: string;
  received_by: string | null;
  notes: string | null;
  customer?: { customer_name: string; customer_number: string };
  branch?: { branch_name: string };
  week?: { week_number: string };
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  payment_id: string;
  customer_id: string;
  branch_id: string;
  week_id: string;
  receipt_data: ReceiptData;
  reprint_count: number;
  last_reprinted_by: string | null;
  last_reprinted_at: string | null;
  customer?: { customer_name: string; customer_number: string };
  branch?: { branch_name: string };
  week?: { week_number: string };
  created_at: string;
  updated_at: string;
}

export interface ReceiptData {
  receipt_number: string;
  payment_number: string;
  date: string;
  customer_name: string;
  customer_number: string;
  meter_number: string;
  branch_name: string;
  area_name: string;
  week_number: string;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  charge_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: string;
  employee_name: string;
  notes: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action_type: string;
  record_type: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  display_name: string;
  category: string;
  data_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  has_week: boolean;
  week_id?: string;
  total_customers: number;
  required_readings: number;
  recorded_readings: number;
  missing_readings: number;
  total_consumption: number;
  total_charges: number;
  total_collected: number;
  total_remaining: number;
  paid_customers: number;
  unpaid_customers: number;
  total_arrears: number;
  collection_percentage: number;
}
