<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'receipt_number', 'payment_id', 'customer_id', 'branch_id',
        'week_id', 'receipt_data', 'reprint_count',
        'last_reprinted_by', 'last_reprinted_at',
    ];

    protected function casts(): array
    {
        return [
            'receipt_data' => 'array',
            'reprint_count' => 'integer',
            'last_reprinted_at' => 'datetime',
        ];
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function week()
    {
        return $this->belongsTo(WeekPeriod::class, 'week_id');
    }
}
