<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TariffSlab extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'tariff_id',
        'from_units',
        'to_units',
        'rate_per_unit',
        'fixed_charge',
    ];

    protected $casts = [
        'from_units' => 'decimal:3',
        'to_units' => 'decimal:3',
        'rate_per_unit' => 'decimal:3',
        'fixed_charge' => 'decimal:2',
    ];

    public function tariff()
    {
        return $this->belongsTo(Tariff::class);
    }
}