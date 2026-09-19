<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['branch:id,branch_name', 'area:id,area_name']);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('customer_name', 'ilike', "%{$request->search}%")
                  ->orWhere('customer_number', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'ilike', "%{$request->search}%");
            });
        }
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        if ($request->status) $query->where('status', $request->status);
        $page = (int) ($request->page ?? 0);
        $pageSize = (int) ($request->page_size ?? 15);
        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')->skip($page * $pageSize)->take($pageSize)->get();
        $formatted = $items->map(fn ($c) => array_merge($c->toArray(), [
            'balance' => (float) $c->balance,
            'branch' => $c->branch ? ['id' => $c->branch->id, 'branch_name' => $c->branch->branch_name] : null,
            'area' => $c->area ? ['id' => $c->area->id, 'area_name' => $c->area->area_name] : null,
        ]))->toArray();
        return response()->json(['items' => $formatted, 'total' => $total]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_number' => 'required|string|unique:customers,customer_number',
            'customer_name' => 'required|string',
            'branch_id' => 'required|uuid|exists:branches,id',
            'area_id' => 'required|uuid|exists:areas,id',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'national_id' => 'nullable|string',
            'subscription_type' => 'in:residential,commercial,industrial',
            'status' => 'in:active,inactive,suspended',
            'balance' => 'numeric',
            'notes' => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()?->id;
        return response()->json(Customer::create($data)->fresh(), 201);
    }

    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);
        $data = $request->validate([
            'customer_number' => 'string|unique:customers,customer_number,' . $id . ',id',
            'customer_name' => 'string',
            'branch_id' => 'uuid|exists:branches,id',
            'area_id' => 'uuid|exists:areas,id',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'national_id' => 'nullable|string',
            'subscription_type' => 'in:residential,commercial,industrial',
            'status' => 'in:active,inactive,suspended',
            'balance' => 'numeric',
            'notes' => 'nullable|string',
        ]);
        $data['updated_by'] = $request->user()?->id;
        $customer->update($data);
        return response()->json($customer->fresh());
    }

    public function destroy(string $id)
    {
        Customer::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
