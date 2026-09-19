<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $keyType = 'string';
    public $incrementing = false;

    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id', 'user_name', 'action_type', 'record_type',
        'record_id', 'old_value', 'new_value', 'reason',
        'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_value' => 'array',
            'new_value' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
