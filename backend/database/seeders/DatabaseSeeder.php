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
        // Seed default counters
        \App\Models\Counter::create(['name' => 'Teller 1', 'type' => 'Teller', 'is_active' => true]);
        \App\Models\Counter::create(['name' => 'Teller 2', 'type' => 'Teller', 'is_active' => true]);
        \App\Models\Counter::create(['name' => 'Loket Kredit 1', 'type' => 'Kredit', 'is_active' => true]);
        \App\Models\Counter::create(['name' => 'Customer Service 1', 'type' => 'Customer Service', 'is_active' => true]);

        // Seed default announcements
        \App\Models\Announcement::create(['content' => 'Selamat Datang di Bank BPR Kerta Raharja. Silakan ambil nomor antrean Anda.', 'is_active' => true]);
        \App\Models\Announcement::create(['content' => 'Budayakan mengantre demi ketertiban bersama di lingkungan Bank.', 'is_active' => true]);
    }
}
