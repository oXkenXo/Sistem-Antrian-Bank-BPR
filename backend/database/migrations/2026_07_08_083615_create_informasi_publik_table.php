<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInformasiPublikTable extends Migration
{
    public function up()
    {
        Schema::create('informasi_publik', function (Blueprint $table) {
            $table->id();
            $table->string('id_kantor')->nullable(); // Nullable untuk konten default dari pusat
            $table->string('judul');
            $table->enum('tipe', ['gambar', 'youtube', 'teks_bergulir'])->default('gambar');
            $table->text('konten'); // URL gambar, YouTube embed URL, atau isi teks bergulir
            $table->date('tanggal_berlaku')->nullable();
            $table->date('tanggal_kadaluarsa')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('urutan')->default(0); // Urutan tampil
            $table->timestamps();

            $table->foreign('id_kantor')->references('id_kantor')->on('kantor')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('informasi_publik');
    }
}
