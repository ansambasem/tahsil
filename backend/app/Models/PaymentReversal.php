<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentReversal extends Model
{
    public $timestamps = false;
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'payment_id', 'original_amount', 'reason', 'reversed_by',
    ];

    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }
}
