<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meter_replacements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('meter_id');
            $table->string('old_meter_number');
            $table->string('new_meter_number');
            $table->decimal('old_final_reading', 14, 3)->default(0);
            $table->decimal('new_initial_reading', 14, 3)->default(0);
            $table->date('replacement_date')->default(now());
            $table->text('reason')->nullable();
            $table->uuid('performed_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('restrict');
            $table->index('meter_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meter_replacements');
    }
};
