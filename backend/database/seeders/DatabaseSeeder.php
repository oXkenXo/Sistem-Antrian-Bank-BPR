<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // 1. Jalankan seeder kantor cabang
        $this->call(KantorSeeder::class);

        // 2. Seed petugas & admin dummy
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@bpr.co.id'],
            [
                'name' => 'Admin Pusat BPR',
                'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
                'id_kantor' => '01',
                'role' => 'admin'
            ]
        );

        $branchNames = [
            '01' => 'Soreang',
            '02' => 'Banjaran',
            '03' => 'Ciparay',
            '04' => 'Majalaya',
            '05' => 'Rancaekek',
            '06' => 'Cicalengka',
            '07' => 'Baleendah',
            '08' => 'Pangalengan',
            '09' => 'Ciwidey',
            '10' => 'Margahayu',
            '11' => 'Dayeuhkolot',
            '12' => 'Katapang',
            '13' => 'Cileunyi',
            '14' => 'Bojongsoang',
            '15' => 'Pacet',
            '16' => 'Cimaung',
        ];

        foreach ($branchNames as $id => $name) {
            // Seed petugas per cabang
            \App\Models\User::updateOrCreate(
                ['email' => "petugas{$id}@bpr.co.id"],
                [
                    'name' => "Petugas {$name}",
                    'password' => \Illuminate\Support\Facades\Hash::make('petugas123'),
                    'id_kantor' => $id,
                    'role' => 'petugas'
                ]
            );

            // Seed default counters (Loket) per cabang
            \App\Models\Counter::updateOrCreate(
                ['name' => 'Teller 1', 'id_kantor' => $id],
                ['type' => 'Teller', 'is_active' => true]
            );
            \App\Models\Counter::updateOrCreate(
                ['name' => 'Customer Service 1', 'id_kantor' => $id],
                ['type' => 'Customer Service', 'is_active' => true]
            );
        }

        // 4. Seed default informasi publik (teks_bergulir/running text global fallback)
        \App\Models\InformasiPublik::updateOrCreate(
            ['judul' => 'Ucapan Selamat Datang', 'id_kantor' => null], // NULL = Global fallback
            [
                'tipe' => 'teks_bergulir',
                'konten' => 'Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda dan tunggu nomor Anda dipanggil di loket.',
                'is_active' => true,
                'urutan' => 1
            ]
        );

        \App\Models\InformasiPublik::updateOrCreate(
            ['judul' => 'Budaya Mengantre', 'id_kantor' => null],
            [
                'tipe' => 'teks_bergulir',
                'konten' => 'Budayakan mengantre demi kenyamanan dan ketertiban bersama di lingkungan perbankan.',
                'is_active' => true,
                'urutan' => 2
            ]
        );

        // 5. Seed default iklan/konten samping (global fallback)
        \App\Models\InformasiPublik::updateOrCreate(
            ['judul' => 'Video Profil BPR Kerta Raharja', 'id_kantor' => null],
            [
                'tipe' => 'youtube',
                'konten' => 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Link video profil placeholder
                'is_active' => true,
                'urutan' => 3
            ]
        );
    }
}
