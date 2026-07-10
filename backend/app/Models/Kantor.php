<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kantor extends Model
{
    use HasFactory;

    protected $table = 'kantor';
    protected $primaryKey = 'id_kantor';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_kantor',
        'nama_kantor',
        'alamat',
        'gambar_kantor',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'id_kantor', 'id_kantor');
    }

    public function counters()
    {
        return $this->hasMany(Counter::class, 'id_kantor', 'id_kantor');
    }

    public function queues()
    {
        return $this->hasMany(Queue::class, 'id_kantor', 'id_kantor');
    }

    public function informasiPublik()
    {
        return $this->hasMany(InformasiPublik::class, 'id_kantor', 'id_kantor');
    }
}
