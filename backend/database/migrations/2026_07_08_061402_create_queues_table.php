<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQueuesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number');
            $table->string('service_type');
            $table->string('prefix');
            $table->integer('number');
            $table->enum('status', ['waiting', 'calling', 'completed', 'skip'])->default('waiting');
            $table->string('counter_name')->nullable();
            $table->string('id_kantor'); // Terikat ke kantor cabang
            $table->timestamps();

            $table->foreign('id_kantor')->references('id_kantor')->on('kantor')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('queues');
    }
}
