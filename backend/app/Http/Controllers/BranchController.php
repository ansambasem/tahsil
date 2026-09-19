<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return response()->json(Branch::orderBy('branch_name')->get()->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'branch_code' => 'required|string|unique:branches,branch_code',
            'branch_name' => 'required|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'manager' => 'nullable|string',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()?->id;
        return response()->json(Branch::create($data)->fresh(), 201);
    }

    public function update(Request $request, string $id)
    {
        $branch = Branch::findOrFail($id);
        $data = $request->validate([
            'branch_code' => 'string|unique:branches,branch_code,' . $id . ',id',
            'branch_name' => 'string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'manager' => 'nullable|string',
            'status' => 'in:active,inactive',
            'notes' => 'nullable|string',
        ]);
        $data['updated_by'] = $request->user()?->id;
        $branch->update($data);
        return response()->json($branch->fresh());
    }

    public function destroy(string $id)
    {
        Branch::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
