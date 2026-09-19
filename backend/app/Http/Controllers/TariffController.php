<?php

namespace App\Http\Controllers;

use App\Services\TariffService;
use Illuminate\Http\Request;

class TariffController extends Controller
{
    public function index()
    {
        return response()->json(app(TariffService::class)->listTariffs());
    }

    public function store(Request $request)
    {
        $request->validate([
            'tariff_name' => 'required|string',
            'tariff_code' => 'required|string|unique:tariffs,tariff_code',
            'subscription_type' => 'required|in:residential,commercial,industrial',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
            'slabs' => 'array',
            'slabs.*.from_units' => 'numeric',
            'slabs.*.to_units' => 'nullable|numeric',
            'slabs.*.rate_per_unit' => 'numeric',
            'slabs.*.fixed_charge' => 'numeric',
        ]);
        try {
            return response()->json(app(TariffService::class)->createTariff($request->all()), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'tariff_name' => 'string',
            'tariff_code' => 'string|unique:tariffs,tariff_code,' . $id . ',id',
            'subscription_type' => 'in:residential,commercial,industrial',
            'effective_from' => 'date',
            'effective_to' => 'nullable|date',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
            'slabs' => 'array',
            'slabs.*.from_units' => 'numeric',
            'slabs.*.to_units' => 'nullable|numeric',
            'slabs.*.rate_per_unit' => 'numeric',
            'slabs.*.fixed_charge' => 'numeric',
        ]);
        try {
            return response()->json(app(TariffService::class)->updateTariff($id, $request->all()));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function destroy(string $id)
    {
        app(TariffService::class)->deleteTariff($id);
        return response()->json(['success' => true]);
    }
}
