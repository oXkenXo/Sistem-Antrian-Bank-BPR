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
        'id_kantor',
    ];

    public function kantor()
    {
        return $this->belongsTo(Kantor::class, 'id_kantor', 'id_kantor');
    }
}
