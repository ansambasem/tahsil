<?php

namespace App\Http\Controllers;

use App\Models\WeekPeriod;
use App\Services\BillingService;
use Illuminate\Http\Request;

class WeekController extends Controller
{
    public function index()
    {
        $weeks = WeekPeriod::with('branch:id,branch_name')->orderBy('created_at', 'desc')->get();
        return response()->json($weeks->map(fn ($w) => array_merge($w->toArray(), [
            'branch' => $w->branch ? ['id' => $w->branch->id, 'branch_name' => $w->branch->branch_name] : null,
        ]))->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'week_number' => 'required|string|unique:week_periods,week_number',
            'branch_id' => 'required|uuid|exists:branches,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);
        $data['status'] = 'open';
        $data['created_by'] = $request->user()?->id;
        return response()->json(WeekPeriod::create($data)->fresh(), 201);
    }

    public function close(Request $request, string $id)
    {
        try {
            return response()->json(app(BillingService::class)->closeWeek(
                $id, $request->user()->id, $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function reopen(Request $request, string $id)
    {
        $request->validate(['reason' => 'required|string']);
        try {
            return response()->json(app(BillingService::class)->reopenWeek(
                $id, $request->reason, $request->user()->id, $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
