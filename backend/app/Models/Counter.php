<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Counter extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'id_kantor',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function kantor()
    {
        return $this->belongsTo(Kantor::class, 'id_kantor', 'id_kantor');
    }
}
