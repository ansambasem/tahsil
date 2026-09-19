<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $table = 'users';

    protected $fillable = [
        'email',
        'password_hash',
        'display_name',
        'phone',
        'is_active',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Tell Laravel that the authentication password
     * is stored in password_hash instead of password.
     */
    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    public function getRoleNames(): array
    {
        return $this->roles->pluck('name')->toArray();
    }

    public function getPermissionNames(): array
    {
        $roleIds = $this->roles->pluck('id')->toArray();

        if (empty($roleIds)) {
            return [];
        }

        return Permission::whereHas('roles', function ($q) use ($roleIds) {
            $q->whereIn('roles.id', $roleIds);
        })->pluck('name')->unique()->toArray();
    }

    public function hasPermission(string $permission): bool
    {
        $roleNames = $this->getRoleNames();

        if (in_array('ADMIN', $roleNames)) {
            return true;
        }

        return in_array($permission, $this->getPermissionNames());
    }
}