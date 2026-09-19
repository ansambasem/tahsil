<?php

namespace App\Http\Controllers;

use App\Models\Receipt;
use App\Services\BillingService;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = Receipt::with(['customer:id,customer_name,customer_number', 'branch:id,branch_name', 'week:id,week_number']);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('receipt_number', 'ilike', "%{$request->search}%")
                  ->orWhereHas('customer', fn ($cq) => $cq->where('customer_name', 'ilike', "%{$request->search}%"));
            });
        }
        $receipts = $query->orderBy('created_at', 'desc')->get();
        return response()->json($receipts->map(fn ($r) => array_merge($r->toArray(), [
            'customer' => $r->customer ? ['customer_name' => $r->customer->customer_name, 'customer_number' => $r->customer->customer_number] : null,
            'branch' => $r->branch ? ['branch_name' => $r->branch->branch_name] : null,
            'week' => $r->week ? ['week_number' => $r->week->week_number] : null,
        ]))->toArray());
    }

    public function reprint(Request $request, string $id)
    {
        try {
            return response()->json(app(BillingService::class)->reprintReceipt(
                $id, $request->user()->id, $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
