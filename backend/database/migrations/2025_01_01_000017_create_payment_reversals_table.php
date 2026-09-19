<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_reversals', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('payment_id');
            $table->decimal('original_amount', 14, 2);
            $table->text('reason');
            $table->uuid('reversed_by')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->foreign('payment_id')->references('id')->on('payments')->onDelete('restrict');
            $table->index('payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_reversals');
    }
};
