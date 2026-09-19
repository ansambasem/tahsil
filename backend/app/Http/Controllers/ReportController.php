<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Charge;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function payments(Request $request)
    {
        $query = Payment::with(['customer:id,customer_name,customer_number', 'branch:id,branch_name', 'week:id,week_number']);
        if ($request->week_id) $query->where('week_id', $request->week_id);
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        $payments = $query->where('status', 'active')->orderBy('created_at', 'desc')->get();
        return response()->json($payments->map(fn ($p) => array_merge($p->toArray(), [
            'amount' => (float) $p->amount,
            'customer' => $p->customer ? ['customer_name' => $p->customer->customer_name, 'customer_number' => $p->customer->customer_number] : null,
            'branch' => $p->branch ? ['branch_name' => $p->branch->branch_name] : null,
            'week' => $p->week ? ['week_number' => $p->week->week_number] : null,
        ]))->toArray());
    }

    public function charges(Request $request)
    {
        $query = Charge::with([
            'customer:id,customer_name,customer_number,subscription_type',
            'meter:id,meter_number', 'branch:id,branch_name', 'week:id,week_number'
        ]);
        if ($request->week_id) $query->where('week_id', $request->week_id);
        if ($request->branch_id) $query->where('branch_id', $request->branch_id);
        $charges = $query->orderBy('created_at', 'desc')->get();
        return response()->json($charges->map(fn ($c) => array_merge($c->toArray(), [
            'charge_amount' => (float) $c->charge_amount,
            'paid_amount' => (float) $c->paid_amount,
            'remaining_amount' => (float) $c->remaining_amount,
            'customer' => $c->customer ? ['customer_name' => $c->customer->customer_name, 'customer_number' => $c->customer->customer_number, 'subscription_type' => $c->customer->subscription_type] : null,
            'meter' => $c->meter ? ['meter_number' => $c->meter->meter_number] : null,
            'branch' => $c->branch ? ['branch_name' => $c->branch->branch_name] : null,
            'week' => $c->week ? ['week_number' => $c->week->week_number] : null,
        ]))->toArray());
    }
}
