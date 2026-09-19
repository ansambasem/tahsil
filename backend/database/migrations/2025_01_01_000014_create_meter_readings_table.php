<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meter_readings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('week_id');
            $table->uuid('meter_id');
            $table->uuid('customer_id');
            $table->uuid('branch_id');
            $table->uuid('area_id');
            $table->decimal('previous_reading', 14, 3)->default(0);
            $table->decimal('current_reading', 14, 3)->default(0);
            $table->decimal('consumption', 14, 3)->default(0);
            $table->date('reading_date')->default(now());
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->uuid('read_by')->nullable();
            $table->uuid('modified_by')->nullable();
            $table->timestampTz('modified_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->unique(['week_id', 'meter_id']);
            $table->foreign('week_id')->references('id')->on('week_periods')->onDelete('restrict');
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('restrict');
            $table->index('week_id');
            $table->index('meter_id');
            $table->index('status');
        });

        DB::statement("ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_status_check CHECK (status IN ('pending', 'entered', 'verified'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('meter_readings');
    }
};
