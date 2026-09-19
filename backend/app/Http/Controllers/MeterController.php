<?php

namespace App\Http\Controllers;

use App\Models\Meter;
use App\Services\BillingService;
use Illuminate\Http\Request;

class MeterController extends Controller
{
    public function index(Request $request)
    {
        $query = Meter::with(['customer:id,customer_name,customer_number', 'branch:id,branch_name', 'area:id,area_name']);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('meter_number', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('customer_name', 'ilike', "%{$request->search}%"));
            });
        }
        $meters = $query->orderBy('created_at', 'desc')->get();
        return response()->json($meters->map(fn ($m) => array_merge($m->toArray(), [
            'initial_reading' => (float) $m->initial_reading,
            'current_reading' => (float) $m->current_reading,
            'customer' => $m->customer ? ['customer_name' => $m->customer->customer_name, 'customer_number' => $m->customer->customer_number] : null,
            'branch' => $m->branch ? ['branch_name' => $m->branch->branch_name] : null,
            'area' => $m->area ? ['area_name' => $m->area->area_name] : null,
        ]))->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'meter_number' => 'required|string|unique:meters,meter_number',
            'customer_id' => 'required|uuid|exists:customers,id',
            'branch_id' => 'required|uuid|exists:branches,id',
            'area_id' => 'required|uuid|exists:areas,id',
            'installation_date' => 'nullable|date',
            'initial_reading' => 'numeric',
            'current_reading' => 'numeric',
            'status' => 'in:active,replaced,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()?->id;
        return response()->json(Meter::create($data)->fresh(), 201);
    }

    public function update(Request $request, string $id)
    {
        $meter = Meter::findOrFail($id);
        $data = $request->validate([
            'meter_number' => 'string|unique:meters,meter_number,' . $id . ',id',
            'customer_id' => 'uuid|exists:customers,id',
            'branch_id' => 'uuid|exists:branches,id',
            'area_id' => 'uuid|exists:areas,id',
            'installation_date' => 'nullable|date',
            'initial_reading' => 'numeric',
            'current_reading' => 'numeric',
            'status' => 'in:active,replaced,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['updated_by'] = $request->user()?->id;
        $meter->update($data);
        return response()->json($meter->fresh());
    }

    public function destroy(string $id)
    {
        Meter::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function replacements(string $id)
    {
        $meter = Meter::findOrFail($id);
        return response()->json($meter->replacements()->orderBy('created_at', 'desc')->get()->map(fn ($r) => array_merge($r->toArray(), [
            'old_final_reading' => (float) $r->old_final_reading,
            'new_initial_reading' => (float) $r->new_initial_reading,
        ]))->toArray());
    }

    public function replace(Request $request, string $id)
    {
        $request->validate([
            'new_meter_number' => 'required|string',
            'new_initial_reading' => 'required|numeric',
            'reason' => 'required|string',
        ]);
        try {
            $result = app(BillingService::class)->replaceMeter(
                $id,
                $request->new_meter_number,
                (float) $request->new_initial_reading,
                $request->reason,
                $request->user()->id,
                $request->user()->display_name
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
