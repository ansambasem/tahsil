<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'branch_id', 'area_code', 'area_name', 'status', 'notes',
        'created_by', 'updated_by',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }
}
