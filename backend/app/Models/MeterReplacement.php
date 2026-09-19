<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeterReplacement extends Model
{
    public $timestamps = false;
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'meter_id', 'old_meter_number', 'new_meter_number',
        'old_final_reading', 'new_initial_reading',
        'replacement_date', 'reason', 'performed_by',
    ];

    protected function casts(): array
    {
        return [
            'old_final_reading' => 'decimal:3',
            'new_initial_reading' => 'decimal:3',
            'replacement_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }
}
