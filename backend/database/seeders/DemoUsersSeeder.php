<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $adminRole = Role::where('name', 'ADMIN')->first();
        $managerRole = Role::where('name', 'MANAGER')->first();

        $admin = User::firstOrCreate(
            ['email' => 'admin@water.gov'],
            [
                'password_hash' => Hash::make('WaterAdmin#2024'),
                'display_name' => 'System Administrator',
                'is_active' => true,
            ]
        );
        if ($adminRole && !$admin->roles()->where('role_id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id);
        }

        $manager = User::firstOrCreate(
            ['email' => 'manager@water.gov'],
            [
                'password_hash' => Hash::make('WaterManager#2024'),
                'display_name' => 'Manager',
                'is_active' => true,
            ]
        );
        if ($managerRole && !$manager->roles()->where('role_id', $managerRole->id)->exists()) {
            $manager->roles()->attach($managerRole->id);
        }
    }
}
