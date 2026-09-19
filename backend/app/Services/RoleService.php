<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RoleService
{
    public function listRoles()
    {
        return Role::orderBy('name')->get()->toArray();
    }

    public function listPermissions()
    {
        return Permission::orderBy('module')->orderBy('name')->get()->toArray();
    }

    public function getRolePermissions(string $roleId)
    {
        $role = Role::findOrFail($roleId);
        return $role->permissions()->orderBy('module')->orderBy('name')->get()->toArray();
    }

    public function updateRolePermissions(string $roleId, array $permissionIds): array
    {
        return DB::transaction(function () use ($roleId, $permissionIds) {
            $role = Role::findOrFail($roleId);
            $role->permissions()->sync($permissionIds);
            return ['success' => true];
        });
    }
}
