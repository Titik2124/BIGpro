<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('source')->default('online');
            $table->string('user_id')->nullable();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->date('date');
            $table->string('time', 5);
            $table->unsignedInteger('people')->default(1);
            $table->string('table')->nullable();
            $table->text('note')->nullable();
            $table->json('items');
            $table->unsignedInteger('total')->default(0);
            $table->string('status')->default('Menunggu Konfirmasi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
