<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('payment_number')->unique();
            $table->uuid('charge_id');
            $table->uuid('customer_id');
            $table->uuid('branch_id');
            $table->uuid('area_id');
            $table->uuid('week_id');
            $table->decimal('amount', 14, 2);
            $table->string('payment_method')->default('cash');
            $table->string('status')->default('active');
            $table->uuid('received_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('charge_id')->references('id')->on('charges')->onDelete('restrict');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('restrict');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('restrict');
            $table->foreign('week_id')->references('id')->on('week_periods')->onDelete('restrict');
            $table->index('charge_id');
            $table->index('customer_id');
            $table->index('week_id');
            $table->index('status');
        });

        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('cash', 'transfer', 'card'))");
        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('active', 'reversed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
