<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tariff_slabs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tariff_id');
            $table->decimal('from_units', 14, 3)->default(0);
            $table->decimal('to_units', 14, 3)->nullable();
            $table->decimal('rate_per_unit', 14, 3)->default(0);
            $table->decimal('fixed_charge', 14, 2)->default(0);
            $table->timestampTz('created_at')->useCurrent();
            $table->foreign('tariff_id')->references('id')->on('tariffs')->onDelete('cascade');
            $table->index('tariff_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tariff_slabs');
    }
};
