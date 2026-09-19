<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeekPeriod extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $table = 'week_periods';

    protected $fillable = [
        'week_number', 'branch_id', 'start_date', 'end_date',
        'status', 'closed_by', 'closed_at', 'notes',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function readings()
    {
        return $this->hasMany(MeterReading::class, 'week_id');
    }

    public function charges()
    {
        return $this->hasMany(Charge::class, 'week_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'week_id');
    }

    public function receipts()
    {
        return $this->hasMany(Receipt::class, 'week_id');
    }
}
