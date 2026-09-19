<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeterReading extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $table = 'meter_readings';

    protected $fillable = [
        'week_id', 'meter_id', 'customer_id', 'branch_id', 'area_id',
        'previous_reading', 'current_reading', 'consumption',
        'reading_date', 'status', 'notes', 'read_by',
        'modified_by', 'modified_at',
    ];

    protected function casts(): array
    {
        return [
            'previous_reading' => 'decimal:3',
            'current_reading' => 'decimal:3',
            'consumption' => 'decimal:3',
            'reading_date' => 'date',
            'modified_at' => 'datetime',
        ];
    }

    public function week()
    {
        return $this->belongsTo(WeekPeriod::class, 'week_id');
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
