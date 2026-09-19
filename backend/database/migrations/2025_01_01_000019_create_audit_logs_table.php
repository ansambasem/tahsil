<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('action_type');
            $table->string('record_type');
            $table->uuid('record_id')->nullable();
            $table->jsonb('old_value')->nullable();
            $table->jsonb('new_value')->nullable();
            $table->text('reason')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index('action_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
