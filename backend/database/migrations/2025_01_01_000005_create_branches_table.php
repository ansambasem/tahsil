<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('branch_code')->unique();
            $table->string('branch_name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('manager')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });

        DB::statement("ALTER TABLE branches ADD CONSTRAINT branches_status_check CHECK (status IN ('active', 'inactive'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
