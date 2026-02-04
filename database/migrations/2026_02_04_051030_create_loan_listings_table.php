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
       Schema::create('loan_listings', function (Blueprint $table) {
            $table->id();

            // Branch & Officer
            $table->string('branch_id')->nullable();
            $table->string('village')->nullable();
            $table->string('credit_officer_id')->nullable();

            // Group
            $table->string('group_id')->nullable();
            $table->string('group_name')->nullable();

            // Client
            $table->string('client_id');
            $table->string('account_title');
            $table->string('account_id')->nullable();
            $table->string('mobile');
            $table->string('id_number');
            $table->string('gender');
            $table->string('dob')->nullable();
            $table->string('age')->nullable();

            // Loan Core
            $table->string('application_id');
            $table->string('loan_type');
            $table->string('product_id');
            $table->integer('loan_series')->nullable();

            $table->decimal('interest_rate')->nullable();
            $table->decimal('interest', 15, 2)->nullable();

            $table->decimal('terms')->nullable();

            $table->decimal('disbursed_amount', 15, 2)->nullable();
            $table->string('loan_purpose')->nullable();

            $table->string('disbursed_on')->nullable();
            $table->string('installment_start_date')->nullable();
            $table->string('maturity_date')->nullable();

            $table->string('disbursement_mode')->nullable();
            $table->string('frequency_id')->nullable();

            $table->string('green_practice')->nullable();

            // Geo Location (kept as string per your rule)
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_listings');
    }
};
