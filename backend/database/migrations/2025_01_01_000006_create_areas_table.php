<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('branch_id');
            $table->string('area_code');
            $table->string('area_name');
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
            $table->unique(['branch_id', 'area_code']);
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('restrict');
            $table->index('branch_id');
        });

        DB::statement("ALTER TABLE areas ADD CONSTRAINT areas_status_check CHECK (status IN ('active', 'inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};
