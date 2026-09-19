<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;

class AuditService
{
    public static function log(
        ?string $userId,
        string $userName,
        string $actionType,
        string $recordType,
        ?string $recordId = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        ?string $reason = null
    ): void {
        AuditLog::create([
            'user_id' => $userId,
            'user_name' => $userName,
            'action_type' => $actionType,
            'record_type' => $recordType,
            'record_id' => $recordId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'reason' => $reason,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
