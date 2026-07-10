<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class InformasiPublik extends Model
{
    use HasFactory;

    protected $table = 'informasi_publik';

    protected $fillable = [
        'id_kantor',
        'judul',
        'tipe',
        'konten',
        'tanggal_berlaku',
        'tanggal_kadaluarsa',
        'is_active',
        'urutan',
    ];

    public function kantor()
    {
        return $this->belongsTo(Kantor::class, 'id_kantor', 'id_kantor');
    }

    protected $casts = [
        'tanggal_berlaku'    => 'date',
        'tanggal_kadaluarsa' => 'date',
        'is_active'          => 'boolean',
        'urutan'             => 'integer',
    ];

    /**
     * Scope for active, non-expired informasi publik
     */
    public function scopeAktif($query)
    {
        $today = Carbon::today();
        return $query
            ->where('is_active', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('tanggal_berlaku')
                  ->orWhere('tanggal_berlaku', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('tanggal_kadaluarsa')
                  ->orWhere('tanggal_kadaluarsa', '>=', $today);
            })
            ->orderBy('urutan', 'asc');
    }
}
