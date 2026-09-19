<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\RoleService;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'بيانات الدخول غير صحيحة'], 401);
        }
        if (!$user->is_active) {
            return response()->json(['error' => 'الحساب غير نشط'], 403);
        }
        if (!Hash::check($request->password, $user->password_hash)) {
            return response()->json(['error' => 'بيانات الدخول غير صحيحة'], 401);
        }
        $token = $user->createToken('auth-token')->plainTextToken;
        $roles = $user->getRoleNames();
        $permissions = $user->getPermissionNames();
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'roles' => $roles,
            ],
            'permissions' => $permissions,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'display_name' => $user->display_name,
            'phone' => $user->phone,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getPermissionNames(),
        ]);
    }

    public function roles()
    {
        return response()->json(app(RoleService::class)->listRoles());
    }

    public function permissions()
    {
        return response()->json(app(RoleService::class)->listPermissions());
    }

    public function rolePermissions(string $roleId)
    {
        return response()->json(app(RoleService::class)->getRolePermissions($roleId));
    }

    public function updateRolePermissions(Request $request, string $roleId)
    {
        $request->validate(['permissionIds' => 'array']);
        return response()->json(app(RoleService::class)->updateRolePermissions($roleId, $request->permissionIds ?? []));
    }

    public function users()
    {
        return response()->json(app(UserService::class)->listUsers());
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'display_name' => 'required|string',
            'phone' => 'nullable|string',
            'is_active' => 'boolean',
            'role_id' => 'nullable|string',
        ]);
        try {
            return response()->json(app(UserService::class)->createUser($request->all()), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function updateUser(Request $request, string $id)
    {
        $request->validate([
            'display_name' => 'required|string',
            'phone' => 'nullable|string',
            'is_active' => 'boolean',
            'role_id' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);
        try {
            return response()->json(app(UserService::class)->updateUser($id, $request->all()));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function deleteUser(string $id)
    {
        app(UserService::class)->deleteUser($id);
        return response()->json(['success' => true]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password_hash)) {
            return response()->json(['error' => 'كلمة المرور الحالية غير صحيحة'], 400);
        }
        $user->update(['password_hash' => Hash::make($request->new_password)]);
        return response()->json(['success' => true]);
    }
}
