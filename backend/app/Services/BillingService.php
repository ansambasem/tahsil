<?php

namespace App\Services;

use App\Models\Meter;
use App\Models\MeterReading;
use App\Models\MeterReplacement;
use App\Models\WeekPeriod;
use App\Models\Customer;
use App\Models\Tariff;
use App\Models\TariffSlab;
use App\Models\Charge;
use App\Models\Payment;
use App\Models\PaymentReversal;
use App\Models\Receipt;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BillingService
{
    public function createReading(string $weekId, string $meterId, float $currentReading, ?string $notes, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($weekId, $meterId, $currentReading, $notes, $userId, $userName) {
            $meter = Meter::findOrFail($meterId);
            $week = WeekPeriod::findOrFail($weekId);
            if ($week->status === 'closed') {
                throw new \Exception('لا يمكن إضافة قراءات لفترة مغلقة');
            }
            $existing = MeterReading::where('week_id', $weekId)->where('meter_id', $meterId)->first();
            if ($existing) {
                throw new \Exception('تم إدخال قراءة لهذا العداد في هذه الفترة');
            }
            $previousReading = (float) $meter->current_reading;
            $consumption = $currentReading - $previousReading;
            if ($consumption < 0) {
                throw new \Exception('القراءة الحالية أقل من القراءة السابقة');
            }
            $reading = MeterReading::create([
                'week_id' => $weekId,
                'meter_id' => $meterId,
                'customer_id' => $meter->customer_id,
                'branch_id' => $meter->branch_id,
                'area_id' => $meter->area_id,
                'previous_reading' => $previousReading,
                'current_reading' => $currentReading,
                'consumption' => $consumption,
                'reading_date' => now(),
                'status' => 'entered',
                'notes' => $notes,
                'read_by' => $userId,
            ]);
            $meter->update(['current_reading' => $currentReading]);
            AuditService::log($userId, $userName, 'reading.create', 'meter_readings', $reading->id, null, [
                'meter_number' => $meter->meter_number,
                'previous' => $previousReading,
                'current' => $currentReading,
                'consumption' => $consumption,
            ]);
            return [
                'success' => true,
                'reading_id' => $reading->id,
                'previous_reading' => $previousReading,
                'current_reading' => $currentReading,
                'consumption' => $consumption,
            ];
        });
    }

    public function updateReading(string $readingId, float $currentReading, ?string $notes, ?string $reason, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($readingId, $currentReading, $notes, $reason, $userId, $userName) {
            $reading = MeterReading::findOrFail($readingId);
            $week = WeekPeriod::find($reading->week_id);
            if ($week && $week->status === 'closed') {
                throw new \Exception('لا يمكن تعديل قراءات فترة مغلقة');
            }
            $previousReading = (float) $reading->previous_reading;
            $newConsumption = $currentReading - $previousReading;
            if ($newConsumption < 0) {
                throw new \Exception('القراءة الحالية أقل من القراءة السابقة');
            }
            $oldValues = [
                'current_reading' => (float) $reading->current_reading,
                'consumption' => (float) $reading->consumption,
            ];
            $reading->update([
                'current_reading' => $currentReading,
                'consumption' => $newConsumption,
                'notes' => $notes ?? $reading->notes,
                'modified_by' => $userId,
                'modified_at' => now(),
            ]);
            Meter::where('id', $reading->meter_id)->update(['current_reading' => $currentReading]);
            AuditService::log($userId, $userName, 'reading.update', 'meter_readings', $readingId, $oldValues, [
                'current_reading' => $currentReading,
                'consumption' => $newConsumption,
            ], $reason ?? 'تعديل القراءة');
            return ['success' => true, 'consumption' => $newConsumption];
        });
    }

    private function calculateChargeAmount(array $slabs, float $consumption): float
    {
        if ($consumption <= 0) return 0;
        $total = 0;
        $remaining = $consumption;
        $firstSlab = true;
        foreach ($slabs as $slab) {
            if ($remaining <= 0) break;
            $slabConsumption = min($remaining, ($slab['to_units'] ?? 999999999) - $slab['from_units']);
            if ($slabConsumption > 0) {
                $total += $slabConsumption * (float) $slab['rate_per_unit'];
                $remaining -= $slabConsumption;
            }
            if ($firstSlab && (float) $slab['fixed_charge'] > 0) {
                $total += (float) $slab['fixed_charge'];
            }
            $firstSlab = false;
        }
        return round($total * 100) / 100;
    }

    public function generateChargesForWeek(string $weekId, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($weekId, $userId, $userName) {
            $week = WeekPeriod::findOrFail($weekId);
            if ($week->status === 'closed') {
                throw new \Exception('لا يمكن توليد رسوم لفترة مغلقة');
            }
            $existingCount = Charge::where('week_id', $weekId)->count();
            if ($existingCount > 0) {
                throw new \Exception('تم توليد الرسوم مسبقاً لهذه الفترة');
            }
            $readings = MeterReading::where('week_id', $weekId)
                ->whereIn('status', ['entered', 'verified'])
                ->get();
            $count = 0;
            $errors = [];
            foreach ($readings as $reading) {
                $customer = Customer::find($reading->customer_id);
                $tariff = Tariff::where('subscription_type', $customer->subscription_type)
                    ->where('status', 'active')
                    ->where('effective_from', '<=', $reading->reading_date)
                    ->where(function ($q) use ($reading) {
                        $q->whereNull('effective_to')->orWhere('effective_to', '>=', $reading->reading_date);
                    })
                    ->orderBy('effective_from', 'desc')
                    ->first();
                if (!$tariff) {
                    $errors[] = "لا يوجد تعرفة نشطة للعميل: {$customer->customer_number}";
                    continue;
                }
                $slabs = $tariff->slabs()->orderBy('from_units')->get()->map(fn ($s) => [
                    'from_units' => (float) $s->from_units,
                    'to_units' => $s->to_units !== null ? (float) $s->to_units : null,
                    'rate_per_unit' => (float) $s->rate_per_unit,
                    'fixed_charge' => (float) $s->fixed_charge,
                ])->toArray();
                $chargeAmount = $this->calculateChargeAmount($slabs, (float) $reading->consumption);
                $tariffSnapshot = [
                    'tariff_id' => $tariff->id,
                    'tariff_name' => $tariff->tariff_name,
                    'tariff_code' => $tariff->tariff_code,
                    'subscription_type' => $tariff->subscription_type,
                    'slabs' => $slabs,
                ];
                Charge::create([
                    'week_id' => $weekId,
                    'customer_id' => $reading->customer_id,
                    'meter_id' => $reading->meter_id,
                    'branch_id' => $reading->branch_id,
                    'area_id' => $reading->area_id,
                    'reading_id' => $reading->id,
                    'tariff_id' => $tariff->id,
                    'tariff_snapshot' => $tariffSnapshot,
                    'previous_reading' => $reading->previous_reading,
                    'current_reading' => $reading->current_reading,
                    'consumption' => $reading->consumption,
                    'charge_amount' => $chargeAmount,
                    'paid_amount' => 0,
                    'remaining_amount' => $chargeAmount,
                    'status' => 'unpaid',
                    'generated_by' => $userId,
                ]);
                $count++;
            }
            AuditService::log($userId, $userName, 'charges.generate', 'week_periods', $weekId, null, [
                'week_id' => $weekId,
                'charges_generated' => $count,
            ], 'توليد الرسوم للفترة الأسبوعية');
            return ['success' => true, 'charges_generated' => $count, 'errors' => $errors];
        });
    }

    public function processPayment(string $chargeId, float $amount, string $paymentMethod, ?string $notes, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($chargeId, $amount, $paymentMethod, $notes, $userId, $userName) {
            if ($amount <= 0) {
                throw new \Exception('المبلغ يجب أن يكون أكبر من صفر');
            }
            $charge = Charge::findOrFail($chargeId);
            if ($charge->status === 'paid') {
                throw new \Exception('تم دفع هذا الرسم بالكامل');
            }
            if ($charge->status === 'cancelled') {
                throw new \Exception('هذا الرسم ملغي');
            }
            if ($amount > (float) $charge->remaining_amount) {
                throw new \Exception("المبلغ يتجاوز المبلغ المتبقي ({$charge->remaining_amount})");
            }
            $paymentNumber = 'PAY-' . date('Ymd') . '-' . substr((string) time(), -8);
            $newPaid = (float) $charge->paid_amount + $amount;
            $newRemaining = (float) $charge->charge_amount - $newPaid;
            $chargeStatus = $newRemaining <= 0 ? 'paid' : 'partial';
            $payment = Payment::create([
                'payment_number' => $paymentNumber,
                'charge_id' => $chargeId,
                'customer_id' => $charge->customer_id,
                'branch_id' => $charge->branch_id,
                'area_id' => $charge->area_id ?? optional($charge->reading)->area_id,
                'week_id' => $charge->week_id,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'status' => 'active',
                'received_by' => $userId,
                'notes' => $notes,
            ]);
            $charge->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $chargeStatus,
            ]);
            Customer::where('id', $charge->customer_id)->update([
                'balance' => DB::raw('GREATEST(balance - ' . $amount . ', 0)'),
            ]);
            $customer = Customer::find($charge->customer_id);
            $week = WeekPeriod::find($charge->week_id);
            $meter = Meter::find($charge->meter_id);
            $branch = \App\Models\Branch::find($charge->branch_id);
            $area = \App\Models\Area::find($charge->area_id);
            $receiptNumber = 'REC-' . date('Ymd') . '-' . substr((string) time(), -8);
            $receiptData = [
                'receipt_number' => $receiptNumber,
                'payment_number' => $paymentNumber,
                'date' => now()->format('Y-m-d H:i:s'),
                'customer_name' => $customer?->customer_name,
                'customer_number' => $customer?->customer_number,
                'meter_number' => $meter?->meter_number,
                'branch_name' => $branch?->branch_name,
                'area_name' => $area?->area_name,
                'week_number' => $week?->week_number,
                'previous_reading' => (float) $charge->previous_reading,
                'current_reading' => (float) $charge->current_reading,
                'consumption' => (float) $charge->consumption,
                'charge_amount' => (float) $charge->charge_amount,
                'paid_amount' => $amount,
                'remaining_amount' => $newRemaining,
                'payment_method' => $paymentMethod,
                'employee_name' => $userName,
                'notes' => $notes,
            ];
            $receipt = Receipt::create([
                'receipt_number' => $receiptNumber,
                'payment_id' => $payment->id,
                'customer_id' => $charge->customer_id,
                'branch_id' => $charge->branch_id,
                'week_id' => $charge->week_id,
                'receipt_data' => $receiptData,
            ]);
            AuditService::log($userId, $userName, 'payment.create', 'payments', $payment->id, null, [
                'amount' => $amount,
                'charge_id' => $chargeId,
                'payment_number' => $paymentNumber,
            ]);
            return [
                'success' => true,
                'payment_id' => $payment->id,
                'payment_number' => $paymentNumber,
                'receipt_id' => $receipt->id,
                'receipt_number' => $receiptNumber,
                'new_charge_status' => $chargeStatus,
                'remaining_amount' => $newRemaining,
            ];
        });
    }

    public function reversePayment(string $paymentId, string $reason, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($paymentId, $reason, $userId, $userName) {
            if (!trim($reason)) {
                throw new \Exception('سبب العكس مطلوب');
            }
            $payment = Payment::findOrFail($paymentId);
            if ($payment->status === 'reversed') {
                throw new \Exception('تم عكس هذه الدفعة مسبقاً');
            }
            $charge = Charge::find($payment->charge_id);
            $newPaid = (float) $charge->paid_amount - (float) $payment->amount;
            $newRemaining = (float) $charge->remaining_amount + (float) $payment->amount;
            $chargeStatus = $newPaid <= 0 ? 'unpaid' : 'partial';
            $newPaid = max(0, $newPaid);
            $payment->update(['status' => 'reversed']);
            PaymentReversal::create([
                'payment_id' => $paymentId,
                'original_amount' => $payment->amount,
                'reason' => $reason,
                'reversed_by' => $userId,
            ]);
            $charge->update([
                'paid_amount' => $newPaid,
                'remaining_amount' => $newRemaining,
                'status' => $chargeStatus,
            ]);
            Customer::where('id', $payment->customer_id)->update([
                'balance' => DB::raw('balance + ' . (float) $payment->amount),
            ]);
            AuditService::log($userId, $userName, 'payment.reverse', 'payments', $paymentId, [
                'status' => 'active',
                'amount' => (float) $payment->amount,
            ], ['status' => 'reversed'], $reason);
            return ['success' => true, 'payment_id' => $paymentId, 'new_charge_status' => $chargeStatus];
        });
    }

    public function closeWeek(string $weekId, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($weekId, $userId, $userName) {
            $week = WeekPeriod::findOrFail($weekId);
            if ($week->status === 'closed') {
                throw new \Exception('الفترة مغلقة بالفعل');
            }
            $week->update([
                'status' => 'closed',
                'closed_by' => $userId,
                'closed_at' => now(),
            ]);
            AuditService::log($userId, $userName, 'week.close', 'week_periods', $weekId, null, ['status' => 'closed'], 'إغلاق الفترة الأسبوعية');
            return ['success' => true];
        });
    }

    public function reopenWeek(string $weekId, string $reason, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($weekId, $reason, $userId, $userName) {
            if (!trim($reason)) {
                throw new \Exception('سبب إعادة الفتح مطلوب');
            }
            $week = WeekPeriod::findOrFail($weekId);
            if ($week->status === 'open') {
                throw new \Exception('الفترة مفتوحة بالفعل');
            }
            $week->update([
                'status' => 'open',
                'closed_by' => null,
                'closed_at' => null,
            ]);
            AuditService::log($userId, $userName, 'week.reopen', 'week_periods', $weekId, ['status' => 'closed'], ['status' => 'open'], $reason);
            return ['success' => true];
        });
    }

    public function reprintReceipt(string $receiptId, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($receiptId, $userId, $userName) {
            $receipt = Receipt::findOrFail($receiptId);
            $newCount = $receipt->reprint_count + 1;
            $receipt->update([
                'reprint_count' => $newCount,
                'last_reprinted_by' => $userId,
                'last_reprinted_at' => now(),
            ]);
            AuditService::log($userId, $userName, 'receipt.reprint', 'receipts', $receiptId, null, ['reprint_count' => $newCount], 'إعادة طباعة الإيصال');
            return ['success' => true, 'reprint_count' => $newCount];
        });
    }

    public function replaceMeter(string $meterId, string $newMeterNumber, float $newInitialReading, string $reason, string $userId, string $userName): array
    {
        return DB::transaction(function () use ($meterId, $newMeterNumber, $newInitialReading, $reason, $userId, $userName) {
            if (!trim($reason)) {
                throw new \Exception('سبب الاستبدال مطلوب');
            }
            $meter = Meter::findOrFail($meterId);
            MeterReplacement::create([
                'meter_id' => $meterId,
                'old_meter_number' => $meter->meter_number,
                'new_meter_number' => $newMeterNumber,
                'old_final_reading' => $meter->current_reading,
                'new_initial_reading' => $newInitialReading,
                'replacement_date' => now(),
                'reason' => $reason,
                'performed_by' => $userId,
            ]);
            $meter->update([
                'meter_number' => $newMeterNumber,
                'initial_reading' => $newInitialReading,
                'current_reading' => $newInitialReading,
                'status' => 'active',
            ]);
            AuditService::log($userId, $userName, 'meter.replace', 'meters', $meterId, [
                'old_meter_number' => $meter->meter_number,
                'old_final_reading' => (float) $meter->current_reading,
            ], [
                'new_meter_number' => $newMeterNumber,
                'new_initial_reading' => $newInitialReading,
            ], $reason);
            return ['success' => true];
        });
    }
}
