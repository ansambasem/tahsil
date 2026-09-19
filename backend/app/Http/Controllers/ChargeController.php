<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Services\BillingService;
use Illuminate\Http\Request;

class ChargeController extends Controller
{
    public function index(Request $request)
    {
        $query = Charge::with([
            'customer:id,customer_name,customer_number,subscription_type',
            'meter:id,meter_number', 'branch:id,branch_name',
            'area:id,area_name', 'week:id,week_number',
            'tariff:id,tariff_name,tariff_code'
        ]);
        if ($request->week_id) $query->where('week_id', $request->week_id);
        if ($request->status) $query->where('status', $request->status);
        $charges = $query->orderBy('created_at', 'desc')->get();
        return response()->json($charges->map(fn ($c) => array_merge($c->toArray(), [
            'previous_reading' => (float) $c->previous_reading,
            'current_reading' => (float) $c->current_reading,
            'consumption' => (float) $c->consumption,
            'charge_amount' => (float) $c->charge_amount,
            'paid_amount' => (float) $c->paid_amount,
            'remaining_amount' => (float) $c->remaining_amount,
            'customer' => $c->customer ? ['customer_name' => $c->customer->customer_name, 'customer_number' => $c->customer->customer_number, 'subscription_type' => $c->customer->subscription_type] : null,
            'meter' => $c->meter ? ['meter_number' => $c->meter->meter_number] : null,
            'branch' => $c->branch ? ['branch_name' => $c->branch->branch_name] : null,
            'area' => $c->area ? ['area_name' => $c->area->area_name] : null,
            'week' => $c->week ? ['week_number' => $c->week->week_number] : null,
            'tariff' => $c->tariff ? ['tariff_name' => $c->tariff->tariff_name, 'tariff_code' => $c->tariff->tariff_code] : null,
        ]))->toArray());
    }

    public function unpaid()
    {
        $charges = Charge::with(['customer:id,customer_name,customer_number', 'meter:id,meter_number', 'branch:id,branch_name', 'week:id,week_number'])
            ->whereIn('status', ['unpaid', 'partial'])->orderBy('created_at', 'desc')->get();
        return response()->json($charges->map(fn ($c) => array_merge($c->toArray(), [
            'charge_amount' => (float) $c->charge_amount,
            'paid_amount' => (float) $c->paid_amount,
            'remaining_amount' => (float) $c->remaining_amount,
            'customer' => $c->customer ? ['customer_name' => $c->customer->customer_name, 'customer_number' => $c->customer->customer_number] : null,
            'meter' => $c->meter ? ['meter_number' => $c->meter->meter_number] : null,
            'branch' => $c->branch ? ['branch_name' => $c->branch->branch_name] : null,
            'week' => $c->week ? ['week_number' => $c->week->week_number] : null,
        ]))->toArray());
    }

    public function generate(Request $request)
    {
        $request->validate(['week_id' => 'required|uuid']);
        try {
            return response()->json(app(BillingService::class)->generateChargesForWeek(
                $request->week_id, $request->user()->id, $request->user()->display_name
            ));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
