<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listUsers()
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return $users->map(function ($user) {
            $roles = $user->roles;
            return [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
                'role_names' => $roles->pluck('name')->toArray(),
                'role_ids' => $roles->pluck('id')->toArray(),
            ];
        })->toArray();
    }

    public function createUser(array $data): array
    {
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            throw new \Exception('البريد الإلكتروني مستخدم بالفعل');
        }

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'display_name' => $data['display_name'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (!empty($data['role_id'])) {
                DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $user->id,
                    'role_id' => $data['role_id'],
                ]);
            }

            return [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ];
        });
    }

    public function updateUser(string $userId, array $data): array
    {
        return DB::transaction(function () use ($userId, $data) {
            $user = User::findOrFail($userId);

            $updateData = [
                'display_name' => $data['display_name'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ];

            if (!empty($data['password'])) {
                $updateData['password_hash'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (!empty($data['role_id'])) {
                DB::table('user_roles')->where('user_id', $userId)->delete();
                DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $userId,
                    'role_id' => $data['role_id'],
                ]);
            }

            return [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ];
        });
    }

    public function deleteUser(string $userId): void
    {
        User::where('id', $userId)->delete();
    }
}
