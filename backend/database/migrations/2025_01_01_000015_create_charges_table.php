<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('week_id');
            $table->uuid('customer_id');
            $table->uuid('meter_id');
            $table->uuid('branch_id');
            $table->uuid('area_id');
            $table->uuid('reading_id')->nullable();
            $table->uuid('tariff_id');
            $table->jsonb('tariff_snapshot')->default('{}');
            $table->decimal('previous_reading', 14, 3)->default(0);
            $table->decimal('current_reading', 14, 3)->default(0);
            $table->decimal('consumption', 14, 3)->default(0);
            $table->decimal('charge_amount', 14, 2)->default(0);
            $table->decimal('paid_amount', 14, 2)->default(0);
            $table->decimal('remaining_amount', 14, 2)->default(0);
            $table->string('status')->default('unpaid');
            $table->uuid('generated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('week_id')->references('id')->on('week_periods')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('meter_id')->references('id')->on('meters')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('restrict');
            $table->foreign('reading_id')->references('id')->on('meter_readings')->onDelete('restrict');
            $table->foreign('tariff_id')->references('id')->on('tariffs')->onDelete('restrict');
            $table->index('week_id');
            $table->index('customer_id');
            $table->index('status');
        });

        DB::statement("ALTER TABLE charges ADD CONSTRAINT charges_status_check CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
