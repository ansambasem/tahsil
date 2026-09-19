<?php

namespace App\Http\Controllers;

use App\Models\MeterReading;
use App\Services\BillingService;
use Illuminate\Http\Request;

class ReadingController extends Controller
{
    public function index(Request $request)
    {
        $query = MeterReading::with([
            'meter:id,meter_number', 'customer:id,customer_name,customer_number',
            'branch:id,branch_name', 'area:id,area_name', 'week:id,week_number'
        ]);
        if ($request->week_id) $query->where('week_id', $request->week_id);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('meter', fn ($mq) => $mq->where('meter_number', 'ilike', "%{$request->search}%"))
                  ->orWhereHas('customer', fn ($cq) => $cq->where('customer_name', 'ilike', "%{$request->search}%"));
            });
        }
        $readings = $query->orderBy('created_at', 'desc')->get();
        return response()->json($readings->map(fn ($r) => array_merge($r->toArray(), [
            'previous_reading' => (float) $r->previous_reading,
            'current_reading' => (float) $r->current_reading,
            'consumption' => (float) $r->consumption,
            'meter' => $r->meter ? ['meter_number' => $r->meter->meter_number] : null,
            'customer' => $r->customer ? ['customer_name' => $r->customer->customer_name, 'customer_number' => $r->customer->customer_number] : null,
            'branch' => $r->branch ? ['branch_name' => $r->branch->branch_name] : null,
            'area' => $r->area ? ['area_name' => $r->area->area_name] : null,
            'week' => $r->week ? ['week_number' => $r->week->week_number] : null,
        ]))->toArray());
    }

    public function store(Request $request)
    {
        $request->validate([
            'week_id' => 'required|uuid',
            'meter_id' => 'required|uuid',
            'current_reading' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);
        try {
            return response()->json(app(BillingService::class)->createReading(
                $request->week_id,
                $request->meter_id,
                (float) $request->current_reading,
                $request->notes,
                $request->user()->id,
                $request->user()->display_name
            ), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'current_reading' => 'required|numeric',
            'notes' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);
        try {
            return response()->json(app(BillingService::class)->updateReading(
                $id,
                (float) $request->current_reading,
                $request->notes,
                $request->reason,
                $request->user()->id,
                $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
