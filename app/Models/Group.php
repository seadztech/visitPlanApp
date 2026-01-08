<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = [
        'outpost_id',
        'branch_id',
        'village',
        'credit_officer_id',
        'group_id',
        'group_name',
        'group_product_id',
        'savings_balance_b4',
        'savings_balance_after',
        'loan_balance_b4',
        'loan_balance_after',
        'arrears_b4',
        'arrears_after',
        'accts_b4',
        'accts_after',
        'venue',
        'frequency',
        'meeting_day',
        'time'
    ];
    
    public function outpost()
    {
        return $this->belongsTo(Outpost::class);
    }
}