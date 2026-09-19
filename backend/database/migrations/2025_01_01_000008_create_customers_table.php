<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('customer_number')->unique();
            $table->string('customer_name');
            $table->uuid('branch_id');
            $table->uuid('area_id');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('national_id')->nullable();
            $table->string('subscription_type')->default('residential');
            $table->string('status')->default('active');
            $table->decimal('balance', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('restrict');
            $table->index('branch_id');
            $table->index('area_id');
            $table->index('status');
            $table->index('customer_number');
            $table->index('customer_name');
        });

        DB::statement("ALTER TABLE customers ADD CONSTRAINT customers_subscription_type_check CHECK (subscription_type IN ('residential', 'commercial', 'industrial'))");
        DB::statement("ALTER TABLE customers ADD CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'suspended'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
