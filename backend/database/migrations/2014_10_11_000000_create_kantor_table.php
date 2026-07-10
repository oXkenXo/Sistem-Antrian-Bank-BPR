<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateKantorTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('kantor', function (Blueprint $table) {
            $table->string('id_kantor')->primary(); // Kode kantor (e.g. '01', '02', dll.)
            $table->string('nama_kantor');
            $table->text('alamat')->nullable();
            $table->string('gambar_kantor')->nullable(); // Path URL gambar kantor cabang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('kantor');
    }
}
