<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'source',
        'user_id',
        'name',
        'phone',
        'date',
        'time',
        'people',
        'table',
        'note',
        'items',
        'total',
        'status',
    ];

    protected $casts = [
        'items' => 'array',
        'people' => 'integer',
        'total' => 'integer',
    ];
}
