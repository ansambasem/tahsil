<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'key', 'value', 'display_name', 'category', 'data_type',
        'notes', 'updated_by',
    ];
}
