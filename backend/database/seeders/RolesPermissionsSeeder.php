<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'ADMIN'], ['display_name' => 'مدير النظام', 'description' => 'Full system access']);
        $manager = Role::firstOrCreate(['name' => 'MANAGER'], ['display_name' => 'مدير', 'description' => 'Manager with limited admin access']);
        $reader = Role::firstOrCreate(['name' => 'READER'], ['display_name' => 'قارئ العدادات', 'description' => 'Meter reading operator']);

        $permissions = [
            ['name' => 'users.view', 'display_name' => 'عرض المستخدمين', 'module' => 'users'],
            ['name' => 'users.create', 'display_name' => 'إنشاء مستخدم', 'module' => 'users'],
            ['name' => 'users.update', 'display_name' => 'تعديل مستخدم', 'module' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'حذف مستخدم', 'module' => 'users'],
            ['name' => 'branches.create', 'display_name' => 'إنشاء فرع', 'module' => 'branches'],
            ['name' => 'branches.update', 'display_name' => 'تعديل فرع', 'module' => 'branches'],
            ['name' => 'branches.delete', 'display_name' => 'حذف فرع', 'module' => 'branches'],
            ['name' => 'areas.create', 'display_name' => 'إنشاء منطقة', 'module' => 'areas'],
            ['name' => 'areas.update', 'display_name' => 'تعديل منطقة', 'module' => 'areas'],
            ['name' => 'areas.delete', 'display_name' => 'حذف منطقة', 'module' => 'areas'],
            ['name' => 'customers.create', 'display_name' => 'إنشاء عميل', 'module' => 'customers'],
            ['name' => 'customers.update', 'display_name' => 'تعديل عميل', 'module' => 'customers'],
            ['name' => 'customers.delete', 'display_name' => 'حذف عميل', 'module' => 'customers'],
            ['name' => 'meters.create', 'display_name' => 'إنشاء عداد', 'module' => 'meters'],
            ['name' => 'meters.update', 'display_name' => 'تعديل عداد', 'module' => 'meters'],
            ['name' => 'meters.delete', 'display_name' => 'حذف عداد', 'module' => 'meters'],
            ['name' => 'meters.replace', 'display_name' => 'استبدال عداد', 'module' => 'meters'],
            ['name' => 'tariffs.create', 'display_name' => 'إنشاء تعرفة', 'module' => 'tariffs'],
            ['name' => 'tariffs.update', 'display_name' => 'تعديل تعرفة', 'module' => 'tariffs'],
            ['name' => 'tariffs.delete', 'display_name' => 'حذف تعرفة', 'module' => 'tariffs'],
            ['name' => 'weeks.create', 'display_name' => 'إنشاء فترة', 'module' => 'weeks'],
            ['name' => 'weeks.close', 'display_name' => 'إغلاق فترة', 'module' => 'weeks'],
            ['name' => 'weeks.reopen', 'display_name' => 'إعادة فتح فترة', 'module' => 'weeks'],
            ['name' => 'readings.create', 'display_name' => 'إدخال قراءة', 'module' => 'readings'],
            ['name' => 'readings.update', 'display_name' => 'تعديل قراءة', 'module' => 'readings'],
            ['name' => 'charges.generate', 'display_name' => 'توليد رسوم', 'module' => 'charges'],
            ['name' => 'payments.create', 'display_name' => 'تسجيل دفعة', 'module' => 'payments'],
            ['name' => 'payments.reverse', 'display_name' => 'عكس دفعة', 'module' => 'payments'],
            ['name' => 'receipts.reprint', 'display_name' => 'إعادة طباعة إيصال', 'module' => 'receipts'],
            ['name' => 'reports.view', 'display_name' => 'عرض التقارير', 'module' => 'reports'],
            ['name' => 'dashboard.view', 'display_name' => 'عرض لوحة التحكم', 'module' => 'dashboard'],
            ['name' => 'audit_logs.view', 'display_name' => 'عرض سجل العمليات', 'module' => 'audit'],
            ['name' => 'settings.update', 'display_name' => 'تعديل الإعدادات', 'module' => 'settings'],
        ];

        $permissionIds = [];
        foreach ($permissions as $perm) {
            $p = Permission::firstOrCreate(['name' => $perm['name']], $perm);
            $permissionIds[] = $p->id;
        }

        // ADMIN gets all permissions
        $admin->permissions()->sync($permissionIds);

        // MANAGER gets most permissions except user management
        $managerPerms = array_filter($permissions, fn ($p) => !str_starts_with($p['name'], 'users.'));
        $managerIds = [];
        foreach ($managerPerms as $perm) {
            $p = Permission::where('name', $perm['name'])->first();
            if ($p) $managerIds[] = $p->id;
        }
        $manager->permissions()->sync($managerIds);

        // READER gets readings + dashboard only
        $readerPerms = ['readings.create', 'readings.update', 'dashboard.view'];
        $readerIds = [];
        foreach ($readerPerms as $name) {
            $p = Permission::where('name', $name)->first();
            if ($p) $readerIds[] = $p->id;
        }
        $reader->permissions()->sync($readerIds);
    }
}
