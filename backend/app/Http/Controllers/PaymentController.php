<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\BillingService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['customer:id,customer_name,customer_number', 'branch:id,branch_name', 'week:id,week_number']);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('payment_number', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('customer_name', 'ilike', "%{$request->search}%"));
            });
        }
        if ($request->status) $query->where('status', $request->status);
        $payments = $query->orderBy('created_at', 'desc')->get();
        return response()->json($payments->map(fn ($p) => array_merge($p->toArray(), [
            'amount' => (float) $p->amount,
            'customer' => $p->customer ? ['customer_name' => $p->customer->customer_name, 'customer_number' => $p->customer->customer_number] : null,
            'branch' => $p->branch ? ['branch_name' => $p->branch->branch_name] : null,
            'week' => $p->week ? ['week_number' => $p->week->week_number] : null,
        ]))->toArray());
    }

    public function store(Request $request)
    {
        $request->validate([
            'charge_id' => 'required|uuid',
            'amount' => 'required|numeric',
            'payment_method' => 'required|in:cash,transfer,card',
            'notes' => 'nullable|string',
        ]);
        try {
            return response()->json(app(BillingService::class)->processPayment(
                $request->charge_id,
                (float) $request->amount,
                $request->payment_method,
                $request->notes,
                $request->user()->id,
                $request->user()->display_name
            ), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function reverse(Request $request, string $id)
    {
        $request->validate(['reason' => 'required|string']);
        try {
            return response()->json(app(BillingService::class)->reversePayment(
                $id, $request->reason, $request->user()->id, $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
