<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Meter;
use App\Models\MeterReading;
use App\Models\Charge;
use App\Models\Payment;
use App\Models\WeekPeriod;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(?string $weekId): array
    {
        $wId = $weekId;
        if (!$wId) {
            $latest = WeekPeriod::latest('created_at')->first();
            if (!$latest) {
                return ['has_week' => false];
            }
            $wId = $latest->id;
        }
        $totalCustomers = Customer::where('status', 'active')->count();
        $requiredReadings = Meter::where('status', 'active')->count();
        $recordedReadings = MeterReading::where('week_id', $wId)->whereIn('status', ['entered', 'verified'])->count();
        $missingReadings = max(0, $requiredReadings - $recordedReadings);
        $chargesAgg = Charge::where('week_id', $wId)->selectRaw("
            COALESCE(SUM(consumption), 0) as consumption,
            COALESCE(SUM(charge_amount), 0) as charges,
            COALESCE(SUM(paid_amount), 0) as collected,
            COALESCE(SUM(remaining_amount), 0) as remaining
        ")->first();
        $paidCustomers = Charge::where('week_id', $wId)->where('status', 'paid')->distinct('customer_id')->count('customer_id');
        $unpaidCustomers = Charge::where('week_id', $wId)->whereIn('status', ['unpaid', 'partial'])->distinct('customer_id')->count('customer_id');
        $arrears = Charge::whereIn('status', ['unpaid', 'partial'])->sum('remaining_amount');
        $totalCharges = (float) $chargesAgg->charges;
        $totalCollected = (float) $chargesAgg->collected;
        return [
            'has_week' => true,
            'week_id' => $wId,
            'total_customers' => $totalCustomers,
            'required_readings' => $requiredReadings,
            'recorded_readings' => $recordedReadings,
            'missing_readings' => $missingReadings,
            'total_consumption' => (float) $chargesAgg->consumption,
            'total_charges' => $totalCharges,
            'total_collected' => $totalCollected,
            'total_remaining' => (float) $chargesAgg->remaining,
            'paid_customers' => $paidCustomers,
            'unpaid_customers' => $unpaidCustomers,
            'total_arrears' => (float) $arrears,
            'collection_percentage' => $totalCharges > 0 ? round(($totalCollected / $totalCharges * 100) * 100) / 100 : 0,
        ];
    }

    public function getLatestPayments(): array
    {
        return Payment::with(['customer:id,customer_name,customer_number', 'branch:id,branch_name', 'week:id,week_number'])
            ->where('status', 'active')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($p) => $this->formatPayment($p))
            ->toArray();
    }

    public function getBranchCollection(?string $weekId): array
    {
        $wId = $weekId;
        if (!$wId) {
            $latest = WeekPeriod::latest('created_at')->first();
            $wId = $latest?->id;
        }
        $branches = \App\Models\Branch::all();
        $result = [];
        foreach ($branches as $branch) {
            $charges = Charge::where('branch_id', $branch->id)->when($wId, fn ($q) => $q->where('week_id', $wId))->sum('charge_amount');
            $collected = Charge::where('branch_id', $branch->id)->when($wId, fn ($q) => $q->where('week_id', $wId))->sum('paid_amount');
            $result[] = [
                'name' => $branch->branch_name,
                'charges' => (float) $charges,
                'collected' => (float) $collected,
            ];
        }
        return $result;
    }

    private function formatPayment($p): array
    {
        return [
            'id' => $p->id,
            'payment_number' => $p->payment_number,
            'charge_id' => $p->charge_id,
            'customer_id' => $p->customer_id,
            'branch_id' => $p->branch_id,
            'week_id' => $p->week_id,
            'amount' => (float) $p->amount,
            'payment_method' => $p->payment_method,
            'status' => $p->status,
            'received_by' => $p->received_by,
            'notes' => $p->notes,
            'customer' => $p->customer ? ['customer_name' => $p->customer->customer_name, 'customer_number' => $p->customer->customer_number] : null,
            'branch' => $p->branch ? ['branch_name' => $p->branch->branch_name] : null,
            'week' => $p->week ? ['week_number' => $p->week->week_number] : null,
            'created_at' => $p->created_at,
            'updated_at' => $p->updated_at,
        ];
    }
}
