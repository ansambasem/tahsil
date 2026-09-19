<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'customer_number', 'customer_name', 'branch_id', 'area_id',
        'address', 'phone', 'national_id', 'subscription_type',
        'status', 'balance', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }

    public function charges()
    {
        return $this->hasMany(Charge::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
