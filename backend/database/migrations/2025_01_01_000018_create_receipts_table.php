<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('receipt_number')->unique();
            $table->uuid('payment_id');
            $table->uuid('customer_id');
            $table->uuid('branch_id');
            $table->uuid('week_id');
            $table->jsonb('receipt_data')->default('{}');
            $table->integer('reprint_count')->default(0);
            $table->uuid('last_reprinted_by')->nullable();
            $table->timestampTz('last_reprinted_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('payment_id')->references('id')->on('payments')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('week_id')->references('id')->on('week_periods')->onDelete('restrict');
            $table->index('payment_id');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
