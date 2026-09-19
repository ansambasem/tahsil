<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('week_periods', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('week_number')->unique();
            $table->uuid('branch_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('open');
            $table->uuid('closed_by')->nullable();
            $table->timestampTz('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->index('branch_id');
            $table->index('status');
        });

        DB::statement("ALTER TABLE week_periods ADD CONSTRAINT week_periods_status_check CHECK (status IN ('open', 'closed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('week_periods');
    }
};
