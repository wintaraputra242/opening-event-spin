<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_winners', function (Blueprint $table) {
            $table->id();

            $table->foreignId('guest_id')
                ->unique() // 1 tamu hanya boleh fix untuk 1 hadiah
                ->constrained('guests')
                ->cascadeOnDelete();

            $table->foreignId('prize_id')
                ->constrained('prizes')
                ->cascadeOnDelete();

            // status: belum dipakai / sudah dipakai (sudah menang via slot fix)
            $table->boolean('is_used')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fixed_winners');
    }
};