<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tariffs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('tariff_name');
            $table->string('tariff_code')->unique();
            $table->string('subscription_type');
            $table->date('effective_from')->default(now());
            $table->date('effective_to')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->index('status');
            $table->index('subscription_type');
        });

        DB::statement("ALTER TABLE tariffs ADD CONSTRAINT tariffs_subscription_type_check CHECK (subscription_type IN ('residential', 'commercial', 'industrial'))");
        DB::statement("ALTER TABLE tariffs ADD CONSTRAINT tariffs_status_check CHECK (status IN ('active', 'inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('tariffs');
    }
};
