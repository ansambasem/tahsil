<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'branch_code',
        'branch_name',
        'address',
        'phone',
        'manager',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    public function areas()
    {
        return $this->hasMany(Area::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }

    public function weekPeriods()
    {
        return $this->hasMany(WeekPeriod::class);
    }
}