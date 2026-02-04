<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanListing extends Model
{
    //
    protected $fillable = [
    'branch_id',
    'village',
    'credit_officer_id',
    'group_id',
    'group_name',
    'client_id',
    'account_title',
    'account_id',
    'mobile',
    'id_number',
    'gender',
    'dob',
    'age',
    'application_id',
    'loan_type',
    'product_id',
    'loan_series',
    'interest_rate',
    'interest',
    'terms',
    'disbursed_amount',
    'loan_purpose',
    'disbursed_on',
    'installment_start_date',
    'maturity_date',
    'disbursement_mode',
    'frequency_id',
    'green_practice',
    'latitude',
    'longitude',
];

}
