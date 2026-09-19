<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::with('branch')->orderBy('area_name')->get();
        return response()->json($areas->map(fn ($a) => array_merge($a->toArray(), [
            'branch' => $a->branch ? ['id' => $a->branch->id, 'branch_name' => $a->branch->branch_name] : null,
        ]))->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'area_code' => 'required|string',
            'area_name' => 'required|string',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()?->id;
        return response()->json(Area::create($data)->fresh(), 201);
    }

    public function update(Request $request, string $id)
    {
        $area = Area::findOrFail($id);
        $data = $request->validate([
            'branch_id' => 'uuid|exists:branches,id',
            'area_code' => 'string',
            'area_name' => 'string',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['updated_by'] = $request->user()?->id;
        $area->update($data);
        return response()->json($area->fresh());
    }

    public function destroy(string $id)
    {
        Area::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
