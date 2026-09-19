<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meters', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('meter_number')->unique();
            $table->uuid('customer_id');
            $table->uuid('branch_id');
            $table->uuid('area_id');
            $table->date('installation_date')->default(now());
            $table->decimal('initial_reading', 14, 3)->default(0);
            $table->decimal('current_reading', 14, 3)->default(0);
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('restrict');
            $table->index('customer_id');
            $table->index('branch_id');
            $table->index('meter_number');
            $table->index('status');
        });

        DB::statement("ALTER TABLE meters ADD CONSTRAINT meters_status_check CHECK (status IN ('active', 'replaced', 'inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('meters');
    }
};
