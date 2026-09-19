<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query();
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('user_name', 'ilike', "%{$request->search}%")
                  ->orWhere('action_type', 'ilike', "%{$request->search}%")
                  ->orWhere('record_type', 'ilike', "%{$request->search}%");
            });
        }
        if ($request->action_type) $query->where('action_type', $request->action_type);
        $logs = $query->orderBy('created_at', 'desc')->limit(200)->get();
        return response()->json($logs->toArray());
    }
}
