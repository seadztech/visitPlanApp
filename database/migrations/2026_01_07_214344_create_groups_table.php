<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->integer('outpost_id');
            $table->string('branch_id');
            $table->string('village')->nullable();
            $table->string('credit_officer_id');
            $table->string('group_id')->unique();
            $table->string('group_name');
            $table->string('group_product_id')->nullable();
            $table->decimal('savings_balance_b4', 15, 2)->default(0);
            $table->decimal('savings_balance_after', 15, 2)->default(0);
            $table->decimal('loan_balance_b4', 15, 2)->default(0);
            $table->decimal('loan_balance_after', 15, 2)->default(0);
            $table->decimal('arrears_b4', 15, 2)->default(0);
            $table->decimal('arrears_after', 15, 2)->default(0);
            $table->unsignedInteger('accts_b4')->default(0);
            $table->unsignedInteger('accts_after')->default(0);
            $table->string('venue')->nullable();
            $table->string('frequency')->nullable();
            $table->string('meeting_day')->nullable();
            $table->time('time')->nullable();
            $table->timestamps();
    
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
