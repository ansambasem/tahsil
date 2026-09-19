<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'payment_number', 'charge_id', 'customer_id', 'branch_id',
        'area_id', 'week_id', 'amount', 'payment_method',
        'status', 'received_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function charge()
    {
        return $this->belongsTo(Charge::class, 'charge_id');
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

    public function reversals()
    {
        return $this->hasMany(PaymentReversal::class, 'payment_id');
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class, 'payment_id');
    }
}
