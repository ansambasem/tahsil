<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meter extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'meter_number', 'customer_id', 'branch_id', 'area_id',
        'installation_date', 'initial_reading', 'current_reading',
        'status', 'notes', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'initial_reading' => 'decimal:3',
            'current_reading' => 'decimal:3',
            'installation_date' => 'date',
        ];
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

    public function readings()
    {
        return $this->hasMany(MeterReading::class);
    }

    public function replacements()
    {
        return $this->hasMany(MeterReplacement::class);
    }
}
