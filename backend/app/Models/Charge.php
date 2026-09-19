<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Charge extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'week_id', 'customer_id', 'meter_id', 'branch_id', 'area_id',
        'reading_id', 'tariff_id', 'tariff_snapshot',
        'previous_reading', 'current_reading', 'consumption',
        'charge_amount', 'paid_amount', 'remaining_amount',
        'status', 'generated_by',
    ];

    protected function casts(): array
    {
        return [
            'tariff_snapshot' => 'array',
            'previous_reading' => 'decimal:3',
            'current_reading' => 'decimal:3',
            'consumption' => 'decimal:3',
            'charge_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
        ];
    }

    public function week()
    {
        return $this->belongsTo(WeekPeriod::class, 'week_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function reading()
    {
        return $this->belongsTo(MeterReading::class, 'reading_id');
    }

    public function tariff()
    {
        return $this->belongsTo(Tariff::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'charge_id');
    }
}
