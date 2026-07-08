<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'service_type',
        'prefix',
        'number',
        'status',
        'counter_name',
    ];
}
